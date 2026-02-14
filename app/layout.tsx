import type { Metadata } from "next";
import { Geist, Nunito, Unbounded } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/providers/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const unbounded = Unbounded({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-unbounded',
});

const nunito = Nunito({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-nunito',
});

// Расширенные метаданные для SEO
export const metadata: Metadata = {
  metadataBase: new URL('https://peoples-treasure.vercel.app'),
  title: {
    default: "Сокровища Народов | Исследуй культуру народов России!",
    template: "%s | Сокровища Народов",
  },
  description: "«Сокровища народов» — это просветительский проект, созданный с целью сохранения и популяризации культурного наследия народов России. Наша миссия — показать всё разнообразие и глубину традиций, ремёсел, языков и обычаев, чтобы это богатство стало ближе и понятнее каждому. Мы верим, что настоящие сокровища — это те нити, из которых соткана уникальная ткань нашей общей истории и идентичности. Присоединяйтесь к исследованию!",
  
  // Ключевые слова для поисковых систем
  keywords: [
    "народы России",
    "культура народов России",
    "традиции народов",
    "обычаи народов",
    "этнография России",
    "коренные народы",
    "малые народы",
    "культурное наследие",
    "фольклор народов",
    "национальные костюмы",
    "народные промыслы",
    "история народов",
    "этнические группы",
    "многонациональная Россия",
    "дружба народов",
    "национальная кухня",
    "народные праздники",
    "обряды и традиции",
    "языки народов России",
    "культурное разнообразие",
    "этнокультура",
    "народное творчество",
    "ремесла народов",
    "сказки народов",
    "легенды и мифы",
    "народная музыка",
    "танцы народов",
    "национальные инструменты",
    "этнический туризм",
    "культурный туризм",
    "этнографический музей",
    "культура и искусство",
    "нематериальное наследие",
    "этнографические экспедиции",
    "народные мастера",
    "традиционные технологии",
    "национальные орнаменты",
    "символика народов",
    "этнические мотивы",
    "культурная идентичность",
    "сохранение традиций",
    "возрождение культуры",
    "межнациональные отношения",
    "толерантность",
    "культурный обмен",
    "этнокультурные центры",
    "фестивали народов",
    "выставки культуры",
    "этнопарки",
    "культурное наследие ЮНЕСКО"
  ].join(', '),

  // Open Graph для соцсетей
  openGraph: {
    title: "Сокровища Народов | Культура народов России",
    description: "Погрузитесь в мир традиций, обычаев и культурного наследия народов России. Интерактивная карта, тесты, форум и уникальные материалы.",
    url: "https://peoples-treasure.vercel.app",
    siteName: "Сокровища Народов",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Сокровища Народов - Культура народов России",
      },
    ],
    locale: "ru_RU",
    type: "website",
  },

  // Роботы для поисковиков
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Иконки
  icons: {
    
    shortcut: ['/app/favicon.ico'],
  },

  // Манифест для PWA
  manifest: '/manifest.json',

  // Авторские права
  authors: [{ name: 'Сокровища Народов' }],
  creator: 'Сокровища Народов',
  publisher: 'Сокровища Народов',
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },

  // Категория сайта
  category: 'education',
  
  // Альтернативные языки
  alternates: {
    canonical: 'https://peoples-treasure.vercel.app',
    languages: {
      'ru-RU': 'https://peoples-treasure.vercel.app',
    },
  },

  // Для мобильных устройств
  appleWebApp: {
    capable: true,
    title: 'Сокровища Народов',
    statusBarStyle: 'default',
  },

  // Цвет темы для браузера
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFF0F0' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' },
  ],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
};

// Базовые структурированные данные (без API)
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Сокровища Народов",
  "url": "https://peoples-treasure.vercel.app",
  "description": "Культурное наследие народов России",
  "inLanguage": "ru",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://peoples-treasure.vercel.app/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

const organizationData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Сокровища Народов",
  "url": "https://peoples-treasure.vercel.app",
  "logo": "https://peoples-treasure.vercel.app/app/favicon.ico",
  "sameAs": [
    "https://vk.com/sokrovisha_narodov",
    "https://t.me/sokrovisha_narodov",
    "https://ok.ru/sokrovisha_narodov"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+7-920-545-08-62",
    "contactType": "customer service",
    "areaServed": "RU",
    "availableLanguage": ["Russian"]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        {/* Предзагрузка важных ресурсов */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://peoples-treasure.vercel.app" />
        
        {/* RSS Feed */}
        <link rel="alternate" type="application/rss+xml" title="Сокровища Народов - Новости" href="/rss.xml" />
        
        {/* Yandex Verification (без ключа, просто мета-тег) */}
        <meta name="yandex-verification" content="4e4ae6843d5ef552" />
        
        {/* Google Verification */}
        <meta name="google-site-verification" content="ваш_код_можно_добавить_позже" />
        
        {/* Структурированные данные */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
        />
        
        {/* Дополнительные мета-теги */}
        <meta name="geo.region" content="RU" />
        <meta name="geo.placename" content="Russia" />
        <meta name="geo.position" content="55.755826;37.6173" />
        <meta name="ICBM" content="55.755826, 37.6173" />
        
        {/* Для поисковых систем */}
        <meta name="yandex" content="index, follow" />
        <meta name="google" content="index, follow" />
        <meta name="revisit-after" content="7 days" />
        <meta name="document-state" content="dynamic" />
        <meta name="copyright" content="Сокровища Народов" />
        <meta name="author" content="Сокровища Народов" />
        
        {/* Для мобильных устройств */}
        <meta name="format-detection" content="telephone=yes, address=yes, email=yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Сокровища Народов" />
        
        {/* Для соцсетей */}
        <meta property="og:locale" content="ru_RU" />
        <meta property="og:site_name" content="Сокровища Народов" />
        <meta property="twitter:domain" content="peoples-treasure.vercel.app" />
      </head>
      <body
        className={`
          ${unbounded.variable}
          ${geistSans.variable}
          ${geistSans.className}
          ${nunito.variable}
          antialiased scroll-smooth min-h-screen bg-[#FFF9F9] dark:bg-[#1A1A1A]
          transition-colors duration-300
        `}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}