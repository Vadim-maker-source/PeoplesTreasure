'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { peoples } from '@/app/lib/peoples';
import { getAllPosts, getPostsByEthnicGroup, PostWithAuthor, toggleLike } from '@/app/lib/api/posts';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import debounce from 'lodash/debounce';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

export default function Forum() {
  const [selectedEthnicGroup, setSelectedEthnicGroup] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<PostWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [autoplayStates, setAutoplayStates] = useState<Map<string, boolean>>(new Map());

  const handleVideoPlay = (postId: string, isPlaying: boolean) => {
    setAutoplayStates(prev => {
      const newMap = new Map(prev);
      newMap.set(postId, !isPlaying);
      return newMap;
    });
  };
  
  const handleVideoEnded = (postId: string) => {
    setAutoplayStates(prev => {
      const newMap = new Map(prev);
      newMap.set(postId, true);
      return newMap;
    });
  };
  
  const handleSlideChange = (postId: string) => {
    setAutoplayStates(prev => {
      const newMap = new Map(prev);
      newMap.set(postId, true);
      return newMap;
    });
  };
  
  const router = useRouter();

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      let result;
      
      if (selectedEthnicGroup === 'all') {
        result = await getAllPosts(currentPage, 10, sortBy);
      } else {
        result = await getPostsByEthnicGroup(selectedEthnicGroup, currentPage, 10, sortBy);
      }

      setPosts(result.posts);
      setFilteredPosts(result.posts);
      setTotalPages(result.pagination.totalPages);
      setTotalCount(result.pagination.totalCount);
    } catch (error) {
      console.error(error);
      toast.error('Ошибка при загрузке постов');
    } finally {
      setIsLoading(false);
    }
  };

  const performSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setFilteredPosts(posts);
      return;
    }

    const lowercasedQuery = query.toLowerCase().trim();
    
    const filtered = posts.filter(post => {
      if (post.title.toLowerCase().includes(lowercasedQuery)) {
        return true;
      }
      
      const authorFullName = `${post.author.firstName} ${post.author.lastName}`.toLowerCase();
      if (authorFullName.includes(lowercasedQuery)) {
        return true;
      }
      
      const hasMatchingTag = post.tags.some(tag => 
        tag.toLowerCase().includes(lowercasedQuery)
      );
      if (hasMatchingTag) {
        return true;
      }
      
      if (post.content.toLowerCase().includes(lowercasedQuery)) {
        return true;
      }
      
      return false;
    });

    setFilteredPosts(filtered);
  }, [posts]);

  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      performSearch(query);
    }, 300),
    [performSearch]
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);

  useEffect(() => {
    setCurrentPage(1);
    fetchPosts();
  }, [selectedEthnicGroup, sortBy]);

  useEffect(() => {
    if (currentPage !== 1) {
      fetchPosts();
    }
  }, [currentPage]);

  const sortedPosts = useMemo(() => {
    const postsToSort = [...filteredPosts];
    
    if (sortBy === 'newest') {
      return postsToSort.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      return postsToSort.sort((a, b) => b.likes - a.likes);
    }
  }, [filteredPosts, sortBy]);

  const formatDate = (date: Date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours} ч. назад`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)} дн. назад`;
    } else {
      return postDate.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  };

  const handleToggleLike = async (postId: string) => {
    try {
      const result = await toggleLike(postId);
      if (result.success) {
        const updatedPosts = posts.map(post => {
          if (post.id !== postId) return post;
          
          const updatedPost: PostWithAuthor = {
            ...post,
            likes: typeof result.likes === 'number' ? result.likes : post.likes,
            likedByUser: typeof result.liked === 'boolean' ? result.liked : post.likedByUser
          };
          
          return updatedPost;
        });
        
        setPosts(updatedPosts);
        
        const updatedFilteredPosts = filteredPosts.map(post => {
          if (post.id !== postId) return post;
          
          const updatedPost: PostWithAuthor = {
            ...post,
            likes: typeof result.likes === 'number' ? result.likes : post.likes,
            likedByUser: typeof result.liked === 'boolean' ? result.liked : post.likedByUser
          };
          
          return updatedPost;
        });
        
        setFilteredPosts(updatedFilteredPosts);
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
      toast.error(error as string);
      console.error(error);
    }
  };

  const handleCopyLink = async (postId: string) => {
    try {
      const url = `${window.location.origin}/posts/${postId}`;
      await navigator.clipboard.writeText(url);
      toast.success('Ссылка на пост успешно скопирована!');
    } catch (error) {
      console.error(error);
      toast.error('Произошла ошибка');
    }
  };

  const getEthnicGroupName = (id: string | null) => {
    if (!id) return 'Не указан';
    return peoples.find(p => p.id === id)?.name || 'Народ';
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSortChange = (sortType: 'newest' | 'popular') => {
    setSortBy(sortType);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const isVideoFile = (url: string): boolean => {
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2 text-xl">
            <Loader2 className="animate-spin text-[#FF7340]" />
            <p className="text-[#FFB840] text-xl">Загрузка постов...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Панель фильтров и сортировки */}
      <div className="sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Фильтр по народам */}
            <div className="flex-1 w-full md:w-auto">
  <div className="flex items-center gap-2">
    <span className="text-gray-700 font-medium">Народ:</span>
    <div className="relative">
      <select
        value={selectedEthnicGroup}
        onChange={(e) => setSelectedEthnicGroup(e.target.value)}
        className="appearance-none px-4 py-2 pr-10 rounded-xl bg-[#FFF0F0] text-gray-700 border-none focus:ring-2 focus:ring-orange-300 outline-none cursor-pointer"
      >
        <option value="all">Все народы</option>
        {peoples.map(people => (
          <option key={people.id} value={people.id}>
            {people.name}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  </div>
</div>

            {/* Поиск */}
            <div className="relative w-full md:w-auto">
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <FontAwesomeIcon icon={faMagnifyingGlass} className="text-gray-400" />
    </div>
    <input 
      type="text" 
      placeholder="Ищите по названию, автору или хештегам..." 
      value={searchQuery}
      onChange={handleSearchChange}
      className="w-full md:w-80 pl-10 pr-4 py-2 rounded-xl bg-[#FFF0F0] text-gray-700 border-none focus:ring-2 focus:ring-orange-300 outline-none placeholder-gray-500"
    />
    {searchQuery && (
      <button
        onClick={handleClearSearch}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        ✕
      </button>
    )}
  </div>
  {searchQuery && (
    <div className="absolute top-full left-0 right-0 mt-1 text-sm text-gray-500">
      Найдено {filteredPosts.length} из {posts.length} постов
    </div>
  )}
</div>

            {/* Сортировка */}
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-700 font-medium">Сортировка:</span>
                <div className="flex bg-[#FFF0F0] rounded-full p-1">
                  <button
                    onClick={() => handleSortChange('newest')}
                    className={`px-4 py-2 rounded-full transition-all ${sortBy === 'newest' ? 'bg-orange-500 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                  >
                    Сначала новые
                  </button>
                  <button
                    onClick={() => handleSortChange('popular')}
                    className={`px-4 py-2 rounded-full transition-all ${sortBy === 'popular' ? 'bg-orange-500 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                  >
                    Популярные
                  </button>
                </div>
              </div>
              <Link href="/create-post">
                <button className="px-4 py-2 rounded-xl bg-orange-500 text-white flex items-center hover:opacity-80 cursor-pointer duration-200">
                  <Plus className="aspect-square" /> Добавить пост
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Лента постов */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Статистика и информация о сортировке */}
        <div className="mb-8 flex justify-between items-center">
          <p className="text-gray-600">
            {searchQuery ? (
              <>Найдено {filteredPosts.length} из {totalCount} постов</>
            ) : (
              <>Показано {filteredPosts.length} из {totalCount} постов</>
            )}
            {selectedEthnicGroup !== 'all' && ` по народу "${getEthnicGroupName(selectedEthnicGroup)}"`}
          </p>
          <div className="text-sm text-gray-500">
            Сортировка: <span className="font-medium">
              {sortBy === 'newest' ? 'сначала новые' : 'по популярности'}
            </span>
          </div>
        </div>

        {/* Сообщение если нет результатов поиска */}
        {searchQuery && filteredPosts.length === 0 && (
          <div className="text-center py-8 mb-8">
            <div className="text-4xl mb-4"><FontAwesomeIcon icon={faMagnifyingGlass} /></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Ничего не найдено
            </h3>
            <p className="text-gray-600 mb-4">
              По запросу "{searchQuery}" не найдено ни одного поста.
            </p>
            <button
              onClick={handleClearSearch}
              className="text-[#FF7340] hover:text-[#FF4500] font-medium"
            >
              Очистить поиск
            </button>
          </div>
        )}

        {/* Посты */}
        <div className="space-y-8">
          {sortedPosts.map((post) => (
            <div key={post.id} className="bg-white px-4 md:px-6 lg:px-8 pt-4 md:pt-6 lg:pt-8 rounded-2xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300">
              {/* Шапка поста */}
              <div className="mb-4 md:mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Link href={`/profile/${post.author.id}`}>
                      <div className="w-12 h-12 rounded-full bg-linear-to-r from-[#FFCB73] to-[#FF7340] flex items-center justify-center text-white font-bold">
                        {post.author.firstName[0]}{post.author.lastName[0]}
                      </div>
                    </Link>
                    <div>
                      <Link href={`/profile/${post.author.id}`}>
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                          {post.author.firstName} {post.author.lastName} {post.author.verified && (
                            <Image src="/images/verified.png" alt="" width={18} height={18} />
                          )}
                        </h3>
                      </Link>
                      <p className="text-sm text-gray-500">
                        {formatDate(post.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-[#FF7340]/80 text-white rounded-full text-sm font-medium">
                      Посвящено народу: {getEthnicGroupName(post.ethnicGroupId)}
                    </span>
                  </div>
                </div>
                
                <h2 className="text-xl font-bold text-gray-900">{post.title}</h2>
              </div>

              {/* Слайдер изображений */}
              {post.images.length > 0 && (
  <div className="relative">
    <Swiper
      modules={[Navigation, Pagination, Autoplay]}
      navigation
      pagination={{ clickable: true }}
      autoplay={autoplayStates.get(post.id) !== false ? { delay: 5000, disableOnInteraction: false } : false}
      loop={post.images.length > 1}
      className="h-125 rounded-xl overflow-hidden"
      onSlideChange={() => handleSlideChange(post.id)}
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
                onPlay={() => handleVideoPlay(post.id, true)}
                onPause={() => handleVideoPlay(post.id, false)}
                onEnded={() => handleVideoEnded(post.id)}
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

              {/* Увеличенное изображение */}
              {selectedImage && (
                <div 
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
                  onClick={() => setSelectedImage(null)}
                >
                  <div className="relative max-w-full max-h-full">
                    <img
                      src={selectedImage}
                      alt="Увеличенное изображение"
                      className="max-h-[90vh] max-w-full object-contain"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
                      onClick={() => setSelectedImage(null)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Контент поста */}
              <div>
                <p className="text-gray-700 mb-6 line-clamp-3">
                  {post.content}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {post.tags.map((tag, index) => (
                    <span key={index} className="px-3 py-1 bg-[#FFF0F0] text-gray-700 rounded-full text-sm">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Кнопки взаимодействия */}
                <div className="flex items-center justify-between py-4 border-t border-gray-100">
                  <div className="flex items-center gap-6">
                    <button
                      onClick={() => handleToggleLike(post.id)}
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-500 transition-colors cursor-pointer"
                    >
                      <span className="text-2xl">
                        {post.likedByUser ? 
                          <img src="/images/likefill.svg" alt="Лайк" className="aspect-square w-6" /> : 
                          <img src="/images/like.svg" alt="Лайк" className="aspect-square w-6" />
                        }
                      </span>
                      <span className="font-medium">{post.likes}</span>
                    </button>
                    
                    <button className="flex items-center gap-2 text-gray-600 hover:text-gray-500 transition-colors cursor-pointer">
                      <img src="/images/comments.svg" alt="Комментарии" className="aspect-square w-6" />
                      <span className="font-medium">{post.commentsCount}</span>
                    </button>
                    
                    <button 
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-500 transition-colors cursor-pointer" 
                      onClick={() => handleCopyLink(post.id)}
                    >
                      <img src="/images/link.svg" alt="Ссылка" className="aspect-square w-6" />
                      <span className="font-medium">Ссылка</span>
                    </button>
                  </div>
                  
                  <Link 
                    href={`/posts/${post.id}`}
                    className="text-[#FF7340] hover:text-[#FF4500] font-medium flex items-center gap-2"
                  >
                    Далее <img src="/images/arrow.svg" alt="Стрелка" className="aspect-square w-6" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Сообщение если нет постов */}
        {posts.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Пока нет постов
            </h3>
            <p className="text-gray-600 mb-6">
              {selectedEthnicGroup !== 'all' 
                ? `Пока никто не поделился информацией о народе "${getEthnicGroupName(selectedEthnicGroup)}"`
                : 'Будьте первым, кто поделится знаниями о культуре народов России!'}
            </p>
            <Link href="/create-post">
              <button className="inline-flex items-center gap-2 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                <span>Создать первый пост</span>
              </button>
            </Link>
          </div>
        )}

        {/* Пагинация - показываем только если нет активного поиска */}
        {!searchQuery && totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <nav className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg ${currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                ← Назад
              </button>
              
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
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-4 py-2 rounded-lg ${currentPage === pageNum ? 'bg-[#FF7340] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg ${currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Далее →
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}