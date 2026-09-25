import type { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireMobileUser } from "../../../_lib/auth";
import { fail, ok, serverError } from "../../../_lib/response";

export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileUser(request, true);
    if (!user) return fail("Доступ запрещён", 403, "FORBIDDEN");
    const tickets = await prisma.support.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
    return ok(tickets.map(ticket => ({ ...ticket, createdAt: ticket.createdAt.toISOString(), updatedAt: ticket.updatedAt.toISOString() })));
  } catch (error) {
    return serverError(error);
  }
}
