import { Inspector } from "@/components/inspector";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Sinch Number Lookup API v2
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Number Lookup Inspector
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Inspect a phone number: offline E.164 parsing, plus live carrier, line
          type, porting, SIM-swap and VoIP risk data from the Sinch Number Lookup
          API.
        </p>
      </header>
      <Inspector />
    </main>
  );
}
