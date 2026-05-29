// Fetches celebrity reference images from Supabase Storage (bucket: celebrity-refs)
// and merges them with any URLs stored in the DB column reference_images.
// Called server-side during generation when a celebrity is detected.

import { createSupabaseAdmin } from "@/lib/supabase";

const BUCKET = "celebrity-refs";
const MAX_REFS = 3; // max reference images passed to the model

/** Returns up to MAX_REFS public URLs for the celebrity's reference photos */
export async function getCelebRefImages(
  celebId: string,
  dbUrls: string[] = [],
  legacyUrl?: string,
): Promise<string[]> {
  const collected: string[] = [];

  // 1. Pull from Supabase Storage bucket celebrity-refs/{celebId}/
  try {
    const admin = createSupabaseAdmin();
    const { data: files } = await admin.storage
      .from(BUCKET)
      .list(celebId, { limit: MAX_REFS, sortBy: { column: "name", order: "asc" } });

    if (files && files.length > 0) {
      for (const file of files.slice(0, MAX_REFS)) {
        const { data } = admin.storage
          .from(BUCKET)
          .getPublicUrl(`${celebId}/${file.name}`);
        if (data?.publicUrl) collected.push(data.publicUrl);
      }
    }
  } catch {
    // Storage not reachable — fall through to DB/legacy sources
  }

  // 2. Supplement with DB-stored URLs if we still need more
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
