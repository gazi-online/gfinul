import { type Language } from '../lib/i18n'

export type LinkedAccountType = 'aadhaar' | 'pan' | 'voter'

export interface LinkedAccount {
  type: LinkedAccountType
  label: string
  value: string
  verified: boolean
  updatedAt: string | null
}

export interface NotificationPreferences {
  sms: boolean
  email: boolean
  app: boolean
}

export interface ProfileSettings {
  linkedAccounts: Record<LinkedAccountType, LinkedAccount>
  notifications: NotificationPreferences
  language: Language
}

const STORAGE_PREFIX = 'gazi-profile-settings'

const createDefaultLinkedAccounts = (): Record<LinkedAccountType, LinkedAccount> => ({
  aadhaar: {
    type: 'aadhaar',
    label: 'Aadhaar',
    value: '',
    verified: false,
    updatedAt: null,
  },
  pan: {
    type: 'pan',
    label: 'PAN',
    value: '',
    verified: false,
    updatedAt: null,
  },
  voter: {
    type: 'voter',
    label: 'Voter ID',
    value: '',
    verified: false,
    updatedAt: null,
  },
})

const createDefaultSettings = (language: Language): ProfileSettings => ({
  linkedAccounts: createDefaultLinkedAccounts(),
  notifications: {
    sms: true,
    email: true,
    app: true,
  },
  language,
})

const getStorageKey = (userId?: string) => `${STORAGE_PREFIX}:${userId ?? 'guest'}`

const mergeLinkedAccounts = (
  saved: Partial<Record<LinkedAccountType, Partial<LinkedAccount>>> | undefined
) => {
  const defaults = createDefaultLinkedAccounts()

  return {
    aadhaar: { ...defaults.aadhaar, ...saved?.aadhaar, type: 'aadhaar', label: 'Aadhaar' },
    pan: { ...defaults.pan, ...saved?.pan, type: 'pan', label: 'PAN' },
    voter: { ...defaults.voter, ...saved?.voter, type: 'voter', label: 'Voter ID' },
  } satisfies Record<LinkedAccountType, LinkedAccount>
}

const readSettings = (userId: string | undefined, language: Language): ProfileSettings => {
  if (typeof window === 'undefined') {
    return createDefaultSettings(language)
  }

  const raw = window.localStorage.getItem(getStorageKey(userId))
  if (!raw) {
    return createDefaultSettings(language)
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ProfileSettings>
    return {
      linkedAccounts: mergeLinkedAccounts(parsed.linkedAccounts),
      notifications: {
        sms: parsed.notifications?.sms ?? true,
        email: parsed.notifications?.email ?? true,
        app: parsed.notifications?.app ?? true,
      },
      language: parsed.language ?? language,
    }
  } catch {
    return createDefaultSettings(language)
  }
}

const writeSettings = (userId: string | undefined, settings: ProfileSettings) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(getStorageKey(userId), JSON.stringify(settings))
}

export const profileSettingsApi = {
  async loadSettings(userId: string | undefined, language: Language) {
    return readSettings(userId, language)
  },

  async saveNotifications(
    userId: string | undefined,
    language: Language,
    notifications: NotificationPreferences
  ) {
    const nextSettings = {
      ...readSettings(userId, language),
      notifications,
    }

    writeSettings(userId, nextSettings)
    return nextSettings
  },

  async saveLanguage(userId: string | undefined, language: Language) {
    const nextSettings = {
      ...readSettings(userId, language),
      language,
    }

    writeSettings(userId, nextSettings)
    return nextSettings
  },

  async saveLinkedAccount(
    userId: string | undefined,
    language: Language,
    account: LinkedAccount
  ) {
    const current = readSettings(userId, language)
    const nextSettings = {
      ...current,
      linkedAccounts: {
        ...current.linkedAccounts,
        [account.type]: account,
      },
    }

    writeSettings(userId, nextSettings)
    return nextSettings
  },
}
