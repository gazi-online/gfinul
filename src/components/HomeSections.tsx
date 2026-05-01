import React, { useState, useEffect } from 'react'
import { BadgeCheck, BriefcaseBusiness, Calculator, CreditCard, Droplets, FileImage, FileText, Gift, Home, Landmark, Lightbulb, MapPin, QrCode, Receipt, Scissors, ShieldCheck, Signature, Smartphone, Truck, type LucideIcon, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { type CustomerReview, type Product, type ServiceItem } from '../lib/types'
import { formatLocalizedCurrency } from '../lib/i18n'
import { getServiceDisplayDescription, getServiceDisplayName } from '../lib/serviceDisplay'
import { reviewsApi } from '../api/reviews'
import { useToast } from './toast/useToast'

const GAZI_ONLINE_MAPS_URL = 'https://www.google.com/maps/place/Gazi+Online+%7C%7C+%E0%A6%97%E0%A6%BE%E0%A6%9C%E0%A6%BF+%E0%A6%85%E0%A6%A8%E0%A6%B2%E0%A6%BE%E0%A6%87%E0%A6%A8/@22.6120142,88.8414335,817m/data=!3m1!1e3!4m8!3m7!1s0x3a01ff13ccf3f2c1:0x7514f47bf39cb29!8m2!3d22.6120142!4d88.8440084!9m1!1b1!16s%2Fg%2F11lf41kn1q?entry=ttu&g_ep=EgoyMDI2MDQxMy4wIKXMDSoASAFQAw%3D%3D'

// â”€â”€ Icon helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 inline ml-1">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
  </svg>
)



const POPULAR_SERVICE_VISUALS: Record<string, { icon: LucideIcon; shell: string; iconColor: string; ring: string }> = {
  'Apply PAN': {
    icon: CreditCard,
    shell: 'bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 dark:from-sky-950/60 dark:via-blue-950/50 dark:to-indigo-950/60',
    iconColor: 'text-blue-700 dark:text-blue-300',
    ring: 'ring-blue-100 dark:ring-blue-900/40',
  },
  'Aadhaar': {
    icon: ShieldCheck,
    shell: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 dark:from-emerald-950/60 dark:via-teal-950/50 dark:to-cyan-950/60',
    iconColor: 'text-emerald-700 dark:text-emerald-300',
    ring: 'ring-emerald-100 dark:ring-emerald-900/40',
  },
  'Aadhaar Update': {
    icon: ShieldCheck,
    shell: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 dark:from-emerald-950/60 dark:via-teal-950/50 dark:to-cyan-950/60',
    iconColor: 'text-emerald-700 dark:text-emerald-300',
    ring: 'ring-emerald-100 dark:ring-emerald-900/40',
  },
  'Pay Bill': {
    icon: Receipt,
    shell: 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 dark:from-amber-950/60 dark:via-orange-950/50 dark:to-yellow-950/60',
    iconColor: 'text-amber-700 dark:text-amber-300',
    ring: 'ring-amber-100 dark:ring-amber-900/40',
  },
  'Income Cert.': {
    icon: FileText,
    shell: 'bg-gradient-to-br from-violet-50 via-fuchsia-50 to-pink-100 dark:from-violet-950/60 dark:via-fuchsia-950/50 dark:to-pink-950/60',
    iconColor: 'text-violet-700 dark:text-violet-300',
    ring: 'ring-violet-100 dark:ring-violet-900/40',
  },
  'Vehicle Tax': {
    icon: Truck,
    shell: 'bg-gradient-to-br from-slate-50 via-zinc-50 to-stone-100 dark:from-slate-950/60 dark:via-zinc-950/50 dark:to-stone-950/60',
    iconColor: 'text-slate-700 dark:text-slate-300',
    ring: 'ring-slate-100 dark:ring-slate-800/50',
  },
  'Google Play Redeem Codes': {
    icon: Gift,
    shell: 'bg-gradient-to-br from-lime-50 via-emerald-50 to-teal-100 dark:from-lime-950/60 dark:via-emerald-950/50 dark:to-teal-950/60',
    iconColor: 'text-emerald-700 dark:text-emerald-300',
    ring: 'ring-emerald-100 dark:ring-emerald-900/40',
  },
}

const POPULAR_SERVICE_KEYWORDS: Array<{ words: string[]; visual: { icon: LucideIcon; shell: string; iconColor: string; ring: string } }> = [
  { words: ['pan', 'card'], visual: POPULAR_SERVICE_VISUALS['Apply PAN'] },
  { words: ['aadhaar', 'aadhar', 'identity', 'kyc'], visual: POPULAR_SERVICE_VISUALS['Aadhaar'] },
  { words: ['bill', 'payment', 'invoice', 'utility'], visual: POPULAR_SERVICE_VISUALS['Pay Bill'] },
  { words: ['certificate', 'income', 'document'], visual: POPULAR_SERVICE_VISUALS['Income Cert.'] },
  { words: ['vehicle', 'transport', 'driving', 'rc'], visual: POPULAR_SERVICE_VISUALS['Vehicle Tax'] },
  { words: ['google', 'play', 'redeem', 'gift', 'code'], visual: POPULAR_SERVICE_VISUALS['Google Play Redeem Codes'] },
]

