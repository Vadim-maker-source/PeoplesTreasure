'use client';

import { getAllSupportTickets, answerSupportTicket, markAsReadByAdmin, closeSupportTicket, getAdminUnreadCount } from '@/app/lib/api/support';
import { getCurrentUser } from '@/app/lib/api/user';
import { Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
                return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">В ожидании</span>;
            case 'answered':
                return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Отвечено</span>;
            case 'closed':
                return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">Закрыто</span>;
            default:
                return null;
        }
    };

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-[#FFF9F9] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Доступ запрещен</h1>
                    <p className="text-gray-600">Только администратор может просматривать эту страницу</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFF9F9] py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-gray-900">
                            Панель администратора - Поддержка
                        </h1>
                        {unreadCount > 0 && (
                            <span className="px-4 py-2 bg-[#FF7340] text-white rounded-full">
                                {unreadCount} непрочитанных
                            </span>
                        )}
                    </div>
                    <p className="text-gray-600 mt-2">
                        Управление обращениями пользователей
                    </p>
                </div>

                {/* Фильтры */}
                <div className="mb-6">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={`px-4 py-2 rounded-lg ${filterStatus === 'all' ? 'bg-[#FF7340] text-white' : 'bg-gray-100 text-gray-700'}`}
                        >
                            Все
                        </button>
                        <button
                            onClick={() => setFilterStatus('pending')}
                            className={`px-4 py-2 rounded-lg ${filterStatus === 'pending' ? 'bg-[#FF7340] text-white' : 'bg-gray-100 text-gray-700'}`}
                        >
                            В ожидании
                        </button>
                        <button
                            onClick={() => setFilterStatus('answered')}
                            className={`px-4 py-2 rounded-lg ${filterStatus === 'answered' ? 'bg-[#FF7340] text-white' : 'bg-gray-100 text-gray-700'}`}
                        >
                            Отвечено
                        </button>
                        <button
                            onClick={() => setFilterStatus('closed')}
                            className={`px-4 py-2 rounded-lg ${filterStatus === 'closed' ? 'bg-[#FF7340] text-white' : 'bg-gray-100 text-gray-700'}`}
                        >
                            Закрыто
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center py-12">
                        <Loader2 className='text-[#FF7340] animate-spin' />
                        <p className="mt-4 text-gray-600">Загрузка обращений...</p>
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl shadow">
                        <p className="text-gray-500">Обращений пока нет</p>
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
                                            className={`bg-white rounded-2xl shadow-lg border p-6 cursor-pointer hover:shadow-xl transition-shadow ${
                                                !ticket.isReadByAdmin ? 'border-[#FF7340]' : 'border-gray-200'
                                            }`}
                                            onClick={() => setSelectedTicket(ticket)}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="font-bold text-gray-900">{ticket.subject}</h3>
                                                    <p className="text-sm text-gray-500">
                                                        От: {ticket.user?.firstName} {ticket.user?.lastName} ({ticket.user?.email})
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {getStatusBadge(ticket.status)}
                                                    {!ticket.isReadByAdmin && (
                                                        <span className="px-2 py-1 bg-[#FF7340] text-white rounded-full text-xs">
                                                            Новое
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <p className="text-gray-700 mb-3 line-clamp-2">{ticket.message}</p>
                                            
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm text-gray-500">{formatDate(ticket.createdAt)}</p>
                                                <div className="flex gap-2">
                                                    {!ticket.isReadByAdmin && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMarkAsRead(ticket.id);
                                                            }}
                                                            className="text-sm text-[#FF7340] hover:text-[#FF4500]"
                                                        >
                                                            Прочитано
                                                        </button>
                                                    )}
                                                    {ticket.status !== 'closed' && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCloseTicket(ticket.id);
                                                            }}
                                                            className="text-sm text-gray-500 hover:text-gray-700"
                                                        >
                                                            Закрыть
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
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
                                                className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50"
                                            >
                                                Назад
                                            </button>
                                            <span className="px-4 py-2">
                                                Страница {pagination.currentPage} из {pagination.totalPages}
                                            </span>
                                            <button
                                                onClick={() => setPagination(prev => ({...prev, currentPage: prev.currentPage + 1}))}
                                                disabled={!pagination.hasNextPage}
                                                className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50"
                                            >
                                                Вперед
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Панель ответа */}
                            <div className="lg:col-span-1">
                                {selectedTicket ? (
                                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sticky top-8">
                                        <div className="mb-6">
                                            <h3 className="font-bold text-gray-900 mb-2">Ответ на обращение</h3>
                                            <p className="text-sm text-gray-500 mb-4">
                                                От: {selectedTicket.user?.firstName} {selectedTicket.user?.lastName}
                                            </p>
                                            <div className="mb-4">
                                                <p className="font-medium text-gray-700">Сообщение:</p>
                                                <p className="text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg">
                                                    {selectedTicket.message}
                                                </p>
                                            </div>
                                            
                                            {selectedTicket.answer && (
                                                <div className="mb-4">
                                                    <p className="font-medium text-gray-700">Предыдущий ответ:</p>
                                                    <p className="text-gray-600 mt-2 bg-green-50 p-3 rounded-lg">
                                                        {selectedTicket.answer}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Ваш ответ
                                            </label>
                                            <textarea
                                                value={answerText}
                                                onChange={(e) => setAnswerText(e.target.value)}
                                                rows={6}
                                                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-[#FFB840] focus:ring-2 focus:ring-[#FFCB73] transition duration-200 resize-none"
                                                placeholder="Напишите ответ пользователю..."
                                            />
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleAnswerTicket}
                                                disabled={!answerText.trim()}
                                                className="flex-1 bg-linear-to-r from-[#FF7340] to-[#FF4500] text-white py-3 rounded-lg disabled:opacity-50"
                                            >
                                                Отправить ответ
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedTicket(null);
                                                    setAnswerText('');
                                                }}
                                                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg"
                                            >
                                                Отмена
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 text-center">
                                        <p className="text-gray-500">Выберите обращение для ответа</p>
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