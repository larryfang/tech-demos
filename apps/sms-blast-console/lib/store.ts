import type { Campaign } from "./types";

// Module state is lost on dev-server HMR; globalThis keeps the single-user
// in-memory campaign list stable across recompiles.
const g = globalThis as typeof globalThis & { __campaigns?: Map<string, Campaign> };
const campaigns = (g.__campaigns ??= new Map<string, Campaign>());

export function listCampaigns(): Campaign[] {
  return [...campaigns.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveCampaign(campaign: Campaign): void {
  campaigns.set(campaign.id, campaign);
}

export function getCampaign(id: string): Campaign | undefined {
  return campaigns.get(id);
}
