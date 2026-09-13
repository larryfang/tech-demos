import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { importPKCS8, SignJWT } from "jose";
import type {
  AppSummary,
  AscCredentials,
  BuildRow,
  FeedbackRow,
  SubmissionRow,
} from "./types";

const ASC_API = "https://api.appstoreconnect.apple.com";

type JsonApiResource = {
  id?: string;
  type?: string;
  attributes?: Record<string, unknown>;
};

type JsonApiList = {
  data?: JsonApiResource[] | JsonApiResource;
};

export function credentialsFromEnv(
  override?: Partial<AscCredentials>,
): AscCredentials | null {
  const keyId = override?.keyId?.trim() || process.env.ASC_KEY_ID?.trim() || "";
  const issuerId =
    override?.issuerId?.trim() || process.env.ASC_ISSUER_ID?.trim() || "";
  const keyType =
    override?.keyType ||
    (process.env.ASC_KEY_TYPE === "individual" ? "individual" : "team");
  const privateKeyPath =
    override?.privateKeyPath?.trim() ||
    process.env.ASC_PRIVATE_KEY_PATH?.trim() ||
    "";
  const privateKeyPem =
    override?.privateKeyPem?.trim() || process.env.ASC_PRIVATE_KEY?.trim() || "";

  if (!keyId) return null;
  if (keyType === "team" && !issuerId) return null;
  if (!privateKeyPath && !privateKeyPem) return null;

  return {
    keyId,
    issuerId: issuerId || undefined,
    keyType,
    privateKeyPath: privateKeyPath || undefined,
    privateKeyPem: privateKeyPem || undefined,
  };
}

function unwrapList(payload: unknown): JsonApiResource[] {
  if (!payload || typeof payload !== "object") return [];
  const data = (payload as JsonApiList).data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") return [data];
  if (Array.isArray(payload)) return payload as JsonApiResource[];
  return [];
}

function attr(resource: JsonApiResource, key: string): string {
  const value = resource.attributes?.[key];
  return typeof value === "string" ? value : value != null ? String(value) : "";
}

export function mapApps(payload: unknown): AppSummary[] {
  return unwrapList(payload).map((item) => ({
    id: item.id ?? "",
    name: attr(item, "name") || "Untitled app",
    bundleId: attr(item, "bundleId"),
    sku: attr(item, "sku") || undefined,
  })).filter((app) => app.id);
}

export function mapBuilds(payload: unknown): BuildRow[] {
  return unwrapList(payload).map((item) => ({
    id: item.id ?? "",
    version: attr(item, "version") || attr(item, "versionString") || "—",
    buildNumber: attr(item, "buildNumber") || attr(item, "build") || "—",
    uploadedDate: attr(item, "uploadedDate") || attr(item, "createdDate") || "",
    processingState:
      attr(item, "processingState") || attr(item, "processingStatus") || "UNKNOWN",
  })).filter((build) => build.id);
}

export function mapFeedback(payload: unknown): FeedbackRow[] {
  return unwrapList(payload).map((item) => {
    const comment =
      attr(item, "comment") ||
      attr(item, "commentText") ||
      "(screenshot / crash feedback, no comment)";
    const tester =
      attr(item, "tester") ||
      attr(item, "email") ||
      [attr(item, "firstName"), attr(item, "lastName")].filter(Boolean).join(" ") ||
      "Beta tester";
    return {
      id: item.id ?? "",
      comment,
      tester,
      createdDate: attr(item, "createdDate") || "",
      device: attr(item, "deviceModel") || attr(item, "device") || undefined,
      os: attr(item, "osVersion") || attr(item, "os") || undefined,
    };
  }).filter((row) => row.id);
}

export function mapSubmissions(payload: unknown): SubmissionRow[] {
  return unwrapList(payload).map((item) => ({
    id: item.id ?? "",
    version: attr(item, "versionString") || attr(item, "version") || "—",
    platform: attr(item, "platform") || "IOS",
    state:
      attr(item, "appStoreState") ||
      attr(item, "state") ||
      attr(item, "appVersionState") ||
      "UNKNOWN",
    createdDate: attr(item, "createdDate") || undefined,
  })).filter((row) => row.id);
}

function runCommand(
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv,
  timeoutMs = 25000,
): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { env, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
    }, timeoutMs);
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({ ok: false, stdout, stderr: error.message });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ ok: code === 0, stdout, stderr });
    });
  });
}

function parseJson(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("empty CLI output");
  return JSON.parse(trimmed);
}

function credEnv(creds: AscCredentials): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    ASC_KEY_ID: creds.keyId,
    ASC_KEY_TYPE: creds.keyType ?? "team",
    ASC_DEFAULT_OUTPUT: "json",
  };
  delete env.ASC_PROFILE;
  if (creds.issuerId) env.ASC_ISSUER_ID = creds.issuerId;
  if (creds.privateKeyPath) {
    env.ASC_PRIVATE_KEY_PATH = creds.privateKeyPath;
    delete env.ASC_PRIVATE_KEY;
    delete env.ASC_PRIVATE_KEY_B64;
  } else if (creds.privateKeyPem) {
    env.ASC_PRIVATE_KEY = creds.privateKeyPem;
    delete env.ASC_PRIVATE_KEY_PATH;
    delete env.ASC_PRIVATE_KEY_B64;
  }
  return env;
}