const getPopularServiceVisual = (service: Pick<ServiceItem, 'name' | 'description' | 'icon'>) => {
  if (service.icon) {
    return {
      icon: service.icon,
      shell: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-100 dark:from-blue-950/60 dark:via-indigo-950/50 dark:to-sky-950/60',
      iconColor: 'text-blue-700 dark:text-blue-300',
      ring: 'ring-blue-100 dark:ring-blue-900/40',
    }
  }

  const exactMatch = POPULAR_SERVICE_VISUALS[service.name]
  if (exactMatch) return exactMatch

  const normalizedText = `${service.name} ${service.description ?? ''}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')

  for (const rule of POPULAR_SERVICE_KEYWORDS) {
    if (rule.words.some((word) => normalizedText.includes(word))) {
      return rule.visual
    }
  }

  return {
    icon: Lightbulb,
    shell: 'bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-100 dark:from-blue-950/60 dark:via-cyan-950/50 dark:to-sky-950/60',
    iconColor: 'text-sky-700 dark:text-sky-300',
    ring: 'ring-sky-100 dark:ring-sky-900/40',
  }
}

export const ServiceCard: React.FC<ServiceItem & { delayIndex?: number; onStartService?: (name: string, desc: string) => void }> = ({
  id,
  name,
  description,
  icon,
  actionLabel,
  delayIndex = 0,
  onStartService,
}) => {
  const { t } = useTranslation()
  const displayName = getServiceDisplayName(name)
  const displayDescription = getServiceDisplayDescription(name, description)
  const { icon: Icon, shell, iconColor, ring } = getPopularServiceVisual({ name, description, icon })

  return (
    <div
      id={id}
      className={`ui-hover-card bg-white dark:bg-slate-800 rounded-[28px] p-5 lg:p-8 shadow-sm border border-gray-100 dark:border-slate-700/50 hover:border-blue-200 dark:hover:border-blue-400/40 dark:hover:bg-slate-800/95 dark:hover:shadow-[0_20px_45px_rgba(2,6,23,0.42)] animate-slide-up stagger-${delayIndex}`}
    >
      <span className={`inline-flex items-center justify-center w-12 h-12 lg:w-16 lg:h-16 rounded-[20px] ${shell} ${iconColor} mb-4 lg:mb-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ${ring}`}>
        <Icon className="w-6 h-6 lg:w-8 lg:h-8" strokeWidth={2.1} />
      </span>
      <h3 className="font-extrabold text-gray-900 dark:text-white text-base lg:text-xl mb-2 lg:mb-3">{displayName}</h3>
      <p className="text-xs lg:text-base text-gray-500 dark:text-slate-300 leading-relaxed mb-5 lg:mb-8 font-medium">{displayDescription}</p>
      <button
        id={`${id}-action-btn`}
        onClick={() => onStartService?.(name, displayDescription)}
        className="ui-hover-link text-blue-600 dark:text-blue-400 text-sm font-bold hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1.5 tap-scale"
      >
        {actionLabel || t('services.applyNow')} <ArrowRightIcon />
      </button>
    </div>
  )
}

export const SkeletonServiceCard: React.FC = () => (
  <div className="bg-white dark:bg-slate-800 rounded-[28px] p-5 lg:p-8 shadow-sm border border-gray-100 dark:border-slate-700/50 animate-pulse">
    <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-[20px] bg-gray-200 dark:bg-slate-700 mb-4 lg:mb-6"></div>
    <div className="h-5 lg:h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/2 mb-3 lg:mb-4"></div>
    <div className="flex flex-col gap-2.5 mb-6 lg:mb-8">
      <div className="h-3.5 lg:h-4.5 bg-gray-200 dark:bg-slate-700 rounded w-full"></div>
      <div className="h-3.5 lg:h-4.5 bg-gray-200 dark:bg-slate-700 rounded w-4/5"></div>
    </div>
    <div className="h-4 lg:h-5 bg-gray-200 dark:bg-slate-700 rounded w-1/4"></div>
  </div>
)

export const PopularServicesSection: React.FC<{ 
  onStartService?: (name: string, desc: string) => void; 
  onViewAll?: () => void;
  title?: string;
  services: ServiceItem[];
  isLoading?: boolean;
}> = ({ onStartService, onViewAll, title, services, isLoading = false }) => {
  const { t } = useTranslation()

  return (
    <section id="popular-services" className="px-3 lg:px-8 mt-6 lg:mt-10">
      <div className="flex items-center justify-between mb-3 lg:mb-5">
        <h2 className="text-base lg:text-xl font-bold text-gray-900 dark:text-white">{title ?? t('home.popularServices')}</h2>
        <button
          id="view-all-services-btn"
          type="button"
          onClick={onViewAll}
          className="ui-hover-link text-sm lg:text-base font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 tap-scale"
        >
          {t('common.viewAll')} <ArrowRightIcon />
        </button>
      </div>
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-3 lg:gap-5">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonServiceCard key={`skel-svc-${i}`} />)
          : services?.slice(0, 3)?.map((service, i) => (
              <ServiceCard key={service.id} {...service} delayIndex={i + 5} onStartService={onStartService} />
            ))}
      </div>
    </section>
  )
}

// â”€â”€ Recent Applications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface Application {
  id: string
  name: string
  ref: string
  status: 'COMPLETED' | 'PROCESSING' | 'PENDING'
}

const statusStyles: Record<Application['status'], string> = {
  COMPLETED:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30',
  PROCESSING: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30',
  PENDING:    'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400 border border-gray-200 dark:border-slate-700',
}

const applications: Application[] = [
  { id: 'app-1', name: 'Income Certificate', ref: 'Ref: #CV-88219', status: 'COMPLETED' },
  { id: 'app-2', name: 'Trade License',       ref: 'Ref: #CV-88432', status: 'PROCESSING' },
]

export const SkeletonApplicationCard: React.FC = () => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl px-5 py-4 lg:px-8 lg:py-6 shadow-sm border border-gray-100 dark:border-slate-700/50 flex items-center justify-between gap-4 animate-pulse">
    <div className="flex items-center gap-4 lg:gap-6 w-full">
      <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-2xl bg-gray-200 dark:bg-slate-700 shrink-0"></div>
      <div className="flex-1">
        <div className="h-5 lg:h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/2 mb-3"></div>
        <div className="h-3.5 lg:h-4.5 bg-gray-200 dark:bg-slate-700 rounded w-1/3"></div>
      </div>
    </div>
    <div className="w-20 h-6 lg:w-24 lg:h-8 rounded-full bg-gray-200 dark:bg-slate-700"></div>
  </div>
)

export const RecentApplicationsSection: React.FC<{ title?: string }> = ({ title }) => {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section id="recent-applications" className="px-3 lg:px-8 mt-10 lg:mt-16 mb-8 lg:mb-16">
      <h2 className="text-base lg:text-2xl font-bold text-gray-900 dark:text-white mb-5 lg:mb-8">{title ?? t('home.recentApplications')}</h2>
      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:gap-6">
        {isLoading
          ? Array.from({ length: 2 }).map((_, i) => <SkeletonApplicationCard key={`skel-app-${i}`} />)
          : applications.map(({ id, name, ref, status }) => (
              <div
                key={id}
                id={id}
                className="ui-hover-card bg-white dark:bg-slate-800 rounded-[24px] px-5 py-4 lg:px-8 lg:py-6 shadow-sm border border-gray-100 dark:border-slate-700/50 flex items-center justify-between gap-4 active:scale-[0.99]"
              >
                <div className="flex items-center gap-4 lg:gap-6">
                  <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-2xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center shrink-0 text-gray-500 dark:text-slate-300 shadow-inner">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6 lg:w-7 lg:h-7">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm lg:text-lg font-bold text-gray-900 dark:text-white leading-tight">{name}</p>
                    <p className="text-xs lg:text-base text-gray-400 dark:text-slate-400 mt-1">{ref}</p>
                  </div>
                </div>
                <span className={`text-[10px] lg:text-xs font-black px-3 py-1 lg:px-4 lg:py-1.5 rounded-full uppercase tracking-tighter ${statusStyles[status]}`}>
                  {t(`status.${status.toLowerCase()}`)}
                </span>
              </div>
            ))}
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────────────────────────────────
export const FooterSection: React.FC<{ rights?: string; onNavigate?: (tab: any) => void }> = ({ rights, onNavigate }) => {
  const { t } = useTranslation()

  return (
  <footer id="site-footer" className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 px-4 py-6 lg:px-8 lg:py-8 lg:flex lg:justify-between lg:items-center mt-2 lg:mt-8">
    <div className="lg:flex lg:items-center lg:gap-8">
      <div className="flex items-center justify-center lg:justify-start gap-1.5 text-blue-600 dark:text-blue-500 mb-1.5 lg:mb-0">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 lg:w-6 lg:h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
        </svg>
          <span className="font-bold text-gray-900 dark:text-white text-sm lg:text-base">{t('app.brand')}</span>
      </div>
      <p className="text-[11px] lg:text-sm text-gray-400 dark:text-slate-500 mb-4 lg:mb-0 text-center lg:text-left">
          © 2026 {t('app.brand')}. {rights ?? t('home.footerTagline')}
      </p>
    </div>
    
    <div className="lg:flex lg:items-center lg:gap-6">
      <div className="flex items-center justify-center gap-4 lg:gap-6 text-[11px] lg:text-sm font-medium text-gray-500 dark:text-slate-400 mb-3 lg:mb-0">
        <button id="footer-privacy-btn" onClick={() => onNavigate?.('privacy')} className="ui-hover-link hover:text-gray-900 dark:hover:text-slate-200 tap-scale transition-colors">{t('home.privacyPolicy')}</button>
        <button id="footer-terms-btn" onClick={() => onNavigate?.('terms')} className="ui-hover-link hover:text-gray-900 dark:hover:text-slate-200 tap-scale transition-colors">{t('home.terms')}</button>
        <button id="footer-help-btn" onClick={() => onNavigate?.('contact')} className="ui-hover-link hover:text-gray-900 dark:hover:text-slate-200 tap-scale transition-colors">{t('home.help') || 'Contact Us'}</button>
        <button
          id="footer-admin-login-btn"
          type="button"
          onClick={() => onNavigate?.('admin-login')}
          className="ui-hover-link inline-flex items-center gap-1 text-gray-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 tap-scale transition-colors"
          title="Admin Portal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
          Admin
        </button>
      </div>
      <div className="text-center lg:text-right">
        <a
          id="footer-location-link"
          href={GAZI_ONLINE_MAPS_URL}
          target="_blank"
          rel="noreferrer"
          className="ui-hover-pill inline-flex items-center gap-2 text-xs lg:text-sm text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-full px-4 py-1.5 lg:py-2 tap-scale hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors"
        >
          <MapPin className="h-4 w-4" />
          {t('home.location')}
        </a>
      </div>
    </div>
  </footer>
)}
// â”€â”€ Search Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const SearchSection: React.FC<{ query: string; onChange: (v: string) => void; isLoading?: boolean }> = ({ query, onChange, isLoading = false }) => {
  const { t } = useTranslation()

  return (
  <section id="search-section" className="px-3 lg:px-8 mt-6 lg:mt-10 animate-fade-in relative z-20">
    {isLoading ? (
      <div className="relative max-w-4xl mx-auto animate-pulse">
        <div className="rounded-[24px] border border-gray-100 bg-white px-6 py-4 shadow-lg dark:border-slate-700/50 dark:bg-slate-800 lg:px-7 lg:py-6">
          <div className="flex items-center gap-4">
            <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-slate-700" />
            <div className="h-4 flex-1 rounded-full bg-gray-200 dark:bg-slate-700 lg:h-5" />
          </div>
        </div>
      </div>
    ) : (
      <div className="relative max-w-4xl mx-auto group drop-shadow-xl hover:drop-shadow-2xl transition-all duration-300">
        <div className="relative flex items-center">
          <span className="absolute left-6 text-gray-400 dark:text-slate-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 lg:w-6 lg:h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder={t('home.searchPlaceholder')}
            value={query}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border-2 border-transparent dark:border-slate-700/50 rounded-[24px] py-4 lg:py-6 pl-16 pr-6 text-sm lg:text-lg text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 shadow-lg focus:border-blue-500 outline-none transition-all duration-300 focus:bg-gray-50/50 dark:focus:bg-slate-800/80"
          />
        </div>
      </div>
    )}
  </section>
)}


// â”€â”€ Quick Services Grid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const QUICK_SERVICE_ICONS: Record<string, { icon: LucideIcon }> = {
  'Apply PAN':    { icon: CreditCard },
  'Pay Bill':     { icon: Lightbulb },
  'Track Service': { icon: MapPin },
  'Recharge':      { icon: Zap },
  'Aadhaar':       { icon: Smartphone },
  'Income Cert.':  { icon: FileText },
  'Vehicle Tax':   { icon: Gift },
  'Google Play Redeem Codes': { icon: Gift },
  'Water Bill':    { icon: Droplets },
}

const QUICK_SERVICE_ALIASES: Record<string, LucideIcon> = {
  'apply pan': CreditCard,
  'pan card': CreditCard,
  'pan correction': CreditCard,
  'aadhaar': ShieldCheck,
  'aadhar': ShieldCheck,
  'aadhaar update': ShieldCheck,
  'voter id': BadgeCheck,
  'income certificate': FileText,
  'birth certificate': FileText,
  'death certificate': FileText,
  'domicile certificate': FileText,
  'residence certificate': Home,
  'trade license': BadgeCheck,
  'shop license': BadgeCheck,
  'business registration': Landmark,
  'track service': MapPin,
  'track application': MapPin,
  'application status': MapPin,
  'mobile recharge': Smartphone,
  'dth recharge': Smartphone,
  'electricity bill': Zap,
  'power bill': Zap,
  'water bill': Droplets,
  'gas bill': Receipt,
  'utility bill': Receipt,
  'property tax': Landmark,
  'municipal tax': Landmark,
  'land record': Landmark,
  'vehicle tax': Gift,
  'google play redeem codes': Gift,
  'google play code': Gift,
  'redeem code': Gift,
  'driving licence': Truck,
  'driving license': Truck,
  'rc transfer': Truck,
}

const QUICK_SERVICE_KEYWORDS: Array<{ words: string[]; icon: LucideIcon }> = [
  { words: ['pan', 'card'], icon: CreditCard },
  { words: ['aadhaar', 'aadhar', 'identity', 'kyc', 'verify'], icon: ShieldCheck },
  { words: ['certificate', 'income', 'birth', 'death', 'caste', 'document'], icon: FileText },
  { words: ['license', 'licence', 'permit', 'approval', 'trade'], icon: BadgeCheck },
  { words: ['track', 'status', 'application', 'reference'], icon: MapPin },
  { words: ['recharge', 'mobile', 'sim', 'dth'], icon: Smartphone },
  { words: ['electricity', 'power', 'energy'], icon: Zap },
  { words: ['water', 'pipeline'], icon: Droplets },
  { words: ['bill', 'payment', 'invoice', 'utility'], icon: Receipt },
  { words: ['property', 'municipal', 'land', 'tax', 'holding'], icon: Landmark },
  { words: ['vehicle', 'driving', 'transport', 'rc'], icon: Truck },
  { words: ['google', 'play', 'redeem', 'code', 'gift'], icon: Gift },
  { words: ['home', 'address', 'residence'], icon: Home },
]

const normalizeServiceText = (service: ServiceItem) =>
  `${service.name} ${service.description ?? ''}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const getQuickServiceIcon = (service: ServiceItem): LucideIcon => {
  if (service.icon) return service.icon

  const normalizedName = service.name.toLowerCase()
  const normalizedText = normalizeServiceText(service)
  const exactMatch = QUICK_SERVICE_ICONS[service.name]?.icon
  const aliasMatch = QUICK_SERVICE_ALIASES[normalizedName]

  if (exactMatch) return exactMatch
  if (aliasMatch) return aliasMatch

  for (const rule of QUICK_SERVICE_KEYWORDS) {
    if (rule.words.some((word) => normalizedText.includes(word))) {
      return rule.icon
    }
  }

  return Lightbulb
}

type HomeQuickTool = {
  id: string
  name: string
  icon: LucideIcon
  accent: string
}

const HOME_QUICK_TOOLS: HomeQuickTool[] = [
  { id: 'passport-photo', name: 'Passport Photo', icon: FileImage, accent: 'text-sky-600 dark:text-sky-400' },
  { id: 'image-to-pdf', name: 'Image to PDF', icon: FileText, accent: 'text-blue-600 dark:text-blue-400' },
  { id: 'pdf-merge', name: 'PDF Merge', icon: Scissors, accent: 'text-violet-600 dark:text-violet-400' },
  { id: 'qr-generator', name: 'QR Generator', icon: QrCode, accent: 'text-emerald-600 dark:text-emerald-400' },
  { id: 'cv-maker', name: 'CV Maker', icon: BriefcaseBusiness, accent: 'text-amber-600 dark:text-amber-400' },
  { id: 'signature-clean', name: 'Signature Fix', icon: Signature, accent: 'text-rose-600 dark:text-rose-400' },
  { id: 'age-calculator', name: 'Age Calc', icon: Calculator, accent: 'text-cyan-600 dark:text-cyan-400' },
  { id: 'visiting-card', name: 'Visiting Card', icon: CreditCard, accent: 'text-indigo-600 dark:text-indigo-400' },
]

export const QuickServicesGrid: React.FC<{ 
  onStartService?: (title: string, desc: string) => void; 
  onViewAll?: () => void;
  title?: string;
  services: ServiceItem[];
  isLoading?: boolean;
}> = ({ onStartService, onViewAll, title, services, isLoading = false }) => {
  const { t } = useTranslation()
  const quickServices = services?.filter(
    (service) => service.name.trim().toLowerCase() !== 'track service'
  ) ?? []

  return (
    <section id="quick-services-grid" className="px-3 lg:px-8 mt-8 lg:mt-14">
      <div className="flex items-center justify-between mb-5 lg:mb-8">
        <h2 className="text-base lg:text-2xl font-extrabold text-gray-900 dark:text-white">{title ?? t('home.quickServices')}</h2>
        <button
          type="button"
          onClick={onViewAll}
          className="ui-hover-link text-sm lg:text-base font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 tap-scale"
        >
          {t('common.viewAll')} <ArrowRightIcon />
        </button>
      </div>
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-3 lg:gap-5">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2.5 animate-pulse">
                <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-gray-200 dark:bg-slate-700 shadow-inner"></div>
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-12"></div>
              </div>
            ))
          : quickServices.slice(0, 8).map((service, i) => {
              const Icon = service.icon ?? getQuickServiceIcon(service)
               const displayName = getServiceDisplayName(service.name)
               const displayDescription = getServiceDisplayDescription(service.name, service.description)

              return (
                <button
                  key={service.id}
                   onClick={() => onStartService?.(service.name, displayDescription)}
                  className="flex flex-col items-center gap-2.5 lg:gap-3 group animate-slide-up"
                  style={{ animationDelay: `${(i + 1) * 50}ms` }}
                >
                  <span className="ui-hover-icon w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:shadow-md group-active:scale-95 transition-all duration-300">
                    <Icon className="w-7 h-7 text-gray-800 dark:text-white" strokeWidth={2} />
                  </span>
                  <span className="text-[11px] lg:text-xs font-bold text-gray-700 dark:text-slate-300 text-center leading-tight">{displayName}</span>
                </button>
              )
            })}
      </div>
    </section>
  )
}

