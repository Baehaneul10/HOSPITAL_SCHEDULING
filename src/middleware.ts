import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const path = req.nextUrl.pathname;
  if (path.startsWith("/api/auth")) {
    return NextResponse.next();
  }
  if (path.startsWith("/api/") && !req.auth) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  if (path.startsWith("/login")) {
    return NextResponse.next();
  }
  if (!req.auth) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
