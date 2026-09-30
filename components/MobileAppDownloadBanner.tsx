"use client";

import Image from "next/image";
import { Download, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";

const DISMISS_KEY = "peoples-treasure-app-banner-dismissed-at";
const DISMISS_DURATION_MS = 14 * 24 * 60 * 60 * 1000;
const ANDROID_APP_URL =
  process.env.NEXT_PUBLIC_ANDROID_APP_URL ||
  "/downloads/sokrovischa-narodov.apk";

function canInstallAndroidApp() {
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) return false;
  return /Android/i.test(navigator.userAgent) || window.innerWidth < 768;
}

export default function MobileAppDownloadBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!canInstallAndroidApp()) return;

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY));
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_DURATION_MS) return;

    const timer = window.setTimeout(() => setIsVisible(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Скачать мобильное приложение"
      className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-[100] mx-auto max-w-md animate-fadeIn rounded-[28px] border border-[#ffb49b]/70 bg-[#fff9f9]/95 p-3 shadow-[0_24px_70px_rgba(30,20,18,0.28)] backdrop-blur-xl dark:border-white/10 dark:bg-[#182033]/95"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Закрыть предложение"
        className="absolute right-2.5 top-2.5 grid size-8 place-items-center rounded-full text-slate-500 transition hover:bg-black/5 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b41] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
      >
        <X className="size-4" aria-hidden="true" />
      </button>

      <div className="flex items-center gap-3 pr-8">
        <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-[#10182a]">
          <Image
            src="/images/logo.png"
            alt=""
            width={48}
            height={48}
            className="size-11 object-contain"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#ff6b41]">
            <Smartphone className="size-3.5" aria-hidden="true" />
            Мобильное приложение
          </div>
          <h2 className="text-base font-extrabold leading-tight text-slate-950 dark:text-white">
            «Сокровища народов» удобнее в приложении
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            Быстрый доступ к народам, форуму, профилю и публикациям.
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <a
          href={ANDROID_APP_URL}
          download
          onClick={dismiss}
          className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#ff6b41] px-4 py-2.5 text-sm font-extrabold text-white shadow-[0_8px_24px_rgba(255,107,65,0.28)] transition hover:bg-[#f45c32] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b41] focus-visible:ring-offset-2"
        >
          <Download className="size-4" aria-hidden="true" />
          Скачать APK
        </a>
        <button
          type="button"
          onClick={dismiss}
          className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b41] dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
        >
          Не сейчас
        </button>
      </div>
    </aside>
  );
}
