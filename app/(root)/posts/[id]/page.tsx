'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { peoples } from '@/app/lib/peoples';
import { createComment, deleteComment, deletePost, getPostById, toggleLike, updateComment } from '@/app/lib/api/posts';
import { AlertTriangle, ChevronLeft, Loader2, MoreVertical, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { getCurrentUser, User } from '@/app/lib/api/user';

type Comment = {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
  };
};

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showCopied, setShowCopied] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editText, setEditText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCommentActions, setShowCommentActions] = useState<string | null>(null);
  const [showPostActions, setShowPostActions] = useState(false);

  const handleDeletePost = async () => {
    if (!post || isDeleting) return;
    
    setIsDeleting(true);
    try {
      const result = await deletePost(post.id);
      if (result.success) {
        toast.success('Пост успешно удалён!');
        router.push('/forum');
      } else {
        if (result.isAuthError) {
          toast.error('Вы не можете удалить этот пост', {
            action: {
              label: 'Войти',
              onClick: () => router.push('/sign-in'),
            },
          });
        } else {
          toast.error(result.error || 'Не удалось удалить пост');
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('Произошла ошибка при удалении поста');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      if(currentUser){
        setUser(currentUser);
      }
    };

    checkAuth();
  }, []);

  // Загрузка поста
  useEffect(() => {
    const fetchPost = async () => {
      setIsLoading(true);
      try {
        const data = await getPostById(params.id as string);
        setPost(data);
      } catch (error) {
        console.error('Error loading post:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchPost();
    }
  }, [params.id]);

  const openEditModal = (comment: Comment) => {
    setEditingComment(comment);
    setEditText(comment.content);
    setIsModalOpen(true);
    setShowCommentActions(null);
  };

  const closeEditModal = () => {
    setIsModalOpen(false);
    setEditingComment(null);
    setEditText('');
    setIsEditing(false);
  };

  const handleUpdateComment = async () => {
    if (!editingComment || !editText.trim() || isEditing) return;
    
    setIsEditing(true);
    try {
      const result = await updateComment(editingComment.id, editText);
      
      if (result.success && result.comment) {
        setPost((prevPost: any) => ({
          ...prevPost,
          comments: prevPost.comments.map((comment: Comment) => 
            comment.id === editingComment.id ? result.comment : comment
          ),
        }));
        
        toast.success('Комментарий успешно обновлён!');
        closeEditModal();
      } else {
        if (result.isAuthError) {
          toast.error('Для редактирования комментария необходимо авторизоваться', {
            action: {
              label: 'Войти',
              onClick: () => router.push('/sign-in'),
            },
          });
        } else {
          toast.error(result.error || 'Не удалось обновить комментарий');
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('Произошла ошибка при обновлении комментария');
    } finally {
      setIsEditing(false);
    }
  };

  const handleToggleLike = async () => {
    if (!post || isLiking) return;
    
    setIsLiking(true);
    try {
      const result = await toggleLike(post.id);
      if (result.success) {
        setPost((prev: any) => ({
          ...prev,
          likes: result.likes,
          likedByUser: result.liked,
        }));
      } else {
        if (result.isAuthError) {
          toast.error('Для добавления лайка необходимо авторизоваться', {
            action: {
              label: 'Войти',
              onClick: () => router.push('/sign-in'),
            },
          });
        } else {
          toast.error(result.error || 'Не удалось создать комментарий');
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentText.trim() || !post || isCommenting) return;
    
    setIsCommenting(true);
    try {
      const result = await createComment(post.id, commentText);
      if (result.success && result.comment) {
        setPost((prev: any) => ({
          ...prev,
          comments: [result.comment, ...prev.comments],
          commentsCount: prev.commentsCount + 1,
        }));
        setCommentText('');
        toast.success('Комментарий успешно добавлен!')
      } else {
        if (result.isAuthError) {
          toast.error('Для добавления комментария необходимо авторизоваться', {
            action: {
              label: 'Войти',
              onClick: () => router.push('/sign-in'),
            },
          });
        } else {
          toast.error(result.error || 'Не удалось создать комментарий');
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
      toast.success('Ссылка скопирована в буфер обмена');
    } catch (error) {
      console.error(error);
      toast.error('Не удалось скопировать ссылку');
    }
  };

  const getEthnicGroupName = (id: string | null) => {
    if (!id) return 'Не указан';
    return peoples.find(p => p.id === id)?.name || 'Народ';
  };

  const formatDate = (date: Date) => {
    const postDate = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - postDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Сегодня, ' + postDate.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffDays === 1) {
      return 'Вчера, ' + postDate.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    
    return postDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: diffDays > 365 ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDeleteComment = async (userId: string, authorId: string, commentId: string) => {
    const result = await deleteComment(userId, authorId, commentId);
    if(result.success){
      toast.success('Комментарий успешно удалён!');

      setPost((prevPost: any) => ({
        ...prevPost,
        comments: prevPost.comments.filter((comment: Comment) => comment.id !== commentId),
        commentsCount: prevPost.commentsCount - 1,
      }));
      setShowCommentActions(null);
    } else {
      if (result.isAuthError) {
        toast.error('Это не ваш комментарий', {
          action: {
            label: 'Войти',
            onClick: () => router.push('/sign-in'),
          },
        });
      } else {
        toast.error(result.error || 'Не удалось удалить комментарий');
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFF9F9] pt-24 pb-8 px-4">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="animate-spin text-[#FF7340] mx-auto w-8 h-8 mb-4" />
            <p className="text-gray-600">Загрузка поста...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#FFF9F9] pt-24 pb-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Пост не найден</h1>
          <p className="text-gray-600 mb-6">Запрашиваемый пост не существует или был удален</p>
          <button
            onClick={() => router.push('/forum')}
            className="bg-[#FF7340] hover:bg-[#FF4500] text-white font-semibold py-2 px-6 rounded-lg cursor-pointer"
          >
            Вернуться к форуму
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F9] pt-20">
      {/* Модальное окно редактирования комментария */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-4 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Редактировать комментарий</h2>
              <button
                onClick={closeEditModal}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="mb-4">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="Введите новый текст комментария..."
                rows={4}
                className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:border-[#FFB840] focus:ring-2 focus:ring-[#FFCB73] transition duration-200 resize-none text-sm"
                autoFocus
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={closeEditModal}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm cursor-pointer"
                disabled={isEditing}
              >
                Отмена
              </button>
              <button
                onClick={handleUpdateComment}
                disabled={isEditing || !editText.trim()}
                className="bg-[#FF7340] hover:bg-[#FF4500] text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
              >
                {isEditing ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Хедер для мобильных */}
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between md:hidden">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium">Назад</span>
        </button>
        <div className="w-10"></div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-4 md:py-8 max-w-4xl mx-auto">
        {/* Кнопка назад для десктопа */}
        <button
          onClick={() => router.back()}
          className="hidden md:flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-4 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Назад</span>
        </button>

        {/* Шапка поста */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 mb-6">
          <div className="p-4 md:p-6 lg:p-8">
            {/* Заголовок и автор */}
            <div className="flex flex-col mb-4 md:mb-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-linear-to-r from-[#FFCB73] to-[#FF7340] flex items-center justify-center text-white font-bold text-sm md:text-base shrink-0">
                    {post.author.firstName[0]}{post.author.lastName[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-900 text-base md:text-lg truncate">
                      {post.author.firstName} {post.author.lastName}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-500">
                      {formatDate(post.createdAt)}
                    </p>
                  </div>
                </div>
                
                {user?.id === post?.author?.id && (
                  <div className="relative">
                    <button
                      onClick={() => setShowPostActions(!showPostActions)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer duration-200"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>
                    
                    {showPostActions && (
                      <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-30 z-10">
                        <button
                          onClick={() => {
                            setShowDeleteModal(true);
                            setShowPostActions(false);
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 w-full text-sm cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          Удалить
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Народ и кнопка удаления для десктопа */}
              <div className="flex items-center justify-start gap-2">
                <span className="px-2 py-1 bg-[#FF7340]/80 text-white rounded-full text-xs md:text-sm font-medium truncate max-w-[70%]">
                  Народ: {getEthnicGroupName(post.ethnicGroupId)}
                </span>
              </div>
            </div>
            
            {/* Заголовок поста */}
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 md:mb-4 wrap-break-word">
              {post.title}
            </h1>

            {/* Слайдер изображений */}
            {post.images.length > 0 && (
              <div className="mb-4 md:mb-6">
                <Swiper
                  modules={[Navigation, Pagination, Autoplay]}
                  navigation={{
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                  }}
                  pagination={{ 
                    clickable: true,
                    dynamicBullets: true,
                  }}
                  autoplay={{ delay: 5000, disableOnInteraction: false }}
                  loop={post.images.length > 1}
                  className="h-48 md:h-64 lg:h-80 rounded-lg md:rounded-xl overflow-hidden"
                >
                  {post.images.map((image: string, index: number) => (
                    <SwiperSlide key={index}>
                      <div className="relative h-full w-full">
                        <img
                          src={image}
                          alt={`Изображение ${index + 1} к посту "${post.title}"`}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-2 md:p-3">
                          <div className="text-white text-xs md:text-sm">
                            <p className="opacity-90">
                              Изображение {index + 1} из {post.images.length}
                            </p>
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
                <div className="swiper-button-prev text-white w-8 h-8 !md:w-10 !md:h-10 after:text-sm md:after:text-base"></div>
                <div className="swiper-button-next text-white w-8 h-8 !md:w-10 !md:h-10 after:text-sm md:after:text-base"></div>
              </div>
            )}

            {/* Контент поста */}
            <div className="mb-4 md:mb-6">
              <div className="text-gray-700 text-sm md:text-base whitespace-pre-line wrap-break-word">
                {post.content}
              </div>
            </div>

            {/* Теги */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 md:gap-2 mb-4">
                {post.tags.map((tag: string, index: number) => (
                  <span key={index} className="px-2 py-0.5 md:px-3 md:py-1 bg-[#FFF0F0] text-gray-700 rounded-full text-xs md:text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Кнопки взаимодействия */}
            <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-gray-100">
              <div className="flex items-center gap-4 md:gap-6">
                <button
                  onClick={() => handleToggleLike()}
                  className="flex items-center gap-1 md:gap-2 text-gray-600 hover:text-gray-500 transition-colors cursor-pointer"
                  disabled={isLiking}
                >
                  <span className="text-xl md:text-2xl">
                    {post.likedByUser ? (
                      <img src="/images/likefill.svg" alt="Лайк" className="w-5 h-5 md:w-6 md:h-6" />
                    ) : (
                      <img src="/images/like.svg" alt="Лайк" className="w-5 h-5 md:w-6 md:h-6" />
                    )}
                  </span>
                  <span className="font-medium text-sm md:text-base">{post.likes}</span>
                </button>
                
                <button className="flex items-center gap-1 md:gap-2 text-gray-600 hover:text-gray-500 transition-colors cursor-pointer">
                  <img src="/images/comments.svg" alt="Комментарии" className="w-5 h-5 md:w-6 md:h-6" />
                  <span className="font-medium text-sm md:text-base">{post.commentsCount}</span>
                </button>
                
                <button 
                  className="flex items-center gap-1 md:gap-2 text-gray-600 hover:text-gray-500 transition-colors cursor-pointer" 
                  onClick={handleCopyLink}
                >
                  <img src="/images/link.svg" alt="Поделиться" className="w-5 h-5 md:w-6 md:h-6" />
                  <span className="hidden md:inline font-medium">Копировать ссылку</span>
                  <span className="md:hidden font-medium text-sm">Ссылка</span>
                </button>
              </div>
              
              {showCopied && (
                <div className="absolute right-4 bottom-16 bg-gray-800 text-white text-xs px-2 py-1 rounded animate-fadeIn">
                  Скопировано!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Разделитель */}
        <div className="mt-6 mb-6 md:mb-8">
          <div className="h-1 bg-[#FFA100]"></div>
          <div className="h-1 bg-[#FF7C00]"></div>
          <div className="h-1 bg-[#FF4500]"></div>
        </div>

        {/* Форма добавления комментария */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 md:p-6 mb-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">Добавить комментарий</h2>
          <form onSubmit={handleAddComment}>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Напишите ваш комментарий..."
              rows={3}
              className="w-full px-3 py-2 md:px-4 md:py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:border-[#FFB840] focus:ring-2 focus:ring-[#FFCB73] transition duration-200 resize-none mb-3 md:mb-4 text-sm md:text-base"
              required
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isCommenting || !commentText.trim()}
                className="bg-[#FF7340] hover:bg-[#FF4500] text-white font-semibold py-2 px-4 md:py-2 md:px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base cursor-pointer"
              >
                {isCommenting ? 'Отправка...' : 'Отправить'}
              </button>
            </div>
          </form>

          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6 mt-6">
            Комментарии ({post.commentsCount})
          </h2>
          
          {post.comments.length === 0 ? (
            <div className="text-center py-6 md:py-8">
              <p className="text-gray-500 text-sm md:text-base">Пока нет комментариев. Будьте первым!</p>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {post.comments.map((comment: Comment) => (
                <div key={comment.id} className="border-b border-gray-100 pb-4 md:pb-6 last:border-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-linear-to-r from-[#FFCB73] to-[#FF7340] flex items-center justify-center text-white font-bold text-xs md:text-sm shrink-0">
                        {comment.author.firstName[0]}{comment.author.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-1 mb-1">
                          <h4 className="font-bold text-gray-900 text-sm md:text-base truncate">
                            {comment.author.firstName} {comment.author.lastName}
                          </h4>
                          <span className="text-xs md:text-sm text-gray-500">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <div className="mt-1">
                          <p className="text-gray-700 text-sm md:text-base wrap-break-word whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Кнопки действий для комментариев */}
                    {user?.id === comment.author.id && (
                      <div className="relative shrink-0">
                        <button
                          onClick={() => setShowCommentActions(
                            showCommentActions === comment.id ? null : comment.id
                          )}
                          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                        </button>
                        
                        {showCommentActions === comment.id && (
                          <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-35 z-10">
                            <button
                              onClick={() => openEditModal(comment)}
                              className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50 w-full text-sm cursor-pointer"
                            >
                              <img 
                                src="/images/edit.png" 
                                alt="Редактировать" 
                                className="w-4 h-4" 
                              />
                              Редактировать
                            </button>
                            <button
                              onClick={() => handleDeleteComment(user.id, comment.author.id, comment.id)}
                              className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 w-full text-sm cursor-pointer"
                            >
                              <img 
                                src="/images/delete.svg" 
                                alt="Удалить" 
                                className="w-4 h-4" 
                              />
                              Удалить
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно удаления поста */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-4 animate-fadeIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900">Удалить пост</h2>
                <p className="text-gray-600 text-xs md:text-sm">Это действие нельзя отменить</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-4 md:mb-6 text-sm md:text-base">
              Вы уверены, что хотите удалить пост «{post?.title}»? Все комментарии к нему также будут удалены.
            </p>
            
            <div className="flex justify-end gap-2 md:gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-3 py-2 md:px-4 md:py-2 text-gray-600 hover:text-gray-800 font-medium cursor-pointer text-sm md:text-base"
                disabled={isDeleting}
              >
                Отмена
              </button>
              <button
                onClick={handleDeletePost}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 md:py-2 md:px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm md:text-base cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Удаление...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Удалить
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}