import "server-only";

import { getCurrentUser } from "./api/user";

export function isAdmin(user: { role?: string | null } | null | undefined) {
  return user?.role === "ADMIN";
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Необходима авторизация");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!isAdmin(user)) throw new Error("Доступ запрещен");
  return user;
}
