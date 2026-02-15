'use client';

import { createSupportTicket, getUserSupportTickets } from '@/app/lib/api/support';
import { getCurrentUser, User } from '@/app/lib/api/user';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';

const Support = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userTickets, setUserTickets] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showMyTickets, setShowMyTickets] = useState(false);
    
    const [formData, setFormData] = useState({
        subject: '',
        message: '',
    });

    useEffect(() => {
        const checkAuth = async () => {
            const currentUser = await getCurrentUser();
            if(currentUser){
                setUser(currentUser);
                loadUserTickets();
            }
        };

        checkAuth();
    }, []);

    const loadUserTickets = async () => {
        if (!user) return;
        
        const result = await getUserSupportTickets();
        if (result.success) {
            setUserTickets(result.tickets || []);
            setUnreadCount(result.unreadCount || 0);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast.error('Необходима авторизация');
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await createSupportTicket(
                formData.subject,
                formData.message,
                user.email || '',
                `${user.firstName} ${user.lastName}`
            );

            if (result.success) {
                toast.success(result.message);
                setFormData({
                    subject: '',
                    message: '',
                });
                loadUserTickets();
            } else {
                if (result.isAuthError) {
                    toast.error(result.error || 'Необходима авторизация');
                } else {
                    toast.error(result.error || 'Ошибка при отправке');
                }
            }
        } catch (error) {
            console.error(error);
            toast.error('Произошла ошибка при отправке формы');
        } finally {
            setIsSubmitting(false);
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

    return (
        <div className="min-h-screen py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                        Служба поддержки
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-200">
                        Свяжитесь с нами, и мы обязательно вам поможем
                    </p>
                </div>
                
                {/* Форма создания обращения */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                    <div className="p-8">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Новое обращение
                            </h2>
                            <p className="text-gray-600 dark:text-gray-200">
                                Заполните форму ниже, и наша команда поддержки свяжется с вами в ближайшее время
                            </p>
                        </div>

                        {!user ? (
                            <div className="text-center py-8">
                                <p className="text-gray-600 dark:text-gray-200 mb-4">
                                    Для обращения в поддержку необходимо авторизоваться
                                </p>
                                <Link href="/sign-in">
                                    <button className="bg-linear-to-r from-[#FF7340] to-[#FF4500] text-white px-6 py-3 rounded-lg hover:opacity-80">
                                        Войти в аккаунт
                                    </button>
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                        Тема обращения *
                                    </label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:border-[#FFB840] focus:ring-2 focus:ring-[#FFCB73] transition duration-200"
                                        placeholder="Опишите кратко вашу проблему"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                        Ваше сообщение *
                                    </label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        rows={6}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:border-[#FFB840] focus:ring-2 focus:ring-[#FFCB73] transition duration-200 resize-none"
                                        placeholder="Опишите вашу проблему или вопрос подробно..."
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                                    <div className="text-sm text-gray-500 dark:text-gray-200">
                                        <p>Поля, отмеченные *, обязательны для заполнения</p>
                                        <p className="mt-1">
                                            Мы ответим вам в течение 24 часов в рабочее время
                                        </p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-linear-to-r from-[#FF7340] to-[#FF4500] hover:opacity-80 text-white font-semibold py-3 px-8 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200"
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Отправка...
                                            </span>
                                        ) : (
                                            'Отправить сообщение'
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="mt-12 pt-8 border-t border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Другие способы связи
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-full bg-[#FF7340]/10 flex items-center justify-center">
                                            <span className="text-[#FF7340] font-bold">📧</span>
                                        </div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">Email</h4>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        Vadimbureev380@yandex.ru
                                    </p>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-full bg-[#FF7340]/10 flex items-center justify-center">
                                            <span className="text-[#FF7340] font-bold">📞</span>
                                        </div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">Телефон</h4>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        +7 (920) 545-08-62
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-200 mt-1">
                                        Пн-Пт с 9:00 до 18:00
                                    </p>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-full bg-[#FF7340]/10 flex items-center justify-center">
                                            <span className="text-[#FF7340] font-bold">🕒</span>
                                        </div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">Время ответа</h4>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        В течение 24 часов
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-200 mt-1">
                                        В рабочие дни
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Support;