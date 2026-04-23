import React, { useEffect, useMemo, useState } from 'react'
import { type User } from '@supabase/supabase-js'
import { useTranslation } from 'react-i18next'
import { authApi } from '../api/auth'
import {
  profileSettingsApi,
  type LinkedAccount,
  type LinkedAccountType,
  type NotificationPreferences,
} from '../api/profileSettings'
import { useToast } from './toast/useToast'
import { LANGUAGE_LABELS, type Language } from '../lib/i18n'

export const PROFILE_BASE_PATH = '/profile'

export type ProfileSectionId =
  | 'personal'
  | 'linked'
  | 'notifications'
  | 'security'
  | 'language'
  | 'help'

type ProfileStats = {
  total: number
  active: number
  completed: number
}

type ProfilePageProps = {
  user: User | null
  onLogout: () => void
  onSignIn: () => void
  isAdmin?: boolean
  onOpenAdmin?: () => void
  language: Language
  onLanguageChange: (language: Language) => void
  onUserChange?: (user: User) => void
  stats: ProfileStats
  isStatsLoading?: boolean
  currentPath: string
  onNavigate: (section: ProfileSectionId | null) => void
}

type PersonalFormState = {
  name: string
  phone: string
  email: string
}

type SecurityFormState = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

type LinkedFormState = {
  type: LinkedAccountType
  value: string
}

type SectionMeta = {
  id: ProfileSectionId
  label: string
  sublabel: string
  icon: string
  accent: string
}

const PUBLIC_SECTIONS = new Set<ProfileSectionId>(['language', 'help'])

