'use client';

import React, { useEffect, useState } from 'react';
import { getUserSupportTickets, markSupportAsRead, closeUserSupportTicket } from '@/app/lib/api/support';
import { getCurrentUser, User } from '@/app/lib/api/user';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDays, faCommentDots, faEnvelope } from '@fortawesome/free-regular-svg-icons'
import { faCheck, faHourglassStart, faInbox, faLock } from '@fortawesome/free-solid-svg-icons'
import { Loader2 } from 'lucide-react';

export default function MySupportPage() {
  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const router = useRouter();

  useEffect(() => {
    loadUserAndTickets();
  }, [currentPage, filterStatus]);

  const loadUserAndTickets = async () => {
    setIsLoading(true);
    
    const currentUser = await getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      
      const result = await getUserSupportTickets(
        currentPage,
        10,
        filterStatus === 'all' ? undefined : filterStatus as any
      );
      
      if (result.success) {
        setTickets(result.tickets || []);
        setUnreadCount(result.unreadCount || 0);
        setTotalPages(result.pagination?.totalPages || 1);
        setTotalCount(result.pagination?.totalCount || 0);
      } else {
        if (result.isAuthError) {
          toast.error('Необходима авторизация');
          router.push('/sign-in?callbackUrl=/my-support');
        } else {
          toast.error(result.error || 'Ошибка при загрузке обращений');
        }
      }
    } else {
      toast.error('Необходима авторизация');
      router.push('/sign-in?callbackUrl=/my-support');
    }
    
    setIsLoading(false);
  };

  const handleMarkAsRead = async (ticketId: string) => {
    const result = await markSupportAsRead(ticketId);
    if (result.success) {
      toast.success(result.message);
      setUnreadCount(result.unreadCount || 0);
      loadUserAndTickets();
    } else {
      toast.error(result.error || 'Ошибка');
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    const result = await closeUserSupportTicket(ticketId);
    if (result.success) {
      toast.success(result.message);
      loadUserAndTickets();
    } else {
      toast.error(result.error || 'Ошибка');
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Сегодня в ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Вчера в ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return d.toLocaleDateString('ru-RU', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
    } else {
      return d.toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'long', 
        year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-3 py-1 bg-yellow-100/60 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-lg text-md font-medium">
            <FontAwesomeIcon icon={faHourglassStart} /> В ожидании
          </span>
        );
      case 'answered':
        return (
          <span className="px-3 py-1 bg-green-100/60 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg text-md font-medium">
            <FontAwesomeIcon icon={faCheck} /> Отвечено
          </span>
        );
      case 'closed':
        return (
          <span className="px-3 py-1 bg-gray-100/60 text-gray-700 dark:bg-gray-800 dark:text-gray-400 rounded-lg text-md font-medium">
            <FontAwesomeIcon icon={faLock} /> Закрыто
          </span>
        );
      default:
        return null;
    }
  };

  if (!user && !isLoading) {
    return null;
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Хедер */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Мои обращения в поддержку
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Здесь вы можете отслеживать статус ваших обращений и читать ответы от администрации
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {unreadCount > 0 && (
                <div className="relative">
                  <span className="px-4 py-2 bg-[#FF7340] text-white rounded-full font-medium flex items-center">
                    {unreadCount} непрочитанных
                  </span>
                </div>
              )}
              <Link
                href="/support"
                className="bg-gradient-to-r from-[#FF7340] to-[#FF4500] hover:opacity-80 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
              >
                + Новое обращение
              </Link>
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Всего обращений</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalCount}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FontAwesomeIcon icon={faEnvelope} className="text-blue-600 dark:text-blue-400 text-2xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Ожидают ответа</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {tickets.filter(t => t.status === 'pending').length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <FontAwesomeIcon icon={faHourglassStart} className="text-yellow-600 dark:text-yellow-400 text-2xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Получено ответов</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {tickets.filter(t => t.status === 'answered').length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <FontAwesomeIcon icon={faCheck} className="text-green-600 dark:text-green-400 text-2xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Фильтры */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'Все' },
              { value: 'pending', label: 'В ожидании' },
              { value: 'answered', label: 'Отвечено' },
              { value: 'closed', label: 'Закрыто' }
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setFilterStatus(filter.value)}
                className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                  filterStatus === filter.value 
                    ? 'bg-[#FF7340] text-white' 
                    : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Список обращений */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {isLoading ? (
            <div className="py-12 text-center flex items-center justify-center gap-2">
              <Loader2 className="animate-spin text-[#FF7340]" size={24} />
              <p className="text-gray-600 dark:text-gray-400">Загрузка ваших обращений...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-6xl mb-4 text-gray-400 dark:text-gray-600">
                <FontAwesomeIcon icon={faInbox} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                У вас пока нет обращений
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {filterStatus !== 'all' 
                  ? `Нет обращений со статусом "${
                      filterStatus === 'pending' ? 'В ожидании' : 
                      filterStatus === 'answered' ? 'Отвечено' : 'Закрыто'
                    }"`
                  : 'Обратитесь в поддержку, если у вас есть вопросы или проблемы'}
              </p>
              <Link
                href="/support"
                className="inline-block bg-gradient-to-r from-[#FF7340] to-[#FF4500] text-white px-6 py-3 rounded-lg hover:opacity-80 duration-200"
              >
                Создать первое обращение
              </Link>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {tickets.map((ticket) => (
                  <div 
                    key={ticket.id} 
                    className={`p-6 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {ticket.subject}
                          </h3>
                          {getStatusBadge(ticket.status)}
                          {ticket.answer && !ticket.isReadByUser && (
                            <span className="px-3 py-1 bg-[#FF7340] text-white rounded-lg text-md font-medium animate-pulse">
                              ✨ Новый ответ!
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                          {ticket.message}
                        </p>
                        
                        <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <FontAwesomeIcon icon={faCalendarDays} className="text-md" />
                            <span className="text-sm">{formatDate(ticket.createdAt)}</span>
                          </span>
                          {ticket.answeredAt && (
                            <span className="flex items-center gap-1">
                              <FontAwesomeIcon icon={faCheck} />
                              <span className="text-sm">Ответ: {formatDate(ticket.answeredAt)}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          {ticket.answer && !ticket.isReadByUser && (
                            <button
                              onClick={() => handleMarkAsRead(ticket.id)}
                              className="px-4 py-2 bg-[#FF7340] hover:bg-[#FF4500] text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
                            >
                              Отметить как прочитанное
                            </button>
                          )}
                          
                          {ticket.status !== 'closed' && (
                            <button
                              onClick={() => handleCloseTicket(ticket.id)}
                              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                            >
                              {ticket.status === 'pending' ? 'Отменить обращение' : 'Закрыть обращение'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ответ поддержки */}
                    {ticket.answer && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <FontAwesomeIcon icon={faCommentDots} className="text-[#FF7340]" />
                            Ответ службы поддержки
                          </h4>
                          {!ticket.isReadByUser && (
                            <button
                              onClick={() => handleMarkAsRead(ticket.id)}
                              className="text-sm text-[#FF7340] hover:text-[#FF4500] font-medium cursor-pointer"
                            >
                              Отметить как прочитанное
                            </button>
                          )}
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-[#FF7340]/20 dark:bg-[#FF7340]/10 flex items-center justify-center">
                              <span className="text-[#FF7340] font-bold">A</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">Администратор</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Служба поддержки сайта Сокровища Народов</p>
                            </div>
                          </div>
                          
                          <div className="pl-13">
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{ticket.answer}</p>
                            {ticket.answeredAt && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                Ответ отправлен: {formatDate(ticket.answeredAt)}
                              </p>
                            )}
                            </div>
                        </div>
                      </div>
                    )}

                    {/* Статус ожидания */}
                    {ticket.status === 'pending' && !ticket.answer && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                          <span className="text-xl">⏳</span>
                          <div>
                            <p className="font-medium">Ожидает ответа от поддержки</p>
                            <p className="text-sm">Мы ответим вам в течение 24 часов в рабочее время</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Пагинация */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Показано {tickets.length} из {totalCount} обращений
                    </p>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded-lg text-sm cursor-pointer ${
                          currentPage === 1 
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        ← Назад
                      </button>
                      
                      <div className="flex items-center">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-10 h-10 flex items-center justify-center rounded-lg mx-1 text-sm cursor-pointer ${
                                currentPage === pageNum 
                                  ? 'bg-[#FF7340] text-white' 
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 rounded-lg text-sm cursor-pointer ${
                          currentPage === totalPages 
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        Далее →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* FAQ/Помощь */}
        <div className="mt-8 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Часто задаваемые вопросы</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Сколько ждать ответа?</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Мы отвечаем на обращения в течение 24 часов в рабочие дни (пн-пт с 9:00 до 18:00).
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Как закрыть обращение?</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                После получения ответа вы можете закрыть обращение, нажав кнопку "Закрыть обращение".
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Не пришел ответ?</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Проверьте папку "Спам" в вашей почте. Также ответ всегда доступен на этой странице.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Срочный вопрос?</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Для срочных вопросов звоните: +7 (920) 545-08-62 (пн-пт с 9:00 до 18:00).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}