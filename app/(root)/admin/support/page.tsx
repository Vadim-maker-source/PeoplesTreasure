'use client';

import { getAllSupportTickets, answerSupportTicket, markAsReadByAdmin, closeSupportTicket, getAdminUnreadCount } from '@/app/lib/api/support';
import { getCurrentUser } from '@/app/lib/api/user';
import { Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faHourglass, faCheck, faLock, faReply, faTimes } from '@fortawesome/free-solid-svg-icons';

export default function AdminSupportPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [tickets, setTickets] = useState<any[]>([]);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        hasNextPage: false,
        hasPrevPage: false,
    });
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [answerText, setAnswerText] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    useEffect(() => {
        checkAuthorization();
    }, []);

    useEffect(() => {
        if (isAuthorized) {
            loadTickets();
            loadUnreadCount();
        }
    }, [isAuthorized, pagination.currentPage, filterStatus]);

    const checkAuthorization = async () => {
        const user = await getCurrentUser();
        if (user && user.id === '1') {
            setIsAuthorized(true);
        } else {
            setIsAuthorized(false);
            toast.error('Доступ запрещен. Только администратор может просматривать эту страницу.');
        }
    };

    const loadTickets = async () => {
        setIsLoading(true);
        const result = await getAllSupportTickets(
            pagination.currentPage,
            20,
            filterStatus === 'all' ? undefined : filterStatus as any
        );
        
        if (result.success) {
            setTickets(result.tickets || []);
            setPagination(result.pagination || {
                currentPage: 1,
                totalPages: 1,
                totalCount: 0,
                hasNextPage: false,
                hasPrevPage: false,
            });
            setUnreadCount(result.unreadCount || 0);
        }
        setIsLoading(false);
    };

    const loadUnreadCount = async () => {
        const result = await getAdminUnreadCount();
        if (result.success) {
            setUnreadCount(result.unreadCount || 0);
        }
    };

    const handleAnswerTicket = async () => {
        if (!selectedTicket || !answerText.trim()) {
            toast.error('Введите ответ');
            return;
        }

        const result = await answerSupportTicket(selectedTicket.id, answerText);
        if (result.success) {
            toast.success(result.message);
            setSelectedTicket(null);
            setAnswerText('');
            loadTickets();
            loadUnreadCount();
        } else {
            toast.error(result.error || 'Ошибка при отправке ответа');
        }
    };

    const handleMarkAsRead = async (ticketId: string) => {
        const result = await markAsReadByAdmin(ticketId);
        if (result.success) {
            toast.success('Отмечено как прочитанное');
            loadTickets();
            loadUnreadCount();
        }
    };

    const handleCloseTicket = async (ticketId: string) => {
        const result = await closeSupportTicket(ticketId);
        if (result.success) {
            toast.success(result.message);
            loadTickets();
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-sm font-medium flex items-center gap-1">
                        <FontAwesomeIcon icon={faHourglass} />
                        В ожидании
                    </span>
                );
            case 'answered':
                return (
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium flex items-center gap-1">
                        <FontAwesomeIcon icon={faCheck} />
                        Отвечено
                    </span>
                );
            case 'closed':
                return (
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 rounded-full text-sm font-medium flex items-center gap-1">
                        <FontAwesomeIcon icon={faLock} />
                        Закрыто
                    </span>
                );
            default:
                return null;
        }
    };

    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Доступ запрещен</h1>
                    <p className="text-gray-600 dark:text-gray-400">Только администратор может просматривать эту страницу</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Панель администратора - Поддержка
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                                Управление обращениями пользователей
                            </p>
                        </div>
                        {unreadCount > 0 && (
                            <div className="relative">
                                <span className="px-4 py-2 bg-[#FF7340] text-white rounded-full font-medium flex items-center gap-2">
                                    <FontAwesomeIcon icon={faEnvelope} />
                                    {unreadCount} непрочитанных
                                </span>
                            </div>
                        )}
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
                                onClick={() => {
                                    setFilterStatus(filter.value);
                                    setPagination(prev => ({ ...prev, currentPage: 1 }));
                                }}
                                className={`px-4 py-2 rounded-lg cursor-pointer transition-all ${
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

                {isLoading ? (
                    <div className="text-center py-12">
                        <Loader2 className="animate-spin text-[#FF7340] mx-auto mb-4" size={32} />
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Загрузка обращений...</p>
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                        <p className="text-gray-500 dark:text-gray-400">Обращений пока нет</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Список обращений */}
                            <div className="lg:col-span-2">
                                <div className="space-y-4">
                                    {tickets.map(ticket => (
                                        <div 
                                            key={ticket.id} 
                                            className={`bg-white dark:bg-gray-900 rounded-2xl shadow-sm border p-6 cursor-pointer hover:shadow-md transition-all ${
                                                !ticket.isReadByAdmin 
                                                    ? 'border-[#FF7340] dark:border-[#FF7340] ring-1 ring-[#FF7340]/20' 
                                                    : 'border-gray-200 dark:border-gray-800'
                                            }`}
                                            onClick={() => setSelectedTicket(ticket)}
                                        >
                                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 flex-wrap mb-2">
                                                        <h3 className="font-bold text-gray-900 dark:text-white">{ticket.subject}</h3>
                                                        {getStatusBadge(ticket.status)}
                                                        {!ticket.isReadByAdmin && (
                                                            <span className="px-2 py-1 bg-[#FF7340] text-white rounded-full text-xs font-medium animate-pulse">
                                                                Новое
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        От: {ticket.user?.firstName} {ticket.user?.lastName} ({ticket.user?.email})
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <p className="text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">{ticket.message}</p>
                                            
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                    <FontAwesomeIcon icon={faEnvelope} className="text-xs" />
                                                    {formatDate(ticket.createdAt)}
                                                </p>
                                                <div className="flex gap-2">
                                                    {!ticket.isReadByAdmin && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMarkAsRead(ticket.id);
                                                            }}
                                                            className="text-sm text-[#FF7340] hover:text-[#FF4500] font-medium transition-colors cursor-pointer px-3 py-1 rounded-lg hover:bg-[#FF7340]/10"
                                                        >
                                                            Отметить прочитанным
                                                        </button>
                                                    )}
                                                    {ticket.status !== 'closed' && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCloseTicket(ticket.id);
                                                            }}
                                                            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 font-medium transition-colors cursor-pointer px-3 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                                        >
                                                            Закрыть
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {ticket.answer && (
                                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                        <span className="font-medium text-gray-700 dark:text-gray-300">Последний ответ:</span> {ticket.answer}
                                                    </p>
                                                    {ticket.answeredAt && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-500">
                                                            {formatDate(ticket.answeredAt)}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Пагинация */}
                                {pagination.totalPages > 1 && (
                                    <div className="mt-8 flex justify-center">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setPagination(prev => ({...prev, currentPage: prev.currentPage - 1}))}
                                                disabled={!pagination.hasPrevPage}
                                                className={`px-4 py-2 rounded-lg text-sm cursor-pointer ${
                                                    !pagination.hasPrevPage 
                                                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                                }`}
                                            >
                                                ← Назад
                                            </button>
                                            <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                                                {pagination.currentPage} / {pagination.totalPages}
                                            </span>
                                            <button
                                                onClick={() => setPagination(prev => ({...prev, currentPage: prev.currentPage + 1}))}
                                                disabled={!pagination.hasNextPage}
                                                className={`px-4 py-2 rounded-lg text-sm cursor-pointer ${
                                                    !pagination.hasNextPage 
                                                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                                }`}
                                            >
                                                Вперед →
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Панель ответа */}
                            <div className="lg:col-span-1">
                                {selectedTicket ? (
                                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 sticky top-8">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="font-bold text-gray-900 dark:text-white">Ответ на обращение</h3>
                                            <button
                                                onClick={() => {
                                                    setSelectedTicket(null);
                                                    setAnswerText('');
                                                }}
                                                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 transition-colors cursor-pointer"
                                            >
                                                <FontAwesomeIcon icon={faTimes} />
                                            </button>
                                        </div>

                                        <div className="mb-6">
                                            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                                    От: {selectedTicket.user?.firstName} {selectedTicket.user?.lastName}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                                    {selectedTicket.user?.email}
                                                </p>
                                                <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">Сообщение:</p>
                                                <p className="text-gray-600 dark:text-gray-400">
                                                    {selectedTicket.message}
                                                </p>
                                            </div>
                                            
                                            {selectedTicket.answer && (
                                                <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/10 rounded-xl">
                                                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                                        <FontAwesomeIcon icon={faReply} className="text-green-600 dark:text-green-400" />
                                                        Предыдущий ответ:
                                                    </p>
                                                    <p className="text-gray-600 dark:text-gray-400">
                                                        {selectedTicket.answer}
                                                    </p>
                                                    {selectedTicket.answeredAt && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                                            {formatDate(selectedTicket.answeredAt)}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Ваш ответ
                                            </label>
                                            <textarea
                                                value={answerText}
                                                onChange={(e) => setAnswerText(e.target.value)}
                                                rows={6}
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#FFB840] focus:ring-2 focus:ring-[#FFCB73] transition duration-200 resize-none"
                                                placeholder="Напишите ответ пользователю..."
                                            />
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleAnswerTicket}
                                                disabled={!answerText.trim()}
                                                className="flex-1 bg-gradient-to-r from-[#FF7340] to-[#FF4500] text-white py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity cursor-pointer"
                                            >
                                                Отправить ответ
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedTicket(null);
                                                    setAnswerText('');
                                                }}
                                                className="px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                            >
                                                Отмена
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 text-center sticky top-8">
                                        <p className="text-gray-500 dark:text-gray-400">Выберите обращение для ответа</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}