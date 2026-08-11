import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { timingSafeEqual } from "crypto";
import { headers } from "next/headers";
import { rateLimit, clientIp } from "./rate-limit";

/**
 * Length-safe constant-time string comparison, so a wrong password cannot be
 * distinguished from a nearly-right one by response timing.
 */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) {
    // Still compare something of equal length so the early return does not
    // itself leak the password length.
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

// Single-admin authentication via credentials. There is no public account
// system — only staff log in, using the ADMIN_EMAIL / ADMIN_PASSWORD env vars.
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    CredentialsProvider({
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
          console.error(
            "[auth] ADMIN_EMAIL / ADMIN_PASSWORD not configured.",
          );
          return null;
        }

        // Throttle guesses per IP. /admin/login is publicly reachable and a
        // single shared password is the only thing protecting order data.
        try {
          const ip = clientIp(await headers());
          if (!rateLimit(`login:${ip}`, 5, 5 * 60_000).ok) {
            console.warn(`[auth] rate limit hit for ${ip}`);
            return null;
          }
        } catch {
          // headers() unavailable outside a request scope — fail open here
          // rather than locking out legitimate logins.
        }

        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";

        if (
          safeEqual(email ?? "", adminEmail.trim().toLowerCase()) &&
          safeEqual(password, adminPassword)
        ) {
          return { id: "admin", name: "Event Admin", email: adminEmail, role: "admin" };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as { role?: string }).role ?? "admin";
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role =
          (token.role as string) ?? "admin";
      }
      return session;
    },
  },
};
