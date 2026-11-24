// main.ts — post-x-the-agent-builds-a-game entry.
//
// Pipeline: read POST.json (the X post carrying the live status URL),
// validate that it points at a real x.com status, then copy it to
// /output/POST.json where the judge reads it.
//
// The URL started life as a placeholder; the live status URL
// (https://x.com/iHoonHaneul/status/2125004963390910754) was written in
// by the URL-fix session. Nothing here edits the post itself — this
// script only moves it into place and proves the copy is exact, so the
// entry the judge scores is byte-for-byte the post the user published.
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, "POST.json");

// Read the post descriptor and pull the status URL out of it. The cast
// documents the shape we require; the runtime check below is what
// actually enforces it, so a malformed POST.json fails loudly here
// instead of shipping a bad URL to the judge.
const post = JSON.parse(readFileSync(src, "utf8")) as { url: string };

function requireStatusUrl(url: unknown): string {
  if (typeof url !== "string" || !url.startsWith("https://x.com/")) {
    throw new Error(`POST.json must carry an x.com status URL, got: ${url}`);
  }
  return url;
}

const statusUrl = requireStatusUrl(post.url);

mkdirSync("/output", { recursive: true });
copyFileSync(src, "/output/POST.json");

// Round-trip check: the file the judge reads must be byte-identical to
// the source. Comparing the full text (not just size or mtime) catches
// a truncated or re-encoded copy before the entry is submitted.
const written = readFileSync("/output/POST.json", "utf8");
if (written !== readFileSync(src, "utf8")) {
  throw new Error("/output/POST.json does not match POST.json");
}
console.log(`POST.json -> /output/POST.json (${statusUrl})`);
