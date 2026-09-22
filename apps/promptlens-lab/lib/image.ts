import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getFixture } from "@/lib/fixtures";

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function fixtureDataUrl(fixtureId: string): Promise<string> {
  const fixture = getFixture(fixtureId);
  if (!fixture) {
    throw new Error(`Unknown fixture: ${fixtureId}`);
  }
  const filename = fixture.src.replace(/^\//, "");
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  const mime = MIME[ext] ?? "image/png";
  const bytes = await readFile(join(process.cwd(), "public", filename));
  return `data:${mime};base64,${bytes.toString("base64")}`;
}
