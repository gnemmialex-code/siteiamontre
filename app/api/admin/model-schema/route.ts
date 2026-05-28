import { NextResponse } from "next/server";
import { replicate } from "@/scripts/pipeline";

export const maxDuration = 20;

export async function GET() {
  try {
    const model = await (replicate as unknown as {
      models: { get: (owner: string, name: string) => Promise<unknown> }
    }).models.get("google", "nano-banana-pro");

    return NextResponse.json({ model });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
