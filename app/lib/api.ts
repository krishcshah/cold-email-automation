import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Gets the current session user ID, or returns a 401 response.
 * Usage in API routes:
 *   const { userId, error } = await requireAuth();
 *   if (error) return error;
 */
export async function requireAuth(): Promise<
  { userId: string; error: null } | { userId: null; error: NextResponse }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      userId: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { userId: session.user.id, error: null };
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