const PROFILE_SECTIONS: Array<Omit<SectionMeta, 'label' | 'sublabel'> & { labelKey: string; sublabelKey: string }> = [
  { id: 'personal', labelKey: 'profile.sections.personal.title', sublabelKey: 'profile.sections.personal.subtitle', icon: 'PI', accent: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200' },
  { id: 'linked', labelKey: 'profile.sections.linked.title', sublabelKey: 'profile.sections.linked.subtitle', icon: 'ID', accent: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200' },
  { id: 'notifications', labelKey: 'profile.sections.notifications.title', sublabelKey: 'profile.sections.notifications.subtitle', icon: 'NT', accent: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200' },
  { id: 'security', labelKey: 'profile.sections.security.title', sublabelKey: 'profile.sections.security.subtitle', icon: 'SC', accent: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200' },
  { id: 'language', labelKey: 'profile.sections.language.title', sublabelKey: 'profile.sections.language.subtitle', icon: 'LN', accent: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-200' },
  { id: 'help', labelKey: 'profile.sections.help.title', sublabelKey: 'profile.sections.help.subtitle', icon: 'HS', accent: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200' },
]

const FAQ_ITEM_IDS = ['track', 'documents', 'notifications'] as const

const defaultNotifications: NotificationPreferences = {
  sms: true,
  email: true,
  app: true,
}

const defaultLinkedForm: LinkedFormState = {
  type: 'aadhaar',
  value: '',
}

const defaultSecurityForm: SecurityFormState = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^\+?[0-9\s-]{10,15}$/
const aadhaarPattern = /^\d{12}$/
const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]$/
const voterPattern = /^[A-Z0-9]{8,16}$/

export const getProfileSectionFromPath = (pathname: string): ProfileSectionId | null => {
  if (!pathname.startsWith(PROFILE_BASE_PATH)) {
    return null
  }

  const section = pathname.slice(PROFILE_BASE_PATH.length + 1)
  if (!section) {
    return null
  }

  return PROFILE_SECTIONS.find((item) => item.id === section)?.id ?? null
}

const createPersonalForm = (user: User | null): PersonalFormState => ({
  name: user?.user_metadata?.name ?? '',
  phone: user?.user_metadata?.phone ?? '',
  email: user?.email ?? '',
})

const maskValue = (value: string, emptyLabel: string) => {
  if (!value) {
    return emptyLabel
  }

  if (value.length <= 4) {
    return value
  }

  return `${value.slice(0, 2)}${'*'.repeat(Math.max(0, value.length - 4))}${value.slice(-2)}`
}

const getLinkedAccountLabel = (
  type: LinkedAccountType,
  t: (key: string, options?: Record<string, unknown>) => string,
) => {
  if (type === 'aadhaar') return t('profile.linked.aadhaar')
  if (type === 'pan') return t('profile.linked.pan')
  return t('profile.linked.voter')
}

const getLinkedAccountHint = (
  type: LinkedAccountType,
  t: (key: string, options?: Record<string, unknown>) => string,
) => {
  if (type === 'aadhaar') return t('profile.linked.aadhaarHint')
  if (type === 'pan') return t('profile.linked.panHint')
  return t('profile.linked.voterHint')
}

const validateLinkedAccount = (
  type: LinkedAccountType,
  value: string,
  t: (key: string, options?: Record<string, unknown>) => string,
) => {
  const sanitizedValue = value.trim().toUpperCase()

  if (!sanitizedValue) {
    return t('validation.linkedAccountRequired')
  }

  if (type === 'aadhaar' && !aadhaarPattern.test(sanitizedValue)) {
    return t('validation.aadhaarInvalid')
  }

  if (type === 'pan' && !panPattern.test(sanitizedValue)) {
    return t('validation.panInvalid')
  }

  if (type === 'voter' && !voterPattern.test(sanitizedValue)) {
    return t('validation.voterInvalid')
  }

  return ''
}

const validatePersonalForm = (
  form: PersonalFormState,
  t: (key: string, options?: Record<string, unknown>) => string,
) => {
  const errors: Partial<Record<keyof PersonalFormState, string>> = {}

  if (form.name.trim().length < 2) {
    errors.name = t('validation.fullNameRequired')
  }

  if (!emailPattern.test(form.email.trim())) {
    errors.email = t('validation.emailInvalid')
  }

  if (form.phone.trim() && !phonePattern.test(form.phone.trim())) {
    errors.phone = t('validation.phoneInvalid')
  }

  return errors
}

const validateSecurityForm = (
  form: SecurityFormState,
  t: (key: string, options?: Record<string, unknown>) => string,
) => {
  const errors: Partial<Record<keyof SecurityFormState, string>> = {}

  if (!form.currentPassword) {
    errors.currentPassword = t('validation.currentPasswordRequired')
  }

  if (form.newPassword.length < 8) {
    errors.newPassword = t('validation.newPasswordMin')
  } else if (!/[0-9]/.test(form.newPassword)) {
    errors.newPassword = t('validation.newPasswordNumber')
  }

  if (form.confirmPassword !== form.newPassword) {
    errors.confirmPassword = t('validation.confirmPasswordMismatch')
  }

  return errors
}

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
  </svg>
)

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
)

const SectionButton = ({
  item,
  onClick,
  disabled,
}: {
  item: SectionMeta
  onClick: () => void
  disabled?: boolean
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="group flex w-full items-center gap-4 rounded-[24px] border border-gray-100 bg-white/90 p-4 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700/60 dark:bg-slate-900/80 dark:hover:shadow-none"
  >
    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-black ${item.accent}`}>
      {item.icon}
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-bold text-slate-900 dark:text-white">{item.label}</p>
      <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{item.sublabel}</p>
    </div>
    <span className="text-slate-400 transition-transform duration-300 group-hover:translate-x-1 dark:text-slate-500">
      <ChevronRightIcon />
    </span>
  </button>
)

const StatCard = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
  <div className="rounded-[24px] border border-gray-100 bg-white/90 p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
    <div className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">{label}</div>
    <div className="mt-3 flex items-center justify-between">
      <span className="text-2xl font-black text-slate-900 dark:text-white">{value}</span>
      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        {icon}
      </span>
    </div>
  </div>
)

const SkeletonCard = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-[24px] bg-slate-200/80 dark:bg-slate-800 ${className ?? ''}`} />
)

const FieldShell = ({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) => (
  <label className="block">
    <div className="mb-2 flex items-center justify-between gap-3">
      <span className="text-sm font-bold text-slate-900 dark:text-white">{label}</span>
      {hint ? <span className="text-xs font-medium text-slate-400 dark:text-slate-500">{hint}</span> : null}
    </div>
    {children}
    {error ? <p className="mt-2 text-xs font-semibold text-red-500">{error}</p> : null}
  </label>
)

const Drawer = ({
  title,
  description,
  onClose,
  children,
}: {
  title: string
  description: string
  onClose: () => void
  children: React.ReactNode
}) => (
  <div
    className="fixed inset-0 z-[150] flex items-end bg-slate-950/45 backdrop-blur-sm md:items-center md:justify-center"
    onClick={onClose}
  >
    <div
      className="max-h-[92vh] w-full overflow-hidden rounded-t-[32px] bg-[#f8fafc] shadow-2xl dark:bg-slate-950 md:h-[88vh] md:max-h-[860px] md:max-w-2xl md:rounded-[36px]"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="border-b border-slate-200/80 px-5 pb-4 pt-5 dark:border-slate-800 md:px-8 md:pb-5 md:pt-7">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700 md:hidden" />
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-black text-slate-900 dark:text-white md:text-3xl">{title}</h2>
            <p className="mt-2 max-w-xl text-sm font-medium text-slate-500 dark:text-slate-400">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            <CloseIcon />
          </button>
        </div>
      </div>
      <div className="max-h-[calc(92vh-96px)] overflow-y-auto px-5 py-6 md:max-h-[calc(88vh-110px)] md:px-8 md:py-8">
        {children}
      </div>
    </div>
  </div>
)

const ToggleRow = ({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) => (
  <div className="flex items-center justify-between gap-4 rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="min-w-0">
      <p className="text-sm font-bold text-slate-900 dark:text-white">{label}</p>
      <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{description}</p>
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
        checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
          checked ? 'left-6' : 'left-1'
        }`}
      />
    </button>
  </div>
)

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  onLogout,
  onSignIn,
  isAdmin = false,
  onOpenAdmin,
  language,
  onLanguageChange,
  onUserChange,
  stats,
  isStatsLoading = false,
  currentPath,
  onNavigate,
}) => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const activeSection = useMemo(() => getProfileSectionFromPath(currentPath), [currentPath])
  const profileSections = useMemo<SectionMeta[]>(
    () =>
      PROFILE_SECTIONS.map((item) => ({
        id: item.id,
        label: t(item.labelKey),
        sublabel: t(item.sublabelKey),
        icon: item.icon,
        accent: item.accent,
      })),
    [t],
  )
  const faqItems = useMemo(
    () => [
      {
        id: 'track',
        question: t('profile.help.faq.trackQuestion'),
        answer: t('profile.help.faq.trackAnswer'),
      },
      {
        id: 'documents',
        question: t('profile.help.faq.documentsQuestion'),
        answer: t('profile.help.faq.documentsAnswer'),
      },
      {
        id: 'notifications',
        question: t('profile.help.faq.notificationsQuestion'),
        answer: t('profile.help.faq.notificationsAnswer'),
      },
    ],
    [t],
  )
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [personalForm, setPersonalForm] = useState<PersonalFormState>(() => createPersonalForm(user))
  const [personalErrors, setPersonalErrors] = useState<Partial<Record<keyof PersonalFormState, string>>>({})
  const [notificationForm, setNotificationForm] = useState<NotificationPreferences>(defaultNotifications)
  const [securityForm, setSecurityForm] = useState<SecurityFormState>(defaultSecurityForm)
  const [securityErrors, setSecurityErrors] = useState<Partial<Record<keyof SecurityFormState, string>>>({})
  const [linkedAccounts, setLinkedAccounts] = useState<Record<LinkedAccountType, LinkedAccount>>({
    aadhaar: { type: 'aadhaar', label: '', value: '', verified: false, updatedAt: null },
    pan: { type: 'pan', label: '', value: '', verified: false, updatedAt: null },
    voter: { type: 'voter', label: '', value: '', verified: false, updatedAt: null },
  })
  const [linkedForm, setLinkedForm] = useState<LinkedFormState>(defaultLinkedForm)
  const [linkedError, setLinkedError] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language)
  const [activeFaqId, setActiveFaqId] = useState<string | null>(FAQ_ITEM_IDS[0] ?? null)
  const [savingSection, setSavingSection] = useState<ProfileSectionId | null>(null)
  const [verifyingAccount, setVerifyingAccount] = useState<LinkedAccountType | null>(null)

  useEffect(() => {
    setPersonalForm(createPersonalForm(user))
  }, [user])

  useEffect(() => {
    setSelectedLanguage(language)
  }, [language])

  useEffect(() => {
    if (!activeSection || user || PUBLIC_SECTIONS.has(activeSection)) {
      return
    }

    addToast({
      type: 'info',
      title: t('profile.toasts.pleaseSignInTitle'),
      message: t('profile.toasts.sectionSignInMessage'),
    })
    onNavigate(null)
    onSignIn()
  }, [activeSection, addToast, onNavigate, onSignIn, t, user])

  useEffect(() => {
    let isSubscribed = true

    const loadSettings = async () => {
      setIsBootstrapping(true)

      try {
        const settings = await profileSettingsApi.loadSettings(user?.id, language)
        if (!isSubscribed) {
          return
        }

        setNotificationForm(settings.notifications)
        setLinkedAccounts({
          aadhaar: { ...settings.linkedAccounts.aadhaar, label: getLinkedAccountLabel('aadhaar', t) },
          pan: { ...settings.linkedAccounts.pan, label: getLinkedAccountLabel('pan', t) },
          voter: { ...settings.linkedAccounts.voter, label: getLinkedAccountLabel('voter', t) },
        })
        setSelectedLanguage(settings.language)
      } finally {
        if (isSubscribed) {
          setIsBootstrapping(false)
        }
      }
    }

    loadSettings()

    return () => {
      isSubscribed = false
    }
  }, [language, t, user?.id])

  const statsCards = [
    { label: t('profile.applications'), value: String(stats.total), icon: 'APP' },
    { label: t('profile.activeRequests'), value: String(stats.active), icon: 'ACT' },
    { label: t('profile.completedServices'), value: String(stats.completed), icon: 'CMP' },
  ]

  const sectionMeta = profileSections.find((item) => item.id === activeSection) ?? null
  const profileName = personalForm.name || user?.user_metadata?.name || t('profile.citizenProfile')
  const profileInitial = profileName.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || t('profile.citizenProfile').charAt(0).toUpperCase()

  const handleSectionOpen = (section: ProfileSectionId) => {
    if (!user && !PUBLIC_SECTIONS.has(section)) {
      addToast({
        type: 'info',
        title: t('profile.toasts.pleaseSignInTitle'),
        message: t('profile.toasts.pleaseSignInMessage'),
      })
      onSignIn()
      return
    }

    setLinkedError('')
    setPersonalErrors({})
    setSecurityErrors({})
    onNavigate(section)
  }

  const handleSavePersonal = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validationErrors = validatePersonalForm(personalForm, t)
    setPersonalErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      addToast({
        type: 'error',
        title: t('profile.toasts.detailsErrorTitle'),
        message: t('profile.toasts.detailsErrorMessage'),
      })
      return
    }

    setSavingSection('personal')

    try {
      const result = await authApi.updateProfile({
        name: personalForm.name.trim(),
        phone: personalForm.phone.trim(),
        email: personalForm.email.trim(),
      })

      if (result.user) {
        onUserChange?.(result.user)
      }

      addToast({
        type: 'success',
        title: t('profile.toasts.profileUpdatedTitle'),
        message: t('profile.toasts.profileUpdatedMessage'),
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: t('profile.toasts.profileUpdateFailedTitle'),
        message: error instanceof Error ? error.message : t('profile.toasts.profileUpdateFailedMessage'),
      })
    } finally {
      setSavingSection(null)
    }
  }

  const handleSaveNotifications = async () => {
    setSavingSection('notifications')

    try {
      await profileSettingsApi.saveNotifications(user?.id, language, notificationForm)
      addToast({
        type: 'success',
        title: t('profile.toasts.preferencesSavedTitle'),
        message: t('profile.toasts.preferencesSavedMessage'),
      })
    } catch {
      addToast({
        type: 'error',
        title: t('profile.toasts.preferencesFailedTitle'),
        message: t('profile.toasts.preferencesFailedMessage'),
      })
    } finally {
      setSavingSection(null)
    }
  }

  const handleSaveLanguage = async () => {
    setSavingSection('language')

    try {
      await profileSettingsApi.saveLanguage(user?.id, selectedLanguage)
      onLanguageChange(selectedLanguage)
      addToast({
        type: 'success',
        title: t('profile.toasts.languageUpdatedTitle'),
        message: t('profile.toasts.languageUpdatedMessage'),
      })
    } catch {
      addToast({
        type: 'error',
        title: t('profile.toasts.languageFailedTitle'),
        message: t('profile.toasts.languageFailedMessage'),
      })
    } finally {
      setSavingSection(null)
    }
  }

  const handleSaveSecurity = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validationErrors = validateSecurityForm(securityForm, t)
    setSecurityErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      addToast({
        type: 'error',
        title: t('profile.toasts.passwordCheckFailedTitle'),
        message: t('profile.toasts.passwordCheckFailedMessage'),
      })
      return
    }

    if (!user?.email) {
      addToast({
        type: 'error',
        title: t('profile.toasts.missingAccountEmailTitle'),
        message: t('profile.toasts.missingAccountEmailMessage'),
      })
      return
    }

    setSavingSection('security')

    try {
      await authApi.verifyCurrentPassword(user.email, securityForm.currentPassword)
      await authApi.updatePassword(securityForm.newPassword)
      setSecurityForm(defaultSecurityForm)
      addToast({
        type: 'success',
        title: t('profile.toasts.passwordUpdatedTitle'),
        message: t('profile.toasts.passwordUpdatedMessage'),
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: t('profile.toasts.passwordUpdateFailedTitle'),
        message: error instanceof Error ? error.message : t('profile.toasts.passwordUpdateFailedMessage'),
      })
    } finally {
      setSavingSection(null)
    }
  }

  const handleSaveLinkedAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedValue = linkedForm.value.trim().toUpperCase()
    const validationError = validateLinkedAccount(linkedForm.type, normalizedValue, t)
    setLinkedError(validationError)

    if (validationError) {
      return
    }

    setSavingSection('linked')

    try {
        const nextAccount: LinkedAccount = {
          type: linkedForm.type,
          label: getLinkedAccountLabel(linkedForm.type, t),
          value: normalizedValue,
          verified: false,
          updatedAt: new Date().toISOString(),
      }

      const settings = await profileSettingsApi.saveLinkedAccount(user?.id, language, nextAccount)
      setLinkedAccounts(settings.linkedAccounts)
      setLinkedForm(defaultLinkedForm)
      setLinkedError('')
      addToast({
        type: 'success',
        title: t('profile.toasts.linkSuccessTitle'),
        message: t('profile.toasts.linkSuccessMessage', { label: nextAccount.label }),
      })
    } catch {
      addToast({
        type: 'error',
        title: t('profile.toasts.linkFailedTitle'),
        message: t('profile.toasts.linkFailedMessage'),
      })
    } finally {
      setSavingSection(null)
    }
  }

  const handleVerifyAccount = async (type: LinkedAccountType) => {
    const existingAccount = linkedAccounts[type]
    if (!existingAccount.value) {
      addToast({
        type: 'info',
        title: t('profile.toasts.verifyEmptyTitle'),
        message: t('profile.toasts.verifyEmptyMessage', { label: existingAccount.label || getLinkedAccountLabel(type, t) }),
      })
      return
    }

    setVerifyingAccount(type)

    try {
      const nextAccount: LinkedAccount = {
        ...existingAccount,
        verified: true,
        updatedAt: new Date().toISOString(),
      }
      const settings = await profileSettingsApi.saveLinkedAccount(user?.id, language, nextAccount)
      setLinkedAccounts(settings.linkedAccounts)
      addToast({
        type: 'success',
        title: t('profile.toasts.verifySuccessTitle', { label: existingAccount.label }),
        message: t('profile.toasts.verifySuccessMessage', { label: existingAccount.label }),
      })
    } catch {
      addToast({
        type: 'error',
        title: t('profile.toasts.verifyFailedTitle'),
        message: t('profile.toasts.verifyFailedMessage'),
      })
    } finally {
      setVerifyingAccount(null)
    }
  }

  const openSupportEmail = () => {
    window.location.href = 'mailto:support@gazionline.com?subject=Gazi%20Online%20Support'
  }

  const openWhatsAppSupport = () => {
    window.open('https://wa.me/919876543210?text=Hello%20Gazi%20Online%20Support', '_blank', 'noopener,noreferrer')
  }

  const renderDrawerContent = () => {
    switch (activeSection) {
      case 'personal':
        return (
          <form className="space-y-6" onSubmit={handleSavePersonal}>
            <FieldShell label={t('profile.personal.fullName')} error={personalErrors.name}>
              <input
                type="text"
                value={personalForm.name}
                onChange={(event) => setPersonalForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-500/10"
                placeholder={t('profile.personal.fullName')}
              />
            </FieldShell>

            <FieldShell label={t('profile.personal.phoneNumber')} hint={t('common.optional')} error={personalErrors.phone}>
              <input
                type="tel"
                value={personalForm.phone}
                onChange={(event) => setPersonalForm((current) => ({ ...current, phone: event.target.value }))}
                className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-500/10"
                placeholder="+91 9876543210"
              />
            </FieldShell>

            <FieldShell label={t('profile.personal.emailAddress')} error={personalErrors.email}>
              <input
                type="email"
                value={personalForm.email}
                onChange={(event) => setPersonalForm((current) => ({ ...current, email: event.target.value }))}
                className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-500/10"
                placeholder={t('auth.emailPlaceholder')}
              />
            </FieldShell>

            <button
              type="submit"
              disabled={savingSection === 'personal'}
              className="w-full rounded-[22px] bg-blue-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {savingSection === 'personal' ? t('profile.personal.saving') : t('profile.personal.saveChanges')}
            </button>
          </form>
        )
      case 'linked':
        return (
          <div className="space-y-6">
            <div className="grid gap-4">
              {(Object.keys(linkedAccounts) as LinkedAccountType[]).map((type) => {
                const account = linkedAccounts[type]

                return (
                  <div
                    key={type}
                    className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-slate-900 dark:text-white">{account.label}</p>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${
                              account.verified
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                            }`}
                          >
                            {account.verified ? t('common.verified') : t('common.notVerified')}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">{maskValue(account.value, t('profile.linked.notLinkedYet'))}</p>
                        <p className="mt-1 text-xs font-medium text-slate-400 dark:text-slate-500">
                          {account.updatedAt ? t('profile.linked.updated', { date: new Date(account.updatedAt).toLocaleDateString() }) : t('profile.linked.noAccountLinked')}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => setLinkedForm({ type, value: account.value })}
                          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          {account.value ? t('common.edit') : t('common.link')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVerifyAccount(type)}
                          disabled={!account.value || account.verified || verifyingAccount === type}
                          className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                        >
                          {verifyingAccount === type ? t('common.loading') : account.verified ? t('common.verified') : t('common.verify')}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <form className="space-y-4 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60" onSubmit={handleSaveLinkedAccount}>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">{t('profile.linked.linkNewAccount')}</h3>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{t('profile.linked.linkDescription')}</p>
              </div>

              <FieldShell label={t('profile.linked.documentType')}>
                <select
                  value={linkedForm.type}
                  onChange={(event) => setLinkedForm((current) => ({ ...current, type: event.target.value as LinkedAccountType }))}
                  className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-500/10"
                >
                  <option value="aadhaar">{t('profile.linked.aadhaar')}</option>
                  <option value="pan">{t('profile.linked.pan')}</option>
                  <option value="voter">{t('profile.linked.voter')}</option>
                </select>
              </FieldShell>

              <FieldShell label={t('profile.linked.idNumber')} hint={getLinkedAccountHint(linkedForm.type, t)} error={linkedError}>
                <input
                  type="text"
                  value={linkedForm.value}
                  onChange={(event) => setLinkedForm((current) => ({ ...current, value: event.target.value.toUpperCase() }))}
                  className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium uppercase text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-500/10"
                  placeholder={t('profile.linked.idNumber')}
                />
              </FieldShell>

              <button
                type="submit"
                disabled={savingSection === 'linked'}
                className="w-full rounded-[22px] bg-emerald-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {savingSection === 'linked' ? t('profile.linked.savingLinkedAccount') : t('profile.linked.saveLinkedAccount')}
              </button>
            </form>
          </div>
        )
      case 'notifications':
        return (
          <div className="space-y-4">
            <ToggleRow
              label={t('profile.notifications.smsTitle')}
              description={t('profile.notifications.smsDescription')}
              checked={notificationForm.sms}
              onChange={(checked) => setNotificationForm((current) => ({ ...current, sms: checked }))}
            />
            <ToggleRow
              label={t('profile.notifications.emailTitle')}
              description={t('profile.notifications.emailDescription')}
              checked={notificationForm.email}
              onChange={(checked) => setNotificationForm((current) => ({ ...current, email: checked }))}
            />
            <ToggleRow
              label={t('profile.notifications.appTitle')}
              description={t('profile.notifications.appDescription')}
              checked={notificationForm.app}
              onChange={(checked) => setNotificationForm((current) => ({ ...current, app: checked }))}
            />

            <button
              type="button"
              onClick={handleSaveNotifications}
              disabled={savingSection === 'notifications'}
              className="mt-4 w-full rounded-[22px] bg-amber-500 px-5 py-4 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {savingSection === 'notifications' ? t('profile.notifications.savingPreferences') : t('profile.notifications.savePreferences')}
            </button>
          </div>
        )
      case 'security':
        return (
          <form className="space-y-6" onSubmit={handleSaveSecurity}>
            <FieldShell label={t('profile.security.currentPassword')} error={securityErrors.currentPassword}>
              <input
                type="password"
                value={securityForm.currentPassword}
                onChange={(event) => setSecurityForm((current) => ({ ...current, currentPassword: event.target.value }))}
                className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:ring-violet-500/10"
                placeholder={t('profile.security.currentPassword')}
              />
            </FieldShell>

            <FieldShell label={t('profile.security.newPassword')} hint={t('profile.security.newPasswordHint')} error={securityErrors.newPassword}>
              <input
                type="password"
                value={securityForm.newPassword}
                onChange={(event) => setSecurityForm((current) => ({ ...current, newPassword: event.target.value }))}
                className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:ring-violet-500/10"
                placeholder={t('profile.security.newPassword')}
              />
            </FieldShell>

            <FieldShell label={t('profile.security.confirmPassword')} error={securityErrors.confirmPassword}>
              <input
                type="password"
                value={securityForm.confirmPassword}
                onChange={(event) => setSecurityForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:ring-violet-500/10"
                placeholder={t('profile.security.confirmPassword')}
              />
            </FieldShell>

            <button
              type="submit"
              disabled={savingSection === 'security'}
              className="w-full rounded-[22px] bg-violet-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-violet-500/25 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {savingSection === 'security' ? t('profile.security.updatingPassword') : t('profile.security.changePassword')}
            </button>
          </form>
        )
      case 'language':
        return (
          <div className="space-y-4">
            {[
              { id: 'en' as Language, title: LANGUAGE_LABELS.en, subtitle: t('profile.languageOptions.enDescription') },
              { id: 'bn' as Language, title: LANGUAGE_LABELS.bn, subtitle: t('profile.languageOptions.bnDescription') },
            ].map((item) => {
              const active = selectedLanguage === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedLanguage(item.id)}
                  className={`w-full rounded-[24px] border p-4 text-left transition ${
                    active
                      ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100 dark:border-blue-400 dark:bg-blue-500/10 dark:shadow-none'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{item.title}</p>
                      <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{item.subtitle}</p>
                    </div>
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-black ${
                        active
                          ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-400 dark:bg-blue-400 dark:text-slate-950'
                          : 'border-slate-300 text-transparent dark:border-slate-600'
                      }`}
                    >
                      {t('common.ok')}
                    </span>
                  </div>
                </button>
              )
            })}

            <button
              type="button"
              onClick={handleSaveLanguage}
              disabled={savingSection === 'language'}
              className="mt-4 w-full rounded-[22px] bg-cyan-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {savingSection === 'language' ? t('common.saving') : t('language.switcher')}
            </button>
          </div>
        )
      case 'help':
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              {faqItems.map((item) => {
                const isActive = activeFaqId === item.id

                return (
                  <div key={item.id} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <button
                      type="button"
                      onClick={() => setActiveFaqId((current) => (current === item.id ? null : item.id))}
                      className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
                    >
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{item.question}</span>
                      <span className={`text-slate-400 transition-transform ${isActive ? 'rotate-90' : ''}`}>
                        <ChevronRightIcon />
                      </span>
                    </button>
                    {isActive ? (
                      <div className="border-t border-slate-100 px-4 py-4 text-sm font-medium leading-6 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                        {item.answer}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={openSupportEmail}
                className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
              >
                <p className="text-sm font-black text-slate-900 dark:text-white">{t('profile.help.contactSupport')}</p>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{t('profile.help.contactSupportDescription')}</p>
              </button>
              <button
                type="button"
                onClick={openWhatsAppSupport}
                className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
              >
                <p className="text-sm font-black text-slate-900 dark:text-white">{t('profile.help.whatsAppSupport')}</p>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{t('profile.help.whatsAppSupportDescription')}</p>
              </button>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_35%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.98))] px-4 py-6 dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_35%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(15,23,42,0.98))] lg:px-10 lg:py-10">
      <div className="mx-auto max-w-4xl">
        {isBootstrapping ? (
          <div className="space-y-5">
            <SkeletonCard className="h-40 w-full" />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <SkeletonCard key={index} className="h-28" />
              ))}
            </div>
            <SkeletonCard className="h-16 w-full" />
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          <>
            <div className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,_#2563eb,_#0f172a)] p-6 text-white shadow-2xl shadow-blue-500/15 lg:p-8">
              <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 text-2xl font-black uppercase shadow-xl">
                    {profileInitial}
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/60">{t('profile.citizenProfile')}</p>
                    <h2 className="mt-2 text-2xl font-black">{user ? profileName : t('common.pleaseSignIn')}</h2>
                    <p className="mt-1 text-sm font-medium text-white/75">{user?.email ?? t('profile.signInUnlockDescription')}</p>
                    {personalForm.phone ? <p className="mt-1 text-xs font-semibold text-white/60">{personalForm.phone}</p> : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {user ? (
                    <>
                      <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/90">
                          {t('common.verified')}
                      </span>
                      {isAdmin ? (
                        <span className="rounded-full bg-amber-400/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-950">
                          {t('common.admin')}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={onSignIn}
                      className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-950 transition hover:bg-slate-100"
                    >
                      {t('common.pleaseSignIn')}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
              {isStatsLoading
                ? statsCards.map((card) => <SkeletonCard key={card.label} className="h-28" />)
                : statsCards.map((card) => <StatCard key={card.label} {...card} />)}
            </div>

            {isAdmin ? (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="mt-5 flex w-full items-center justify-center rounded-[24px] bg-slate-950 px-4 py-4 text-sm font-black text-white shadow-lg transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                {t('profile.openAdminDashboard')}
              </button>
            ) : null}

            {!user ? (
              <div className="mt-5 rounded-[28px] border border-blue-100 bg-blue-50/80 p-5 dark:border-blue-500/20 dark:bg-blue-500/10">
                <p className="text-sm font-black text-slate-900 dark:text-white">{t('profile.signInUnlockTitle')}</p>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
                  {t('profile.signInUnlockDescription')}
                </p>
                <button
                  type="button"
                  onClick={onSignIn}
                  className="mt-4 rounded-[18px] bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700"
                >
                  {t('common.goToSignIn')}
                </button>
              </div>
            ) : null}

            <div className="mt-5 space-y-3">
              {profileSections.map((item) => (
                <SectionButton key={item.id} item={item} onClick={() => handleSectionOpen(item.id)} />
              ))}
            </div>

            {user ? (
              <button
                type="button"
                onClick={onLogout}
                className="mt-5 w-full rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm font-black text-red-600 transition hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/15"
              >
                {t('common.signOut')}
              </button>
            ) : null}
          </>
        )}
      </div>

      {sectionMeta && activeSection ? (
        <Drawer
          title={sectionMeta.label}
          description={sectionMeta.sublabel}
          onClose={() => onNavigate(null)}
        >
          {renderDrawerContent()}
        </Drawer>
      ) : null}
    </div>
  )
}

export default ProfilePage
