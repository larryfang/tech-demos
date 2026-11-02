/** Server-side Sinch Voice API configuration. Secrets never leave API routes. */

const REGION_BASE_URLS: Record<string, string> = {
  global: "https://calling.api.sinch.com",
  use1: "https://calling-use1.api.sinch.com",
  euc1: "https://calling-euc1.api.sinch.com",
  apse1: "https://calling-apse1.api.sinch.com",
  apse2: "https://calling-apse2.api.sinch.com",
  sae1: "https://calling-sae1.api.sinch.com",
};

export function getSinchConfig() {
  const applicationKey = process.env.SINCH_APPLICATION_KEY ?? "";
  const applicationSecret = process.env.SINCH_APPLICATION_SECRET ?? "";
  const region = (process.env.SINCH_VOICE_REGION ?? "global").toLowerCase();
  return {
    applicationKey,
    applicationSecret,
    region,
    baseUrl: REGION_BASE_URLS[region] ?? REGION_BASE_URLS.global,
    defaultCli: process.env.SINCH_CLI ?? "",
    configured: applicationKey.length > 0 && applicationSecret.length > 0,
  };
}
