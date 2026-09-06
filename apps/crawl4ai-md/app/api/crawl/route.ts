import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const PYTHON = path.join(process.cwd(), "py", "venv", "bin", "python");
const SCRIPT = path.join(process.cwd(), "py", "crawl.py");
const CRAWL_TIMEOUT_MS = 90_000;

export async function POST(request: Request) {
  let url: string;
  try {
    const body = await request.json();
    url = String(body?.url ?? "").trim();
    new URL(url); // validate
  } catch {
    return Response.json({ error: "Please provide a valid URL." }, { status: 400 });
  }

  const workDir = await mkdtemp(path.join(tmpdir(), "crawl4ai-"));
  const outFile = path.join(workDir, "result.json");

  try {
    await execFileAsync(PYTHON, [SCRIPT, url, outFile], {
      timeout: CRAWL_TIMEOUT_MS,
      maxBuffer: 16 * 1024 * 1024,
    }).catch(() => {
      // Non-zero exit still writes a structured error to outFile; fall through.
    });

    const raw = await readFile(outFile, "utf8").catch(() => null);
    if (!raw) {
      return Response.json(
        { error: "Crawler produced no result (is the Python sidecar set up? Run: bun run setup:py)" },
        { status: 500 },
      );
    }

    const result = JSON.parse(raw);
    if (!result.ok) {
      return Response.json({ error: result.error ?? "Crawl failed." }, { status: 502 });
    }
    return Response.json({ url: result.url, title: result.title, markdown: result.markdown });
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
