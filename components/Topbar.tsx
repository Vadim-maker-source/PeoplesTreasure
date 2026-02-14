'use client'

import { getCurrentUser, User } from '@/app/lib/api/user'
import { LogOut, Menu, X } from 'lucide-react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import ToggleSwitch from './ToggleSwitch'

const Topbar = () => {
  const [user, setUser] = useState<User | null>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const router = useRouter()
  
  const handleScrollDebounced = () => {
    const currentScrollY = window.scrollY
    
    if (currentScrollY > lastScrollY + 50) {
      setIsVisible(false)
      setLastScrollY(currentScrollY)
      setIsMenuOpen(false)
    } else if (currentScrollY < lastScrollY - 10) {
      setIsVisible(true)
      setLastScrollY(currentScrollY)
    }
    
    if (currentScrollY < 100) {
      setIsVisible(true)
    }
  }
  
  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser()
      if(currentUser){
        setUser(currentUser)
      }
    }

    checkAuth()
  }, [])
  
  useEffect(() => {
    window.addEventListener('scroll', handleScrollDebounced)
    
    return () => {
      window.removeEventListener('scroll', handleScrollDebounced)
    }
  }, [lastScrollY])

  const handleLogOut = async () => {
    try {
      const logOut = await signOut()
      if(logOut){
        router.replace('/')
        setIsMenuOpen(false)
      }
    } catch (error) {
      console.error(error)
      toast.error('Произошла ошибка при выходе из аккаунта!')
    }
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const handleLinkClick = () => {
    setIsMenuOpen(false)
  }

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link href={href} className="group relative px-1 py-2">
      <span className="relative inline-block">
        {children}
        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#FFB840] group-hover:w-full transition-all duration-300 ease-out group-hover:left-0"></span>
      </span>
    </Link>
  )

  return (
    <>
      <div
        className={`
          flex items-center justify-around w-full p-4 bg-[#FFF0F0] dark:bg-gray-900
          fixed top-0 left-0 right-0 z-50
          transition-transform duration-300 ease-in-out
          ${isVisible ? 'translate-y-0' : '-translate-y-full'}
          shadow-md
        `}
      >
        <img 
          src="/images/logo2.png" 
          alt="Логотип" 
          className="h-9 w-76 hidden md:block dark:hidden" 
        />
        <img 
          src="/images/logo-white.png" 
          alt="Логотип" 
          className="h-9 w-86 hidden md:dark:block" 
        />
        <img src="/images/logo.png" alt="Логотип" className="h-9 aspect-square block md:hidden" />
        
        <div className="hidden md:flex items-center justify-between gap-6">
          <NavLink href="/">Главная</NavLink>
          <NavLink href="/#narodi">Народы России</NavLink>
          <NavLink href="/#map">Карта России</NavLink>
          <NavLink href="/support">Написать нам</NavLink>
          <NavLink href="/forum">Форум</NavLink>
          <NavLink href="/event">События</NavLink>
          
          {user?.id === '1' && (
            <NavLink href="/admin/support">
              <span className="relative">
                Поддержка (админ)
                {Number(user?.unreadSupportCount) > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {user.unreadSupportCount}
                  </span>
                )}
              </span>
            </NavLink>
          )}

          <NavLink href="/my-support">
            <span className="relative">
              Мои обращения
              {Number(user?.unreadSupportCount) > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {user?.unreadSupportCount}
                </span>
              )}
            </span>
          </NavLink>
        </div>

        <ToggleSwitch size="lg" />

        <div className="md:hidden">
          <button
            onClick={toggleMenu}
            className="p-2 text-[#FF7340] hover:bg-[#FFF0F0]/80 dark:hover:bg-gray-800 rounded-full transition-colors"
            aria-label={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
          >
            {isMenuOpen ? <X size={28} className='cursor-pointer hover:opacity-80 duration-150' /> : <Menu size={28} className='cursor-pointer hover:opacity-80 duration-150' />}
          </button>
        </div>

        <div className="hidden md:block">
          {user ? (
            <div className="flex items-center gap-5">
              <Link href={`/profile/${user.id}`}>
                <button className="px-6 py-2 lg:max-w-64 bg-[#FFB840] hover:bg-[#ffb940]/40 border border-[#FF7340] rounded-full cursor-pointer duration-200 flex items-center font-unbounded dark:text-gray-900">
                  <img src="/images/user.svg" alt="" className="w-6 aspect-square" />&nbsp;&nbsp;|&nbsp;&nbsp;{user.firstName}
                </button>
              </Link>
              <button onClick={handleLogOut}>
                <LogOut className="text-[#FF7340] cursor-pointer hover:opacity-80 duration-200" />
              </button>
            </div>
          ) : (
            <div>
              <Link href="/sign-in">
                <button className="px-6 py-2 lg:w-32 bg-[#FFB840] hover:bg-[#ffb940]/40 border border-[#FF7340] rounded-full cursor-pointer duration-200 dark:text-gray-900">
                  Войти
                </button>
              </Link>
            </div>
          )}
        </div>

        {!user && (
          <div className="md:hidden">
            <Link href="/sign-in">
              <button className="px-4 py-1 bg-[#FFB840] hover:bg-[#ffb940]/40 border border-[#FF7340] rounded-full cursor-pointer duration-200 text-sm dark:text-gray-900">
                Войти
              </button>
            </Link>
          </div>
        )}
      </div>

      <div
        className={`
          fixed top-0 left-0 right-0 z-40 bg-[#FFF0F0] dark:bg-gray-900 shadow-lg
          transition-all duration-300 ease-in-out md:hidden
          ${isMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}
          pt-20 pb-6 px-4
        `}
        style={{ top: isVisible ? '80px' : '0' }}
      >
        <div className="flex flex-col space-y-2">
          <Link href="/" onClick={handleLinkClick}>
            <div className="py-3 px-4 hover:bg-[#FFB840]/20 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer">
              Главная
            </div>
          </Link>
          
          <Link href="/#narodi" onClick={handleLinkClick}>
            <div className="py-3 px-4 hover:bg-[#FFB840]/20 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer">
              Народы России
            </div>
          </Link>
          
          <Link href="/#map" onClick={handleLinkClick}>
            <div className="py-3 px-4 hover:bg-[#FFB840]/20 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer">
              Карта России
            </div>
          </Link>
          
          <Link href="/support" onClick={handleLinkClick}>
            <div className="py-3 px-4 hover:bg-[#FFB840]/20 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer">
              Написать нам
            </div>
          </Link>
          
          <Link href="/forum" onClick={handleLinkClick}>
            <div className="py-3 px-4 hover:bg-[#FFB840]/20 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer">
              Форум
            </div>
          </Link>

          <Link href="/event" onClick={handleLinkClick}>
            <div className="py-3 px-4 hover:bg-[#FFB840]/20 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer">
              События
            </div>
          </Link>

          {user?.id === '1' && (
            <Link href="/admin/support" onClick={handleLinkClick}>
              <div className="py-3 px-4 hover:bg-[#FFB840]/20 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer relative">
                Поддержка (админ)
                {Number(user?.unreadSupportCount) > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {user.unreadSupportCount}
                  </span>
                )}
              </div>
            </Link>
          )}

          <Link href="/my-support" onClick={handleLinkClick}>
            <div className="py-3 px-4 hover:bg-[#FFB840]/20 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer relative">
              Мои обращения
              {Number(user?.unreadSupportCount) > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {user?.unreadSupportCount}
                </span>
              )}
            </div>
          </Link>

          <div className="py-2 px-4">
            <ToggleSwitch size="lg" />
          </div>

          {user && (
            <>
              <Link href={`/profile/${user.id}`} onClick={handleLinkClick}>
                <div className="py-3 px-4 hover:bg-[#FFB840]/20 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer flex items-center gap-2">
                  <img src="/images/user.svg" alt="" className="w-5 aspect-square" />
                  <span>Профиль: {user.firstName}</span>
                </div>
              </Link>
              
              <button
                onClick={handleLogOut}
                className="w-full text-left py-3 px-4 hover:bg-[#FFB840]/20 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
              >
                <LogOut size={20} className="text-[#FF7340]" />
                <span>Выйти</span>
              </button>
            </>
          )}
        </div>
      </div>

      {isMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={closeMenu}
        />
      )}
    </>
  )
}

export default Topbar