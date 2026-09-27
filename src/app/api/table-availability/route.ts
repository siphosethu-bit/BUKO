import { NextRequest, NextResponse } from "next/server";
import { tableAvailability } from "@/app/actions/public";
export async function GET(request: NextRequest) {
  const result = await tableAvailability(
    request.nextUrl.searchParams.get("date"),
  );
  return NextResponse.json(result, {
    status: result.ok ? 200 : 503,
    headers: { "Cache-Control": "private, no-store" },
  });
}
