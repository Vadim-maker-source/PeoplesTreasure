'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { peoples } from '@/app/lib/peoples';
import { createComment, deleteComment, deletePost, getPostById, toggleLike, updateComment } from '@/app/lib/api/posts';
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';
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
      console.error('Error deleting post:', error);
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
      console.error('Error updating comment:', error);
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
      console.error('Error toggling like:', error);
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
    } catch (error) {
      console.error(error);
    }
  };

  const getEthnicGroupName = (id: string | null) => {
    if (!id) return 'Не указан';
    return peoples.find(p => p.id === id)?.name || 'Народ';
  };

  const formatDate = (date: Date) => {
    const postDate = new Date(date);
    return postDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
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
      <div className="min-h-screen bg-[#FFF9F9] py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Loader2 className="animate-spin text-[#FF7340]" />
            <p className="text-white text-xl">Загрузка поста...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#FFF9F9] py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Пост не найден</h1>
          <p className="text-gray-600 mb-6">Запрашиваемый пост не существует или был удален</p>
          <button
            onClick={() => router.push('/forum')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg"
          >
            Вернуться к форуму
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F9] relative">
      {/* Модальное окно редактирования комментария */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Редактировать комментарий</h2>
              <button
                onClick={closeEditModal}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="mb-6">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="Введите новый текст комментария..."
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:border-[#FFB840] focus:ring-2 focus:ring-[#FFCB73] transition duration-200 resize-none"
                autoFocus
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                disabled={isEditing}
              >
                Отмена
              </button>
              <button
                onClick={handleUpdateComment}
                disabled={isEditing || !editText.trim()}
                className="bg-[#FF7340] hover:bg-[#FF4500] text-white font-semibold py-2 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEditing ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white hover:text-gray-100 cursor-pointer"
        >
          <span>←</span>
          <span>Назад</span>
        </button>
      </div>

      <div className="mx-auto w-full flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-8">
        {/* Шапка поста */}
        <div className="bg-white w-4xl rounded-2xl shadow-lg overflow-hidden border border-gray-200 mb-8">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-linear-to-r from-[#FFCB73] to-[#FF7340] flex items-center justify-center text-white font-bold text-xl">
                  {post.author.firstName[0]}{post.author.lastName[0]}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    {post.author.firstName} {post.author.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formatDate(post.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-[#FF7340]/80 text-white rounded-full text-sm font-medium">
                  Посвящено народу: {getEthnicGroupName(post.ethnicGroupId)}
                </span>
                {user?.id === post?.author?.id && (
                  <div className="absolute top-4 right-4 z-10">
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg cursor-pointer duration-200"
                      title="Удалить пост"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>

            {/* Слайдер изображений */}
            {post.images.length > 0 && (
              <div className="mb-8">
                <Swiper
                  modules={[Navigation, Pagination, Autoplay]}
                  navigation
                  pagination={{ clickable: true }}
                  autoplay={{ delay: 5000, disableOnInteraction: false }}
                  loop={post.images.length > 1}
                  className="h-125 rounded-xl overflow-hidden"
                >
                  {post.images.map((image: string, index: number) => (
                    <SwiperSlide key={index}>
                      <div className="relative h-full w-full">
                        <img
                          src={image}
                          alt={`Изображение ${index + 1} к посту "${post.title}"`}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-4">
                          <div className="text-white">
                            <p className="text-sm opacity-90">
                              Изображение {index + 1} из {post.images.length}
                            </p>
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            )}

            {/* Контент поста */}
            <div className="prose prose-lg max-w-none mb-8">
              <div className="text-gray-700 whitespace-pre-line">
                {post.content}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag: string, index: number) => (
                <span key={index} className="px-3 py-1 bg-[#FFF0F0] text-gray-700 rounded-full text-sm">
                  #{tag}
                </span>
              ))}
            </div>

            {/* Кнопки взаимодействия */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => handleToggleLike()}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-500 transition-colors cursor-pointer"
                >
                  <span className="text-2xl">{post.likedByUser ? <img src="/images/likefill.svg" alt="" className="aspect-square w-6" /> : <img src="/images/like.svg" alt="" className="aspect-square w-6" />}</span>
                  <span className="font-medium">{post.likes}</span>
                </button>
                
                <button className="flex items-center gap-2 text-gray-600 hover:text-gray-500 transition-colors cursor-pointer">
                  <img src="/images/comments.svg" alt="" className="aspect-square w-6" />
                  <span className="font-medium">{post.commentsCount}</span>
                </button>
                
                <button className="flex items-center gap-2 text-gray-600 hover:text-gray-500 transition-colors cursor-pointer" onClick={() => handleCopyLink()}>
                  <img src="/images/link.svg" alt="" className="aspect-square w-6" />
                  <span className="font-medium">Копировать ссылку</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full mt-8 mb-8">
          <div className="w-full h-4 bg-[#FFA100]"></div>
          <div className="w-full h-4 bg-[#FF7C00]"></div>
          <div className="w-full h-4 bg-[#FF4500]"></div>
        </div>

        {/* Форма добавления комментария */}
        <div className="bg-white w-4xl rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Добавить комментарий</h2>
          <form onSubmit={handleAddComment}>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Напишите ваш комментарий..."
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:border-[#FFB840] focus:ring-2 focus:ring-[#FFCB73] transition duration-200 resize-none mb-4"
              required
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isCommenting || !commentText.trim()}
                className="bg-[#FF7340] hover:bg-[#FF4500] text-white font-semibold py-2 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCommenting ? 'Отправка...' : 'Отправить'}
              </button>
            </div>
          </form>

          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Комментарии ({post.commentsCount})
          </h2>
          
          {post.comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Пока нет комментариев. Будьте первым!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {post.comments.map((comment: Comment) => (
                <div key={comment.id} className="border-b border-gray-100 pb-6 last:border-0 flex items-center w-full justify-between">
                  <div className="flex items-start gap-3 mb-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-linear-to-r from-[#FFCB73] to-[#FF7340] flex items-center justify-center text-white font-bold">
                      {comment.author.firstName[0]}{comment.author.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center gap-3">
                        <h4 className="font-bold text-gray-900 truncate">
                          {comment.author.firstName} {comment.author.lastName}
                        </h4>
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <div className="pr-4 mt-2">
                        <p className="text-gray-700 wrap-break-words whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {user?.id === comment.author.id && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button 
                        onClick={() => openEditModal(comment)}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        title="Редактировать"
                      >
                        <img 
                          src="/images/edit.png" 
                          alt="Редактировать" 
                          className="aspect-square w-5 hover:opacity-80 duration-200 cursor-pointer" 
                        />
                      </button>
                      <button 
                        onClick={() => handleDeleteComment(user.id, comment.author.id, comment.id)}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        title="Удалить"
                      >
                        <img 
                          src="/images/delete.svg" 
                          alt="Удалить" 
                          className="aspect-square w-5 hover:opacity-80 duration-200 cursor-pointer" 
                        />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fadeIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Удалить пост</h2>
                <p className="text-gray-600 text-sm">Это действие нельзя отменить</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Вы уверены, что хотите удалить пост «{post?.title}»? Все комментарии к нему также будут удалены.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium cursor-pointer"
                disabled={isDeleting}
              >
                Отмена
              </button>
              <button
                onClick={handleDeletePost}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
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