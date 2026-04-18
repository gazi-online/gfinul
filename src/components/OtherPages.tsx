import React, { useState, useEffect, useMemo } from 'react'
import { type Product, type ServiceItem, type Order, type ServiceRequest } from '../lib/types'
import { type User } from '@supabase/supabase-js'
import { formatServiceRequestReference, matchesServiceRequestReference } from '../lib/references'
import { getServiceDisplayDescription, getServiceDisplayName, getServiceKind } from '../lib/serviceDisplay'
import { ProductCard, SkeletonProductCard, getProductCategoryMeta } from './HomeSections'
import { uiText, type Language } from '../lib/uiText'

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

const CategoryFilter: React.FC<{ active: string; onSelect: (cat: string) => void; language?: Language }> = ({ active, onSelect, language = 'en' }) => (
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
        {uiText[language].pages.services.categories[cat]}
      </button>
    ))}
  </div>
)

const ServiceCard: React.FC<ServiceItem & { delay: number; onStartService?: (name: string, desc: string) => void }> = ({ 
  id, name, description, actionLabel, delay, onStartService
}) => {
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
        {actionLabel || 'Apply Now'}
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
  language?: Language;
}> = ({ onStartService, services, isLoading = false, language = 'en' }) => {
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const text = uiText[language]

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
            placeholder={text.pages.services.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#EBF0FF] dark:bg-slate-800 border-none rounded-2xl py-4 pl-12 pr-6 text-sm lg:text-base text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/50 transition-all outline-none shadow-inner"
          />
        </div>

        {/* Categories */}
          <CategoryFilter active={activeCategory} onSelect={setActiveCategory} language={language} />

        {/* Section Title */}
        <p className="text-[10px] lg:text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-[2px] mb-4">
          {text.pages.services.eyebrow}
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
              <p className="text-lg font-bold text-gray-400 dark:text-slate-500">{text.pages.services.noResults}</p>
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
  onAddToCart?: (product: Omit<Product, 'category'>) => Promise<void> | void
  onViewProduct?: (product: Product) => void
  language?: Language
}> = ({ products, isLoading = false, onAddToCart, onViewProduct, language = 'en' }) => {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<'all' | string>('all')
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating-desc'>('featured')
  const text = uiText[language]

  const categoryChips = useMemo(() => {
    const categoryMap = new Map<string, { id: string; label: string; count: number }>()

    products.forEach((product) => {
      const categoryMeta = getProductCategoryMeta(product, language)
      const existingCategory = categoryMap.get(categoryMeta.id)
      if (existingCategory) {
        existingCategory.count += 1
        return
      }

      categoryMap.set(categoryMeta.id, {
        id: categoryMeta.id,
        label: categoryMeta.label,
        count: 1,
      })
    })

    return [
      { id: 'all', label: text.pages.products.all, count: products.length },
      ...Array.from(categoryMap.values()).sort((firstCategory, secondCategory) =>
        firstCategory.label.localeCompare(secondCategory.label),
      ),
    ]
  }, [language, products, text.pages.products.all])

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    const nextProducts = products.filter((product) => {
      const categoryMeta = getProductCategoryMeta(product, language)
      const matchesCategory = activeCategory === 'all' || categoryMeta.id === activeCategory
      const matchesSearch =
        !normalizedSearch ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        (product.category ?? '').toLowerCase().includes(normalizedSearch) ||
        categoryMeta.label.toLowerCase().includes(normalizedSearch)

      return matchesCategory && matchesSearch
    })

    nextProducts.sort((firstProduct, secondProduct) => {
      const firstOutOfStock = Number(firstProduct.stock ?? 0) <= 0 || firstProduct.is_active === false
      const secondOutOfStock = Number(secondProduct.stock ?? 0) <= 0 || secondProduct.is_active === false

      if (firstOutOfStock !== secondOutOfStock) {
        return Number(firstOutOfStock) - Number(secondOutOfStock)
      }

      if (sortBy === 'price-asc') {
        return Number(firstProduct.price ?? 0) - Number(secondProduct.price ?? 0)
      }

      if (sortBy === 'price-desc') {
        return Number(secondProduct.price ?? 0) - Number(firstProduct.price ?? 0)
      }

      if (sortBy === 'rating-desc') {
        return Number(secondProduct.rating ?? 0) - Number(firstProduct.rating ?? 0)
      }

      return 0
    })

    return nextProducts
  }, [activeCategory, language, products, search, sortBy])

  return (
    <div className="min-h-screen bg-[#F9FAFB] px-4 py-6 pb-[calc(env(safe-area-inset-bottom)+10rem)] dark:bg-slate-900/20 sm:px-5 lg:px-12 lg:py-10 lg:pb-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 lg:mb-8">
          <p className="text-[10px] lg:text-xs font-black uppercase tracking-[0.18em] text-gray-400 dark:text-slate-500">{text.pages.products.eyebrow}</p>
          <h2 className="mt-2 text-2xl lg:text-4xl font-black text-gray-900 dark:text-white">{text.pages.products.title}</h2>
          <p className="mt-2 max-w-2xl text-sm lg:text-base text-gray-500 dark:text-slate-400">{text.pages.products.description}</p>
        </div>

        <div className="mb-6 rounded-[28px] border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 lg:mb-8 lg:p-5">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder={text.pages.products.searchPlaceholder}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-[#F8FAFC] py-4 pl-12 pr-6 text-sm text-gray-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white lg:text-base"
            />
          </div>

          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {categoryChips.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  className={`inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-2xl px-4 text-sm font-bold transition-all duration-200 ${
                    activeCategory === category.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{category.label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${activeCategory === category.id ? 'bg-white/20 text-white' : 'bg-white text-slate-500 dark:bg-slate-900 dark:text-slate-300'}`}>
                    {category.count}
                  </span>
                </button>
              ))}
            </div>

            <label className="flex min-h-11 items-center gap-3 rounded-2xl border border-gray-200 bg-[#F8FAFC] px-4 text-sm font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
              <span>{text.pages.products.sort}</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as 'featured' | 'price-asc' | 'price-desc' | 'rating-desc')}
                className="min-h-11 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none dark:text-white"
              >
                <option value="featured">{text.pages.products.sortOptions.featured}</option>
                <option value="price-asc">{text.pages.products.sortOptions.priceAsc}</option>
                <option value="price-desc">{text.pages.products.sortOptions.priceDesc}</option>
                <option value="rating-desc">{text.pages.products.sortOptions.ratingDesc}</option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
            <span>{filteredProducts.length} {text.pages.products.countSuffix}</span>
            <span>{activeCategory === 'all' ? text.pages.products.allCategories : categoryChips.find((category) => category.id === activeCategory)?.label ?? text.pages.products.filtered}</span>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => <SkeletonProductCard key={index} />)}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} {...product} onAddToCart={onAddToCart} onViewProduct={onViewProduct} language={language} />
            ))}
          </div>
        ) : (
          <div className="rounded-[28px] border border-dashed border-gray-200 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-lg font-black text-gray-900 dark:text-white">{text.pages.products.noResultsTitle}</p>
            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">{text.pages.products.noResultsDescription}</p>
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
  language?: Language
}

