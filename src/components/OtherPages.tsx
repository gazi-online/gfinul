import React, { useState, useEffect } from 'react'
import { type Product, type ServiceItem, type Order, type ServiceRequest } from '../lib/types'
import { type User } from '@supabase/supabase-js'
import { useTranslation } from 'react-i18next'
import { formatServiceRequestReference, matchesServiceRequestReference } from '../lib/references'
import { formatLocalizedDate, type Language } from '../lib/i18n'
import { getServiceDisplayDescription, getServiceDisplayName, getServiceKind } from '../lib/serviceDisplay'
import { ProductCard, SkeletonProductCard } from './HomeSections'
import { authApi } from '../api/auth'
import {
  BadgeIndianRupee,
  Barcode,
  BookText,
  Bot,
  BriefcaseBusiness,
  Calculator,
  CalendarDays,
  Camera,
  ClipboardList,
  Cloud,
  CreditCard,
  Crop,
  FileImage,
  FileScan,
  FileSpreadsheet,
  FileText,
  FileType,
  Globe,
  GraduationCap,
  Images,
  Keyboard,
  Languages,
  PenTool,
  Printer,
  QrCode,
  ScanLine,
  ScanText,
  ShieldCheck,
  Signature,
  Sparkles,
  Stamp,
  Ticket,
  TicketCheck,
  Tickets,
  UserRound,
  WandSparkles,
} from 'lucide-react'

// ── Icons ────────────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
)

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

// ══════════════════════════════════════════════════════════════════════════════
// ▸ SERVICES PAGE UI (Civic Atelier Refined)
// ══════════════════════════════════════════════════════════════════════════════

// Icon helper for Services
const getServiceIcon = (name: string) => {
  const serviceKind = getServiceKind(name)

  if (serviceKind === 'google_play_redeem_codes') {
    return {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h9a2.25 2.25 0 0 1 2.25 2.25v4.5a2.25 2.25 0 0 1-2.25 2.25h-9A2.25 2.25 0 0 1 5.25 14.25v-4.5A2.25 2.25 0 0 1 7.5 7.5Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h.01M15 12h.01M12 9.75v4.5" />
        </svg>
      ),
      bg: 'bg-emerald-50 dark:bg-emerald-900/40',
      color: 'text-emerald-600 dark:text-emerald-400',
    }
  }

  if (serviceKind === 'pvc_card_order') {
    return {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
          <rect x="3.75" y="6.25" width="16.5" height="11.5" rx="2.25" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 10.25h9M7.5 14h4.5" />
        </svg>
      ),
      bg: 'bg-sky-50 dark:bg-sky-900/40',
      color: 'text-sky-600 dark:text-sky-400',
    }
  }

  const icons: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
    'Apply PAN': {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
        </svg>
      ),
      bg: 'bg-blue-50 dark:bg-blue-900/40',
      color: 'text-blue-600 dark:text-blue-400',
    },
    'Aadhaar Update': {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0 1 19.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 0 0 4.5 10.5a7.464 7.464 0 0 1-1.15 3.993m1.989 3.559A11.209 11.209 0 0 0 8.25 10.5a3.75 3.75 0 1 1 7.5 0c0 .527-.021 1.048-.064 1.562m-6.729 4.909c-.147.394-.232.818-.232 1.267a3.413 3.413 0 0 0 .652 2.014m11.75-8.834a21.372 21.372 0 0 0-4.903-4.662m-11.202 11.39a12.955 12.955 0 0 1-1.154-1.154m5.244-11.243a10.546 10.546 0 0 1 10.513 10.523M16.5 20.25h1.5m-1.5-3v-1.5" />
        </svg>
      ),
      bg: 'bg-emerald-50 dark:bg-emerald-900/40',
      color: 'text-emerald-600 dark:text-emerald-400',
    },
    'Aadhaar': {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0 1 19.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 0 0 4.5 10.5a7.464 7.464 0 0 1-1.15 3.993m1.989 3.559A11.209 11.209 0 0 0 8.25 10.5a3.75 3.75 0 1 1 7.5 0c0 .527-.021 1.048-.064 1.562m-6.729 4.909c-.147.394-.232.818-.232 1.267a3.413 3.413 0 0 0 .652 2.014m11.75-8.834a21.372 21.372 0 0 0-4.903-4.662m-11.202 11.39a12.955 12.955 0 0 1-1.154-1.154m5.244-11.243a10.546 10.546 0 0 1 10.513 10.523M16.5 20.25h1.5m-1.5-3v-1.5" />
        </svg>
      ),
      bg: 'bg-emerald-50 dark:bg-emerald-900/40',
      color: 'text-emerald-600 dark:text-emerald-400',
    },
    'Income Cert.': {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 6.75A2.25 2.25 0 0 1 7.25 4.5h7l4.75 4.75v8.5A2.25 2.25 0 0 1 16.75 20H7.25A2.25 2.25 0 0 1 5 17.75V6.75Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 4.75v4.5h4.5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.2 15.8h7.6M8.2 12.3h4.6" />
        </svg>
      ),
      bg: 'bg-sky-50 dark:bg-sky-900/40',
      color: 'text-sky-600 dark:text-sky-400',
    },
    // Default
  }
  return icons[name] || {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
    bg: 'bg-indigo-50 dark:bg-indigo-900/40',
    color: 'text-indigo-600 dark:text-indigo-400',
  }
}

const CATEGORIES = ['all', 'government', 'finance', 'utility'] as const

// ── Components ───────────────────────────────────────────────────────────────

