// Passcode cookie, not HTTP Basic Auth. iOS home-screen web apps drop Basic Auth.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PREVIEW_COOKIE, previewGateMode, previewPassword, previewToken, safeNextPath, timingSafeEqual } from "@/lib/preview-gate";

const ROBOTS = "noindex, nofollow, noarchive";

function withRobots(response: NextResponse): NextResponse {
  response.headers.set("X-Robots-Tag", ROBOTS);
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

function unavailable(): NextResponse {
  return new NextResponse("This preview is not available.", {
    status: 503,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": ROBOTS,
      "Referrer-Policy": "no-referrer",
    },
  });
}

function isPasscodeRoute(pathname: string): boolean {
  return pathname === "/preview-access" || pathname === "/api/preview-access";
}

function isNextAsset(pathname: string): boolean {
  return pathname.startsWith("/_next/static") || pathname.startsWith("/_next/image");
}

export async function middleware(request: NextRequest) {
  const mode = previewGateMode();
  if (mode === "open") return withRobots(NextResponse.next());
  if (mode === "closed") return unavailable();

  const { pathname } = request.nextUrl;
  if (isPasscodeRoute(pathname) || isNextAsset(pathname)) return withRobots(NextResponse.next());

  const password = previewPassword();
  const cookie = request.cookies.get(PREVIEW_COOKIE)?.value ?? "";
  if (password && cookie) {
    const expected = await previewToken(password);
    if (timingSafeEqual(cookie, expected)) return withRobots(NextResponse.next());
  }

  const url = request.nextUrl.clone();
  const destination = `${pathname}${request.nextUrl.search}`;
  url.pathname = "/preview-access";
  url.search = "";
  const next = safeNextPath(destination);
  if (next !== "/") url.searchParams.set("next", next);
  return withRobots(NextResponse.redirect(url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
