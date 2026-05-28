import { NextResponse } from "next/server";
import Replicate from "replicate";

export const maxDuration = 30;

export async function GET() {
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });

  try {
    // Fetch the model metadata to see what inputs it actually accepts
    const model = await (replicate as unknown as {
      models: {
        get(owner: string, name: string): Promise<{
          latest_version?: { id: string; openapi_schema?: unknown };
          default_example?: { input?: unknown };
        }>;
      };
    }).models.get("google", "nano-banana-pro");

    // Also fetch the latest version schema if available
    let versionSchema = null;
    try {
      if (model?.latest_version?.id) {
        versionSchema = await (replicate as unknown as {
          models: {
            versions: {
              get(owner: string, name: string, version: string): Promise<unknown>;
            };
          };
        }).models.versions.get("google", "nano-banana-pro", model.latest_version.id);
      }
    } catch (e) {
      versionSchema = { error: String(e) };
    }

    return NextResponse.json({ model, versionSchema });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
