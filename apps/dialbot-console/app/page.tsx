import { ConsoleView } from "@/components/console-view";
import { getSnapshot } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function Home() {
  const snapshot = getSnapshot();
  return <ConsoleView initial={snapshot} />;
}
