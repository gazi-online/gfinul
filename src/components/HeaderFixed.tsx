import React, { useEffect, useState } from 'react'
import type { TabId } from './BottomNav'
import { uiText, type Language } from '../lib/uiText'

const UserCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="h-8 w-8"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
    />
  </svg>
)

const BuildingLibraryIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.8}
    stroke="currentColor"
    className="h-6 w-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z"
    />
  </svg>
)

const MoonIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="h-5 w-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
    />
  </svg>
)

const SunIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="h-5 w-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
    />
  </svg>
)

const CartIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.8}
    stroke="currentColor"
    className="h-6 w-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
    />
  </svg>
)

const HomeNavIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.9}
    stroke="currentColor"
    className="h-4 w-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75"
    />
  </svg>
)

const ServicesNavIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.9}
    stroke="currentColor"
    className="h-4 w-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25A2.25 2.25 0 0 1 8.25 10.5H6A2.25 2.25 0 0 1 3.75 8.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
    />
  </svg>
)

const ProductsNavIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.9}
    stroke="currentColor"
    className="h-4 w-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 6.375V5.25A2.25 2.25 0 0 1 9 3h6a2.25 2.25 0 0 1 2.25 2.25v1.125m-10.5 0h10.5m-10.5 0H5.625A1.875 1.875 0 0 0 3.75 8.25v10.125A2.625 2.625 0 0 0 6.375 21h11.25a2.625 2.625 0 0 0 2.625-2.625V8.25a1.875 1.875 0 0 0-1.875-1.875H17.25"
    />
  </svg>
)

const TrackNavIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.9}
    stroke="currentColor"
    className="h-4 w-4"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
)

const DashboardNavIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.9}
    stroke="currentColor"
    className="h-4 w-4"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
  </svg>
)

const ProfileNavIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.9}
    stroke="currentColor"
    className="h-4 w-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
    />
  </svg>
)

interface NavLink {
  id: TabId
  label: string
  icon: React.FC
}

const NAV_LINKS: NavLink[] = [
  { id: 'home', label: 'Home', icon: HomeNavIcon },
  { id: 'services', label: 'Services', icon: ServicesNavIcon },
  { id: 'products', label: 'Products', icon: ProductsNavIcon },
  { id: 'track', label: 'Track', icon: TrackNavIcon },
  { id: 'dashboard', label: 'Dashboard', icon: DashboardNavIcon },
  { id: 'profile', label: 'Profile', icon: ProfileNavIcon },
]

interface HeaderProps {
  title?: string
  activeTab?: TabId
  onTabChange?: (tab: TabId) => void
  cartCount?: number
  onOpenCart?: () => void
  language: Language
  onLanguageChange: (lang: Language) => void
  notificationCount: number
}

const LANGUAGE_OPTIONS: Language[] = ['en', 'bn']

const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'EN',
  bn: 'BN',
}

