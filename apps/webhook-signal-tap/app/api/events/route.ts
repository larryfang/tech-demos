import { NextResponse } from "next/server";
import { clearEvents, listEvents } from "@/lib/store";


export async function GET() {
  return NextResponse.json({ events: listEvents() });
}

export async function DELETE() {
  clearEvents();
  return NextResponse.json({ ok: true });
}
