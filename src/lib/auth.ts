import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

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

        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";

        if (
          email === adminEmail.trim().toLowerCase() &&
          password === adminPassword
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