export const QuickToolsGrid: React.FC<{
  onOpenTools?: () => void
  onViewAll?: () => void
  title?: string
  isLoading?: boolean
}> = ({ onOpenTools, onViewAll, title, isLoading = false }) => {
  const { t } = useTranslation()

  return (
    <section id="quick-tools-grid" className="px-3 lg:px-8 mt-8 lg:mt-10">
      <div className="flex items-center justify-between mb-5 lg:mb-8">
        <h2 className="text-base lg:text-2xl font-extrabold text-gray-900 dark:text-white">{title ?? t('home.quickTools')}</h2>
        <button
          type="button"
          onClick={onViewAll}
          className="ui-hover-link text-sm lg:text-base font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 tap-scale"
        >
          {t('common.viewAll')} <ArrowRightIcon />
        </button>
      </div>
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-3 lg:gap-5">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={`quick-tool-skel-${i}`} className="flex flex-col items-center gap-2.5 animate-pulse">
                <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-gray-200 dark:bg-slate-700 shadow-inner"></div>
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-12"></div>
              </div>
            ))
          : HOME_QUICK_TOOLS.map((tool, i) => {
              const Icon = tool.icon

              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={onOpenTools}
                  className="flex flex-col items-center gap-2.5 lg:gap-3 group animate-slide-up"
                  style={{ animationDelay: `${(i + 1) * 50}ms` }}
                >
                  <span className="ui-hover-icon w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:shadow-md group-active:scale-95 transition-all duration-300">
                    <Icon className={`w-7 h-7 ${tool.accent}`} strokeWidth={2} />
                  </span>
                  <span className="text-[11px] lg:text-xs font-bold text-gray-700 dark:text-slate-300 text-center leading-tight">{tool.name}</span>
                </button>
              )
            })}
      </div>
    </section>
  )
}

