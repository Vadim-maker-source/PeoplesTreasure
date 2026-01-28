'use client'

import { getCurrentUser, User } from '@/app/lib/api/user'
import { LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'

const Topbar = () => {
  const [user, setUser] = useState<User | null>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  const router = useRouter()
  
  const handleScrollDebounced = () => {
    const currentScrollY = window.scrollY
    
    if (currentScrollY > lastScrollY + 50) {
      setIsVisible(false)
      setLastScrollY(currentScrollY)
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
      }
    } catch (error) {
      console.error(error)
      toast.error('Произошла ошибка при выходе из аккаунта!')
    }
  }

  return (
    <div
      className={`
        flex items-center justify-around w-full p-4 bg-[#FFF0F0]
        fixed top-0 left-0 right-0 z-50
        transition-transform duration-300 ease-in-out
        ${isVisible ? 'translate-y-0' : '-translate-y-full'}
        shadow-md
      `}
    >
      <img src="/images/logo.png" alt="Логотип" className="aspect-square w-12" />
      <div className="flex items-center justify-between gap-8">
        <p className="hover:underline hover:decoraiton-[#FFB840]"><Link href="/">Главная</Link></p>
        <p className="hover:underline hover:decoraiton-[#FFB840]"><Link href="/#narodi">Народы России</Link></p>
        <p className="hover:underline hover:decoraiton-[#FFB840]"><Link href="/#map">Карта России</Link></p>
        <p className="hover:underline hover:decoraiton-[#FFB840]"><Link href="/support">Написать нам</Link></p>
        <p className="hover:underline hover:decoraiton-[#FFB840]"><Link href="/forum">Форум</Link></p>
      </div>

      {user ? (
        <div className="flex items-center gap-5">
          <Link href={`/profile/${user.id}`}>
            <button className="px-6 py-2 lg:w-36 md:28 sm:16 bg-[#FFB840] hover:bg-[#ffb940]/40 border border-[#FF7340] rounded-full cursor-pointer duration-200 flex items-center">
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
            <button className="px-6 py-2 lg:w-32 md:28 sm:16 bg-[#FFB840] hover:bg-[#ffb940]/40 border border-[#FF7340] rounded-full cursor-pointer duration-200">
              Войти
            </button>
          </Link>
        </div>
      )}
    </div>
  )
}

export default Topbar