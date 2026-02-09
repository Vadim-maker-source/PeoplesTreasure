'use client'

import { getCurrentUser, User } from '@/app/lib/api/user'
import { LogOut, Menu, X } from 'lucide-react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'

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

  return (
    <>
      <div
        className={`
          flex items-center justify-around w-full p-4 bg-[#FFF0F0]
          fixed top-0 left-0 right-0 z-50
          transition-transform duration-300 ease-in-out
          ${isVisible ? 'translate-y-0' : '-translate-y-full'}
          shadow-md
        `}
      >
        <img src="/images/logo2.png" alt="Логотип" className="h-9 w-76 hidden md:block" />
        <img src="/images/logo.png" alt="Логотип" className="h-9 aspect-square block md:hidden" />
        
        <div className="hidden md:flex items-center justify-between gap-8">
          <p className="hover:underline hover:decoration-[#FFB840]"><Link href="/">Главная</Link></p>
          <p className="hover:underline hover:decoration-[#FFB840]"><Link href="/#narodi">Народы России</Link></p>
          <p className="hover:underline hover:decoration-[#FFB840]"><Link href="/#map">Карта России</Link></p>
          <p className="hover:underline hover:decoration-[#FFB840]"><Link href="/support">Написать нам</Link></p>
          <p className="hover:underline hover:decoration-[#FFB840]"><Link href="/forum">Форум</Link></p>
          <p className="hover:underline hover:decoration-[#FFB840]"><Link href="/event">События</Link></p>
          {user?.id === '1' && (
    <Link href="/admin/support" className="relative">
        Поддержка (админ)
        {Number(user?.unreadSupportCount) > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {user.unreadSupportCount}
            </span>
        )}
    </Link>
)}

<Link href="/my-support" className="relative">
    Мои обращения
    {Number(user?.unreadSupportCount) > 0 && (
        <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {user?.unreadSupportCount}
        </span>
    )}
</Link>
        </div>

        <div className="md:hidden">
          <button
            onClick={toggleMenu}
            className="p-2 text-[#FF7340] hover:bg-[#FFF0F0]/80 rounded-full transition-colors"
            aria-label={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
          >
            {isMenuOpen ? <X size={28} className='cursor-pointer hover:opacity-80 duration-150' /> : <Menu size={28} className='cursor-pointer hover:opacity-80 duration-150' />}
          </button>
        </div>

        <div className="hidden md:block">
          {user ? (
            <div className="flex items-center gap-5">
              <Link href={`/profile/${user.id}`}>
                <button className="px-6 py-2 lg:max-w-64 bg-[#FFB840] hover:bg-[#ffb940]/40 border border-[#FF7340] rounded-full cursor-pointer duration-200 flex items-center font-unbounded">
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
                <button className="px-6 py-2 lg:w-32 bg-[#FFB840] hover:bg-[#ffb940]/40 border border-[#FF7340] rounded-full cursor-pointer duration-200">
                  Войти
                </button>
              </Link>
            </div>
          )}
        </div>

        {!user && (
          <div className="md:hidden">
            <Link href="/sign-in">
              <button className="px-4 py-1 bg-[#FFB840] hover:bg-[#ffb940]/40 border border-[#FF7340] rounded-full cursor-pointer duration-200 text-sm">
                Войти
              </button>
            </Link>
          </div>
        )}
      </div>

      <div
        className={`
          fixed top-0 left-0 right-0 z-40 bg-[#FFF0F0] shadow-lg
          transition-all duration-300 ease-in-out md:hidden
          ${isMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}
          pt-20 pb-6 px-4
        `}
        style={{ top: isVisible ? '80px' : '0' }}
      >
        <div className="flex flex-col space-y-4">
          <Link href="/" onClick={handleLinkClick}>
            <div className="py-3 px-4 hover:bg-[#FFB840]/20 rounded-lg transition-colors cursor-pointer">
              Главная
            </div>
          </Link>
          
          <Link href="/#narodi" onClick={handleLinkClick}>
            <div className="py-3 px-4 hover:bg-[#FFB840]/20 rounded-lg transition-colors cursor-pointer">
              Народы России
            </div>
          </Link>
          
          <Link href="/#map" onClick={handleLinkClick}>
            <div className="py-3 px-4 hover:bg-[#FFB840]/20 rounded-lg transition-colors cursor-pointer">
              Карта России
            </div>
          </Link>
          
          <Link href="/support" onClick={handleLinkClick}>
            <div className="py-3 px-4 hover:bg-[#FFB840]/20 rounded-lg transition-colors cursor-pointer">
              Написать нам
            </div>
          </Link>
          
          <Link href="/forum" onClick={handleLinkClick}>
            <div className="py-3 px-4 hover:bg-[#FFB840]/20 rounded-lg transition-colors cursor-pointer">
              Форум
            </div>
          </Link>

          <Link href="/event" onClick={handleLinkClick}>
            <div className="py-3 px-4 hover:bg-[#FFB840]/20 rounded-lg transition-colors cursor-pointer">
              События
            </div>
          </Link>

          {user && (
            <>
              <Link href={`/profile/${user.id}`} onClick={handleLinkClick}>
                <div className="py-3 px-4 hover:bg-[#FFB840]/20 rounded-lg transition-colors cursor-pointer flex items-center gap-2">
                  <img src="/images/user.svg" alt="" className="w-5 aspect-square" />
                  <span>Профиль: {user.firstName}</span>
                </div>
              </Link>
              
              <button
                onClick={handleLogOut}
                className="py-3 px-4 hover:bg-[#FFB840]/20 rounded-lg transition-colors cursor-pointer flex items-center gap-2 text-left"
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