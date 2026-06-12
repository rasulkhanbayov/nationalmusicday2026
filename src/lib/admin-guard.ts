import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

/**
 * Returns true if the current request is from an authenticated admin.
 * Use at the top of admin API routes.
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  return Boolean(session?.user);
}
