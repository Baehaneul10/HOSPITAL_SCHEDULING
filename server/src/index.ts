import "./env.js";
import cors from "cors";
import express, { type Request, type Response, type NextFunction } from "express";
import { authRouter } from "./routes/auth.js";
import { adminRouter } from "./routes/admin.js";
import { patientsRouter } from "./routes/patients.js";
import { appointmentsRouter } from "./routes/appointments.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);

const corsOrigins = process.env.CORS_ORIGIN?.trim()
  ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
  : true;

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));

const health = (_req: Request, res: Response) => {
  res.json({ ok: true });
};
app.get("/health", health);
app.get("/healthz", health);

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/patients", patientsRouter);
app.use("/api/appointments", appointmentsRouter);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  const message = err instanceof Error ? err.message : "서버 오류가 발생했습니다.";
  res.status(500).json({ error: message });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`API listening on 0.0.0.0:${port}`);
});