async function findAscBinary(): Promise<string | null> {
  const fromEnv = process.env.ASC_BIN?.trim();
  if (fromEnv) return fromEnv;
  const which = await runCommand("which", ["asc"], process.env, 3000);
  const path = which.stdout.trim();
  return which.ok && path ? path : null;
}

export async function fetchViaCli(
  creds: AscCredentials,
  appId?: string,
): Promise<{
  apps: AppSummary[];
  builds: BuildRow[];
  feedback: FeedbackRow[];
  submissions: SubmissionRow[];
  selectedAppId: string;
}> {
  const bin = await findAscBinary();
  if (!bin) throw new Error("asc CLI not found on PATH (set ASC_BIN or install asc)");
  const env = credEnv(creds);

  const appsResult = await runCommand(bin, ["apps", "list", "--output", "json", "--limit", "50"], env);
  if (!appsResult.ok) {
    throw new Error(appsResult.stderr.trim() || "asc apps list failed");
  }
  const apps = mapApps(parseJson(appsResult.stdout));
  if (apps.length === 0) throw new Error("asc apps list returned no apps");
  const selectedAppId = apps.some((app) => app.id === appId) ? appId! : apps[0].id;

  const [buildsResult, feedbackResult, versionsResult] = await Promise.all([
    runCommand(bin, ["builds", "list", "--app", selectedAppId, "--sort", "-uploadedDate", "--limit", "10", "--output", "json"], env),
    runCommand(bin, ["testflight", "feedback", "list", "--app", selectedAppId, "--limit", "10", "--output", "json"], env),
    runCommand(bin, ["versions", "list", "--app", selectedAppId, "--limit", "10", "--output", "json"], env),
  ]);

  if (!buildsResult.ok) throw new Error(buildsResult.stderr.trim() || "asc builds list failed");
  if (!feedbackResult.ok) throw new Error(feedbackResult.stderr.trim() || "asc testflight feedback list failed");
  if (!versionsResult.ok) throw new Error(versionsResult.stderr.trim() || "asc versions list failed");

  return {
    apps,
    selectedAppId,
    builds: mapBuilds(parseJson(buildsResult.stdout)),
    feedback: mapFeedback(parseJson(feedbackResult.stdout)),
    submissions: mapSubmissions(parseJson(versionsResult.stdout)),
  };
}

async function mintJwt(creds: AscCredentials): Promise<string> {
  let pem = creds.privateKeyPem;
  if (!pem && creds.privateKeyPath) {
    try {
      pem = await readFile(creds.privateKeyPath, "utf8");
    } catch {
      throw new Error(`private key not found at ${creds.privateKeyPath}`);
    }
  }
  if (!pem) throw new Error("missing ASC private key");
  const key = await importPKCS8(pem, "ES256");
  const jwt = new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: creds.keyId, typ: "JWT" })
    .setIssuer(creds.issuerId || creds.keyId)
    .setIssuedAt()
    .setExpirationTime("15m")
    .setAudience("appstoreconnect-v1");
  return jwt.sign(key);
}

async function ascGet(token: string, path: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${ASC_API}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`ASC API ${path} → ${response.status} ${text.slice(0, 240)}`);
    }
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchViaRest(
  creds: AscCredentials,
  appId?: string,
): Promise<{
  apps: AppSummary[];
  builds: BuildRow[];
  feedback: FeedbackRow[];
  submissions: SubmissionRow[];
  selectedAppId: string;
}> {
  const token = await mintJwt(creds);
  const apps = mapApps(await ascGet(token, "/v1/apps?limit=50"));
  if (apps.length === 0) throw new Error("ASC API returned no apps");
  const selectedAppId = apps.some((app) => app.id === appId) ? appId! : apps[0].id;

  const [builds, screenshotFeedback, crashFeedback, versions] = await Promise.all([
    ascGet(token, `/v1/builds?filter[app]=${selectedAppId}&sort=-uploadedDate&limit=10`),
    ascGet(token, `/v1/apps/${selectedAppId}/betaFeedbackScreenshotSubmissions?limit=10`).catch(() => ({ data: [] })),
    ascGet(token, `/v1/apps/${selectedAppId}/betaFeedbackCrashSubmissions?limit=10`).catch(() => ({ data: [] })),
    ascGet(token, `/v1/apps/${selectedAppId}/appStoreVersions?limit=10`),
  ]);

  return {
    apps,
    selectedAppId,
    builds: mapBuilds(builds),
    feedback: [...mapFeedback(screenshotFeedback), ...mapFeedback(crashFeedback)],
    submissions: mapSubmissions(versions),
  };
}

export async function fetchLive(
  creds: AscCredentials,
  appId?: string,
): Promise<{
  apps: AppSummary[];
  builds: BuildRow[];
  feedback: FeedbackRow[];
  submissions: SubmissionRow[];
  selectedAppId: string;
  source: string;
}> {
  try {
    const viaCli = await fetchViaCli(creds, appId);
    return { ...viaCli, source: "App Store Connect CLI (`asc`)" };
  } catch (cliError) {
    const viaRest = await fetchViaRest(creds, appId);
    const cliNote = cliError instanceof Error ? cliError.message : String(cliError);
    return {
      ...viaRest,
      source: `ASC REST API (CLI skipped: ${cliNote})`,
    };
  }
}
