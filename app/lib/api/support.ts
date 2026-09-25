"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { requireAdmin, requireUser } from "../authorization";
import { consumeRateLimit } from "../rate-limit";

type SupportStatus = "pending" | "answered" | "closed";

function errorResult(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  return {
    success: false as const,
    error: message,
    isAuthError: message === "Необходима авторизация",
  };
}

async function syncUnreadCount(userId: string) {
  const unreadCount = await prisma.support.count({
    where: { userId, answer: { not: null }, isReadByUser: false },
  });
  await prisma.user.update({
    where: { id: userId },
    data: { unreadSupportCount: unreadCount },
  });
  return unreadCount;
}

export async function createSupportTicket(subject: string, message: string) {
  try {
    const user = await requireUser();
    const rateLimit = await consumeRateLimit('support-ticket', user.id, 5, 60 * 60 * 1000);
    if (!rateLimit.allowed) throw new Error("Слишком много обращений. Попробуйте позже");
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();
    if (!cleanSubject || !cleanMessage) throw new Error("Заполните все поля");
    if (cleanSubject.length > 150) throw new Error("Тема слишком длинная");
    if (cleanMessage.length > 5000) throw new Error("Сообщение слишком длинное");

    const ticket = await prisma.support.create({
      data: {
        userId: user.id,
        subject: cleanSubject,
        message: cleanMessage,
        status: "pending",
        isReadByAdmin: false,
        isReadByUser: false,
      },
    });

    revalidatePath("/support");
    revalidatePath("/admin/support");
    revalidatePath("/profile");

    return {
      success: true as const,
      ticket,
      message: "Обращение успешно отправлено. Мы ответим вам в ближайшее время.",
    };
  } catch (error) {
    console.error("Error creating support ticket:", error);
    return errorResult(error, "Не удалось создать обращение");
  }
}

export async function getUserSupportTickets(
  page = 1,
  limit = 10,
  status?: SupportStatus,
) {
  try {
    const user = await requireUser();
    page = Math.max(1, Math.floor(page));
    limit = Math.min(50, Math.max(1, Math.floor(limit)));
    const where = { userId: user.id, ...(status ? { status } : {}) };
    const skip = (page - 1) * limit;

    const [tickets, totalCount, unreadCount] = await Promise.all([
      prisma.support.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true, avatar: true },
          },
        },
      }),
      prisma.support.count({ where }),
      prisma.support.count({
        where: { userId: user.id, answer: { not: null }, isReadByUser: false },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);
    return {
      success: true as const,
      tickets,
      unreadCount,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  } catch (error) {
    console.error("Error getting user support tickets:", error);
    return errorResult(error, "Не удалось загрузить обращения");
  }
}

export async function getAllSupportTickets(
  page = 1,
  limit = 20,
  status?: SupportStatus,
) {
  try {
    await requireAdmin();
    page = Math.max(1, Math.floor(page));
    limit = Math.min(100, Math.max(1, Math.floor(limit)));
    const where = status ? { status } : {};
    const skip = (page - 1) * limit;

    const [tickets, totalCount, unreadCount] = await Promise.all([
      prisma.support.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true, avatar: true },
          },
        },
      }),
      prisma.support.count({ where }),
      prisma.support.count({ where: { isReadByAdmin: false } }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);
    return {
      success: true as const,
      tickets,
      unreadCount,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  } catch (error) {
    console.error("Error getting support tickets:", error);
    return errorResult(error, "Не удалось загрузить обращения");
  }
}

export async function answerSupportTicket(ticketId: string, answer: string) {
  try {
    await requireAdmin();
    const cleanAnswer = answer.trim();
    if (!cleanAnswer) throw new Error("Заполните ответ");
    if (cleanAnswer.length > 5000) throw new Error("Ответ слишком длинный");

    const ticket = await prisma.support.update({
      where: { id: ticketId },
      data: {
        answer: cleanAnswer,
        status: "answered",
        isReadByUser: false,
        isReadByAdmin: true,
      },
    });

    revalidatePath("/admin/support");
    revalidatePath("/support");
    return { success: true as const, ticket, message: "Ответ успешно отправлен" };
  } catch (error) {
    console.error("Error answering support ticket:", error);
    return errorResult(error, "Не удалось отправить ответ");
  }
}

export async function markAsReadByAdmin(ticketId: string) {
  try {
    await requireAdmin();
    const ticket = await prisma.support.update({
      where: { id: ticketId },
      data: { isReadByAdmin: true },
    });
    revalidatePath("/admin/support");
    return { success: true as const, ticket };
  } catch (error) {
    console.error("Error marking support ticket as read:", error);
    return errorResult(error, "Не удалось обновить статус");
  }
}

export async function closeSupportTicket(ticketId: string) {
  try {
    await requireAdmin();
    const ticket = await prisma.support.update({
      where: { id: ticketId },
      data: { status: "closed" },
    });
    revalidatePath("/admin/support");
    revalidatePath("/support");
    return { success: true as const, ticket, message: "Обращение закрыто" };
  } catch (error) {
    console.error("Error closing support ticket:", error);
    return errorResult(error, "Не удалось закрыть обращение");
  }
}

export async function getAdminUnreadCount() {
  try {
    await requireAdmin();
    const unreadCount = await prisma.support.count({ where: { isReadByAdmin: false } });
    return { success: true as const, unreadCount };
  } catch (error) {
    console.error("Error getting unread support count:", error);
    return errorResult(error, "Не удалось загрузить статистику");
  }
}

export async function markSupportAsRead(ticketId: string) {
  try {
    const user = await requireUser();
    const ticket = await prisma.support.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new Error("Обращение не найдено");
    if (ticket.userId !== user.id) throw new Error("Это не ваше обращение");
    if (!ticket.answer) throw new Error("На это обращение еще нет ответа");

    await prisma.support.update({
      where: { id: ticketId },
      data: { isReadByUser: true },
    });
    const unreadCount = await syncUnreadCount(user.id);

    revalidatePath("/my-support");
    revalidatePath("/support");
    return { success: true as const, message: "Отмечено как прочитанное", unreadCount };
  } catch (error) {
    console.error("Error marking support ticket as read:", error);
    return errorResult(error, "Не удалось обновить статус");
  }
}

export async function closeUserSupportTicket(ticketId: string) {
  try {
    const user = await requireUser();
    const ticket = await prisma.support.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new Error("Обращение не найдено");
    if (ticket.userId !== user.id) throw new Error("Это не ваше обращение");

    await prisma.support.update({
      where: { id: ticketId },
      data: { status: "closed" },
    });
    revalidatePath("/my-support");
    return { success: true as const, message: "Обращение закрыто" };
  } catch (error) {
    console.error("Error closing support ticket:", error);
    return errorResult(error, "Не удалось закрыть обращение");
  }
}
