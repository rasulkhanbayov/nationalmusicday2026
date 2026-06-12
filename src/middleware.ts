export { default } from "next-auth/middleware";

// Protect all /admin routes except the login page itself.
// next-auth's middleware redirects unauthenticated users to the configured
// signIn page (/admin/login).
export const config = {
  matcher: ["/admin/dashboard/:path*", "/admin/scan/:path*"],
};