// Featured Products (Horizontal Scroll) will use types from lib/types

const parseProductPrice = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const numericValue = Number(value.replace(/[^0-9.]+/g, ''))
    if (Number.isFinite(numericValue)) {
      return numericValue
    }
  }

  return null
}

const formatProductPrice = (value: unknown) => {
  const parsedPrice = parseProductPrice(value)
  return parsedPrice === null ? formatLocalizedCurrency(0) : formatLocalizedCurrency(parsedPrice)
}

const normalizeProductRating = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.min(5, value))
  }

  if (typeof value === 'string') {
    const numericValue = Number(value)
    if (Number.isFinite(numericValue)) {
      return Math.max(0, Math.min(5, numericValue))
    }
  }

  return 4.6
}

export const ProductCard = React.memo<Product & {
  onAddToCart?: (product: Omit<Product, 'category'>) => void
  onViewProduct?: (product: Product) => void
}>(({ id, name, price, category, image, onAddToCart, onViewProduct, ...rest }) => {
  const { t } = useTranslation()
  const displayPrice = formatProductPrice(price);
  const productPayload: Product = { id, name, price, category, image, ...rest };
  const rating = normalizeProductRating(rest.rating);
  const isOutOfStock = Number(rest.stock ?? 0) <= 0 || rest.is_active === false;

  return (
    <div
      className="ui-hover-row-card min-w-[180px] lg:min-w-[280px] bg-white dark:bg-slate-800 rounded-[28px] p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-slate-700/50 active:scale-[0.98] group cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={() => onViewProduct?.(productPayload)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onViewProduct?.(productPayload);
        }
      }}
      aria-label={t('products.viewDetails')}
    >
      <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 bg-gray-50 dark:bg-slate-900/50">
        <img src={image} alt={name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute left-2 top-2">
          <span className="max-w-full truncate rounded-full bg-blue-600 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white sm:text-[10px]">
            {category}
          </span>
        </div>
      </div>
      <h3 className="font-bold text-gray-900 dark:text-white text-sm lg:text-lg mb-1 truncate">{name}</h3>
      <div className="mb-2 flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${isOutOfStock ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isOutOfStock ? 'bg-rose-500' : 'bg-emerald-500'}`} />
          {isOutOfStock ? t('status.outOfStock') : t('status.inStock')}
        </span>
      </div>
      <div className="mb-3 flex items-center gap-2">
        <div className="flex items-center gap-0.5 text-amber-400">
          {Array.from({ length: 5 }).map((_, index) => (
            <svg key={index} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={index < Math.round(rating) ? 'currentColor' : 'none'} stroke="currentColor" className="h-3.5 w-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
            </svg>
          ))}
        </div>
        <span className="text-xs font-bold text-gray-500 dark:text-slate-400">{rating.toFixed(1)}</span>
      </div>
      <div className="flex items-center justify-between gap-2 mt-auto">
        <span className="text-blue-600 dark:text-blue-400 font-extrabold lg:text-xl">{displayPrice}</span>
        <button 
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onAddToCart?.({ id, name, price, image });
          }}
          disabled={isOutOfStock}
          className="ui-hover-primary bg-gray-900 dark:bg-blue-600 text-white p-2 lg:p-3 rounded-xl hover:bg-black dark:hover:bg-blue-500 tap-scale disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
          aria-label={isOutOfStock ? t('status.outOfStock') : t('products.addToCart')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export const SkeletonProductCard: React.FC = () => (
  <div className="min-w-[180px] lg:min-w-[280px] bg-white dark:bg-slate-800 rounded-[28px] p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-slate-700/50 animate-pulse">
    <div className="aspect-square rounded-2xl bg-gray-200 dark:bg-slate-700 mb-4" />
    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-2/3 mb-4" />
    <div className="flex justify-between items-center">
      <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/3" />
      <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-xl" />
    </div>
  </div>
)

export const FeaturedProducts: React.FC<{ 
  query: string; 
  onAddToCart?: (product: Omit<Product, 'category'>) => void; 
  onViewProduct?: (product: Product) => void;
  title?: string;
  products: Product[];
  isLoading?: boolean;
}> = ({ query, onAddToCart, onViewProduct, title, products, isLoading = false }) => {
  const { t } = useTranslation()
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const filtered = products?.filter(p => p.name.toLowerCase().includes(query.toLowerCase())) ?? []

  const syncScrollButtons = () => {
    const container = scrollContainerRef.current
    if (!container) return

    const maxScrollLeft = container.scrollWidth - container.clientWidth
    setCanScrollLeft(container.scrollLeft > 4)
    setCanScrollRight(maxScrollLeft - container.scrollLeft > 4)
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    syncScrollButtons()
    const frameId = window.requestAnimationFrame(syncScrollButtons)
    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncScrollButtons) : null
    resizeObserver?.observe(container)
    container.addEventListener('scroll', syncScrollButtons, { passive: true })
    window.addEventListener('resize', syncScrollButtons)

    return () => {
      window.cancelAnimationFrame(frameId)
      resizeObserver?.disconnect()
      container.removeEventListener('scroll', syncScrollButtons)
      window.removeEventListener('resize', syncScrollButtons)
    }
  }, [filtered.length, isLoading])

  const handleScrollProducts = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (!container) return

    const scrollAmount = Math.max(container.clientWidth * 0.8, 220)
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
    window.setTimeout(syncScrollButtons, 320)
  }

  if (!isLoading && filtered.length === 0) return null

  return (
    <section id="featured-products" className="mt-10 lg:mt-16">
      <div className="px-3 lg:px-8 flex items-center justify-between mb-6 lg:mb-10">
        <h2 className="text-base lg:text-3xl font-bold text-gray-900 dark:text-white">{title ?? t('home.featuredProducts')}</h2>
        <div className="flex gap-2">
           <button
             type="button"
             onClick={() => handleScrollProducts('left')}
             aria-disabled={!canScrollLeft}
             aria-label={t('common.viewAll')}
             className={`ui-hover-icon bg-white dark:bg-slate-800 p-2 lg:p-3 rounded-full border border-gray-100 dark:border-slate-700/50 transition dark:hover:border-slate-600 ${
               canScrollLeft
                 ? 'text-gray-400 hover:text-gray-700 hover:border-gray-200 dark:hover:text-slate-200'
                 : 'cursor-default text-gray-300 opacity-50'
             }`}
           >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 lg:w-5 lg:h-5">
               <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
             </svg>
            </button>
            <button
              type="button"
              onClick={() => handleScrollProducts('right')}
              aria-disabled={!canScrollRight}
               aria-label={t('common.viewAll')}
              className={`ui-hover-icon bg-white dark:bg-slate-800 p-2 lg:p-3 rounded-full border border-gray-100 dark:border-slate-700/50 transition dark:hover:border-slate-600 ${
                canScrollRight
                  ? 'text-blue-600 hover:text-blue-700 hover:border-blue-100 dark:hover:text-blue-300'
                  : 'cursor-default text-blue-300 opacity-50'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 lg:w-5 lg:h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
           </div>
         </div>
      <div ref={scrollContainerRef} className="flex gap-4 lg:gap-8 overflow-x-auto px-3 lg:px-8 pt-2 pb-8 lg:pb-12 scrollbar-none snap-x">
        {isLoading 
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonProductCard key={i} />)
          : filtered?.map((prod) => <ProductCard key={prod.id} {...prod} onAddToCart={onAddToCart} onViewProduct={onViewProduct} />)
        }
      </div>
    </section>
  )
}

// â”€â”€ Offers Banner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const OffersBanner: React.FC<{ title?: string; subtitle?: string; buttonText?: string; isLoading?: boolean }> = ({ 
  title,
  subtitle,
  buttonText,
  isLoading = false,
}) => {
  const { t } = useTranslation()

  return (
  <section id="offers-banner" className="px-3 lg:px-8 mt-6">
    {isLoading ? (
      <div className="animate-pulse rounded-[28px] border border-blue-100 bg-white p-6 shadow-sm dark:border-slate-700/50 dark:bg-slate-800 lg:p-14">
        <div className="lg:flex lg:items-center lg:justify-between">
          <div className="flex-1">
            <div className="mb-4 h-7 w-28 rounded-full bg-blue-100 dark:bg-slate-700 lg:mb-6 lg:h-9 lg:w-36" />
            <div className="mb-3 h-8 w-4/5 rounded-2xl bg-gray-200 dark:bg-slate-700 lg:h-14" />
            <div className="mb-2 h-8 w-3/5 rounded-2xl bg-gray-200 dark:bg-slate-700 lg:h-14" />
            <div className="mt-5 h-4 w-2/3 rounded-full bg-gray-200 dark:bg-slate-700 lg:h-6" />
          </div>
          <div className="mt-6 h-14 w-36 rounded-2xl bg-gray-200 dark:bg-slate-700 lg:mt-0 lg:h-16 lg:w-48" />
        </div>
      </div>
    ) : (
      <div className="ui-hover-card bg-blue-600 dark:bg-blue-500 rounded-[28px] p-6 lg:p-14 text-white relative overflow-hidden group">
        <div className="relative z-10 lg:flex lg:items-center lg:justify-between">
          <div>
            <span className="bg-white/20 text-[10px] lg:text-xs font-black uppercase tracking-[2px] px-3 py-1 lg:px-4 lg:py-2 rounded-full mb-4 lg:mb-6 inline-block">{t('home.offersBadge')}</span>
            <h2 className="text-2xl lg:text-5xl font-black mb-2 lg:mb-4 leading-tight whitespace-pre-line">{title ?? t('home.offersTitle')}</h2>
            <p className="text-white/80 text-sm lg:text-xl font-medium mb-6 lg:mb-0">{subtitle ?? t('home.offersSubtitle')}</p>
          </div>
          <button className="ui-hover-primary bg-white text-blue-600 px-8 py-4 lg:px-12 lg:py-5 rounded-2xl font-black text-sm lg:text-lg hover:bg-gray-50 active:scale-95 shadow-xl">
            {buttonText ?? t('home.shopNow')}
          </button>
        </div>
      </div>
    )}
  </section>
)}

// â”€â”€ Customer Reviews â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

const ReviewAvatar: React.FC<Pick<CustomerReview, 'name' | 'avatar'>> = ({ name, avatar }) => (
  avatar ? (
    <img src={avatar} alt={name} className="w-12 h-12 lg:w-16 lg:h-16 rounded-full border-2 border-blue-500/20 object-cover" />
  ) : (
    <div className="flex w-12 h-12 lg:w-16 lg:h-16 items-center justify-center rounded-full border-2 border-blue-500/15 bg-gradient-to-br from-blue-100 via-cyan-100 to-sky-200 text-sm font-black uppercase tracking-[0.12em] text-blue-700 dark:border-blue-400/20 dark:from-blue-500/15 dark:via-cyan-500/10 dark:to-sky-500/15 dark:text-blue-200">
      {getInitials(name)}
    </div>
  )
)

export const ReviewCard: React.FC<CustomerReview> = ({ name, rating, comment, avatar }) => (
  <div className="ui-hover-row-card min-w-[280px] lg:min-w-[340px] bg-white dark:bg-slate-800 rounded-[28px] p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-slate-700/50 snap-center">
    <div className="flex items-center gap-4 mb-5">
      <ReviewAvatar name={name} avatar={avatar} />
      <div>
        <h4 className="font-bold text-gray-900 dark:text-white text-sm lg:text-lg">{name}</h4>
        <div className="flex gap-0.5 text-amber-400 mt-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={i < rating ? "currentColor" : "none"} stroke="currentColor" className="w-3 h-3 lg:w-4 lg:h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
            </svg>
          ))}
        </div>
      </div>
    </div>
    <p className="text-gray-600 dark:text-slate-400 text-xs lg:text-base italic leading-relaxed font-medium">â€œ{comment}â€</p>
  </div>
)

export const SkeletonReviewCard: React.FC = () => (
  <div className="min-w-[280px] lg:min-w-[340px] bg-white dark:bg-slate-800 rounded-[28px] p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-slate-700/50 animate-pulse">
    <div className="flex items-center gap-4 mb-5">
      <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-gray-200 dark:bg-slate-700" />
      <div className="flex-1">
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2 mb-2" />
        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/4" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-full" />
      <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-4/5" />
    </div>
  </div>
)

export const CustomerReviews: React.FC<{ title?: string }> = ({ title }) => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [reviews, setReviews] = useState<CustomerReview[]>([])

  useEffect(() => {
    let isMounted = true

    const loadReviews = async () => {
      try {
        const data = await reviewsApi.fetchReviews()
        if (isMounted) {
          setReviews(data)
        }
      } catch (error) {
        console.error('Failed to load customer reviews:', error)
        if (isMounted) {
          addToast({
            type: 'error',
            title: t('home.reviewsUnavailableTitle'),
            message: t('home.reviewsUnavailableMessage'),
          })
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadReviews()

    return () => {
      isMounted = false
    }
  }, [addToast, t])

  return (
    <section id="customer-reviews" className="mt-10 lg:mt-16">
      <div className="px-3 lg:px-8 mb-6 lg:mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base lg:text-3xl font-bold text-gray-900 dark:text-white">{title ?? t('home.whatCitizensSay')}</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            {t('home.reviewPrompt')}
          </p>
        </div>
        <a
          href={GAZI_ONLINE_MAPS_URL}
          target="_blank"
          rel="noreferrer"
          className="ui-hover-primary inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/25"
        >
          {t('home.writeReview')}
        </a>
      </div>
      <div className="flex gap-4 lg:gap-8 overflow-x-auto px-3 lg:px-8 pt-2 pb-8 lg:pb-12 scrollbar-none snap-x">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonReviewCard key={i} />)
          : reviews.map((rev) => <ReviewCard key={rev.id} {...rev} />)
        }
      </div>
    </section>
  )
}

// â”€â”€ Why Choose Us â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const features = [
  { 
    titleKey: 'home.fastService', 
    textKey: 'home.fastServiceDescription',
    icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,
    color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/30'
  },
  { 
    titleKey: 'home.securePayments', 
    textKey: 'home.securePaymentsDescription',
    icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>,
    color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/30'
  },
  { 
    titleKey: 'home.support247', 
    textKey: 'home.support247Description',
    icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/></svg>,
    color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/30'
  },
]

const SkeletonFeatureCard: React.FC = () => (
  <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm animate-pulse dark:border-slate-700/50 dark:bg-slate-800 lg:p-10">
    <div className="mb-6 h-14 w-14 rounded-2xl bg-gray-200 shadow-inner dark:bg-slate-700" />
    <div className="mb-3 h-6 w-2/3 rounded-full bg-gray-200 dark:bg-slate-700 lg:h-8" />
    <div className="mb-2 h-4 w-full rounded-full bg-gray-200 dark:bg-slate-700 lg:h-5" />
    <div className="h-4 w-5/6 rounded-full bg-gray-200 dark:bg-slate-700 lg:h-5" />
  </div>
)

export const WhyChooseUs: React.FC<{ title?: string; isLoading?: boolean }> = ({ title, isLoading = false }) => {
  const { t } = useTranslation()

  return (
  <section id="why-choose-us" className="px-3 lg:px-8 mt-6 lg:mt-12">
    <h2 className="mb-4 text-base font-bold text-gray-900 dark:text-white lg:mb-8 lg:text-3xl">{title ?? t('home.whyChooseUs')}</h2>
    <div className="grid lg:grid-cols-3 gap-4 lg:gap-8">
      {isLoading
        ? Array.from({ length: 3 }).map((_, i) => <SkeletonFeatureCard key={`skel-why-${i}`} />)
        : features.map((f, i) => (
            <div key={i} className="ui-hover-card bg-white dark:bg-slate-800 p-6 lg:p-10 rounded-[28px] border border-gray-100 dark:border-slate-700/50 shadow-sm first:bg-blue-50/30 dark:first:bg-blue-900/10">
              <span className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner ${f.bg} ${f.color}`}>{f.icon}</span>
              <h3 className="text-lg lg:text-2xl font-black text-gray-900 dark:text-white mb-3">{t(f.titleKey)}</h3>
              <p className="text-gray-500 dark:text-slate-400 text-sm lg:text-lg font-medium leading-relaxed">{t(f.textKey)}</p>
            </div>
          ))}
    </div>
  </section>
)}

