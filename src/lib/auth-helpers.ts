import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { ROLES } from "@/lib/constants";

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    return { error: NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 }) };
  }
  return { user };
}

export async function requireAdmin() {
  const r = await requireUser();
  if ("error" in r) return r;
  if (r.user.role !== ROLES.ADMIN) {
    return { error: NextResponse.json({ error: "경영팀(관리자)만 사용할 수 있습니다." }, { status: 403 }) };
  }
  return { user: r.user };
}