export const TrackPage: React.FC<TrackPageProps> = ({
  requests,
  isLoading = false,
  isRefreshing = false,
  isSignedIn = false,
  lastUpdatedAt = null,
  onRefresh,
  language = 'en',
}) => {
  const [search, setSearch] = useState('')
  const normalizedSearch = search.trim().toLowerCase()
  const hasGuestRequests = !isSignedIn && requests.some((request) => request.guest)
  const canShowTrackedRequests = true
  const text = uiText[language]

  const filtered = requests.filter((request) =>
    getServiceDisplayName(request.services?.name).toLowerCase().includes(normalizedSearch) ||
    matchesServiceRequestReference(request.id, search)
  )

  const summaryCards = [
    { value: requests.length, label: text.pages.track.stats.total, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { value: requests.filter((request) => request.status === 'completed').length, label: text.pages.track.stats.completed, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { value: requests.filter((request) => request.status === 'processing').length, label: text.pages.track.stats.inProgress, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { value: requests.filter((request) => request.status === 'pending').length, label: text.pages.track.stats.pending, color: 'text-gray-600 dark:text-slate-400', bg: 'bg-gray-50 dark:bg-slate-800' },
  ]

  const lastUpdatedLabel = lastUpdatedAt
    ? new Date(lastUpdatedAt).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : text.pages.track.waitingForSync

  return (
    <div className="px-4 py-6 lg:px-12 lg:py-10 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="mb-2 text-2xl font-black text-gray-900 dark:text-white lg:text-4xl">{text.pages.track.title}</h2>
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400 lg:text-base">{text.pages.track.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-left shadow-sm dark:border-emerald-900/40 dark:bg-emerald-900/10">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">{text.pages.track.liveStatus}</p>
              <p className="mt-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                {isSignedIn
                  ? `${text.pages.track.lastSynced} ${lastUpdatedLabel}`
                  : hasGuestRequests
                    ? text.pages.track.guestSaved
                    : text.pages.track.availableWithoutSignIn}
              </p>
            </div>

            {isSignedIn && onRefresh ? (
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition-all hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-500/40 dark:hover:text-blue-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                </svg>
                {isRefreshing ? text.pages.track.refreshing : text.pages.track.refresh}
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
            placeholder={text.pages.track.searchPlaceholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-2xl border border-gray-100 bg-white py-4 pl-12 pr-6 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        {isSignedIn ? (
          <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {summaryCards.map(({ value, label, color, bg }) => (
              <div key={label} className={`${bg} rounded-2xl p-4 text-center lg:p-5`}>
                <p className={`text-2xl font-black lg:text-3xl ${color}`}>{value}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 lg:text-xs">{label}</p>
              </div>
            ))}
          </div>
        ) : null}
        {hasGuestRequests ? (
          <div className="mb-8 rounded-[24px] border border-amber-100 bg-amber-50/80 px-5 py-4 text-sm font-medium text-amber-800 shadow-sm dark:border-amber-900/30 dark:bg-amber-500/10 dark:text-amber-200">
            {text.pages.track.guestNotice}
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
          ) : !canShowTrackedRequests ? (
            <div className="rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-6 py-10 text-center shadow-sm dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25">
                <SearchIcon />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white">Sign in to track your applications</h3>
              <p className="mx-auto mt-2 max-w-md text-sm font-medium text-gray-500 dark:text-slate-400">
                Your submitted service requests will appear here with live status updates as soon as you are signed in.
              </p>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((req, i) => {
              const statusKeyMap: Record<string, TrackStatus> = {
                'completed': 'Completed',
                'processing': 'Processing',
                'pending': 'Pending',
                'rejected': 'Rejected'
              }
              const displayLabelMap: Record<TrackStatus, string> = {
                Completed: text.pages.track.statuses.completed,
                Processing: text.pages.track.statuses.processing,
                Pending: text.pages.track.statuses.pending,
                Rejected: text.pages.track.statuses.rejected,
              }
              const statusKey = statusKeyMap[req.status] || 'Pending'
              const style = trackStatusStyles[statusKey]
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
                        <h3 className="text-sm lg:text-base font-bold text-gray-900 dark:text-white">{getServiceDisplayName(req.services?.name) || text.pages.track.serviceRequest}</h3>
                        {req.guest ? (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                            {text.pages.track.guest}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">#{req.id.slice(0, 8)} · {new Date(req.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-[10px] lg:text-xs font-black px-3 py-1 rounded-full uppercase tracking-tighter ${style.bg} ${style.text}`}>
                      {displayLabelMap[statusKey]}
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
              <p className="font-bold text-gray-400 dark:text-slate-500">{text.pages.track.noResults}</p>
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

interface ProfileMenuItem {
  icon: string
  label: string
  sublabel: string
  color: string
}

const profileMenuItems: ProfileMenuItem[] = [
  { icon: '👤', label: 'Personal Information', sublabel: 'Name, DOB, Address', color: 'bg-blue-50 dark:bg-blue-900/20' },
  { icon: '📱', label: 'Linked Accounts', sublabel: 'Aadhaar, PAN, Voter ID', color: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { icon: '🔔', label: 'Notifications', sublabel: 'Manage alerts & preferences', color: 'bg-amber-50 dark:bg-amber-900/20' },
  { icon: '🔒', label: 'Security', sublabel: 'Password, 2FA, Sessions', color: 'bg-violet-50 dark:bg-violet-900/20' },
  { icon: '🌐', label: 'Language', sublabel: 'English, বাংলা', color: 'bg-cyan-50 dark:bg-cyan-900/20' },
  { icon: '❓', label: 'Help & Support', sublabel: 'FAQ, Contact us', color: 'bg-rose-50 dark:bg-rose-900/20' },
]

export const ProfilePage: React.FC<{ 
  user: User | null; 
  onLogout: () => void;
  isAdmin?: boolean;
  onOpenAdmin?: () => void;
  onSignIn?: () => void;
  language?: Language;
}> = ({ user, onLogout, isAdmin, onOpenAdmin, onSignIn, language = 'en' }) => {
  const text = uiText[language]
  const localizedProfileMenuItems: ProfileMenuItem[] = text.pages.profile.menuItems.map((item) => ({ ...item }))
  if (!user) {
    return (
      <div className="px-4 py-6 lg:px-12 lg:py-10 min-h-screen">
        <div className="max-w-3xl mx-auto rounded-[32px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-6 py-12 text-center shadow-sm dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-10 w-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">{text.pages.profile.guestTitle}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm font-medium text-gray-500 dark:text-slate-400">
            {text.pages.profile.guestDescription}
          </p>
          <button
            onClick={onSignIn}
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-xl shadow-blue-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-blue-500/40 active:scale-[0.97]"
          >
            {text.pages.profile.guestButton}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 lg:px-12 lg:py-10 min-h-screen">
      <div className="max-w-3xl mx-auto">
        {/* Profile Card */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[28px] p-6 lg:p-10 text-white relative overflow-hidden mb-8 animate-scale-in">
          <div className="relative z-10 flex items-center gap-5 lg:gap-8">
            <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-3xl lg:text-4xl shadow-xl">
              {user?.email?.charAt(0).toUpperCase() || '👤'}
            </div>
            <div>
              <h2 className="text-xl lg:text-2xl font-black">{user?.user_metadata?.name || text.pages.profile.citizen}</h2>
              <p className="text-white/70 text-sm lg:text-base font-medium mt-1">{user?.email}</p>
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
            { value: '12', label: 'Applications', icon: '📋' },
            { value: '3', label: 'Active', icon: '⏳' },
            { value: '9', label: 'Completed', icon: '✅' },
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
            {text.pages.profile.adminButton}
          </button>
        )}

        {/* Menu Items */}
        <div className="flex flex-col gap-2">
          {localizedProfileMenuItems.map(({ icon, label, sublabel, color }, i) => (
            <button
              key={label}
              className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 lg:p-5 shadow-sm border border-gray-100 dark:border-slate-700/50 flex items-center gap-4 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-300 text-left animate-slide-up"
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
            {text.pages.profile.signOut}
          </button>
        ) : (
          <button
            className="w-full mt-6 py-4 text-blue-600 dark:text-blue-400 font-bold text-sm rounded-2xl border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 transition-all tap-scale"
          >
            Please Sign In
          </button>
        )}
      </div>
    </div>
  )
}
