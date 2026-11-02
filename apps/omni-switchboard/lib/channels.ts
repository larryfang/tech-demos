export const SWITCHBOARD_CHANNELS = ["SMS", "WHATSAPP", "RCS", "MESSENGER"] as const;

export type SwitchboardChannel = (typeof SWITCHBOARD_CHANNELS)[number];

export const CHANNEL_META: Record<
  SwitchboardChannel,
  { label: string; identityLabel: string; identityPlaceholder: string; hue: string }
> = {
  SMS: {
    label: "SMS",
    identityLabel: "Phone number (E.164)",
    identityPlaceholder: "+15551234567",
    hue: "bg-sky-500",
  },
  WHATSAPP: {
    label: "WhatsApp",
    identityLabel: "Phone number (E.164)",
    identityPlaceholder: "+15551234567",
    hue: "bg-emerald-500",
  },
  RCS: {
    label: "RCS",
    identityLabel: "Phone number (E.164)",
    identityPlaceholder: "+15551234567",
    hue: "bg-violet-500",
  },
  MESSENGER: {
    label: "Messenger",
    identityLabel: "Messenger PSID",
    identityPlaceholder: "1234567890123456",
    hue: "bg-blue-600",
  },
};

export function isSwitchboardChannel(value: string): value is SwitchboardChannel {
  return (SWITCHBOARD_CHANNELS as readonly string[]).includes(value);
}
