/**
 * Render 등 CI: DIRECT_URL 이 없으면 Prisma가 P1012로 멈춥니다.
 * 없을 때만 DATABASE_URL 을 복사합니다. Supabase에서는 가능하면 Session(5432)을 DIRECT_URL로 따로 두는 것이 안전합니다.
 */
import { execSync } from "node:child_process";
import process from "node:process";

if (!process.env.DIRECT_URL?.trim() && process.env.DATABASE_URL?.trim()) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
  console.warn(
    "[build] DIRECT_URL 없음 → DATABASE_URL 로 대체합니다. Supabase는 Session pooler(5432)를 DIRECT_URL에 두는 것을 권장합니다."
  );
}

execSync("npx prisma generate", { stdio: "inherit", env: process.env });
execSync("npx prisma migrate deploy", { stdio: "inherit", env: process.env });
