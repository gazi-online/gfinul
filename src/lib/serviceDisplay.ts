export type ServiceKind = 'default' | 'pvc_card_order' | 'google_play_redeem_codes'

type ServiceDisplayMeta = {
  displayName?: string
  description?: string
  kind?: ServiceKind
}

const SERVICE_DISPLAY_META: Record<string, ServiceDisplayMeta> = {
  Aadhaar: {
    displayName: 'Aadhaar mobile number update',
  },
  'Income Cert.': {
    displayName: 'PVC Card Order',
    kind: 'pvc_card_order',
  },
  'Vehicle Tax': {
    displayName: 'Google Play Redeem Codes',
    description: 'Buy or redeem Google Play gift codes online.',
    kind: 'google_play_redeem_codes',
  },
}

export const getServiceDisplayName = (name?: string | null) => {
  if (!name) return ''
  return SERVICE_DISPLAY_META[name]?.displayName ?? name
}

export const getServiceDisplayDescription = (name?: string | null, description?: string | null) => {
  if (!name) return description ?? ''
  return SERVICE_DISPLAY_META[name]?.description ?? description ?? ''
}

export const getServiceKind = (name?: string | null): ServiceKind => {
  if (!name) return 'default'
  return SERVICE_DISPLAY_META[name]?.kind ?? 'default'
}
