'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Swiper, SwiperSlide } from 'swiper/react';
import { peoples } from '@/app/lib/peoples';
import { createComment, deleteComment, deletePost, getPostById, toggleLike, updateComment, updatePost } from '@/app/lib/api/posts';
import { AlertTriangle, ChevronLeft, Edit, Loader2, MoreVertical, Save, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { getCurrentUser, User } from '@/app/lib/api/user';
import Image from 'next/image';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';

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
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCommentActions, setShowCommentActions] = useState<string | null>(null);
  const [showPostActions, setShowPostActions] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [newVideos, setNewVideos] = useState<File[]>([])
  const [updateForm, setUpdateForm] = useState({
    title: '',
    content: '',
    tags: '',
    ethnicGroupId: ''
  })

  const ethnicGroups = peoples.map(people => ({
    id: people.id,
    name: people.name,
    region: people.region.split(',')[0],
  }));

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
        setUpdateForm({
          title: String(data?.title),
          content: String(data?.content),
          tags: String(data?.tags.join(', ')),
          ethnicGroupId: String(data?.ethnicGroupId),
        })
        setExistingImages(data?.images ?? [])
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

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index))
  }
  
  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index))
  }

  const removeNewVideo = (index: number) => {
    setNewVideos(prev => prev.filter((_, i) => i !== index))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
  
    const files = Array.from(e.target.files)
  
    if (newImages.length + files.length > 10) {
      toast.error('Максимум 10 изображений')
      return
    }
  
    setNewImages(prev => [...prev, ...files])
  }

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
  
    const files = Array.from(e.target.files)
    
    // Фильтруем только видео
    const videoFiles = files.filter(file => file.type.startsWith('video/'))
  
    if (newVideos.length + videoFiles.length > 5) { // Лимит 5 видео
      toast.error('Максимум 5 видео')
      return
    }
  
    // Проверка размера видео (50MB)
    for (const video of videoFiles) {
      if (video.size > 500 * 1024 * 1024) {
        toast.error(`Видео "${video.name}" превышает лимит 50MB`)
        return
      }
    }
  
    setNewVideos(prev => [...prev, ...videoFiles])
  }

  const handleEditPost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isEditing) return
  
    setIsEditing(true)
  
    try {
      const result = await updatePost(post.id, {
        title: updateForm.title,
        content: updateForm.content,
        tags: updateForm.tags.split(',').map(t => t.trim()),
        ethnicGroupId: updateForm.ethnicGroupId || null,
        existingImages,
        newImages,
        newVideos // Добавляем видео
      })
  
      if (result.success) {
        toast.success('Пост обновлён')
        setShowEditModal(false)
        setPost((prev: any) => {
          if (!prev) return prev;
        
          return {
            ...result.post,
            author: prev.author,
            comment: prev.comment,
            commentsCount: prev.commentsCount
          };
        });
        location.reload()
      } else {
        toast.error(result.error || 'Ошибка обновления')
      }
    } catch (e) {
      toast.error('Ошибка при обновлении поста')
    } finally {
      setIsEditing(false)
    }
  }
  

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setUpdateForm(prev => ({
          ...prev,
          [name]: value
        }))
      }

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

  const isVideoFile = (url: string): boolean => {
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-8 px-4">
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
      <div className="min-h-screen pt-24 pb-8 px-4">
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
    <div className="min-h-screen pt-20">
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
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 dark:text-white dark:hover:text-gray-200 cursor-pointer"
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
          className="hidden md:flex items-center gap-2 text-gray-700 hover:text-gray-900 dark:text-white dark:hover:text-gray-200 mb-4 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Назад</span>
        </button>

        {/* Шапка поста */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-800 mb-6">
          <div className="p-4 md:p-6 lg:p-8">
            {/* Заголовок и автор */}
            <div className="flex flex-col mb-4 md:mb-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {post.author.avatar ? <img src={post.author.avatar} alt="" className="w-12 h-12 rounded-full" /> :
                      <div className="w-12 h-12 rounded-full bg-linear-to-r from-[#FFCB73] to-[#FF7340] flex items-center justify-center text-white font-bold">
                        {post.author.firstName[0]}{post.author.lastName[0]}
                      </div>
                    }
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base md:text-lg truncate">
                      {post.author.firstName} {post.author.lastName} {post.author.verified && (
                        <Image src="/images/verified.png" alt="" width={18} height={18} />
                      )}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-200">
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
                      <MoreVertical className="w-5 h-5 text-gray-600 dark:text-white" />
                    </button>
                    
                    {showPostActions && (
                      <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-30 z-10">
                        <button
                          onClick={() => {
                            setShowEditModal(true);
                            setShowPostActions(false);
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-red-50 w-full text-sm cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                          Изменить
                        </button>
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
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4 wrap-break-word">
              {post.title}
            </h1>

            {/* Слайдер изображений */}
            {post.images.length > 0 && (
  <div className="mb-8">
    <Swiper
      modules={[Navigation, Pagination, Autoplay]}
      navigation
      pagination={{ clickable: true }}
      autoplay={autoplayEnabled ? { delay: 5000, disableOnInteraction: false } : false}
      loop={post.images.length > 1}
      className="h-125 rounded-xl overflow-hidden"
      onSlideChange={() => {
        // При смене слайда включаем автоплей обратно
        setAutoplayEnabled(true);
      }}
    >
      {post.images.map((mediaUrl: string, index: number) => (
        <SwiperSlide key={index}>
          <div className="relative h-full w-full">
            {isVideoFile(mediaUrl) ? (
              <video
                src={mediaUrl}
                controls
                className="h-full w-full object-contain bg-black"
                onPlay={() => setAutoplayEnabled(false)}
                onPause={() => {
                  // Можно оставить автоплей выключенным или включить через некоторое время
                  // Сейчас оставим выключенным до смены слайда
                }}
                onEnded={() => setAutoplayEnabled(true)}
              />
            ) : (
              <img
                src={mediaUrl}
                alt={`Медиа ${index + 1} к посту "${post.title}"`}
                className="h-full w-full object-cover"
              />
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-4">
              <div className="text-white">
                <p className="text-sm opacity-90">
                  {isVideoFile(mediaUrl) ? '🎬 Видео' : '📷 Изображение'} {index + 1} из {post.images.length}
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
            <div className="mb-4 md:mb-6">
              <div className="text-gray-700 dark:text-white text-sm md:text-base whitespace-pre-line wrap-break-word">
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
                  <span className="font-medium text-sm md:text-base dark:text-white">{post.likes}</span>
                </button>
                
                <button className="flex items-center gap-1 md:gap-2 text-gray-600 hover:text-gray-500 transition-colors cursor-pointer">
                  <img src="/images/comments.svg" alt="Комментарии" className="w-5 h-5 md:w-6 md:h-6" />
                  <span className="font-medium text-sm md:text-base dark:text-white">{post.commentsCount}</span>
                </button>
                
                <button 
                  className="flex items-center gap-1 md:gap-2 text-gray-600 hover:text-gray-500 transition-colors cursor-pointer" 
                  onClick={handleCopyLink}
                >
                  <img src="/images/link.svg" alt="Поделиться" className="w-5 h-5 md:w-6 md:h-6" />
                  <span className="hidden md:inline font-medium dark:text-white">Копировать ссылку</span>
                  <span className="md:hidden font-medium text-sm dark:text-white">Ссылка</span>
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
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-4 md:p-6 mb-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">Добавить комментарий</h2>
          <form onSubmit={handleAddComment}>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Напишите ваш комментарий..."
              rows={3}
              className="w-full px-3 py-2 md:px-4 md:py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#FFB840] focus:ring-2 focus:ring-[#FFCB73] transition duration-200 resize-none mb-3 md:mb-4 text-sm md:text-base"
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

          <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6 mt-6">
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
                          <h4 className="font-bold text-gray-900 dark:text-white text-sm md:text-base truncate">
                            {comment.author.firstName} {comment.author.lastName}
                          </h4>
                          <span className="text-xs md:text-sm text-gray-500">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <div className="mt-1">
                          <p className="text-gray-700 dark:text-gray-100 text-sm md:text-base wrap-break-word whitespace-pre-wrap">
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
                          className="p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4 md:w-5 md:h-5 text-gray-500 dark:text-gray-100" />
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

{showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-none">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Редактировать пост</h2>
            <button
              onClick={() => setShowEditModal(false)}
              className="p-2 hover:bg-gray-100 text-black rounded-lg cursor-pointer"
            >
              <X size={24} />
            </button>
          </div>
          
          <form onSubmit={handleEditPost} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Заголовок *
                </label>
                <input
                  type="text"
                  name="title"
                  value={updateForm.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFC873] focus:border-transparent outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Контент *
                </label>
                <input
                  type="text"
                  name="content"
                  value={updateForm.content}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFC873] focus:border-transparent outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Теги *
                </label>
                <input
                  type="tel"
                  name="tags"
                  value={updateForm.tags}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFC873] focus:border-transparent outline-none"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Этническая группа
                </label>
                <select
                  name="ethnicGroupId"
                  value={updateForm.ethnicGroupId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-[#FF7340] focus:ring-2 focus:ring-transparent transition duration-200"
                >
                  <option value="">Не выбрано</option>
                  {ethnicGroups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
  <label className="block text-lg font-semibold text-gray-800 mb-3">
    Изображения
  </label>
  
  <div className="mb-4">
    <label className="block">
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
        id="image-upload"
        disabled={isEditing || existingImages.length + newImages.length >= 10}
      />
      <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition duration-200">
        <span className="text-3xl mb-2">📷</span>
        <span className="text-gray-600 font-medium">
          {existingImages.length + newImages.length >= 10 
            ? 'Достигнут лимит 10 изображений' 
            : 'Нажмите для загрузки изображений'}
        </span>
        <span className="text-sm text-gray-500 mt-1">
          До {10 - (existingImages.length + newImages.length)} изображений, макс. 5MB каждое
        </span>
      </div>
    </label>
  </div>
  
  {/* Список существующих изображений */}
  {existingImages.filter(url => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    return imageExtensions.some(ext => url.toLowerCase().includes(ext));
  }).map((img, i) => (
    <div key={i} className="relative group border rounded-lg overflow-hidden mb-2">
      <img src={img} alt={`Изображение ${i + 1}`} className="w-full h-32 object-cover" />
      <button
        type="button"
        onClick={() => removeExistingImage(
          existingImages.findIndex(existing => existing === img)
        )}
        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition duration-200 hover:bg-red-600"
      >
        ×
      </button>
    </div>
  ))}
  
  {/* Список новых изображений */}
  {newImages.map((file, i) => (
    <div key={i} className="relative group border rounded-lg overflow-hidden mb-2">
      <img 
        src={URL.createObjectURL(file)} 
        alt={`Новое изображение ${i + 1}`} 
        className="w-full h-32 object-cover" 
      />
      <div className="p-2 bg-white">
        <p className="text-sm text-gray-600 truncate" title={file.name}>
          {file.name}
        </p>
        <p className="text-xs text-gray-500">
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>
      <button
        type="button"
        onClick={() => removeNewImage(i)}
        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition duration-200 hover:bg-red-600"
      >
        ×
      </button>
    </div>
  ))}
</div>

              <div className="mb-6">
  <label className="block text-lg font-semibold text-gray-800 mb-3">
    Видео
  </label>
  
  <div className="mb-4">
    <label className="block">
      <input
        type="file"
        multiple
        accept="video/*"
        onChange={handleVideoChange}
        className="hidden"
        id="video-upload"
        disabled={isEditing || newVideos.length >= 5}
      />
      <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition duration-200">
        <span className="text-3xl mb-2">🎬</span>
        <span className="text-gray-600 font-medium">
          {newVideos.length >= 5 ? 'Достигнут лимит 5 видео' : 'Нажмите для загрузки видео'}
        </span>
        <span className="text-sm text-gray-500 mt-1">
          До {5 - newVideos.length} видео, макс. 50MB каждое
        </span>
      </div>
    </label>
  </div>
  
  {/* Список существующих видео */}
  {existingImages.filter(url => {
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  }).map((url, i) => (
    <div key={i} className="relative group border rounded-lg overflow-hidden mb-2">
      <div className="aspect-video bg-gray-800 flex items-center justify-center">
        <span className="text-white text-4xl">🎬</span>
      </div>
      <div className="p-2 bg-white">
        <p className="text-sm text-gray-600 truncate">
          Видео {i + 1}
        </p>
      </div>
      <button
        type="button"
        onClick={() => removeExistingImage(
          existingImages.findIndex(img => img === url)
        )}
        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition duration-200 hover:bg-red-600"
      >
        ×
      </button>
    </div>
  ))}
  
  {/* Список новых видео */}
  {newVideos.map((file, i) => (
    <div key={i} className="relative group border rounded-lg overflow-hidden mb-2">
      <div className="aspect-video bg-gray-800 flex items-center justify-center">
        <span className="text-white text-4xl">🎬</span>
      </div>
      <div className="p-2 bg-white">
        <p className="text-sm text-gray-600 truncate" title={file.name}>
          {file.name}
        </p>
        <p className="text-xs text-gray-500">
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>
      <button
        type="button"
        onClick={() => removeNewVideo(i)}
        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition duration-200 hover:bg-red-600"
      >
        ×
      </button>
    </div>
  ))}
</div>
            </div>
            
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isEditing}
                className="flex items-center gap-2 px-6 py-2 bg-[#FFB840] hover:from-[#FFB840]/80 text-white font-medium rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isEditing ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Сохранить
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      )}
    </div>
  );
}