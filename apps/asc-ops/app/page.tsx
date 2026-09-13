import { ConsoleView } from "@/components/console-view";
import { loadConsole } from "@/lib/load-console";

export const dynamic = "force-dynamic";

export default async function Home() {
  const snapshot = await loadConsole();
  return <ConsoleView initial={snapshot} />;
}
