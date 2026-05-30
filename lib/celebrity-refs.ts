// Fetches celebrity reference images from Supabase Storage (bucket: celebrity-refs).
// Folder structure: celebrity-refs/{celebId}/1.jpg, 2.JPG, 3.png …
// Called server-side during generation when a celebrity name is detected.

import { createSupabaseAdmin } from "@/lib/supabase";

const BUCKET   = "celebrity-refs";
const MAX_REFS = 4; // max reference images passed to the model

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "avif", "gif"]);

function isImageFile(name: string): boolean {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_EXTENSIONS.has(ext);
}

/** Returns up to MAX_REFS public URLs for the celebrity's reference photos */
export async function getCelebRefImages(
  celebId: string,
  dbUrls: string[] = [],
  legacyUrl?: string,
): Promise<string[]> {
  const collected: string[] = [];

  // 1. Pull from Supabase Storage — celebrity-refs/{celebId}/*.jpg
  try {
    const admin = createSupabaseAdmin();
    const { data: files, error } = await admin.storage
      .from(BUCKET)
      .list(celebId, { limit: 20, sortBy: { column: "name", order: "asc" } });

    if (error) {
      console.warn(`[CelebRefs] Storage list error for "${celebId}":`, error.message);
    }

    if (files && files.length > 0) {
      const imageFiles = files
        .filter((f) => f.name && isImageFile(f.name))  // skip .emptyFolderPlaceholder etc.
        .slice(0, MAX_REFS);

      console.log(`[CelebRefs] "${celebId}": found ${imageFiles.length} image(s) in Storage`);

      // Use signed URLs (60 s TTL) so they work for private buckets too
      const paths = imageFiles.map((f) => `${celebId}/${f.name}`);
      const { data: signed, error: signErr } = await admin.storage
        .from(BUCKET)
        .createSignedUrls(paths, 60);

      if (signErr) {
        console.warn(`[CelebRefs] createSignedUrls error for "${celebId}":`, signErr.message);
        // Fall back to public URLs
        for (const file of imageFiles) {
          const { data } = admin.storage.from(BUCKET).getPublicUrl(`${celebId}/${file.name}`);
          if (data?.publicUrl) collected.push(data.publicUrl);
        }
      } else {
        for (const s of signed ?? []) {
          if (s.signedUrl) collected.push(s.signedUrl);
        }
      }
    } else {
      console.log(`[CelebRefs] "${celebId}": no files found in Storage`);
    }
  } catch (err) {
    console.warn(`[CelebRefs] Storage unreachable for "${celebId}":`, err);
  }

  // 2. Supplement with DB reference_images[] if we need more
  if (collected.length < MAX_REFS) {
    for (const url of dbUrls) {
      if (!collected.includes(url)) {
        collected.push(url);
        if (collected.length >= MAX_REFS) break;
      }
    }
  }

  // 3. Legacy single reference_image_url fallback
  if (collected.length < MAX_REFS && legacyUrl && !collected.includes(legacyUrl)) {
    collected.push(legacyUrl);
  }

  return collected.slice(0, MAX_REFS);
}
