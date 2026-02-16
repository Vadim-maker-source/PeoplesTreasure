'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPendingPosts, moderatePost, PostWithAuthor } from '@/app/lib/api/posts';
import { Loader2, Check, X, Eye } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { peoples } from '@/app/lib/peoples';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';

export default function ModeratePage() {
  const router = useRouter();
  const [posts, setPosts] = useState<(PostWithAuthor & { status: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadPendingPosts();
  }, []);

  const loadPendingPosts = async () => {
    try {
      setIsLoading(true);
      const pendingPosts = await getPendingPosts();
      setPosts(pendingPosts);
    } catch (error) {
      console.error(error);
      toast.error('Ошибка при загрузке постов на модерацию');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModerate = async (postId: string, action: 'approve' | 'reject') => {
    try {
      setProcessingId(postId);
      const result = await moderatePost(postId, action);
      
      if (result.success) {
        toast.success(result.message);
        setPosts(prev => prev.filter(p => p.id !== postId));
      } else {
        toast.error(result.error || 'Ошибка при модерации');
      }
    } catch (error) {
      console.error(error);
      toast.error('Произошла ошибка');
    } finally {
      setProcessingId(null);
    }
  };

  const getEthnicGroupName = (id: string | null) => {
    if (!id) return 'Не указан';
    return peoples.find(p => p.id === id)?.name || 'Народ';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isVideoFile = (url: string): boolean => {
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2 text-xl">
            <Loader2 className="animate-spin text-[#FF7340]" />
            <p className="text-[#FFB840] text-xl">Загрузка постов на модерацию...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Модерация постов
          </h1>
          <p className="text-gray-600 text-lg">
            Посты, ожидающие проверки: {posts.length}
          </p>
        </div>

        {/* Список постов на модерацию */}
        {posts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Нет постов на модерацию
            </h3>
            <p className="text-gray-600">
              Все посты проверены. Отличная работа!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                {/* Информация о посте */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {post.author.avatar ? (
                        <img src={post.author.avatar} alt="" className="w-12 h-12 rounded-full" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-linear-to-r from-[#FFCB73] to-[#FF7340] flex items-center justify-center text-white font-bold">
                          {post.author.firstName[0]}{post.author.lastName[0]}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-gray-900">
                          {post.author.firstName} {post.author.lastName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {post.author.email}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      Ожидает модерации
                    </span>
                  </div>

                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>📅 {formatDate(post.createdAt)}</span>
                      <span>👥 Народ: {getEthnicGroupName(post.ethnicGroupId)}</span>
                    </div>
                  </div>

                  {/* Слайдер медиа */}
                  {post.images.length > 0 && (
                    <div className="relative mb-4">
                      <Swiper
                        modules={[Navigation, Pagination]}
                        navigation
                        pagination={{ clickable: true }}
                        loop={post.images.length > 1}
                        className="h-96 rounded-xl overflow-hidden"
                      >
                        {post.images.map((mediaUrl, index) => (
                          <SwiperSlide key={index}>
                            <div 
                              className="relative h-full w-full cursor-pointer"
                              onClick={() => setSelectedImage(mediaUrl)}
                            >
                              {isVideoFile(mediaUrl) ? (
                                <video
                                  src={mediaUrl}
                                  controls
                                  className="h-full w-full object-contain bg-black"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <img
                                  src={mediaUrl}
                                  alt={`Медиа ${index + 1}`}
                                  className="h-full w-full object-cover"
                                />
                              )}
                              <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-4">
                                <p className="text-white text-sm">
                                  {isVideoFile(mediaUrl) ? '🎬 Видео' : '📷 Изображение'} {index + 1} из {post.images.length}
                                </p>
                              </div>
                            </div>
                          </SwiperSlide>
                        ))}
                      </Swiper>
                    </div>
                  )}

                  {/* Контент */}
                  <div className="mb-4">
                    <p className="text-gray-700 whitespace-pre-line">
                      {post.content}
                    </p>
                  </div>

                  {/* Теги */}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.map((tag, index) => (
                        <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Кнопки действий */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                    <Link
                      href={`/posts/${post.id}`}
                      target="_blank"
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-xl transition duration-200 flex items-center justify-center gap-2"
                    >
                      <Eye className="w-5 h-5" />
                      <span>Просмотр</span>
                    </Link>
                    
                    <button
                      onClick={() => handleModerate(post.id, 'approve')}
                      disabled={processingId === post.id}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {processingId === post.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Check className="w-5 h-5" />
                      )}
                      <span>Одобрить</span>
                    </button>
                    
                    <button
                      onClick={() => handleModerate(post.id, 'reject')}
                      disabled={processingId === post.id}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {processingId === post.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <X className="w-5 h-5" />
                      )}
                      <span>Отклонить</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Модальное окно для увеличенного изображения */}
        {selectedImage && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-full max-h-full">
              {isVideoFile(selectedImage) ? (
                <video
                  src={selectedImage}
                  controls
                  className="max-h-[90vh] max-w-full"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <img
                  src={selectedImage}
                  alt="Увеличенное изображение"
                  className="max-h-[90vh] max-w-full object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              <button
                className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
                onClick={() => setSelectedImage(null)}
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}