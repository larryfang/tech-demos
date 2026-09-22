import { LabView } from "@/components/lab-view";
import { isLiveAvailable } from "@/lib/vision";

export const dynamic = "force-dynamic";

export default function Home() {
  return <LabView liveAvailable={isLiveAvailable()} />;
}
