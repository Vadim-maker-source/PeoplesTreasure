'use client'

import React, { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

interface ToggleSwitchProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showLabel?: boolean
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ 
  size = 'md', 
  className = '',
  showLabel = false 
}) => {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Инициализация темы при монтировании
  useEffect(() => {
    // Проверяем сохраненную тему или системные предпочтения
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    const initialTheme = storedTheme || (systemPrefersDark ? 'dark' : 'light')
    const isDarkMode = initialTheme === 'dark'
    
    setIsDark(isDarkMode)
    
    // Применяем тему к документу
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    
    setMounted(true)
  }, [])

  // Слушаем изменения системной темы
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Меняем тему только если нет сохраненной пользовательской темы
      if (!localStorage.getItem('theme')) {
        const newIsDark = e.matches
        setIsDark(newIsDark)
        if (newIsDark) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])
  
  const sizes = {
    sm: {
      button: 'h-6 w-12',
      circle: 'h-4 w-4',
      translate: 'translate-x-7',
      icon: 12
    },
    md: {
      button: 'h-8 w-16',
      circle: 'h-6 w-6',
      translate: 'translate-x-9',
      icon: 14
    },
    lg: {
      button: 'h-10 w-20',
      circle: 'h-8 w-8',
      translate: 'translate-x-11',
      icon: 16
    }
  }

  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    
    // Сохраняем в localStorage
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light')
    
    // Применяем к документу
    if (newIsDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Не рендерим на сервере и пока не смонтировано на клиенте
  if (!mounted) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {showLabel && (
          <span className="text-sm text-[#7E6B5C] dark:text-[#C4B5A0]">Светлая</span>
        )}
        <div className={`
          relative inline-flex items-center rounded-full 
          bg-[#FFC873] ${sizes[size].button}
        `}>
          <span className={`
            flex transform rounded-full 
            bg-white shadow-lg translate-x-1
            items-center justify-center ${sizes[size].circle}
          `}>
            <Sun size={sizes[size].icon} className="text-[#FF7340]" />
          </span>
        </div>
      </div>
    )
  }


  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showLabel && (
        <span className="text-sm text-[#7E6B5C] dark:text-[#C4B5A0]">
          {isDark ? 'Темная' : 'Светлая'}
        </span>
      )}
      <button
        onClick={toggleTheme}
        className={`
          relative inline-flex items-center rounded-full 
          transition-colors duration-300 focus:outline-none 
          focus:ring-0
          ${isDark ? 'bg-[#2C2C2C]' : 'bg-[#FFC873]'}
          ${sizes[size].button}
        `}
        role="switch"
        aria-checked={isDark}
        aria-label="Переключить тему"
      >
        <span
          className={`
            flex transform rounded-full 
            bg-white shadow-lg transition-transform duration-300
            items-center justify-center cursor-pointer
            ${sizes[size].circle}
            ${isDark ? sizes[size].translate : 'translate-x-1'}
          `}
        >
          {isDark ? (
            <Moon size={sizes[size].icon} className="text-[#4A3B2C]" />
          ) : (
            <Sun size={sizes[size].icon} className="text-[#FF7340]" />
          )}
        </span>
      </button>
    </div>
  )
}

export default ToggleSwitch