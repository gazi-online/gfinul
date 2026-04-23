import i18n from './i18n'

export type ServiceKind = 'default' | 'pvc_card_order' | 'google_play_redeem_codes'

type ServiceDisplayMeta = {
  displayNameKey?: string
  descriptionKey?: string
  kind?: ServiceKind
}

const SERVICE_DISPLAY_META: Record<string, ServiceDisplayMeta> = {
  Aadhaar: {
    displayNameKey: 'services.names.aadhaar',
  },
  'Income Cert.': {
    displayNameKey: 'services.names.incomeCertificate',
    kind: 'pvc_card_order',
  },
  'Vehicle Tax': {
    displayNameKey: 'services.names.vehicleTax',
    descriptionKey: 'services.descriptions.googlePlayRedeemCodes',
    kind: 'google_play_redeem_codes',
  },
  'Apply PAN': {
    displayNameKey: 'services.names.applyPan',
    descriptionKey: 'services.descriptions.applyPan',
  },
  'Aadhaar Update': {
    displayNameKey: 'services.names.aadhaarUpdate',
  },
  'Pay Bill': {
    displayNameKey: 'services.names.payBill',
  },
  'Google Play Redeem Codes': {
    displayNameKey: 'services.names.googlePlayRedeemCodes',
    descriptionKey: 'services.descriptions.googlePlayRedeemCodes',
    kind: 'google_play_redeem_codes',
  },
}

export const getServiceDisplayName = (name?: string | null) => {
  if (!name) return ''
  const key = SERVICE_DISPLAY_META[name]?.displayNameKey
  return key ? i18n.t(key) : name
}

export const getServiceDisplayDescription = (name?: string | null, description?: string | null) => {
  if (!name) return description ?? ''
  const key = SERVICE_DISPLAY_META[name]?.descriptionKey
  return key ? i18n.t(key) : description ?? ''
}

export const getServiceKind = (name?: string | null): ServiceKind => {
  if (!name) return 'default'
  return SERVICE_DISPLAY_META[name]?.kind ?? 'default'
}
