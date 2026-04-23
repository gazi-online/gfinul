export const getServiceRequestShortReference = (requestId?: string | null) => {
  if (!requestId) return ''

  const normalizedId = requestId.startsWith('guest-') ? requestId.slice(6) : requestId
  return normalizedId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()
}

export const formatServiceRequestReference = (requestId?: string | null) => {
  const shortReference = getServiceRequestShortReference(requestId)
  return shortReference ? `REQ-${shortReference}` : 'Pending'
}

export const normalizeReferenceValue = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, '')

export const matchesServiceRequestReference = (requestId: string, query: string) => {
  const normalizedQuery = normalizeReferenceValue(query)

  if (!normalizedQuery) return true

  const shortReference = getServiceRequestShortReference(requestId)
  const candidates = [
    requestId,
    shortReference,
    `#${shortReference}`,
    `REQ-${shortReference}`,
    `REQ${shortReference}`,
  ]

  return candidates.some((candidate) =>
    normalizeReferenceValue(candidate).includes(normalizedQuery)
  )
}
