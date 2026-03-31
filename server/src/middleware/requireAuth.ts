import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt.js";
import { ROLES } from "../lib/constants.js";
import { prisma } from "../lib/prisma.js";

export type AuthedRequest = Request & {
  user?: { id: string; email: string; role: string; name: string | null };
};

export async function requireUser(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "로그인이 필요합니다." });
    return;
  }
  const payload = await verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "유효하지 않은 토큰입니다." });
    return;
  }
  const dbUser = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, role: true, name: true, approved: true },
  });
  if (!dbUser) {
    res.status(401).json({ error: "사용자를 찾을 수 없습니다." });
    return;
  }
  if (!dbUser.approved) {
    res.status(403).json({ error: "승인되지 않은 계정입니다. 관리자에게 문의하세요." });
    return;
  }
  req.user = {
    id: dbUser.id,
    email: dbUser.email,
    role: dbUser.role,
    name: dbUser.name ?? null,
  };
  next();
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== ROLES.ADMIN) {
    res.status(403).json({ error: "관리자만 가능합니다." });
    return;
  }
  next();
}
