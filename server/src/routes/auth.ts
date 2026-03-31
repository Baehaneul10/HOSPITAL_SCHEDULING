import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../lib/jwt.js";
import { ROLES } from "../lib/constants.js";
import type { AuthedRequest } from "../middleware/requireAuth.js";
import { requireUser } from "../middleware/requireAuth.js";

export const authRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

authRouter.post("/register", async (req, res, next) => {
  try {
  const email = String(req.body?.email ?? "")
    .toLowerCase()
    .trim();
  const password = String(req.body?.password ?? "");
  const nameRaw = req.body?.name;
  const name = nameRaw != null && String(nameRaw).trim() !== "" ? String(nameRaw).trim() : null;

  if (!email || !password) {
    res.status(400).json({ error: "이메일과 비밀번호를 입력하세요." });
    return;
  }
  if (!EMAIL_RE.test(email)) {
    res.status(400).json({ error: "올바른 이메일 형식이 아닙니다." });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "비밀번호는 8자 이상이어야 합니다." });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "이미 사용 중인 이메일입니다." });
    return;
  }

  /** 승인 후에는 관리자 권한으로 전 기능 사용(기존 정책). 가입 직후에는 approved=false */
  const role = ROLES.ADMIN;

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, name, role, approved: false },
    select: { id: true, email: true, name: true, role: true, approved: true },
  });

  res.status(201).json({
    message: "가입이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.",
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      approved: user.approved,
    },
  });
  } catch (e) {
    next(e);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
  const email = String(req.body?.email ?? "")
    .toLowerCase()
    .trim();
  const password = String(req.body?.password ?? "");
  if (!email || !password) {
    res.status(400).json({ error: "이메일과 비밀번호를 입력하세요." });
    return;
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." });
    return;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." });
    return;
  }
  if (!user.approved) {
    res.status(403).json({
      error: "관리자 승인 후 로그인할 수 있습니다. 승인 여부는 담당 관리자에게 문의하세요.",
    });
    return;
  }
  const token = await signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      approved: user.approved,
    },
  });
  } catch (e) {
    next(e);
  }
});

authRouter.get("/me", requireUser, async (req: AuthedRequest, res, next) => {
  try {
  const u = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, email: true, name: true, role: true, approved: true },
  });
  if (!u) {
    res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    return;
  }
  res.json(u);
  } catch (e) {
    next(e);
  }
});