// â”€â”€ App CTA Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const AppCTASection: React.FC<{ title?: React.ReactNode; desc?: string; buttonText?: string; isLoading?: boolean }> = ({ 
  title,
  desc,
  buttonText,
  isLoading = false,
}) => {
  const { t } = useTranslation()

  return (
  <section id="app-cta" className="px-3 lg:px-8 mt-12 lg:mt-24 mb-10">
    {isLoading ? (
      <div className="animate-pulse rounded-[32px] bg-[#1e293b] p-8 text-white shadow-sm lg:p-20">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full max-w-2xl">
            <div className="mb-4 h-10 w-3/4 rounded-2xl bg-white/15 lg:mb-6 lg:h-16" />
            <div className="mb-3 h-10 w-1/2 rounded-2xl bg-blue-300/20 lg:h-16" />
            <div className="h-4 w-5/6 rounded-full bg-white/15 lg:h-6" />
          </div>
          <div className="flex w-full flex-col gap-4 sm:flex-row lg:w-auto">
            <div className="h-16 flex-1 rounded-2xl bg-white/15 lg:w-52 lg:flex-none" />
            <div className="h-16 flex-1 rounded-2xl bg-white/20 lg:w-52 lg:flex-none" />
          </div>
        </div>
      </div>
    ) : (
      <div className="ui-hover-card bg-[#1e293b] dark:bg-blue-600 rounded-[32px] p-8 lg:p-20 text-white relative flex flex-col lg:flex-row items-center justify-between gap-10">
        <div className="absolute inset-0 opacity-10 pointer-events-none" />
        <div className="text-center lg:text-left relative z-10">
          <h2 className="text-3xl lg:text-6xl font-black mb-4 lg:mb-6">{title ?? <>{t('home.alwaysConnected')}<br /><span className="text-blue-400 dark:text-blue-200">{t('home.everywhere')}</span></>}</h2>
          <p className="text-white/70 text-sm lg:text-2xl max-w-xl font-medium">{desc ?? t('home.appDescription')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto relative z-10">
          <button className="ui-hover-primary flex-1 lg:flex-none flex items-center justify-center gap-3 bg-[#25D366] px-8 py-5 rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all shadow-xl shadow-green-500/20">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.408.001 12.045a11.811 11.811 0 001.592 5.923L0 24l6.102-1.6c1.808.985 3.848 1.503 5.94 1.503h.005c6.637 0 12.046-5.409 12.049-12.047a11.821 11.821 0 00-3.582-8.514"/></svg>
            {t('home.whatsappHelp')}
          </button>
          <button className="ui-hover-primary flex-1 lg:flex-none flex items-center justify-center gap-3 bg-white text-gray-900 px-8 py-5 rounded-2xl font-bold hover:bg-gray-100 active:scale-95 transition-all shadow-xl">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.523 15.303c-.55 0-1 .445-1 1s.45 1 1 1 1-.445 1-1-.45-1-1-1zm-4.5 0c-.55 0-1 .445-1 1s.45 1 1 1 1-.445 1-1-.45-1-1-1zm6-6.5c0-.55-.45-1-1-1H3.977c-.55 0-1 .45-1 1v12.045c0 .55.45 1 1 1h12.045c.55 0 1-.45 1-1V8.803zM3.977 4.5l8.023 8.023L20.023 4.5H3.977z"/></svg>
            {buttonText ?? t('home.downloadApp')}
          </button>
        </div>
      </div>
    )}
  </section>
)}

export const EmptyState: React.FC = () => {
  const { t } = useTranslation()

  return (
  <div className="text-center py-20 lg:py-32 animate-fade-in">
    <div className="w-24 h-24 lg:w-32 lg:h-32 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 lg:mb-8 text-4xl lg:text-5xl">
       ðŸ”Ž
    </div>
    <h3 className="text-lg lg:text-2xl font-black text-gray-900 dark:text-white mb-2">{t('home.noResultsTitle')}</h3>
    <p className="text-gray-500 dark:text-slate-400 text-sm lg:text-lg max-w-sm mx-auto font-medium">{t('home.noResultsDescription')}</p>
  </div>
)}

