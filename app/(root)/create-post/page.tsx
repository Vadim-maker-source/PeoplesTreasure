'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { peoples } from '@/app/lib/peoples';
import { createPost } from '@/app/lib/api/posts';

type MediaFile = {
  file: File;
  type: 'image' | 'video';
  preview?: string;
};

export default function CreatePostPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    ethnicGroupId: '',
    tags: '',
  });
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);

  const ethnicGroups = peoples.map(people => ({
    id: people.id,
    name: people.name,
    region: people.region.split(',')[0],
  }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);

      if (mediaFiles.length + newFiles.length > 10) {
        alert('Максимальное количество файлов - 10');
        return;
      }

      const newMediaFiles: MediaFile[] = newFiles.map(file => {
        const type = file.type.startsWith('video/') ? 'video' : 'image';
        return {
          file,
          type: type as 'image' | 'video',
          preview: type === 'image' ? URL.createObjectURL(file) : undefined
        };
      });

      setMediaFiles(prev => [...prev, ...newMediaFiles]);
    }
  };

  const handleRemoveMedia = (index: number) => {
    const media = mediaFiles[index];
    if (media.preview) {
      URL.revokeObjectURL(media.preview);
    }
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Введите заголовок поста');
      return;
    }

    if (!formData.content.trim()) {
      alert('Введите содержание поста');
      return;
    }

    if (!formData.ethnicGroupId) {
      alert('Выберите народ');
      return;
    }

    for (const media of mediaFiles) {
      if (media.type === 'image' && media.file.size > 5 * 1024 * 1024) {
        alert(`Изображение "${media.file.name}" не должно превышать 5MB`);
        return;
      }
      if (media.type === 'video' && media.file.size > 50 * 1024 * 1024) {
        alert(`Видео "${media.file.name}" не должно превышать 50MB`);
        return;
      }
    }

    setIsLoading(true);
    setUploadingFiles(mediaFiles.map(m => m.file.name));

    try {
      const images = mediaFiles.filter(m => m.type === 'image').map(m => m.file);
      const videos = mediaFiles.filter(m => m.type === 'video').map(m => m.file);

      const result = await createPost({
        title: formData.title,
        content: formData.content,
        ethnicGroupId: formData.ethnicGroupId,
        tags: formData.tags,
        images,
        videos,
      });

      if (result.success) {

        mediaFiles.forEach(media => {
          if (media.preview) {
            URL.revokeObjectURL(media.preview);
          }
        });

        if (result.redirectUrl) {
          router.push(result.redirectUrl);
        } else {
          router.push('/');
        }
        router.refresh();
      } else {
        alert(`Ошибка: ${result.error}`);
      }
    } catch (error) {
      console.error(error);
      alert('Произошла ошибка при создании поста');
    } finally {
      setIsLoading(false);
      setUploadingFiles([]);
    }
  };

  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          <div className="bg-linear-to-r from-[#FF7340] to-[#FF4500] px-8 py-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  Создание нового поста
                </h1>
                <p className="text-blue-100 text-lg">
                  Поделитесь своими знаниями о культуре народов России
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-3xl">📝</span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            <div className="space-y-8">

              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  Заголовок поста *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="Например: Традиции татарской свадьбы"
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:border-[#FF7340] focus:ring-2 focus:ring-transparent transition duration-200"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Придумайте яркий и информативный заголовок
                </p>
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  Выберите народ
                </label>
                <select
                  name="ethnicGroupId"
                  value={formData.ethnicGroupId}
                  onChange={handleChange}
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

              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  Содержание поста *
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  required
                  rows={10}
                  placeholder="Расскажите подробно о теме поста..."
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:border-[#FF7340] focus:ring-2 focus:ring-transparent transition duration-200 resize-none"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Подробно опишите тему вашего поста
                </p>
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  Теги
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="традиции, кухня, история, праздники"
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:border-[#FF7340] focus:ring-2 focus:ring-transparent transition duration-200"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Перечислите теги через запятую (необязательно)
                </p>
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  Изображения и видео
                </label>

                <div className="mb-4">
                  <label className="block">
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleMediaChange}
                      className="hidden"
                      id="media-upload"
                      disabled={isLoading || mediaFiles.length >= 10}
                    />
                    <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition duration-200">
                      <span className="text-3xl mb-2">📷🎥</span>
                      <span className="text-gray-600 font-medium">
                        {mediaFiles.length >= 10 ? 'Достигнут лимит 10 файлов' : 'Нажмите для загрузки изображений и видео'}
                      </span>
                      <span className="text-sm text-gray-500 mt-1">
                        До {10 - mediaFiles.length} файлов. Изображения до 5MB, видео до 50MB
                      </span>
                    </div>
                  </label>
                </div>

                {mediaFiles.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-gray-700 font-medium mb-3">Загруженные файлы:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {mediaFiles.map((media, index) => (
                        <div key={index} className="relative group border rounded-lg overflow-hidden">
                          <div className="aspect-video bg-gray-200 relative">
                            {media.type === 'image' ? (
                              <img
                                src={media.preview}
                                alt={`Изображение ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                <video
                                  src={URL.createObjectURL(media.file)}
                                  className="hidden"
                                />
                                <div className="text-center text-white">
                                  <span className="text-4xl block mb-2">🎬</span>
                                  <span className="text-xs">Видео</span>
                                </div>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition duration-200"></div>
                          </div>
                          <div className="p-2 bg-white">
                            <p className="text-sm text-gray-600 truncate" title={media.file.name}>
                              {media.file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(media.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            <span className="absolute top-1 left-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
                              {media.type === 'image' ? '📷' : '🎬'}
                            </span>
                          </div>
                          {!isLoading && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMedia(index)}
                              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition duration-200 hover:bg-red-600"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-[#FF7340] hover:bg-[#FF4500] text-white font-semibold py-4 px-8 rounded-xl transition duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Создание...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span>📤</span>
                        <span>Опубликовать пост</span>
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => router.back()}
                    disabled={isLoading}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-4 px-8 rounded-xl transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span>←</span>
                      <span>Отмена</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="mt-8 bg-linear-to-r from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200">
          <h3 className="text-xl font-bold text-emerald-800 mb-4">💡 Советы по созданию хорошего поста:</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 mt-1">•</span>
              <span className="text-emerald-700">Пишите подробно и информативно</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 mt-1">•</span>
              <span className="text-emerald-700">Используйте качественные изображения и видео</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 mt-1">•</span>
              <span className="text-emerald-700">Добавляйте соответствующие теги</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 mt-1">•</span>
              <span className="text-emerald-700">Проверяйте информацию на достоверность</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}