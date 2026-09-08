import { NextRequest, NextResponse } from "next/server";

// Citizen session tracking. Every visitor is assigned a stable anonymous
// citizen id via cookie so "my reports" can be scoped to them.
// If a Supabase Auth session or linking token is provided,
// the proxy permits setting sb-access-token so accounts can be linked smoothly.
export const CITIZEN_ID_COOKIE = "citizen_id";
export const SB_ACCESS_TOKEN_COOKIE = "sb-access-token";

export function proxy(request: NextRequest) {
  let response: NextResponse;

  // Opt-in: allow linking a Supabase account token passed via query param or header
  const linkToken =
    request.nextUrl.searchParams.get("sb_access_token") ||
    request.headers.get("x-sb-access-token");

  const existingCitizenId = request.cookies.get(CITIZEN_ID_COOKIE)?.value;

  if (!existingCitizenId) {
    // Propagate the new cookie onto the request itself (not just the
    // response) so the very first request from a brand-new visitor can
    // already read it — e.g. a route handler calling getCitizenId().
    const citizenId = crypto.randomUUID();
    request.cookies.set(CITIZEN_ID_COOKIE, citizenId);

    response = NextResponse.next({ request });
    response.cookies.set(CITIZEN_ID_COOKIE, citizenId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  } else {
    response = NextResponse.next();
  }

  if (linkToken) {
    response.cookies.set(SB_ACCESS_TOKEN_COOKIE, linkToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return response;
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
