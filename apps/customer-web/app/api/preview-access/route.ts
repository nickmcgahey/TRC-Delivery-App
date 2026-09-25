import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  PREVIEW_COOKIE,
  cookieSecure,
  passwordsMatch,
  previewGateMode,
  previewPassword,
  previewToken,
  safeNextPath,
} from "@/lib/preview-gate";

const ROBOTS = "noindex, nofollow, noarchive";

function redirectTo(path: string): NextResponse {
  const response = new NextResponse(null, {
    status: 303,
    headers: {
      Location: path,
      "X-Robots-Tag": ROBOTS,
      "Cache-Control": "no-store",
    },
  });
  return response;
}

export async function POST(request: NextRequest) {
  const mode = previewGateMode();
  if (mode === "closed") {
    return new NextResponse("This preview is not available.", {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": ROBOTS,
      },
    });
  }

  const password = previewPassword();
  const form = await request.formData();
  const submitted = String(form.get("password") ?? "").slice(0, 200);
  const next = safeNextPath(String(form.get("next") ?? ""));

  if (mode === "open" || !password) return redirectTo(next);

  const accepted = await passwordsMatch(submitted, password);
  if (!accepted) {
    const params = new URLSearchParams({ error: "1" });
    if (next !== "/") params.set("next", next);
    return redirectTo(`/preview-access?${params.toString()}`);
  }

  const response = redirectTo(next);
  response.cookies.set({
    name: PREVIEW_COOKIE,
    value: await previewToken(password),
    httpOnly: true,
    secure: cookieSecure(request),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  response.headers.set("X-Robots-Tag", ROBOTS);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
