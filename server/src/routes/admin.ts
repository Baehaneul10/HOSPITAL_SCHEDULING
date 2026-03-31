import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireUser, requireAdmin, type AuthedRequest } from "../middleware/requireAuth.js";

export const adminRouter = Router();
adminRouter.use(requireUser);
adminRouter.use(requireAdmin);

adminRouter.get("/users/pending", async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { approved: false },
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    res.json({ users });
  } catch (e) {
    next(e);
  }
});

adminRouter.post("/users/:id/approve", async (req: AuthedRequest, res, next) => {
  try {
    const id = String(req.params.id ?? "");
    if (!id) {
      res.status(400).json({ error: "잘못된 요청입니다." });
      return;
    }
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
      return;
    }
    const user = await prisma.user.update({
      where: { id },
      data: { approved: true },
      select: { id: true, email: true, name: true, role: true, approved: true, createdAt: true },
    });
    res.json({ user });
  } catch (e) {
    next(e);
  }
});