const CategoryFilter: React.FC<{ active: string; onSelect: (cat: string) => void }> = ({ active, onSelect }) => {
  const { t } = useTranslation()

  return (
  <div className="flex flex-wrap gap-3 mb-8">
    {CATEGORIES.map((cat) => (
      <button
        key={cat}
        onClick={() => onSelect(cat)}
        className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-200 tap-scale ${
          active === cat
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
            : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
        }`}
      >
        {t(`categories.${cat}`)}
      </button>
    ))}
  </div>
)}

const ServiceCard: React.FC<ServiceItem & { delay: number; onStartService?: (name: string, desc: string) => void }> = ({ 
  id, name, description, actionLabel, delay, onStartService
}) => {
  const { t } = useTranslation()
  const { icon, bg, color } = getServiceIcon(name);
  const displayName = getServiceDisplayName(name)
  const displayDescription = getServiceDisplayDescription(name, description)
  return (
    <div 
      className="bg-white dark:bg-slate-800 rounded-[12px] p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-slate-700/50 hover:shadow-md transition-all duration-300 animate-slide-up flex flex-col md:flex-row items-start md:items-center gap-4 lg:gap-6 mb-4 active:scale-[0.98]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`${bg} ${color} w-12 h-12 lg:w-16 lg:h-16 rounded-[12px] flex items-center justify-center shrink-0`}>
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-base lg:text-lg font-black text-gray-900 dark:text-white leading-tight mb-1">
          {displayName}
        </h3>
        <p className="text-xs lg:text-sm text-gray-600 dark:text-slate-400 leading-relaxed max-w-[500px]">
          {displayDescription}
        </p>
      </div>

      <button
        onClick={() => onStartService?.(name, displayDescription)}
        className="w-full md:w-auto px-6 py-2 rounded-[8px] text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 shadow-sm transition-all duration-200 tap-scale"
      >
        {actionLabel || t('services.applyNow')}
      </button>
    </div>
  )
}

const SkeletonServiceCard: React.FC = () => (
  <div className="bg-white dark:bg-slate-800 rounded-[12px] p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-slate-700/50 animate-pulse flex flex-col md:flex-row items-start md:items-center gap-4 lg:gap-6 mb-4">
    <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-[12px] bg-gray-200 dark:bg-slate-700 shrink-0" />
    <div className="flex-1 w-full">
      <div className="h-5 lg:h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/3 mb-2" />
      <div className="h-3 lg:h-4 bg-gray-200 dark:bg-slate-700 rounded w-2/3" />
    </div>
    <div className="w-full md:w-24 h-9 bg-gray-200 dark:bg-slate-700 rounded-[8px]" />
  </div>
)

export const ServicesPage: React.FC<{ 
  onStartService?: (name: string, desc: string) => void;
  services: ServiceItem[];
  isLoading?: boolean;
}> = ({ onStartService, services, isLoading = false }) => {
  const { t } = useTranslation()
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = services.filter(svc => {
    const displayName = getServiceDisplayName(svc.name).toLowerCase()
    const displayDescription = getServiceDisplayDescription(svc.name, svc.description).toLowerCase()
    // Note: Database schema might need 'category' column for this to work perfectly.
    // For now, filtering only by search.
    return svc.name.toLowerCase().includes(search.toLowerCase()) || 
           displayName.includes(search.toLowerCase()) ||
           displayDescription.includes(search.toLowerCase())
  })

  return (
    <div className="px-5 py-6 lg:px-12 lg:py-10 min-h-screen bg-[#F9FAFB] dark:bg-slate-900/20">
      <div className="max-w-5xl mx-auto">
        {/* Search Bar */}
        <div className="relative mb-6">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder={t('services.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#EBF0FF] dark:bg-slate-800 border-none rounded-2xl py-4 pl-12 pr-6 text-sm lg:text-base text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/50 transition-all outline-none shadow-inner"
          />
        </div>

        {/* Categories */}
        <CategoryFilter active={activeCategory} onSelect={setActiveCategory} />

        {/* Section Title */}
        <p className="text-[10px] lg:text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-[2px] mb-4">
          {t('services.popularServices')}
        </p>

        {/* List */}
        <div className="flex flex-col">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonServiceCard key={i} />)
          ) : filtered.length > 0 ? (
            filtered.map((svc, i) => (
              <ServiceCard key={svc.id} {...svc} delay={i * 50} onStartService={onStartService} />
            ))
          ) : (
            <div className="text-center py-20">
              <p className="text-4xl mb-4">🔍</p>
              <p className="text-lg font-bold text-gray-400 dark:text-slate-500">{t('services.noServicesFound')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// ▸ TRACK PAGE
// ══════════════════════════════════════════════════════════════════════════════

export const ProductsPage: React.FC<{
  products: Product[]
  isLoading?: boolean
  onAddToCart?: (product: Omit<Product, 'category'>) => void
  onViewProduct?: (product: Product) => void
}> = ({ products, isLoading = false, onAddToCart, onViewProduct }) => {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')

  const filteredProducts = products.filter((product) => {
    const searchValue = search.toLowerCase()
    return product.name.toLowerCase().includes(searchValue) || (product.category ?? '').toLowerCase().includes(searchValue)
  })

  return (
    <div className="px-5 py-6 lg:px-12 lg:py-10 min-h-screen bg-[#F9FAFB] dark:bg-slate-900/20">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 lg:mb-8">
          <p className="text-[10px] lg:text-xs font-black uppercase tracking-[0.18em] text-gray-400 dark:text-slate-500">{t('products.category')}</p>
          <h2 className="mt-2 text-2xl lg:text-4xl font-black text-gray-900 dark:text-white">{t('products.catalogTitle')}</h2>
          <p className="mt-2 max-w-2xl text-sm lg:text-base text-gray-500 dark:text-slate-400">{t('products.catalogDescription')}</p>
        </div>

        <div className="relative mb-6 lg:mb-8">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder={t('products.searchPlaceholder')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-white py-4 pl-12 pr-6 text-sm lg:text-base text-gray-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => <SkeletonProductCard key={index} />)}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} {...product} onAddToCart={onAddToCart} onViewProduct={onViewProduct} />
            ))}
          </div>
        ) : (
          <div className="rounded-[28px] border border-dashed border-gray-200 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-lg font-black text-gray-900 dark:text-white">{t('products.noProductsFound')}</p>
            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">{t('products.noProductsDescription')}</p>
          </div>
        )}
      </div>
    </div>
  )
}

type TrackStatus = 'Completed' | 'Processing' | 'Pending' | 'Rejected'

const trackStatusStyles: Record<TrackStatus, { bg: string; text: string }> = {
  Completed:  { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400' },
  Processing: { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-400' },
  Pending:    { bg: 'bg-gray-100 dark:bg-slate-800', text: 'text-gray-500 dark:text-slate-400' },
  Rejected:   { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-400' },
}

interface TrackPageProps {
  requests: ServiceRequest[]
  isLoading?: boolean
  isRefreshing?: boolean
  isSignedIn?: boolean
  lastUpdatedAt?: string | null
  onRefresh?: () => void
}

export const TrackPage: React.FC<TrackPageProps> = ({
  requests,
  isLoading = false,
  isRefreshing = false,
  isSignedIn = false,
  lastUpdatedAt = null,
  onRefresh,
}) => {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const normalizedSearch = search.trim().toLowerCase()
  const hasGuestRequests = !isSignedIn && requests.some((request) => request.guest)

  const filtered = requests.filter((request) =>
    getServiceDisplayName(request.services?.name).toLowerCase().includes(normalizedSearch) ||
    matchesServiceRequestReference(request.id, search)
  )

  const summaryCards = [
    { value: requests.length, label: t('profile.applications'), color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { value: requests.filter((request) => request.status === 'completed').length, label: t('status.completed'), color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { value: requests.filter((request) => request.status === 'processing').length, label: t('status.processing'), color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { value: requests.filter((request) => request.status === 'pending').length, label: t('status.pending'), color: 'text-gray-600 dark:text-slate-400', bg: 'bg-gray-50 dark:bg-slate-800' },
  ]

  const lastUpdatedLabel = lastUpdatedAt
    ? formatLocalizedDate(lastUpdatedAt)
    : t('common.loading')

  return (
    <div className="px-4 py-6 lg:px-12 lg:py-10 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="mb-2 text-2xl font-black text-gray-900 dark:text-white lg:text-4xl">{t('nav.track')}</h2>
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400 lg:text-base">{t('profile.help.faq.trackAnswer')}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {(isSignedIn || hasGuestRequests) ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-left shadow-sm dark:border-emerald-900/40 dark:bg-emerald-900/10">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">{t('status.processing')}</p>
                <p className="mt-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  {isSignedIn
                    ? t('common.updated', { date: lastUpdatedLabel })
                    : t('profile.signInUnlockDescription')}
                </p>
              </div>
            ) : null}

            {isSignedIn && onRefresh ? (
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition-all hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-500/40 dark:hover:text-blue-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                </svg>
                {isRefreshing ? t('common.loading') : t('common.refresh')}
              </button>
            ) : null}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder={t('common.search')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-2xl border border-gray-100 bg-white py-4 pl-12 pr-6 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        {/* Summary Stats */}
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {summaryCards.map(({ value, label, color, bg }) => (
            <div key={label} className={`${bg} rounded-2xl p-4 text-center lg:p-5`}>
              <p className={`text-2xl font-black lg:text-3xl ${color}`}>{value}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 lg:text-xs">{label}</p>
            </div>
          ))}
        </div>
        {hasGuestRequests ? (
          <div className="mb-8 rounded-[24px] border border-amber-100 bg-amber-50/80 px-5 py-4 text-sm font-medium text-amber-800 shadow-sm dark:border-amber-900/30 dark:bg-amber-500/10 dark:text-amber-200">
            {t('profile.signInUnlockDescription')}
          </div>
        ) : !isSignedIn ? (
          <div className="mb-8 rounded-[24px] border border-blue-100 bg-blue-50/80 px-5 py-4 text-sm font-medium text-blue-800 shadow-sm dark:border-blue-900/30 dark:bg-blue-500/10 dark:text-blue-200">
            {t('trackPage.publicHint')}
          </div>
        ) : null}

        {/* Track Entries */}
        <div className="flex flex-col gap-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700/50 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-slate-700" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/4" />
                  </div>
                  <div className="w-20 h-6 bg-gray-200 dark:bg-slate-700 rounded-full" />
                </div>
              </div>
            ))
          ) : filtered.length > 0 ? (
            filtered.map((req, i) => {
              const statusMap: Record<string, TrackStatus> = {
                'completed': 'Completed',
                'processing': 'Processing',
                'pending': 'Pending',
                'rejected': 'Rejected'
              }
              const displayStatus = statusMap[req.status] || 'Pending'
              const style = trackStatusStyles[displayStatus]
              const progress = req.status === 'completed' ? 100 : req.status === 'processing' ? 60 : 20
              return (
                <div
                  key={req.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100 dark:border-slate-700/50 hover:shadow-lg transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm lg:text-base font-bold text-gray-900 dark:text-white">{getServiceDisplayName(req.services?.name) || t('nav.services')}</h3>
                        {req.guest ? (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                            {t('common.guest')}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">#{req.id.slice(0, 8)} · {formatLocalizedDate(req.created_at)}</p>
                    </div>
                    <span className={`text-[10px] lg:text-xs font-black px-3 py-1 rounded-full uppercase tracking-tighter ${style.bg} ${style.text}`}>
                      {t(`status.${displayStatus.toLowerCase()}`)}
                    </span>
                  </div>
                  {req.status !== 'rejected' && (
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${progress}%`,
                          background: req.status === 'completed'
                            ? 'linear-gradient(90deg, #10b981, #34d399)'
                            : req.status === 'processing'
                            ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                            : 'linear-gradient(90deg, #94a3b8, #cbd5e1)',
                        }}
                      />
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">🔍</p>
              <p className="font-bold text-gray-400 dark:text-slate-500">{t('trackPage.emptyTitle')}</p>
              <p className="mt-2 text-sm font-medium text-gray-500 dark:text-slate-400">{t('trackPage.emptyMessage')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// ▸ PROFILE PAGE
// ══════════════════════════════════════════════════════════════════════════════

type TollAccent = 'blue' | 'emerald' | 'amber' | 'violet' | 'rose' | 'cyan' | 'slate' | 'indigo'

type TollTool = {
  name: string
  icon: React.ComponentType<any>
  accent: TollAccent
}

const TOOL_CARD_COLORS: Record<TollAccent, string> = {
  blue: '#2563eb',
  emerald: '#059669',
  amber: '#d97706',
  violet: '#7c3aed',
  rose: '#e11d48',
  cyan: '#0891b2',
  slate: '#475569',
  indigo: '#4f46e5',
}

export const TollPage: React.FC = () => {
  const { t } = useTranslation()
  const [toolSearch, setToolSearch] = useState('')
  const [isToolsLoading, setIsToolsLoading] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => setIsToolsLoading(false), 450)
    return () => window.clearTimeout(timer)
  }, [])

  const getToolKind = (tool: string) => {
    const normalized = tool.toLowerCase()

    if (normalized.includes('pdf') || normalized.includes('document') || normalized.includes('scan')) return 'document'
    if (normalized.includes('photo') || normalized.includes('image') || normalized.includes('crop') || normalized.includes('enhancer')) return 'photo'
    if (normalized.includes('sign') || normalized.includes('signature')) return 'signature'
    if (normalized.includes('qr') || normalized.includes('barcode')) return 'scan'
    if (normalized.includes('cv') || normalized.includes('letter') || normalized.includes('writer') || normalized.includes('typing') || normalized.includes('biodata') || normalized.includes('notice')) return 'writing'
    if (normalized.includes('card') || normalized.includes('sheet') || normalized.includes('memo') || normalized.includes('leaflet') || normalized.includes('routine')) return 'layout'
    if (normalized.includes('translator') || normalized.includes('converter') || normalized.includes('calculator') || normalized.includes('calendar') || normalized.includes('date')) return 'utility'
    if (normalized.includes('ticket') || normalized.includes('visa') || normalized.includes('result') || normalized.includes('services apply') || normalized.includes('job circular')) return 'service'
    if (normalized.includes('cloud') || normalized.includes('ai')) return 'smart'
    return 'tool'
  }

  const getToolIcon = (tool: string): React.ComponentType<any> => {
    const byName: Record<string, React.ComponentType<any>> = {
      'ID Card Crop to PDF': FileScan,
      'Passport Crop to PDF': FileText,
      'NID Front-Back Joiner': CreditCard,
      'Image to PDF': FileImage,
      'PDF to Image': Images,
      'Image to Text': ScanText,
      'Multi-Image to PDF': Images,
      'PDF Merge & Split': FileText,
      'A4 Document Scan': FileScan,
      'Stamp or Document Writer': Stamp,
      'Teletalk Photo & Sig Resizer': Crop,
      'Date Converter (EN-BN-AR)': CalendarDays,
      'Date to Words (BN-EN)': BookText,
      'AI Passport Photo Maker': WandSparkles,
      'Passport Photo Maker': Camera,
      'Studio Photo Print Layout': Printer,
      'Photo Print Layout': Printer,
      'Joint Photo Maker': Images,
      'Advance Image Crop': Crop,
      'Image Enhancer': Sparkles,
      'Image Compressor & KB Limiter': FileImage,
      'Photo Name & Date Adder': CalendarDays,
      'Visa Photo Cropper': Crop,
      'iPhone Image Converter': FileType,
      'Image Converter': FileType,
      'Bangla Sign Maker': Signature,
      'Digital Signature Pad': PenTool,
      'Signature BG Remover': Signature,
      'Image BG Remover': WandSparkles,
      'QR & Barcode Scanner': ScanLine,
      'Barcode Generator': Barcode,
      'QR Code Generator': QrCode,
      'Professional CV Maker': BriefcaseBusiness,
      'Job & Cover Letter Writing': FileText,
      'Biodata Maker': UserRound,
      'Affidavit Writer': ShieldCheck,
      'Agreement Letter Writing': ClipboardList,
      'Police GD Writing': ShieldCheck,
      'Ready Notice Maker': FileType,
      'A4 Page Typing': Keyboard,
      'Exam Question Maker': GraduationCap,
      'Property Distribution': Calculator,
      'Wedding Memento Card Maker': Sparkles,
      'Visiting Card Maker': CreditCard,
      'Student ID Card Maker': UserRound,
      'Leaflet Maker': BookText,
      'Cash Memo Maker': FileSpreadsheet,
      'Excel Table Sheet': FileSpreadsheet,
      'Salary Sheet Maker': BadgeIndianRupee,
      'Class Routine Maker': CalendarDays,
      'OMR Sheet Generator': ClipboardList,
      'Eid Card Design': Sparkles,
      'Photoshop Shortcuts': Keyboard,
      'USD to BDT Converter': BadgeIndianRupee,
      'Age Calculator': Calculator,
      'Bangla to Banglish': Languages,
      'English to Bengali Phonetic': Languages,
      'EN/BN Text Translator': Globe,
      'Height & Weight Converter': Calculator,
      'Land Area Calculator': Calculator,
      'Photocopy Cost Calculator': Calculator,
      'Bengali Calendar': CalendarDays,
      'Exam Result Check BD': GraduationCap,
      'Job Circular Finder BD': BriefcaseBusiness,
      'Online Services Apply BD': Globe,
      'Airline Ticket Check': TicketCheck,
      'Online Visa Check': ShieldCheck,
      'Travel Ticket Booking': Tickets,
      'Fuel Application Form': FileText,
      'Family Card Form': UserRound,
      'Studio Cloud File Database': Cloud,
      'AI Editing Prompt Hub': Bot,
    }

    if (byName[tool]) return byName[tool]

    const kind = getToolKind(tool)

    if (kind === 'document') return FileText
    if (kind === 'photo') return Camera
    if (kind === 'signature') return Signature
    if (kind === 'scan') return ScanLine
    if (kind === 'writing') return FileText
    if (kind === 'layout') return ClipboardList
    if (kind === 'utility') return Calculator
    if (kind === 'service') return Ticket
    if (kind === 'smart') return Bot

    return FileText
  }

  const getToolAccent = (tool: string): TollAccent => {
    const normalized = tool.toLowerCase()

    if (normalized.includes('ai') || normalized.includes('enhancer') || normalized.includes('bg remover')) return 'amber'
    if (normalized.includes('signature') || normalized.includes('writer') || normalized.includes('cv') || normalized.includes('notice')) return 'violet'
    if (normalized.includes('ticket') || normalized.includes('visa') || normalized.includes('result') || normalized.includes('job circular')) return 'slate'
    if (normalized.includes('card') || normalized.includes('memo') || normalized.includes('sheet') || normalized.includes('leaflet')) return 'rose'
    if (normalized.includes('calendar') || normalized.includes('translator') || normalized.includes('converter') || normalized.includes('calculator') || normalized.includes('date')) return 'cyan'
    if (normalized.includes('cloud') || normalized.includes('prompt')) return 'indigo'
    if (normalized.includes('photo') || normalized.includes('image') || normalized.includes('crop')) return 'emerald'
    return 'blue'
  }

  const categories = [
    {
      title: 'ID, PDF & Document Prep',
      description: 'Crop, merge, convert, scan, and export print-ready files for everyday document work.',
      tone: 'border-blue-100 bg-blue-50/70 dark:border-blue-500/20 dark:bg-blue-500/10',
      iconWrap: 'bg-blue-600 text-white shadow-lg shadow-blue-500/20',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75h6.19a2.25 2.25 0 0 1 1.59.66l3.31 3.31a2.25 2.25 0 0 1 .66 1.59v8.94a2.25 2.25 0 0 1-2.25 2.25H7.5a2.25 2.25 0 0 1-2.25-2.25V6a2.25 2.25 0 0 1 2.25-2.25Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.75h6M9 13.5h6M9 17.25h3.75" />
        </svg>
      ),
      tools: [
        'ID Card Crop to PDF',
        'Passport Crop to PDF',
        'NID Front-Back Joiner',
        'Image to PDF',
        'PDF to Image',
        'Image to Text',
        'Multi-Image to PDF',
        'PDF Merge & Split',
        'A4 Document Scan',
        'Stamp or Document Writer',
        'Teletalk Photo & Sig Resizer',
        'Date Converter (EN-BN-AR)',
        'Date to Words (BN-EN)',
      ],
    },
    {
      title: 'Photo Studio & Print',
      description: 'Everything needed for passport photos, print layouts, image cleanup, and media export.',
      tone: 'border-emerald-100 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/10',
      iconWrap: 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 7.5A2.25 2.25 0 0 1 6 5.25h2.11c.597 0 1.17-.237 1.592-.658l.546-.547A2.25 2.25 0 0 1 11.84 3.5h.32a2.25 2.25 0 0 1 1.591.659l.547.546c.422.422.994.659 1.591.659H18A2.25 2.25 0 0 1 20.25 7.5v9A2.25 2.25 0 0 1 18 18.75H6A2.25 2.25 0 0 1 3.75 16.5v-9Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
        </svg>
      ),
      tools: [
        'AI Passport Photo Maker',
        'Passport Photo Maker',
        'Studio Photo Print Layout',
        'Photo Print Layout',
        'Joint Photo Maker',
        'Advance Image Crop',
        'Image Enhancer',
        'Image Compressor & KB Limiter',
        'Photo Name & Date Adder',
        'Visa Photo Cropper',
        'iPhone Image Converter',
        'Image Converter',
      ],
    },
    {
      title: 'Background, Sign & Scan',
      description: 'Signature, background removal, and barcode-ready utilities for fast studio delivery.',
      tone: 'border-amber-100 bg-amber-50/70 dark:border-amber-500/20 dark:bg-amber-500/10',
      iconWrap: 'bg-amber-500 text-white shadow-lg shadow-amber-500/20',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 7.5h16.5M6 5.25v13.5M10.5 10.5v5.25M15 10.5v5.25M18 5.25v13.5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15.75h7.5" />
        </svg>
      ),
      tools: [
        'Bangla Sign Maker',
        'Digital Signature Pad',
        'Signature BG Remover',
        'Image BG Remover',
        'QR & Barcode Scanner',
        'Barcode Generator',
        'QR Code Generator',
      ],
    },
    {
      title: 'Writing, CV & Legal',
      description: 'Generate resumes, letters, notices, and legal drafting support from one organized section.',
      tone: 'border-violet-100 bg-violet-50/70 dark:border-violet-500/20 dark:bg-violet-500/10',
      iconWrap: 'bg-violet-600 text-white shadow-lg shadow-violet-500/20',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.25 2.25 0 1 1 3.182 3.182L8.25 19.463 4.5 20.25l.787-3.75L16.862 4.487Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 7.5 16.5 10.5" />
        </svg>
      ),
      tools: [
        'Professional CV Maker',
        'Job & Cover Letter Writing',
        'Biodata Maker',
        'Affidavit Writer',
        'Agreement Letter Writing',
        'Police GD Writing',
        'Ready Notice Maker',
        'A4 Page Typing',
        'Exam Question Maker',
        'Property Distribution',
      ],
    },
    {
      title: 'Design, Print & Business Tools',
      description: 'Studio-friendly business assets and printable formats for branding, IDs, and daily shop output.',
      tone: 'border-rose-100 bg-rose-50/70 dark:border-rose-500/20 dark:bg-rose-500/10',
      iconWrap: 'bg-rose-500 text-white shadow-lg shadow-rose-500/20',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75A2.25 2.25 0 0 1 6.75 4.5h10.5a2.25 2.25 0 0 1 2.25 2.25v10.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 17.25V6.75Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9h7.5M8.25 12h7.5M8.25 15h4.5" />
        </svg>
      ),
      tools: [
        'Wedding Memento Card Maker',
        'Visiting Card Maker',
        'Student ID Card Maker',
        'Leaflet Maker',
        'Cash Memo Maker',
        'Excel Table Sheet',
        'Salary Sheet Maker',
        'Class Routine Maker',
        'OMR Sheet Generator',
        'Eid Card Design',
        'Photoshop Shortcuts',
      ],
    },
    {
      title: 'Language, Date & Calculators',
      description: 'Useful translators, converters, and shop calculators for daily counter work.',
      tone: 'border-cyan-100 bg-cyan-50/70 dark:border-cyan-500/20 dark:bg-cyan-500/10',
      iconWrap: 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M7.5 6.75h9M6 12h12M7.5 17.25h9" />
        </svg>
      ),
      tools: [
        'USD to BDT Converter',
        'Age Calculator',
        'Bangla to Banglish',
        'English to Bengali Phonetic',
        'EN/BN Text Translator',
        'Height & Weight Converter',
        'Land Area Calculator',
        'Photocopy Cost Calculator',
        'Bengali Calendar',
      ],
    },
    {
      title: 'Checks, Tickets & Online Services',
      description: 'Travel, exam, visa, and online service tools grouped together for faster access.',
      tone: 'border-slate-200 bg-slate-50/80 dark:border-slate-600 dark:bg-slate-800/70',
      iconWrap: 'bg-slate-800 text-white shadow-lg shadow-slate-500/20 dark:bg-slate-200 dark:text-slate-900',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 8.25A2.25 2.25 0 0 1 6 6h12a2.25 2.25 0 0 1 2.25 2.25v7.5A2.25 2.25 0 0 1 18 18H6a2.25 2.25 0 0 1-2.25-2.25v-7.5Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9.75h7.5M8.25 14.25h4.5" />
        </svg>
      ),
      tools: [
        'Exam Result Check BD',
        'Job Circular Finder BD',
        'Online Services Apply BD',
        'Airline Ticket Check',
        'Online Visa Check',
        'Travel Ticket Booking',
        'Fuel Application Form',
        'Family Card Form',
      ],
    },
    {
      title: 'Studio Hub & Smart Utilities',
      description: 'High-value extras from the reference board for smarter studio operations.',
      tone: 'border-indigo-100 bg-indigo-50/70 dark:border-indigo-500/20 dark:bg-indigo-500/10',
      iconWrap: 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 8.25A2.25 2.25 0 0 1 9 6h1.5A2.25 2.25 0 0 1 12.75 8.25v1.5A2.25 2.25 0 0 1 10.5 12h-1.5a2.25 2.25 0 0 1-2.25-2.25v-1.5ZM11.25 14.25A2.25 2.25 0 0 1 13.5 12h1.5a2.25 2.25 0 0 1 2.25 2.25v1.5A2.25 2.25 0 0 1 15 18h-1.5a2.25 2.25 0 0 1-2.25-2.25v-1.5ZM15.75 8.25A2.25 2.25 0 0 1 18 6h.75A2.25 2.25 0 0 1 21 8.25V9a2.25 2.25 0 0 1-2.25 2.25H18A2.25 2.25 0 0 1 15.75 9V8.25ZM3 15.75A2.25 2.25 0 0 1 5.25 13.5H6A2.25 2.25 0 0 1 8.25 15.75v.75A2.25 2.25 0 0 1 6 18.75h-.75A2.25 2.25 0 0 1 3 16.5v-.75Z" />
        </svg>
      ),
      tools: [
        'Studio Cloud File Database',
        'AI Editing Prompt Hub',
      ],
    },
  ] as const

  const structuredCategories = categories.map((category) => ({
    ...category,
    tools: category.tools.map((name): TollTool => ({
      name,
      icon: getToolIcon(name),
      accent: getToolAccent(name),
    })),
  }))

  const totalTools = structuredCategories.reduce((sum, category) => sum + category.tools.length, 0)
  const normalizedToolSearch = toolSearch.trim().toLowerCase()
  const filteredCategories = structuredCategories
    .map((category) => ({
      ...category,
      tools: category.tools.filter(({ name }) => name.toLowerCase().includes(normalizedToolSearch)),
    }))
    .filter((category) => category.tools.length > 0)
  const visibleCategories = normalizedToolSearch ? filteredCategories : structuredCategories
  const visibleToolCount = visibleCategories.reduce((sum, category) => sum + category.tools.length, 0)
  const heroBackgroundIcons = [
    { Icon: FileText, className: 'left-6 top-8 h-16 w-16 text-blue-200/80 dark:text-blue-400/20', delay: '0ms' },
    { Icon: Camera, className: 'right-10 top-10 h-14 w-14 text-cyan-200/80 dark:text-cyan-400/20', delay: '900ms' },
    { Icon: QrCode, className: 'left-14 bottom-12 h-12 w-12 text-sky-200/80 dark:text-sky-400/20', delay: '1700ms' },
    { Icon: Printer, className: 'right-18 bottom-10 h-16 w-16 text-indigo-200/80 dark:text-indigo-400/20', delay: '2400ms' },
    { Icon: WandSparkles, className: 'left-1/2 top-6 h-12 w-12 -translate-x-1/2 text-blue-100/90 dark:text-blue-300/20', delay: '1200ms' },
  ]
  const skeletonCategoryCounts = [6, 8, 4]

  return (
    <div className="min-h-screen bg-[#F9FAFB] px-3 py-6 dark:bg-slate-900/20 lg:px-8 lg:py-10">
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[32px] border border-blue-100 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800">
          {isToolsLoading ? (
            <div className="px-6 py-8 lg:px-10 lg:py-12">
              <div className="mx-auto max-w-4xl animate-pulse">
                <div className="mx-auto h-7 w-32 rounded-full bg-slate-200 dark:bg-slate-700" />
                <div className="mx-auto mt-5 h-10 w-full max-w-3xl rounded-2xl bg-slate-200 dark:bg-slate-700 lg:h-14" />
                <div className="mx-auto mt-4 h-5 w-full max-w-2xl rounded-xl bg-slate-200 dark:bg-slate-700" />
                <div className="mx-auto mt-3 h-5 w-3/4 max-w-xl rounded-xl bg-slate-200 dark:bg-slate-700" />
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  {[0, 1, 2].map((item) => (
                    <div key={item} className="h-8 w-36 rounded-full bg-slate-200 dark:bg-slate-700" />
                  ))}
                </div>
                <div className="mx-auto mt-6 h-12 w-full max-w-2xl rounded-2xl bg-slate-200 dark:bg-slate-700" />
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden px-6 py-8 lg:px-10 lg:py-12">
              <div className="pointer-events-none absolute inset-0">
                {heroBackgroundIcons.map(({ Icon, className, delay }, index) => (
                  <div
                    key={index}
                    className={`animate-hero-icon-float absolute ${className}`}
                    style={{ animationDelay: delay }}
                  >
                    <Icon className="h-full w-full" strokeWidth={1.8} />
                  </div>
                ))}
              </div>

              <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
                <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-blue-700 dark:border-slate-600 dark:bg-slate-700/70 dark:text-blue-200">
                  {t('toll.badge')}
                </span>
                <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-white lg:text-5xl">{t('toll.title')}</h2>
                <p className="mt-3 max-w-2xl text-sm font-medium text-slate-600 dark:text-slate-300 lg:text-base">
                  {t('toll.subtitle')}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 dark:border-slate-600 dark:bg-slate-700/70 dark:text-slate-200">
                    {totalTools} curated tools
                  </span>
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 dark:border-slate-600 dark:bg-slate-700/70 dark:text-slate-200">
                    {structuredCategories.length} smart categories
                  </span>
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 dark:border-slate-600 dark:bg-slate-700/70 dark:text-slate-200">
                    Styled for document and media work
                  </span>
                </div>
                <div className="mt-6 w-full max-w-2xl">
                  <label className="relative block">
                    <span className="sr-only">Search tools</span>
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 dark:text-slate-300">
                      <SearchIcon />
                    </div>
                    <input
                      type="search"
                      value={toolSearch}
                      onChange={(event) => setToolSearch(event.target.value)}
                      placeholder="Search tools, PDF, photo, CV..."
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-28 text-sm font-semibold text-slate-900 placeholder:text-slate-400 shadow-[0_10px_30px_rgba(15,23,42,0.06)] outline-none transition-all duration-300 focus:border-blue-300 focus:bg-white dark:border-slate-600 dark:bg-slate-700/70 dark:text-white dark:placeholder:text-slate-300"
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-300">
                      {visibleToolCount} tools
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 px-6 py-6 lg:px-10 lg:py-8">
            {isToolsLoading
              ? skeletonCategoryCounts.map((count, categoryIndex) => (
                  <article
                    key={`skeleton-${categoryIndex}`}
                    className="rounded-[28px] border border-slate-200 bg-slate-50/80 px-5 py-5 dark:border-slate-700 dark:bg-slate-800/80"
                  >
                    <div className="animate-pulse">
                      <div className="mx-auto h-7 w-56 rounded-xl bg-slate-200 dark:bg-slate-700" />
                      <div className="mx-auto mt-3 h-4 w-full max-w-xl rounded-xl bg-slate-200 dark:bg-slate-700" />
                      <div className="mx-auto mt-2 h-4 w-3/4 max-w-lg rounded-xl bg-slate-200 dark:bg-slate-700" />
                      <div className="mx-auto mt-4 h-7 w-24 rounded-full bg-slate-200 dark:bg-slate-700" />
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-4">
                      {Array.from({ length: count }).map((_, toolIndex) => (
                        <div
                          key={toolIndex}
                          className="mode-card-btn animate-pulse border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/60"
                        >
                          <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700 sm:h-12 sm:w-12" />
                          <div className="h-4 w-5/6 rounded-lg bg-slate-200 dark:bg-slate-700" />
                          <div className="h-4 w-2/3 rounded-lg bg-slate-200 dark:bg-slate-700" />
                        </div>
                      ))}
                    </div>
                  </article>
                ))
              : visibleCategories.map(({ title, description, tone, iconWrap, icon, tools }, categoryIndex) => (
                  <article
                    key={title}
                    className={`ui-hover-card animate-slide-up rounded-[28px] border px-5 py-5 shadow-sm transition-all duration-300 ${tone}`}
                    style={{ animationDelay: `${categoryIndex * 60}ms` }}
                  >
                    <div className="mb-5 flex flex-col items-center text-center">
                      <h3 className="max-w-[18rem] text-base font-black leading-tight text-gray-900 dark:text-white sm:max-w-[24rem] sm:text-lg lg:max-w-none lg:text-[1.35rem]">
                        {title}
                      </h3>
                      <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-gray-600 dark:text-slate-300">
                        {description}
                      </p>
                      <span className="mt-3 inline-flex rounded-full border border-black/5 bg-white/80 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-gray-700 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200">
                        {tools.length} tools
                      </span>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-4">
                      {tools.map(({ name, icon: ToolIcon, accent }, toolIndex) => (
                        <article
                          key={name}
                          className="animate-fade-slide-in"
                          style={{ animationDelay: `${categoryIndex * 90 + toolIndex * 18}ms` }}
                        >
                          <button
                            type="button"
                            className="mode-card-btn"
                            style={{ ['--btn-color' as string]: TOOL_CARD_COLORS[accent] }}
                          >
                            <div className="mode-icon">
                              <ToolIcon className="h-9 w-9 sm:h-12 sm:w-12" strokeWidth={2.1} />
                            </div>
                            <span className="text-[0.95rem] font-extrabold leading-tight sm:text-lg">
                              {name}
                            </span>
                          </button>
                        </article>
                      ))}
                    </div>
                  </article>
                ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-dashed border-blue-200 bg-blue-50/70 px-6 py-5 dark:border-blue-500/30 dark:bg-blue-500/10 lg:px-8">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">{t('toll.noteTitle')}</h3>
              <p className="mt-1 text-sm font-medium text-gray-600 dark:text-slate-300">{t('toll.noteDescription')}</p>
            </div>
            <span className="inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-300">
              Curated from your reference board
            </span>
          </div>
        </section>
      </div>
    </div>
  )
}

interface ProfileMenuItem {
  id: string
  icon: string
  label: string
  sublabel: string
  color: string
}

const profileMenuItems: ProfileMenuItem[] = [
  { id: 'personal', icon: '👤', label: 'Personal Information', sublabel: 'Name, Phone', color: 'bg-blue-50 dark:bg-blue-900/20' },
  { id: 'linked', icon: '📱', label: 'Linked Accounts', sublabel: 'Aadhaar, PAN, Voter ID', color: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { id: 'notifications', icon: '🔔', label: 'Notifications', sublabel: 'Manage alerts & preferences', color: 'bg-amber-50 dark:bg-amber-900/20' },
  { id: 'security', icon: '🔒', label: 'Security', sublabel: 'Password', color: 'bg-violet-50 dark:bg-violet-900/20' },
  { id: 'language', icon: '🌐', label: 'Language', sublabel: 'English, বাংলা', color: 'bg-cyan-50 dark:bg-cyan-900/20' },
  { id: 'help', icon: '❓', label: 'Help & Support', sublabel: 'FAQ, Contact us', color: 'bg-rose-50 dark:bg-rose-900/20' },
]

// Legacy profile modal kept only for reference. The active profile route uses src/components/ProfilePage.tsx.
export const LegacyProfilePage: React.FC<{ 
  user: User | null; 
  onLogout: () => void;
  isAdmin?: boolean;
  onOpenAdmin?: () => void;
  language?: Language;
  onLanguageChange?: (lang: Language) => void;
  stats?: {
    total: number;
    active: number;
    completed: number;
  };
}> = ({ user, onLogout, isAdmin, onOpenAdmin, language = 'en', onLanguageChange, stats = { total: 0, active: 0, completed: 0 } }) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [name, setName] = useState(user?.user_metadata?.name || '');
  const [phone, setPhone] = useState(user?.user_metadata?.phone || '');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.name || '');
      setPhone(user.user_metadata?.phone || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await authApi.updateProfile({ name, phone });
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setActiveModal(null), 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await authApi.updatePassword(password);
      setSuccessMsg('Password updated successfully!');
      setPassword('');
      setTimeout(() => setActiveModal(null), 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (id: string) => {
    if (id === 'help') {
      window.location.href = 'mailto:support@gazionline.com';
      return;
    }
    setActiveModal(id);
    setSuccessMsg('');
    setErrorMsg('');
  };

  // ── Render Modals ─────────────────────────────────
  const getModalInfo = () => {
    switch (activeModal) {
      case 'personal':
        return {
          title: 'Personal Information',
          desc: 'Manage your name and phone number used for applications.'
        };
      case 'security':
        return {
          title: 'Security',
          desc: 'Update your password to keep your account safe.'
        };
      case 'language':
        return {
          title: 'Language',
          desc: 'Switch between English and Bengali interface.'
        };
      case 'linked':
        return {
          title: 'Linked Accounts',
          desc: 'Manage your Aadhaar, PAN, and other IDs.'
        };
      case 'notifications':
        return {
          title: 'Notifications',
          desc: 'Adjust your alert preferences and email setup.'
        };
      default:
        return { title: 'Profile', desc: '' };
    }
  };

  const renderModalContent = () => {
    switch (activeModal) {
      case 'personal':
        return (
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-slate-200 mb-2">Full Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all shadow-inner" 
                  placeholder="Enter your full name"
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-slate-200 mb-2">Phone Number</label>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all shadow-inner" 
                  placeholder="e.g. +91 9876543210"
                />
              </div>
              {errorMsg && <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-sm font-medium animate-shake">{errorMsg}</div>}
              {successMsg && <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium animate-fade-in">✓ {successMsg}</div>}
            </div>
            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 mt-4 tap-scale"
            >
              {isLoading ? 'Saving Changes...' : 'Save Profile Details'}
            </button>
          </form>
        );
      case 'security':
        return (
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-slate-200 mb-2">New Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-violet-500 outline-none dark:text-white transition-all shadow-inner" 
                  placeholder="At least 6 characters"
                  required 
                  minLength={6} 
                />
              </div>
              {errorMsg && <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-sm font-medium animate-shake">{errorMsg}</div>}
              {successMsg && <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium animate-fade-in">✓ {successMsg}</div>}
            </div>
            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-violet-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-violet-500/30 hover:bg-violet-700 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 mt-4 tap-scale"
            >
              {isLoading ? 'Updating Security...' : 'Update Password Now'}
            </button>
          </form>
        );
      case 'language':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={() => { onLanguageChange?.('en'); setTimeout(() => setActiveModal(null), 300); }} 
                className={`p-6 rounded-[24px] border-2 transition-all duration-300 text-left tap-scale ${language === 'en' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-md' : 'border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
              >
                <span className="text-3xl block mb-3">🇬🇧</span>
                <span className="font-bold text-gray-900 dark:text-white block">English</span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Global Standard</p>
              </button>
              <button 
                onClick={() => { onLanguageChange?.('bn'); setTimeout(() => setActiveModal(null), 300); }} 
                className={`p-6 rounded-[24px] border-2 transition-all duration-300 text-left tap-scale ${language === 'bn' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-md' : 'border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
              >
                <span className="text-3xl block mb-3">🇮🇳</span>
                <span className="font-bold text-gray-900 dark:text-white block">বাংলা</span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">আঞ্চলিক ভাষা</p>
              </button>
            </div>
          </div>
        );
      case 'linked':
      case 'notifications':
        return (
          <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in">
            <div className="w-24 h-24 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner">🚧</div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Feature Coming Soon</h3>
            <p className="text-gray-500 dark:text-slate-400 max-w-sm font-medium leading-relaxed">
              We are working hard to bring this feature to your profile in our next major update.
            </p>
            <button 
              onClick={() => setActiveModal(null)}
              className="mt-8 px-8 py-3 bg-gray-900 dark:bg-slate-800 text-white rounded-xl font-bold hover:bg-black transition-colors tap-scale"
            >
              Okay, Understood
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="px-4 py-6 lg:px-12 lg:py-10 min-h-screen relative">
      <div className="max-w-3xl mx-auto">
        {/* Profile Card */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[28px] p-6 lg:p-10 text-white relative overflow-hidden mb-8 animate-scale-in">
          <div className="relative z-10 flex items-center gap-5 lg:gap-8">
            <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-3xl lg:text-4xl shadow-xl uppercase">
              {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || '👤'}
            </div>
            <div>
              <h2 className="text-xl lg:text-2xl font-black">{name || user?.user_metadata?.name || 'Citizen'}</h2>
              <p className="text-white/70 text-sm lg:text-base font-medium mt-1">{user?.email}</p>
              {phone && <p className="text-white/60 text-xs font-medium mt-0.5">{phone}</p>}
              {user && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-white/20 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">Verified ✓</span>
                  {isAdmin && <span className="bg-amber-500/90 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ml-1 shadow-sm">Admin</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { value: stats.total.toString(), label: 'Applications', icon: '📋' },
            { value: stats.active.toString(), label: 'Active', icon: '⏳' },
            { value: stats.completed.toString(), label: 'Completed', icon: '✅' },
          ].map(({ value, label, icon }) => (
            <div key={label} className="bg-white dark:bg-slate-800 rounded-2xl p-4 text-center shadow-sm border border-gray-100 dark:border-slate-700/50">
              <span className="text-lg block mb-1">{icon}</span>
              <p className="text-lg lg:text-xl font-black text-gray-900 dark:text-white">{value}</p>
              <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>

        {/* Admin Access Token */}
        {isAdmin && (
          <button
            onClick={onOpenAdmin}
            className="w-full mb-6 py-4 text-white font-bold text-sm lg:text-base rounded-2xl bg-gradient-to-r from-gray-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 hover:from-black hover:to-gray-900 transition-all shadow-lg flex items-center justify-center gap-3 tap-scale"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" /></svg>
            Open Admin Dashboard
          </button>
        )}

        {/* Menu Items */}
        <div className="flex flex-col gap-2">
          {profileMenuItems.map(({ id, icon, label, sublabel, color }, i) => (
            <button
              key={id}
              onClick={() => handleActionClick(id)}
              className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 lg:p-5 shadow-sm border border-gray-100 dark:border-slate-700/50 flex items-center gap-4 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-300 text-left animate-slide-up bg-opacity-80"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center text-lg shrink-0`}>{icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm lg:text-base font-bold text-gray-900 dark:text-white">{label}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">{sublabel}</p>
              </div>
              <ChevronRightIcon />
            </button>
          ))}
        </div>

        {/* Logout */}
        {user ? (
           <button 
            onClick={onLogout}
            className="w-full mt-6 py-4 text-red-500 dark:text-red-400 font-bold text-sm rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5 hover:bg-red-100 dark:hover:bg-red-500/10 transition-all tap-scale"
          >
            Sign Out
          </button>
        ) : (
          <button
            className="w-full mt-6 py-4 text-blue-600 dark:text-blue-400 font-bold text-sm rounded-2xl border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 transition-all tap-scale"
          >
            Please Sign In
          </button>
        )}
      </div>

      {/* Modal Overlay - Full Screen Flow Pattern */}
      {activeModal && (() => {
        const { title, desc } = getModalInfo();
        return (
          <div className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-slate-900 md:items-center md:justify-center md:bg-black/40 md:backdrop-blur-sm animate-fade-in" onClick={() => setActiveModal(null)}>
            <div className="flex h-full w-full flex-col bg-white dark:bg-slate-900 md:h-[90vh] md:max-h-[850px] md:max-w-xl md:rounded-[40px] md:shadow-2xl overflow-hidden animate-scale-up" onClick={e => e.stopPropagation()}>
              
              {/* Header matching ServiceFlow */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 md:px-10 md:pt-10 md:pb-6 border-b border-gray-100 dark:border-slate-800/50">
                <div className="flex-1">
                  <h2 className="text-xl lg:text-3xl font-black text-gray-900 dark:text-white leading-tight">
                    {title}
                  </h2>
                  <p className="mt-1 text-xs lg:text-base font-medium text-gray-500 dark:text-slate-400">
                    {desc}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="ml-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100 text-gray-500 transition-all hover:bg-gray-200 hover:text-gray-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white tap-scale"
                >
                  <CloseIcon />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-6 py-8 md:px-10 md:py-10">
                {renderModalContent()}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  )
}
