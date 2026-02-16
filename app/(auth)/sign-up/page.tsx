'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { createUser, sendVerificationCode } from '@/app/lib/api/user';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import Image from 'next/image';

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
  
  // OTP state
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [generatedCode, setGeneratedCode] = useState('');
  const [yandexLoading, setYandexLoading] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    age: '',
    password: '',
    confirmPassword: '',
  });

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

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

  // Генерация 6-значного кода на клиенте
  const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Отправка кода на email
  const sendCode = async () => {
    const code = generateCode();
    setGeneratedCode(code);
    
    setOtpLoading(true);
    setOtpError('');
    
    try {
      const result = await sendVerificationCode(formData.email, code);
      
      if (result.error) {
        setOtpError(result.error);
      } else {
        setOtpCooldown(60);
        const timer = setInterval(() => {
          setOtpCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error) {
      setOtpError('Не удалось отправить код подтверждения');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateStep3()) return;
    
    setLoading(true);

    try {
      // Проверяем, не занят ли email
      const existingUser = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      }).then(res => res.json());

      if (existingUser.exists) {
        setError('Пользователь с таким email уже существует');
        setLoading(false);
        return;
      }

      // Отправляем код и открываем модалку
      await sendCode();
      setOtpModalOpen(true);
      
    } catch (error) {
      setError('Произошла ошибка при регистрации');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpValue.length !== 6) {
      setOtpError('Введите полный код подтверждения');
      return;
    }

    if (otpValue !== generatedCode) {
      setOtpError('Неверный код подтверждения');
      return;
    }

    setOtpLoading(true);
    setOtpError('');

    try {
      // Создаем пользователя
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
        setOtpError(result.error);
        setOtpLoading(false);
        return;
      }

      setOtpModalOpen(false);
      setOtpValue('');
      setGeneratedCode('');

      // Автоматический вход
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
      setOtpError('Ошибка при регистрации');
      console.error(error);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleYandexSignIn = async () => {
    setYandexLoading(true);
    try {
      await signIn("yandex", { callbackUrl });
    } catch (error) {
      console.error(error);
      setError("Ошибка при входе через Яндекс");
      setYandexLoading(false);
    }
  };

  return (
    <>
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
                <button
                          onClick={handleYandexSignIn}
                          disabled={yandexLoading}
                          className="w-full flex items-center justify-center gap-1 px-4 py-2.5 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {yandexLoading ? (
                            <span className="flex items-center">
                              <Image src="/images/Yandex_icon.png" alt="Яндекс" width={30} height={30} />
                              Вход через Яндекс...
                            </span>
                          ) : (
                            <>
                              <Image src="/images/Yandex_icon.png" alt="Яндекс" width={30} height={30} />
                              Войти через Яндекс
                            </>
                          )}
                        </button>
                
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">или</span>
                          </div>
                        </div>
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

      {/* OTP Modal */}
      <Dialog open={otpModalOpen} onOpenChange={setOtpModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              Подтверждение email
            </DialogTitle>
            <DialogDescription className="text-center">
              Мы отправили 6-значный код подтверждения на адрес<br />
              <span className="font-medium text-gray-900">{formData.email}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center space-y-6 py-4">
            <InputOTP
              maxLength={6}
              value={otpValue}
              onChange={setOtpValue}
              disabled={otpLoading}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            {otpError && (
              <p className="text-sm text-red-600 text-center">
                {otpError}
              </p>
            )}

            <div className="flex flex-col items-center space-y-2">
              <button
                type="button"
                onClick={handleVerifyOTP}
                disabled={otpLoading || otpValue.length !== 6}
                className="w-full cursor-pointer flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#FF7340] hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {otpLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Проверка...
                  </span>
                ) : (
                  'Подтвердить'
                )}
              </button>

              <button
                type="button"
                onClick={sendCode}
                disabled={otpLoading || otpCooldown > 0}
                className="text-sm text-[#FF7340] hover:underline disabled:text-gray-400 disabled:no-underline"
              >
                {otpCooldown > 0 
                  ? `Отправить код повторно через ${otpCooldown}с` 
                  : 'Отправить код повторно'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
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