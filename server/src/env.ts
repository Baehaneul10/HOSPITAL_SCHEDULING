process.on("uncaughtException", (err) => {
  console.error("[fatal] uncaughtException", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[fatal] unhandledRejection", reason);
});

import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(serverRoot, ".env") });

/** .env에 없으면 로컬 SQLite (prisma/dev.db). 운영은 .env에 MariaDB URL 설정 */
if (!process.env.DATABASE_URL?.trim()) {
  process.env.DATABASE_URL = "file:./dev.db";
}

if (!process.env.JWT_SECRET?.trim()) {
  process.env.JWT_SECRET = "dev-only-change-in-production";
}

if (process.env.RENDER === "true") {
  console.log(
    `[boot] Render runtime PORT=${process.env.PORT ?? "(unset)"} cwd=${process.cwd()} hasDbUrl=${Boolean(process.env.DATABASE_URL?.trim())}`
  );
}
