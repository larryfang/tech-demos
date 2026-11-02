import { Badge } from "@/components/ui/badge";
import type { MailgunValidation } from "@/lib/validation";

export function ResultBadge({ result }: { result: MailgunValidation["result"] }) {
  const styles: Record<string, string> = {
    deliverable: "bg-emerald-600 text-white",
    undeliverable: "bg-red-600 text-white",
    do_not_send: "bg-red-700 text-white",
    catch_all: "bg-amber-500 text-white",
    unknown: "bg-zinc-400 text-white",
  };
  return <Badge className={styles[result] ?? ""}>{result.replace(/_/g, " ")}</Badge>;
}

export function RiskBadge({ risk }: { risk: MailgunValidation["risk"] }) {
  const styles: Record<string, string> = {
    low: "bg-emerald-100 text-emerald-800 border border-emerald-300",
    medium: "bg-amber-100 text-amber-800 border border-amber-300",
    high: "bg-red-100 text-red-800 border border-red-300",
    unknown: "bg-zinc-100 text-zinc-600 border border-zinc-300",
  };
  return <Badge className={styles[risk] ?? ""}>risk: {risk}</Badge>;
}

export function BoolBadge({ label, bad }: { label: string; bad: boolean }) {
  return (
    <Badge
      className={
        bad
          ? "bg-red-100 text-red-800 border border-red-300"
          : "bg-zinc-100 text-zinc-600 border border-zinc-300"
      }
    >
      {label}: {bad ? "yes" : "no"}
    </Badge>
  );
}

export function CheckBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Badge
      className={
        ok
          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
          : "bg-red-100 text-red-800 border border-red-300"
      }
    >
      {ok ? "✓" : "✕"} {label}
    </Badge>
  );
}
