'use server';

import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { getCurrentUser } from "./user";

export async function createSupportTicket(subject: string, message: string, userEmail: string, fromName: string) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('Необходима авторизация');
    }

    if (!subject.trim() || !message.trim()) {
      throw new Error('Заполните все поля');
    }

    // Создаем запись в базе данных
    const ticket = await prisma.support.create({
      data: {
        userId: user.id,
        subject: subject.trim(),
        message: message.trim(),
        status: 'pending',
        isReadByAdmin: false,
        isReadByUser: false,
      },
    });

    revalidatePath('/support');
    revalidatePath('/admin/support');
    revalidatePath('/profile');

    return {
      success: true,
      ticket,
      message: 'Обращение успешно отправлено. Мы ответим вам в ближайшее время.'
    };
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Не удалось создать обращение',
      isAuthError: error instanceof Error && error.message === 'Необходима авторизация'
    };
  }
}

export async function getUserSupportTickets(
  page: number = 1,
  limit: number = 10,
  status?: 'pending' | 'answered' | 'closed'
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('Необходима авторизация');
    }

    const skip = (page - 1) * limit;
    const where = { 
      userId: user.id,
      ...(status && { status })
    };

    const [tickets, totalCount] = await Promise.all([
      prisma.support.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.support.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // Получаем количество непрочитанных
    const unreadCount = await prisma.support.count({
      where: {
        userId: user.id,
        answer: { not: null },
        isReadByUser: false,
      },
    });

    // Обновляем счетчик в профиле пользователя (кешируем)
    await prisma.user.update({
      where: { id: user.id },
      data: { unreadSupportCount: unreadCount },
    });

    return {
      success: true,
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
    console.error('Error getting user support tickets:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Не удалось загрузить обращения',
      isAuthError: error instanceof Error && error.message === 'Необходима авторизация'
    };
  }
}

// Получить все обращения (для админа - пользователь с id = 1)
export async function getAllSupportTickets(
  page: number = 1,
  limit: number = 20,
  status?: 'pending' | 'answered' | 'closed'
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('Необходима авторизация');
    }

    // Проверяем, что пользователь - админ (id = 1)
    if (user.id !== '1') {
      throw new Error('Доступ запрещен. Только администратор может просматривать все обращения.');
    }

    const skip = (page - 1) * limit;
    
    const where = status ? { status } : {};

    const [tickets, totalCount] = await Promise.all([
      prisma.support.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.support.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // Подсчет непрочитанных сообщений от пользователей
    const unreadCount = await prisma.support.count({
      where: { isReadByAdmin: false },
    });

    return {
      success: true,
      tickets,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      unreadCount,
    };
  } catch (error) {
    console.error('Error getting all support tickets:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Не удалось загрузить обращения',
      isAuthError: error instanceof Error && error.message === 'Необходима авторизация'
    };
  }
}

// Ответить на обращение (только для админа)
export async function answerSupportTicket(ticketId: string, answer: string) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('Необходима авторизация');
    }

    // Проверяем, что пользователь - админ (id = 1)
    if (user.id !== '1') {
      throw new Error('Доступ запрещен. Только администратор может отвечать на обращения.');
    }

    if (!answer.trim()) {
      throw new Error('Заполните ответ');
    }

    const updatedTicket = await prisma.support.update({
      where: { id: ticketId },
      data: {
        answer: answer.trim(),
        status: 'answered',
        isReadByUser: false, // пользователь еще не прочитал ответ
        isReadByAdmin: true, // админ прочитал (он же и отвечает)
      },
    });

    revalidatePath('/admin/support');
    revalidatePath(`/support`);

    return {
      success: true,
      ticket: updatedTicket,
      message: 'Ответ успешно отправлен'
    };
  } catch (error) {
    console.error('Error answering support ticket:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Не удалось отправить ответ',
      isAuthError: error instanceof Error && error.message === 'Необходима авторизация'
    };
  }
}

// Отметить как прочитанное пользователем
export async function markAsReadByUser(ticketId: string) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('Необходима авторизация');
    }

    const ticket = await prisma.support.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new Error('Обращение не найдено');
    }

    // Проверяем, что пользователь владелец обращения
    if (ticket.userId !== user.id) {
      throw new Error('Доступ запрещен');
    }

    const updatedTicket = await prisma.support.update({
      where: { id: ticketId },
      data: {
        isReadByUser: true,
      },
    });

    revalidatePath('/support');
    revalidatePath('/profile');

    return {
      success: true,
      ticket: updatedTicket,
    };
  } catch (error) {
    console.error('Error marking ticket as read:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Не удалось обновить статус',
      isAuthError: error instanceof Error && error.message === 'Необходима авторизация'
    };
  }
}

