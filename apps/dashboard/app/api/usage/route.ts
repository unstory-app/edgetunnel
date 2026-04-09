import { NextResponse } from "next/server";
import { getUsageSummary } from "../../../lib/metrics";

export async function GET() {
  const usage = await getUsageSummary();
  return NextResponse.json(usage);
}
