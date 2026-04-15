import { createCookieSessionStorage, redirect } from "react-router";

const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomUUID();

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "s3-explorer_session",
    httpOnly: true,
    maxAge: 60 * 60 * 24,
    path: "/",
    sameSite: "lax",
    secrets: [SESSION_SECRET],
    secure: process.env.NODE_ENV === "production",
  },
});

export function isAuthEnabled(): boolean {
  return !!(process.env.AUTH_USERNAME && process.env.AUTH_PASSWORD);
}

export async function getSession(request: Request) {
  return sessionStorage.getSession(request.headers.get("Cookie"));
}

export async function requireAuth(request: Request) {
  if (!isAuthEnabled()) return;

  const session = await getSession(request);
  if (!session.get("authenticated")) {
    throw redirect("/login");
  }
}

export async function login(username: string, password: string) {
  if (
    username === process.env.AUTH_USERNAME &&
    password === process.env.AUTH_PASSWORD
  ) {
    const session = await sessionStorage.getSession();
    session.set("authenticated", true);
    return sessionStorage.commitSession(session);
  }
  return null;
}

export async function logout(request: Request) {
  const session = await getSession(request);
  return sessionStorage.destroySession(session);
}

const attempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + 60_000 });
    return { allowed: true };
  }

  if (record.count >= 5) {
    return { allowed: false, retryAfter: Math.ceil((record.resetAt - now) / 1000) };
  }

  record.count++;
  return { allowed: true };
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