const HeaderFixed: React.FC<HeaderProps> = ({
  title = 'Gazi online',
  activeTab = 'home',
  onTabChange,
  cartCount = 0,
  onOpenCart,
  language,
  onLanguageChange,
  notificationCount,
}) => {
  const [isDark, setIsDark] = useState(false)
  const navText = uiText[language].nav

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
      document.documentElement.classList.add('dark')
      setIsDark(true)
      return
    }

    document.documentElement.classList.remove('dark')
    setIsDark(false)
  }, [])

  const toggleDarkMode = () => {
    const doc = document.documentElement

    if (doc.classList.contains('dark')) {
      doc.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      setIsDark(false)
      return
    }

    doc.classList.add('dark')
    localStorage.setItem('theme', 'dark')
    setIsDark(true)
  }

  const handleMobileLanguageChange = () => {
    const currentIndex = LANGUAGE_OPTIONS.indexOf(language)
    const nextLanguage = LANGUAGE_OPTIONS[(currentIndex + 1) % LANGUAGE_OPTIONS.length]
    onLanguageChange(nextLanguage)
  }

  return (
    <header
      id="app-header"
      className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white/95 px-4 transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900/95 lg:px-6"
    >
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-blue-600 dark:text-blue-400">
            <BuildingLibraryIcon />
          </div>
          <h1 className="text-lg font-black tracking-tight text-gray-900 dark:text-white lg:text-xl">{title}</h1>
        </div>

        <div className="flex items-center gap-3 lg:gap-6">
          <nav className="hidden items-center gap-3 lg:flex" aria-label="Main navigation">
            {NAV_LINKS.filter((link) => link.id !== 'profile').map(({ id, icon: Icon }) => (
              <button
                key={id}
                id={`nav-${id}`}
                onClick={() => onTabChange?.(id)}
                className={`
                  group inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-bold transition-all duration-300 active:scale-95
                  ${
                    activeTab === id
                      ? 'border-blue-100 bg-blue-50 text-blue-600 shadow-sm shadow-blue-100/70 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400'
                      : 'border-transparent text-gray-600 hover:-translate-y-0.5 hover:border-blue-100 hover:bg-blue-50/80 hover:text-blue-600 hover:shadow-sm hover:shadow-blue-100/70 dark:text-slate-400 dark:hover:border-blue-500/20 dark:hover:bg-blue-500/10 dark:hover:text-blue-300'
                  }
                `}
              >
                <span
                  className={`transition-transform duration-300 ${
                    activeTab === id ? '' : 'group-hover:-translate-y-0.5 group-hover:scale-110'
                  }`}
                >
                  <Icon />
                </span>
                  <span className="transition-transform duration-300 group-hover:translate-x-0.5">{navText[id]}</span>
                </button>
              ))}
          </nav>

          <div className="flex items-center gap-3 lg:gap-4">
            <button
              onClick={toggleDarkMode}
              className="group rounded-full border border-transparent p-2 text-gray-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-100 hover:bg-amber-50 hover:text-amber-600 hover:shadow-sm hover:shadow-amber-100/70 active:scale-95 dark:text-slate-400 dark:hover:border-amber-400/20 dark:hover:bg-amber-500/10 dark:hover:text-amber-300"
              aria-label="Toggle dark mode"
            >
              <span className="block transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                {isDark ? <SunIcon /> : <MoonIcon />}
              </span>
            </button>

            <div className="hidden items-center rounded-xl border border-gray-100 bg-gray-50 p-1 transition-all duration-300 hover:border-blue-100 hover:bg-blue-50/80 hover:shadow-sm hover:shadow-blue-100/60 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-500/20 dark:hover:bg-blue-500/10 lg:flex">
              {LANGUAGE_OPTIONS.map((lang) => (
                <button
                  key={lang}
                  onClick={() => onLanguageChange(lang)}
                  className={`rounded-lg px-2 py-1 text-[10px] font-black transition-all duration-300 active:scale-95 ${
                    language === lang
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-500 hover:bg-white/80 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-blue-300'
                  }`}
                >
                  {LANGUAGE_LABELS[lang]}
                </button>
              ))}
            </div>

            <button
              onClick={handleMobileLanguageChange}
              aria-label={`Change language, current ${LANGUAGE_LABELS[language]}`}
              className="rounded-xl border border-gray-100 bg-gray-50 px-2.5 py-2 text-[10px] font-black tracking-[0.2em] text-gray-600 transition-all duration-300 hover:border-blue-100 hover:bg-blue-50/80 hover:text-blue-600 hover:shadow-sm hover:shadow-blue-100/60 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-500/20 dark:hover:bg-blue-500/10 dark:hover:text-blue-300 lg:hidden"
            >
              {LANGUAGE_LABELS[language]}
            </button>

            <button
              onClick={() => onOpenCart?.()}
              aria-label="Cart"
              className="group relative rounded-full border border-transparent p-1.5 text-gray-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-100 hover:bg-emerald-50 hover:text-emerald-600 hover:shadow-sm hover:shadow-emerald-100/70 active:scale-95 dark:text-slate-400 dark:hover:border-emerald-400/20 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300 lg:p-2"
            >
              <span className="block transition-transform duration-300 group-hover:scale-110 group-hover:translate-x-0.5">
                <CartIcon />
              </span>
              {cartCount > 0 && (
                <span className="absolute right-0 top-0 inline-flex h-4 w-4 items-center justify-center rounded-full border border-white bg-rose-500 text-[10px] font-bold text-white dark:border-slate-900">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange?.('profile')}
              aria-label="Profile"
              className={`
                group rounded-full border-2 p-1 transition-all duration-300 active:scale-95
                ${
                  activeTab === 'profile'
                    ? 'border-blue-600 bg-blue-50 shadow-sm shadow-blue-100/70 dark:bg-blue-900/20'
                    : 'border-transparent bg-gray-50 hover:-translate-y-0.5 hover:border-blue-100 hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm hover:shadow-blue-100/70 dark:bg-slate-800 dark:hover:border-blue-500/20 dark:hover:bg-blue-500/10 dark:hover:text-blue-300'
                }
              `}
            >
              <div className="scale-75 text-gray-600 transition-transform duration-300 group-hover:scale-[0.82] dark:text-slate-400">
                <UserCircleIcon />
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default HeaderFixed
