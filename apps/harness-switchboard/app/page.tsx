import { Switchboard } from "@/components/switchboard";
import { isLiveAvailable } from "@/lib/live";

export const dynamic = "force-dynamic";

export default function Home() {
  return <Switchboard liveAvailable={isLiveAvailable()} />;
}