// Отметить как прочитанное админом
export async function markAsReadByAdmin(ticketId: string) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('Необходима авторизация');
    }

    // Проверяем, что пользователь - админ (id = 1)
    if (user.id !== '1') {
      throw new Error('Доступ запрещен');
    }

    const updatedTicket = await prisma.support.update({
      where: { id: ticketId },
      data: {
        isReadByAdmin: true,
      },
    });

    revalidatePath('/admin/support');

    return {
      success: true,
      ticket: updatedTicket,
    };
  } catch (error) {
    console.error('Error marking ticket as read by admin:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Не удалось обновить статус',
      isAuthError: error instanceof Error && error.message === 'Необходима авторизация'
    };
  }
}

// Закрыть обращение
export async function closeSupportTicket(ticketId: string) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('Необходима авторизация');
    }

    const ticket = await prisma.support.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new Error('Обращение не найдено');
    }

    // Проверяем, что пользователь владелец обращения или админ
    if (ticket.userId !== user.id && user.id !== '1') {
      throw new Error('Доступ запрещен');
    }

    const updatedTicket = await prisma.support.update({
      where: { id: ticketId },
      data: {
        status: 'closed',
      },
    });

    revalidatePath('/support');
    revalidatePath('/admin/support');

    return {
      success: true,
      ticket: updatedTicket,
      message: 'Обращение закрыто'
    };
  } catch (error) {
    console.error('Error closing support ticket:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Не удалось закрыть обращение',
      isAuthError: error instanceof Error && error.message === 'Необходима авторизация'
    };
  }
}

// Получить количество непрочитанных обращений для админа
export async function getAdminUnreadCount() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('Необходима авторизация');
    }

    // Только для админа
    if (user.id !== '1') {
      return { success: true, unreadCount: 0 };
    }

    const unreadCount = await prisma.support.count({
      where: { isReadByAdmin: false },
    });

    return {
      success: true,
      unreadCount,
    };
  } catch (error) {
    console.error('Error getting admin unread count:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Не удалось загрузить статистику',
    };
  }
}











export type SupportTicket = {
  id: string;
  userId: string;
  subject: string;
  message: string;
  answer?: string | null;
  status: 'pending' | 'answered' | 'closed';
  isReadByUser: boolean;
  isReadByAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
  answeredAt?: Date | null;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
  };
};


export async function getUserUnreadSupportCount() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { success: true, unreadCount: 0 };
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { unreadSupportCount: true }
    });

    return {
      success: true,
      unreadCount: userData?.unreadSupportCount || 0
    };
  } catch (error) {
    console.error('Error getting user unread count:', error);
    return { success: false, error: 'Не удалось получить количество непрочитанных' };
  }
}

export async function markSupportAsRead(ticketId: string) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('Необходима авторизация');
    }

    const ticket = await prisma.support.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new Error('Обращение не найдено');
    }

    if (ticket.userId !== user.id) {
      throw new Error('Это не ваше обращение');
    }

    if (!ticket.answer) {
      throw new Error('На это обращение еще нет ответа');
    }

    await prisma.support.update({
      where: { id: ticketId },
      data: { isReadByUser: true },
    });

    const unreadCount = await prisma.support.count({
      where: {
        userId: user.id,
        answer: { not: null },
        isReadByUser: false,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { unreadSupportCount: unreadCount },
    });

    revalidatePath('/my-support');
    revalidatePath('/support');

    return {
      success: true,
      message: 'Отмечено как прочитанное',
      unreadCount,
    };
  } catch (error) {
    console.error('Error marking support as read:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Не удалось обновить статус',
      isAuthError: error instanceof Error && error.message === 'Необходима авторизация'
    };
  }
}

export async function closeUserSupportTicket(ticketId: string) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('Необходима авторизация');
    }

    const ticket = await prisma.support.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new Error('Обращение не найдено');
    }

    if (ticket.userId !== user.id) {
      throw new Error('Это не ваше обращение');
    }

    await prisma.support.update({
      where: { id: ticketId },
      data: { status: 'closed' },
    });

    revalidatePath('/my-support');

    return {
      success: true,
      message: 'Обращение закрыто'
    };
  } catch (error) {
    console.error('Error closing support ticket:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Не удалось закрыть обращение',
      isAuthError: error instanceof Error && error.message === 'Необходима авторизация'
    };
  }
}

export async function getSupportTicketById(ticketId: string) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('Необходима авторизация');
    }

    const ticket = await prisma.support.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new Error('Обращение не найдено');
    }

    if (ticket.userId !== user.id) {
      throw new Error('Это не ваше обращение');
    }

    return {
      success: true,
      ticket,
    };
  } catch (error) {
    console.error('Error getting support ticket by id:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Не удалось загрузить обращение',
      isAuthError: error instanceof Error && error.message === 'Необходима авторизация'
    };
  }
}