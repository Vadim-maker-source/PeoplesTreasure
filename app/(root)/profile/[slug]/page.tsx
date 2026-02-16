'use client'

import { getCurrentUser, getUserById, removeAvatar, updateAvatar, updateProfile } from '@/app/lib/api/user'
import { getUserCourses } from '@/app/lib/api/courses'
import { useParams } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import { 
  Edit, 
  User as UserIcon, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  MessageSquare,
  ThumbsUp,
  FileText,
  Award,
  X,
  Save,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trophy,
  CheckCircle,
  Camera,
  Upload,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'
import ToggleSwitch from '@/components/ToggleSwitch'

type SafeUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  age: number;
  phone: string;
  role: string;
  avatar?: string | null;
  region?: string | null;
  bio?: string | null;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
  posts?: any[];
  comments?: any[];
  _count?: {
    posts?: number;
    comments?: number;
  };
}

type PostType = {
  id: string;
  title: string;
  content: string;
  images: string[];
  tags: string[];
  likes: number;
  ethnicGroupId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
  };
  _count: {
    comments: number;
  };
}

type TestType = {
  id: string;
  ethnicGroupId: string;
  ethnicGroupName: string;
  completed: boolean;
  score: number;
  answers: any;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type UpdateFormData = {
  firstName: string;
  lastName: string;
  age: number;
  phone: string;
  bio?: string;
  region?: string;
}

const ImageGallery = ({ images, title }: { images: string[], title: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Функция для определения типа файла
  const isVideoFile = (url: string): boolean => {
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  };
  
  if (!images.length) return null;
  
  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };
  
  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };
  
  const currentMedia = images[currentIndex];
  const isVideo = isVideoFile(currentMedia);
  
  return (
    <div className="relative mb-4 group">
      <div className="relative h-64 md:h-80 w-full rounded-lg overflow-hidden bg-gray-900">
        {isVideo ? (
          <video
            src={currentMedia}
            controls
            className="h-full w-full object-contain"
            poster="/images/video-poster.jpg" // Опционально: добавьте постер
          />
        ) : (
          <img
            src={currentMedia}
            alt={`Изображение ${currentIndex + 1} к посту "${title}"`}
            className="h-full w-full object-cover"
          />
        )}
        
        {/* Индикатор типа медиа */}
        <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
          {isVideo ? (
            <>
              <span>🎬</span>
              <span>Видео</span>
            </>
          ) : (
            <>
              <span>📷</span>
              <span>Фото</span>
            </>
          )}
        </div>
        
        {/* Кнопки навигации */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-opacity opacity-0 group-hover:opacity-100"
              disabled={isVideo} // Можно отключить навигацию во время воспроизведения видео
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-opacity opacity-0 group-hover:opacity-100"
              disabled={isVideo}
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
        
        {/* Счетчик */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
          <span>{currentIndex + 1} / {images.length}</span>
          {isVideo && (
            <span className="flex items-center gap-1">
              <span>🎬</span>
            </span>
          )}
        </div>
      </div>
      
      {/* Миниатюры (превью) */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
          {images.map((media, index) => {
            const isVideoMedia = isVideoFile(media);
            return (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all ${
                  index === currentIndex 
                    ? 'ring-2 ring-[#FF7340] scale-105' 
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                {isVideoMedia ? (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <span className="text-white text-xl">🎬</span>
                  </div>
                ) : (
                  <img
                    src={media}
                    alt={`Миниатюра ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
                {isVideoMedia && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <span className="text-white text-xs">🎬</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const AvatarUploadModal = ({ 
  isOpen, 
  onClose, 
  currentAvatar, 
  onAvatarUpdate 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  currentAvatar?: string | null;
  onAvatarUpdate: () => void;
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      toast.error('Можно загружать только изображения');
      return;
    }

    // Проверка размера (макс 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Размер файла не должен превышать 5MB');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', selectedFile);

      const result = await updateAvatar(formData);
      
      if (result.success) {
        toast.success('Аватар успешно обновлен');
        onAvatarUpdate();
        onClose();
      } else {
        toast.error(result.error || 'Ошибка при загрузке аватара');
      }
    } catch (error) {
      toast.error('Ошибка при загрузке аватара');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    setIsUploading(true);
    try {
      const result = await removeAvatar();
      
      if (result.success) {
        toast.success('Аватар удален');
        onAvatarUpdate();
        onClose();
      } else {
        toast.error(result.error || 'Ошибка при удалении аватара');
      }
    } catch (error) {
      toast.error('Ошибка при удалении аватара');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Изменить аватар</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 text-black rounded-lg cursor-pointer duration-150"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Предпросмотр */}
          <div className="flex justify-center mb-6">
            <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-[#FFC873]">
              {preview ? (
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              ) : currentAvatar ? (
                <img 
                  src={currentAvatar} 
                  alt="Current avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-linear-to-r from-[#FF7340] to-[#FFB840] flex items-center justify-center">
                  <UserIcon className="text-white" size={48} />
                </div>
              )}
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#FFB840] hover:from-[#FFB840]/80 text-white font-medium rounded-lg disabled:opacity-50 cursor-pointer"
            >
              <Camera size={18} />
              Выбрать изображение
            </button>

            {preview && (
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg disabled:opacity-50 cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Загрузка...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Загрузить
                  </>
                )}
              </button>
            )}

            {currentAvatar && (
              <button
                onClick={handleRemove}
                disabled={isUploading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 font-medium rounded-lg disabled:opacity-50 cursor-pointer"
              >
                <Trash2 size={18} />
                Удалить аватар
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Profile() {
  const params = useParams()
  const slug = params.slug as string
  
  const [user, setUser] = useState<SafeUser | null>(null)
  const [currentUser, setCurrentUser] = useState<SafeUser | null>(null)
  const [posts, setPosts] = useState<PostType[]>([])
  const [tests, setTests] = useState<TestType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [formData, setFormData] = useState<UpdateFormData>({
    firstName: '',
    lastName: '',
    age: 0,
    phone: '',
    bio: '',
    region: ''
  })

  const toSafeUser = (data: any): SafeUser | null => {
    if (!data) return null
    
    return {
      id: data.id || '',
      email: data.email || '',
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      age: data.age || 0,
      phone: data.phone || '',
      role: data.role || 'USER',
      avatar: data.avatar || null,
      region: data.region || null,
      bio: data.bio || null,
      verified: data.verified,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
      posts: data.posts || [],
      comments: data.comments || [],
      _count: data._count || {}
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const userDataResponse = await getUserById(slug) as any
        
        if (userDataResponse) {
          const safeUser = toSafeUser(userDataResponse)
          setUser(safeUser)
          
          if (safeUser) {
            setFormData({
              firstName: safeUser.firstName,
              lastName: safeUser.lastName,
              age: safeUser.age,
              phone: safeUser.phone,
              bio: safeUser.bio || '',
              region: safeUser.region || ''
            })
            
            if (safeUser.posts) {
              setPosts(safeUser.posts)
            }
          }
        }
        
        const currentUserData = await getCurrentUser()
        setCurrentUser(toSafeUser(currentUserData))
        
        if (currentUserData?.id === slug) {
          try {
            const testsData = await getUserCourses()
            if (testsData.success) {
              setTests(testsData.courses || [])
            }
          } catch (error) {
            console.error(error)
          }
        }
        
      } catch (error) {
        console.error(error)
        toast.error('Не удалось загрузить профиль')
      } finally {
        setIsLoading(false)
      }
    }
    
    if (slug) {
      loadData()
    }
  }, [slug])

  const handleAvatarUpdate = async () => {
    if (slug) {
      const userDataResponse = await getUserById(slug) as any;
      if (userDataResponse) {
        const safeUser = toSafeUser(userDataResponse);
        setUser(safeUser);
      }
      
      const currentUserData = await getCurrentUser();
      setCurrentUser(toSafeUser(currentUserData));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'age' ? parseInt(value) || 0 : value
    }))
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)
    
    try {
      const result = await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        age: formData.age,
        phone: formData.phone,
        bio: formData.bio,
        region: formData.region
      })
      
      if (result.success && result.user) {
        setUser(toSafeUser(result.user))
        setIsEditModalOpen(false)
        toast.success('Профиль успешно обновлен!')
        
        if (currentUser?.id === user?.id) {
          setCurrentUser(toSafeUser(result.user))
        }
      } else {
        toast.error(result.error || 'Ошибка при обновлении профиля')
      }
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Ошибка при обновлении профиля')
    } finally {
      setIsUpdating(false)
    }
  }

  const getStats = () => {
    if (!user) return null
    
    const postsCount = user._count?.posts || posts.length || 0
    const commentsCount = user._count?.comments || 0
    
    let totalLikes = 0
    if (posts.length > 0) {
      totalLikes = posts.reduce((sum, post) => sum + (post.likes || 0), 0)
    }
    
    let totalCommentsOnPosts = 0
    if (posts.length > 0) {
      totalCommentsOnPosts = posts.reduce((sum, post) => sum + (post._count?.comments || 0), 0)
    }
    
    return {
      postsCount,
      commentsCount,
      totalLikes,
      totalComments: totalCommentsOnPosts,
      testsCount: tests.length,
      engagement: totalLikes + totalCommentsOnPosts
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-[#FF7340] mx-auto mb-4" size={48} />
          <p className="text-gray-600">Загрузка профиля...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Пользователь не найден
            </h2>
            <p className="text-gray-600">
              Профиль с таким ID не существует
            </p>
          </div>
        </div>
      </div>
    )
  }

  const stats = getStats()
  const isOwnProfile = currentUser?.id === user.id

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Шапка профиля */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-[#FFC873] mb-8">
          <div className="bg-linear-to-r from-[#FFC873] to-[#FFB840] p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-white p-1">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.firstName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-linear-to-r from-[#FF7340] to-[#FFB840] flex items-center justify-center">
                      <UserIcon className="text-white" size={48} />
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    {user.firstName} {user.lastName} {user.verified && (
                      <Image src="/images/verified.png" alt="" width={24} height={24} />
                    )}
                  </h1>
                  <p className="text-white/90">{user.email}</p>
                  {user.bio && (
                    <p className="text-white/80 mt-2 break-all max-w-180">{user.bio}</p>
                  )}
                </div>
              </div>
              
              {isOwnProfile && (
                <>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-[#FF7340] hover:bg-gray-100 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  <Edit size={18} />
                  Редактировать
                </button>
                <ToggleSwitch 
                  size="lg" 
                />
                </>
              )}
            </div>
          </div>
          
          <div className="p-6">
            {/* Информация */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="h-12 aspect-square rounded-full bg-linear-to-r from-[#FFC873] to-[#FFB840] flex items-center justify-center">
                  <Mail className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium dark:text-black">{user.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-linear-to-r from-[#FFC873] to-[#FFB840] flex items-center justify-center">
                  <Phone className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Телефон</p>
                  <p className="font-medium dark:text-black">{user.phone}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-linear-to-r from-[#FFC873] to-[#FFB840] flex items-center justify-center">
                  <Calendar className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Возраст</p>
                  <p className="font-medium dark:text-black">{user.age} лет</p>
                </div>
              </div>
              
              {user.region && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-linear-to-r from-[#FFC873] to-[#FFB840] flex items-center justify-center">
                    <MapPin className="text-white" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Регион</p>
                    <p className="font-medium dark:text-black">{user.region}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Статистика */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-linear-to-r from-[#FFF0F0] to-[#FFE0C2] p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="text-[#FF7340]" size={20} />
                    <span className="font-semibold text-gray-900">Посты</span>
                  </div>
                  <p className="text-2xl font-bold text-[#FF7340]">{stats.postsCount}</p>
                </div>
                
                <div className="bg-linear-to-r from-[#FFF0F0] to-[#FFE0C2] p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="text-[#FF7340]" size={20} />
                    <span className="font-semibold text-gray-900">Комментарии</span>
                  </div>
                  <p className="text-2xl font-bold text-[#FF7340]">{stats.commentsCount}</p>
                </div>
                
                <div className="bg-linear-to-r from-[#FFF0F0] to-[#FFE0C2] p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ThumbsUp className="text-[#FF7340]" size={20} />
                    <span className="font-semibold text-gray-900">Лайки</span>
                  </div>
                  <p className="text-2xl font-bold text-[#FF7340]">{stats.totalLikes}</p>
                </div>
                
                <div className="bg-linear-to-r from-[#FFF0F0] to-[#FFE0C2] p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="text-[#FF7340]" size={20} />
                    <span className="font-semibold text-gray-900">Тесты</span>
                  </div>
                  <p className="text-2xl font-bold text-[#FF7340]">{stats.testsCount}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Посты пользователя */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-[#FFC873]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="text-[#FF7340]" size={24} />
                Посты пользователя ({posts.length})
              </h2>
            </div>
            
            {posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post, index) => (
                  <div
                    key={post.id || index}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-[#FFC873] transition-colors"
                  >
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">{post.title}</h3>
                    
                    {/* Галерея изображений */}
                    {post.images.length > 0 && (
                      <ImageGallery images={post.images} title={post.title} />
                    )}
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.content}</p>
                    
                    {/* Теги */}
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {post.tags.map((tag, tagIndex) => (
                          <span 
                            key={tagIndex}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>
                        {post.createdAt 
                          ? new Date(post.createdAt).toLocaleDateString('ru-RU')
                          : 'Дата не указана'
                        }
                      </span>
                      <Link 
                    href={`/posts/${post.id}`}
                    className="text-[#FF7340] hover:text-[#FF4500] font-medium flex items-center gap-2"
                  >
                    Читать далее <img src="/images/arrow.svg" alt="Стрелка" className="aspect-square w-6" />
                  </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500">Пользователь еще не создал постов</p>
              </div>
            )}
          </div>
          
          {/* Пройденные тесты (только для своего профиля) */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-[#FFC873]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Trophy className="text-[#FF7340]" size={24} />
                Пройденные тесты ({tests.length})
              </h2>
            </div>
            
            {tests.length > 0 ? (
              <div className="space-y-4">
                {tests.map((test, index) => (
                  <div 
                    key={test.id || index}
                    className="p-4 border border-gray-200 rounded-lg hover:border-[#FFC873] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          {test.ethnicGroupName}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center">
                            <CheckCircle className="text-green-500 mr-1" size={16} />
                            <span className="text-sm text-green-600 font-medium">Пройден</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            Результат: {test.score * 20}%
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/quiz/narod/${test.ethnicGroupId}`}
                        className="px-3 py-1 bg-[#FFB840] hover:from-[#FFB840]/80 text-white text-sm font-medium rounded-lg duration-200"
                      >
                        Пройти снова
                      </Link>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mt-3">
                      <span>
                        {test.completedAt 
                          ? new Date(test.completedAt).toLocaleDateString('ru-RU')
                          : 'Дата не указана'
                        }
                      </span>
                      <span className="flex items-center gap-1">
                        <Award size={14} />
                        {test.score == 5 ? 'Отлично' : 
                         test.score >= 3 ? 'Хорошо' : 
                         test.score >= 2 ? 'Удовлетворительно' : 'Попробуйте еще раз'}
                      </span>
                    </div>
                    
                    {test.score === 100 && (
                      <div className="mt-3 p-2 bg-linear-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded">
                        <p className="text-sm text-amber-700 flex items-center">
                          <Trophy size={14} className="mr-1" />
                          <span className="font-medium">Отличный результат!</span>
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500">
                  {isOwnProfile ? 'Вы еще не прошли ни одного теста' : 'Пользователь еще не прошел ни одного теста'}
                </p>
                {isOwnProfile && (
                  <>
                    <p className="text-sm text-gray-400 mt-2">
                      Пройдите тесты по культуре народов России!
                    </p>
                    <Link
                      href="/peoples"
                      className="inline-block mt-4 px-4 py-2 bg-linear-to-r from-[#FF7340] to-[#FFB840] hover:from-[#FFB840] hover:to-[#FF7340] text-white font-medium rounded-lg transition-all"
                    >
                      Выбрать тест
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Модальное окно редактирования профиля */}
      {isEditModalOpen && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Редактировать профиль</h2>
        <button
          onClick={() => setIsEditModalOpen(false)}
          className="p-2 hover:bg-gray-100 text-black rounded-lg cursor-pointer duration-150"
        >
          <X size={24} />
        </button>
      </div>
      
      {/* Секция смены аватара */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Фото профиля</h3>
        <div className="flex items-center gap-6">
          {/* Текущий аватар */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#FFC873]">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.firstName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-linear-to-r from-[#FF7340] to-[#FFB840] flex items-center justify-center">
                  <UserIcon className="text-white" size={40} />
                </div>
              )}
            </div>
          </div>

          {/* Кнопки управления аватаром */}
          <div className="flex-1 space-y-2">
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setIsAvatarModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#FFB840] hover:from-[#FFB840]/80 text-white font-medium rounded-lg transition-colors cursor-pointer"
            >
              <Camera size={18} />
              Загрузить новое фото
            </button>
            
            {user.avatar && (
              <button
                onClick={async () => {
                  if (confirm('Вы уверены, что хотите удалить аватар?')) {
                    const result = await removeAvatar();
                    if (result.success) {
                      toast.success('Аватар удален');
                      // Обновляем данные пользователя
                      const userDataResponse = await getUserById(slug) as any;
                      if (userDataResponse) {
                        const safeUser = toSafeUser(userDataResponse);
                        setUser(safeUser);
                      }
                    } else {
                      toast.error(result.error || 'Ошибка при удалении аватара');
                    }
                  }
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 font-medium rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 size={18} />
                Удалить фото
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Рекомендуемый размер: 200x200px. Максимальный размер: 5MB. Форматы: JPG, PNG, GIF
        </p>
      </div>

      {/* Форма редактирования профиля */}
      <form onSubmit={handleUpdateProfile} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Имя *
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-[#FFC873] focus:border-transparent outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Фамилия *
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-[#FFC873] focus:border-transparent outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Возраст *
            </label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              min="14"
              max="120"
              required
              className="w-full px-4 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-[#FFC873] focus:border-transparent outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Телефон *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-[#FFC873] focus:border-transparent outline-none"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Регион
            </label>
            <input
              type="text"
              name="region"
              value={formData.region}
              onChange={handleInputChange}
              placeholder="Например, Москва"
              className="w-full px-4 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-[#FFC873] focus:border-transparent outline-none"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              О себе
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={3}
              placeholder="Расскажите о себе..."
              className="w-full px-4 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-[#FFC873] focus:border-transparent outline-none resize-none"
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setIsEditModalOpen(false)}
            className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium cursor-pointer"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={isUpdating}
            className="flex items-center gap-2 px-6 py-2 bg-[#FFB840] hover:from-[#FFB840]/80 text-white font-medium rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isUpdating ? (
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

{/* Модальное окно для загрузки аватара (остается отдельно) */}
<AvatarUploadModal
  isOpen={isAvatarModalOpen}
  onClose={() => setIsAvatarModalOpen(false)}
  currentAvatar={user.avatar}
  onAvatarUpdate={handleAvatarUpdate}
/>
    </div>
  )
}