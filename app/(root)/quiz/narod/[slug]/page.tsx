'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  Trophy,
  RefreshCw,
  Home,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { peoples } from '@/app/lib/peoples';
import { getRandomQuestions } from '@/app/lib/questions';
import { getOrCreateTest, Question, submitTestResults } from '@/app/lib/api/courses';
import { getCurrentUser, User } from '@/app/lib/api/user';

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.slug as string;

  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
      const checkAuth = async () => {
        const currentUser = await getCurrentUser()
        if(currentUser){
          setUser(currentUser)
        }
      }
  
      checkAuth()
    }, [])
  
  const [ethnicGroup, setEthnicGroup] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  const loadQuiz = useCallback(async () => {
    setIsLoading(true);
    try {
      const group = peoples.find(p => p.id === quizId);
      
      if (!group) {
        toast.error(`Народ с ID "${quizId}" не найден`);
        router.push('/');
        return;
      }
      
      setEthnicGroup(group);
      
      const quizQuestions = getRandomQuestions(group.id);
      setQuestions(quizQuestions);
      setAnswers(new Array(quizQuestions.length).fill(null));
      
      const saved = localStorage.getItem(`quiz_progress_${group.id}`);
      if (saved) {
        const progress = JSON.parse(saved);
        if (progress.completed) {
          setShowResult(true);
          setAnswers(progress.answers || []);
        } else {
          setAnswers(progress.answers || new Array(quizQuestions.length).fill(null));
          setCurrentQuestion(progress.currentQuestion || 0);
        }
      }
      
      setTimerActive(true);
      setTimer(0);
      
    } catch (error) {
      console.error(error);
      toast.error('Не удалось загрузить тест');
    } finally {
      setIsLoading(false);
    }
  }, [quizId, router]);

  useEffect(() => {
    if (quizId) {
      loadQuiz();
      const createTest = async () => {
        await getOrCreateTest(String(user?.id), quizId, ethnicGroup)
      }
      createTest()
    }
  }, [quizId, loadQuiz]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timerActive && !showResult) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, showResult]);

  useEffect(() => {
    if (ethnicGroup && questions.length > 0 && !showResult) {
      const progress = {
        answers,
        currentQuestion,
        completed: false,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(`quiz_progress_${ethnicGroup.id}`, JSON.stringify(progress));
    }
  }, [answers, currentQuestion, ethnicGroup, questions, showResult]);

  const handleAnswerSelect = (index: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = index;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    const correctAnswers = answers.filter((answer, index) => 
      answer === questions[index].correctAnswer
    ).length;
    
    const totalQuestions = questions.length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    const passed = correctAnswers === totalQuestions;
    
    const testAnswers = answers.map((answer, index) => ({
      questionId: index,
      selectedAnswer: answer!,
      correctAnswer: questions[index].correctAnswer,
      isCorrect: answer === questions[index].correctAnswer,
    }));
    
    const testResults = {
      score: correctAnswers,
      total: totalQuestions,
      percentage,
      passed,
      answers: testAnswers,
    };
  
    try {
      const result = await submitTestResults(quizId, ethnicGroup.name, testResults);
      
      if (result.success) {
        toast.success('Результаты сохранены!');
        if (result.passed) {
          toast.success('Поздравляем с успешным прохождением теста!');
        }
      } else {
        toast.error(result.error || 'Не удалось сохранить результаты');
      }
    } catch (error) {
      console.error(error);
      toast.error('Произошла ошибка при сохранении результатов');
    }
    
    setTimerActive(false);
    setShowResult(true);
    
    if (ethnicGroup) {
      localStorage.removeItem(`quiz_progress_${ethnicGroup.id}`);
    }
  };

  const handleRestart = () => {
    if (ethnicGroup) {
      const newQuestions = getRandomQuestions(ethnicGroup.id);
      setQuestions(newQuestions);
      setAnswers(new Array(newQuestions.length).fill(null));
      setCurrentQuestion(0);
      setShowResult(false);
      setTimer(0);
      setTimerActive(true);
    }
  };

  const handleContinueLearning = () => {
    if (ethnicGroup) {
      router.push(`/${ethnicGroup.name}`);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-b from-[#FFF0F0] to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-[#FF7340] mx-auto mb-4" size={48} />
          <p className="text-gray-600">Загрузка теста...</p>
        </div>
      </div>
    );
  }

  if (!ethnicGroup) {
    return (
      <div className="min-h-screen bg-linear-to-b from-[#FFF0F0] to-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <Link
              href="/peoples"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
              <span>Вернуться к народам</span>
            </Link>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-[#FFC873]">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Тест не найден
            </h2>
            <p className="text-gray-600 mb-6">
              Выберите народ для прохождения теста
            </p>
            <Link
              href="/peoples"
              className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-[#FF7340] to-[#FFB840] hover:from-[#FFB840] hover:to-[#FF7340] text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              Выбрать народ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (showResult && questions.length > 0) {
    const correctAnswers = answers.filter((answer, index) => 
      answer === questions[index].correctAnswer
    ).length;
    
    const totalQuestions = questions.length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    const passed = correctAnswers === totalQuestions;

    return (
      <div className="min-h-screen bg-linear-to-b from-[#FFF0F0] to-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <Link
              href={`/peoples/${ethnicGroup.id}`}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
              <span>Назад к {ethnicGroup.name}</span>
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-[#FFC873]">
            <div className={`p-8 text-center ${passed ? 'bg-linear-to-r from-[#FFF0F0] to-[#FFE0C2]' : 'bg-linear-to-r from-[#FFF0F0] to-[#FFE0C2]'}`}>
              <div className="flex justify-center mb-6">
                <div className={`w-24 h-24 rounded-full ${passed ? 'bg-linear-to-r from-[#FFC873] to-[#FFB840]' : 'bg-linear-to-r from-[#FF7340] to-[#FFB840]'} flex items-center justify-center`}>
                  {passed ? (
                    <CheckCircle className="text-white" size={48} />
                  ) : (
                    <XCircle className="text-white" size={48} />
                  )}
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {passed ? 'Поздравляем! 🎉' : 'Попробуйте еще раз!'}
              </h1>
              <h2 className="text-2xl font-semibold text-[#FF7340] mb-4">
                {ethnicGroup.name}
              </h2>
              
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-bold mb-4 bg-linear-to-r from-[#FFC873] to-[#FFB840] text-white shadow-md">
                <Trophy size={20} />
                <span>{correctAnswers} из {totalQuestions} правильных</span>
              </div>
              
              <div className="flex items-center justify-center gap-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock size={18} />
                  <span>Время: {formatTime(timer)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Процент: {percentage}%</span>
                </div>
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Результаты по вопросам:</h3>
              <div className="space-y-4">
                {questions.map((question, index) => {
                  const answer = answers[index];
                  const isCorrect = answer === question.correctAnswer;
                  const selectedOption = answer !== null && answer !== undefined ? question.options[answer] : 'Нет ответа';
                  const correctOption = question.options[question.correctAnswer];
                  
                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${isCorrect ? 'border-[#07df00] bg-[#61ff5c]/30' : 'border-[#FF7340] bg-[#FFF0F0]'}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isCorrect 
                              ? 'bg-[#07df00] text-white' 
                              : 'bg-[#FF7340] text-white'
                          }`}>
                            <span className="font-bold">{index + 1}</span>
                          </div>
                          <span className="font-medium text-gray-900">
                            Вопрос {index + 1}
                          </span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          isCorrect 
                            ? 'bg-[#07df00] text-white' 
                            : 'bg-[#FF7340] text-white'
                        }`}>
                          {isCorrect ? <div className="flex items-center"><img src="/images/Done.svg" className="w-5 aspect-square" /> Правильно </div> : <div className="flex items-center"><img src="/images/x.svg" className="w-5 aspect-square" /> Неправильно </div>}
                        </span>
                      </div>
                      
                      <p className="font-medium text-gray-800 mb-3">{question.text}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div className={`p-3 rounded-lg ${isCorrect ? 'bg-[#F8F0FF] border border-[#C873FF]' : 'bg-[#FFF0F0] border border-[#FF7340]'}`}>
                          <p className="text-sm font-medium text-gray-700 mb-1">Ваш ответ:</p>
                          <p className={`font-medium ${isCorrect ? 'text-[#C873FF]' : 'text-[#FF7340]'}`}>
                            {selectedOption}
                          </p>
                        </div>
                        
                        {!isCorrect && (
                          <div className="p-3 rounded-lg bg-[#F8F0FF] border border-[#C873FF]">
                            <p className="text-sm font-medium text-gray-700 mb-1">Правильный ответ:</p>
                            <p className="font-medium text-[#C873FF]">{correctOption}</p>
                          </div>
                        )}
                      </div>
                      
                      {question.explanation && !isCorrect && (
                        <div className="mt-2 p-3 bg-linear-to-r from-[#FFC873] to-[#FFB840] border border-[#FFC873] rounded-lg">
                          <p className="text-white">
                            <span className="font-medium">💡 Пояснение:</span> {question.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 border-t border-[#FFC873]">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleRestart}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-[#FF7340] hover:opacity-80 text-white font-semibold rounded-lg transition-all cursor-pointer duration-200"
                >
                  <RefreshCw size={18} />
                  Пройти заново
                </button>
                
                <button
                  onClick={handleContinueLearning}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-[#FFB840] hover:opacity-80 text-white font-semibold rounded-lg transition-all cursor-pointer duration-200"
                >
                  <ArrowLeft size={18} />
                  Изучить материал
                </button>
                
                <Link
                  href="/"
                  className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-[#FFC873] hover:border-[#FFB840] text-gray-700 hover:text-gray-900 font-semibold rounded-lg transition-colors"
                >
                  <Home size={18} />
                  На главную
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-linear-to-b from-[#FFF0F0] to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-[#FF7340] mx-auto mb-4" size={48} />
          <p className="text-gray-600">Подготовка вопросов...</p>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6 flex justify-between items-center">
          <Link
            href={`/peoples/${ethnicGroup.id}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            <span>Назад к {ethnicGroup.name}</span>
          </Link>
          
          <div className="flex items-center gap-2 bg-linear-to-r from-[#FFC873] to-[#FFB840] text-white px-3 py-1 rounded-full">
            <Clock size={16} />
            <span className="font-medium">{formatTime(timer)}</span>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Тест по культуре
          </h1>
          <h2 className="text-2xl font-semibold text-[#FF7340] mt-2">
            {ethnicGroup.name}
          </h2>
          <p className="text-gray-600 mt-2">
            Ответьте на {questions.length} вопросов о культуре и традициях
          </p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              Вопрос {currentQuestion + 1} из {questions.length}
            </span>
            <span className="text-sm font-medium text-gray-600">
              {Math.round(((currentQuestion + 1) / questions.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-linear-to-r from-[#FF7340] to-[#FFB840] h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
          
          <div className="flex justify-center gap-2">
            {questions.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentQuestion
                    ? 'bg-[#FF7340] scale-125'
                    : index < currentQuestion
                    ? answers[index] !== null 
                      ? 'bg-[#FFCB73]' 
                      : 'bg-gray-300'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8 border border-[#FFC873]">
          <div className="p-6 md:p-8">
            <div className="mb-2">
              <span className="inline-block px-3 py-1 bg-[#FFC873] text-white rounded-full text-sm font-medium">
                Вопрос {currentQuestion + 1}
              </span>
              {answers[currentQuestion] !== null && answers[currentQuestion] !== undefined && (
                <span className="ml-2 inline-block px-3 py-1 bg-[#FF7340] text-white rounded-full text-sm font-medium">
                  ✓ Отвечено
                </span>
              )}
            </div>
            
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-8">
              {currentQ.text}
            </h2>

            <div className="space-y-3 mb-8">
              {currentQ.options.map((option, index) => {
                const isSelected = answers[currentQuestion] === index;
                
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all group hover:shadow-md cursor-pointer ${
                      isSelected
                        ? 'border-[#FF7340] bg-linear-to-r from-[#FFF0F0] to-[#FFE0C2] shadow-md'
                        : 'border-gray-200 hover:border-[#FFC873] hover:bg-[#FFF8F0]'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="mr-4 mt-1 shrink-0">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-[#FF7340]'
                            : 'bg-gray-100 border border-gray-300 group-hover:border-[#FFC873]'
                        }`}>
                          {isSelected && (
                            <Check className="text-white" size={16} />
                          )}
                        </div>
                      </div>
                      
                      <div className="grow">
                        <span className="text-gray-800 text-lg">{option}</span>
                      </div>
                      
                        <div className="ml-3 shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-medium group-hover:bg-[#FFE0C2] group-hover:text-[#FF7340] transition-colors">
                          {index + 1}
                        </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-[#FFC873]">
              <button
                onClick={handlePrev}
                disabled={currentQuestion === 0}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${
                  currentQuestion === 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:text-[#FF7340] hover:bg-[#FFF0F0]'
                }`}
              >
                <ChevronLeft size={20} />
                Назад
              </button>
              
              <div className="text-sm">
                {answers[currentQuestion] === null || answers[currentQuestion] === undefined ? (
                  <span className="text-[#FF7340] font-medium">Выберите ответ</span>
                ) : (
                  <span className="text-[#FFCB73] font-medium">✓ Ответ сохранен</span>
                )}
              </div>
              
              <button
                onClick={handleNext}
                disabled={answers[currentQuestion] === null || answers[currentQuestion] === undefined}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${
                  answers[currentQuestion] === null || answers[currentQuestion] === undefined
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-[#FFA100] text-white cursor-pointer hover:opacity-80 duration-200'
                }`}
              >
                {currentQuestion === questions.length - 1 ? 'Завершить' : 'Далее'}
                <ChevronRight size={20} />
              </button>
            </div>
            
            {currentQuestion === questions.length - 1 && answers[currentQuestion] !== null && (
              <div className="mt-4 p-3 bg-linear-to-r from-[#FFC873] to-[#FFB840] border border-[#FFC873] rounded-lg">
                <p className="text-white text-center font-medium">
                  ⚠️ Последний вопрос! Нажмите "Завершить" для получения результатов.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}