import * as jose from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-only-change-me");

export type JwtPayload = {
  sub: string;
  email: string;
  role: string;
  name?: string | null;
};

export async function signToken(payload: JwtPayload): Promise<string> {
  return new jose.SignJWT({ role: payload.role, email: payload.email, name: payload.name ?? null })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, secret);
    const sub = payload.sub;
    const email = typeof payload.email === "string" ? payload.email : "";
    const role = typeof payload.role === "string" ? payload.role : "THERAPIST";
    const name = payload.name;
    if (!sub) return null;
    return { sub, email, role, name: typeof name === "string" ? name : null };
  } catch {
    return null;
  }
}
