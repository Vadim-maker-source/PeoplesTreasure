'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { createUser } from '@/app/lib/api/user';

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age: string;
  password: string;
  confirmPassword: string;
}

function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    age: '',
    password: '',
    confirmPassword: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateStep1 = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.age) {
      setError('Пожалуйста, заполните все поля');
      return false;
    }
    
    const age = parseInt(formData.age);
    if (age < 6 || age > 120) {
      setError('Возраст должен быть от 6 до 120 лет');
      return false;
    }
    
    return true;
  };

  const validateStep2 = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!formData.email.trim() || !formData.phone.trim()) {
      setError('Пожалуйста, заполните все поля');
      return false;
    }
    
    if (!emailRegex.test(formData.email)) {
      setError('Пожалуйста, введите корректный email');
      return false;
    }
    
    if (formData.phone.length < 10) {
      setError('Пожалуйста, введите корректный номер телефона');
      return false;
    }
    
    return true;
  };

  const validateStep3 = () => {
    if (!formData.password || !formData.confirmPassword) {
      setError('Пожалуйста, заполните все поля');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return false;
    }
    
    return true;
  };

  const handleNext = () => {
    setError('');
    
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateStep3()) return;
    
    setLoading(true);

    try {
      const result = await createUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        age: parseInt(formData.age),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      });

      if (signInResult?.error) {
        setError('Регистрация успешна! Пожалуйста, войдите вручную.');
        router.push('/sign-in');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      setError('Произошла ошибка при регистрации');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white py-8 px-6 sm:px-8 rounded-2xl shadow-xl border border-gray-200">
        <div>
          <div className="mx-auto h-12 w-12 relative">
            <img
              src="/images/logo.png"
              alt="Культурный код России"
              width={48}
              height={48}
              className="mx-auto"
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Регистрация
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Присоединяйтесь к сообществу "Сокровища Народов"
          </p>
          <div className="mt-4 flex justify-center">
            <div className="flex space-x-2">
              {[1, 2, 3].map((number) => (
                <div
                  key={number}
                  className={`w-3 h-3 rounded-full ${
                    step === number ? 'bg-orange-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Шаг 1: Имя, фамилия, возраст */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  Имя *
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                  placeholder="Введите ваше имя"
                />
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Фамилия *
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                  placeholder="Введите вашу фамилию"
                />
              </div>
              
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                  Возраст *
                </label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  min="6"
                  max="120"
                  required
                  value={formData.age}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                  placeholder="Введите ваш возраст"
                />
                <p className="mt-1 text-xs text-gray-500">Минимальный возраст: 6 лет</p>
              </div>
            </div>
          )}

          {/* Шаг 2: Email и телефон */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                  placeholder="example@mail.ru"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Телефон *
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                  placeholder="+7 (999) 123-45-67"
                />
              </div>
            </div>
          )}

          {/* Шаг 3: Пароль */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Пароль *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                  placeholder="Минимум 6 символов"
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Подтвердите пароль *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                  placeholder="Повторите пароль"
                />
              </div>
            </div>
          )}

          <div className="flex space-x-4">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                disabled={loading}
              >
                Назад
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#FF7340] hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                disabled={loading}
              >
                Далее
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#FF7340] hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Регистрация...
                  </span>
                ) : (
                  'Зарегистрироваться'
                )}
              </button>
            )}
          </div>

          <div className="text-center">
            <Link
              href="/sign-in"
              className="text-gray-600"
            >
              Уже есть аккаунт? <span className="text-[#FF7340] hover:opacity-80 font-medium underline">Войдите</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SignUp() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    }>
      <SignUpPage />
    </Suspense>
  );
}