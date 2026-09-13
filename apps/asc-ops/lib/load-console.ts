import { credentialsFromEnv, fetchLive } from "./asc";
import { fixtureSnapshot } from "./fixtures";
import type { AscCredentials, ConsoleSnapshot } from "./types";

export async function loadConsole(
  appId?: string,
  override?: Partial<AscCredentials>,
): Promise<ConsoleSnapshot> {
  const creds = credentialsFromEnv(override);
  if (!creds) return fixtureSnapshot(appId);

  try {
    const live = await fetchLive(creds, appId);
    return {
      mode: "live",
      source: live.source,
      apps: live.apps,
      selectedAppId: live.selectedAppId,
      builds: live.builds,
      feedback: live.feedback,
      submissions: live.submissions,
    };
  } catch (error) {
    const fallback = fixtureSnapshot(appId);
    return {
      ...fallback,
      fallbackReason:
        error instanceof Error ? error.message : "Live ASC request failed",
    };
  }
}
