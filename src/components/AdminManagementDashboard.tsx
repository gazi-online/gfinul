import React, { useEffect, useMemo, useRef, useState } from 'react'
import { productsApi, type ProductPayload } from '../api/products'
import { usersApi } from '../api/users'
import { ordersApi } from '../api/orders'
import { servicesApi } from '../api/services'
import { type AppUser, type Order, type Product, type ServiceRequest } from '../lib/types'
import { uploadImageToCloudinary } from '../lib/cloudinary'
import { useToast } from './toast/useToast'

type AdminTab = 'overview' | 'products' | 'inventory' | 'users' | 'orders' | 'requests'

type AdminOrder = Order & {
  users?: {
    name?: string | null
    email?: string | null
    phone?: string | null
  } | null
  order_items?: {
    id: string
    quantity: number
    price: number
    products?: {
      name?: string | null
      image?: string | null
      category?: string | null
    } | null
  }[]
}

type ProductFormState = {
  name: string
  price: string
  images: string[]
  category: string
  description: string
  rating: string
  stock: string
  warranty_months: string
  is_active: boolean
}

type PendingProductImage = {
  file: File
  key: string
}

type ProductImagePreview = {
  id: string
  src: string
  kind: 'existing' | 'upload'
  fileKey?: string
}

const LOW_STOCK_THRESHOLD = 5
const PRODUCT_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const ORDER_STATUS_OPTIONS: Array<AdminOrder['status']> = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
const REQUEST_STATUS_OPTIONS: Array<ServiceRequest['status']> = ['pending', 'processing', 'completed', 'rejected']

const TABS: Array<{ id: AdminTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'products', label: 'Products' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'users', label: 'Users' },
  { id: 'orders', label: 'Orders' },
  { id: 'requests', label: 'Requests' },
]

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300',
  processing: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  shipped: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  cancelled: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  rejected: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
}

const ChevronDownIcon = ({ open }: { open: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
)

const SectionCard: React.FC<{ title: string; subtitle?: string; rightSlot?: React.ReactNode; children: React.ReactNode }> = ({ title, subtitle, rightSlot, children }) => (
  <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 md:p-6">
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-lg font-black text-gray-900 dark:text-white">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{subtitle}</p> : null}
      </div>
      {rightSlot}
    </div>
    {children}
  </section>
)

const StatCard = ({ label, value, tone = 'default' }: { label: string; value: string | number; tone?: 'default' | 'success' | 'warning' | 'danger' }) => {
  const toneClass =
    tone === 'success'
      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
      : tone === 'warning'
      ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white'
      : tone === 'danger'
      ? 'bg-gradient-to-br from-rose-500 to-red-500 text-white'
      : 'bg-white text-gray-900 dark:bg-slate-800 dark:text-white'

  return (
    <div className={`rounded-3xl border border-gray-100 p-5 shadow-sm dark:border-slate-700 ${toneClass}`}>
      <p className={`text-xs font-black uppercase tracking-[0.18em] ${tone === 'default' ? 'text-gray-400 dark:text-slate-500' : 'text-white/75'}`}>{label}</p>
      <p className="mt-2 text-3xl font-black md:text-4xl">{value}</p>
    </div>
  )
}

type PieSegment = {
  label: string
  value: number
  color: string
  swatchClassName: string
}

const MinimalPieChart: React.FC<{ segments: PieSegment[]; total: number }> = ({ segments, total }) => {
  const safeSegments = segments.filter((segment) => segment.value > 0)

  const gradient = useMemo(() => {
    if (safeSegments.length === 0 || total <= 0) {
      return 'conic-gradient(#e2e8f0 0deg 360deg)'
    }

    let currentAngle = 0
    const stops = safeSegments.map((segment) => {
      const nextAngle = currentAngle + (segment.value / total) * 360
      const stop = `${segment.color} ${currentAngle}deg ${nextAngle}deg`
      currentAngle = nextAngle
      return stop
    })

    return `conic-gradient(${stops.join(', ')})`
  }, [safeSegments, total])

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative mx-auto h-48 w-48 shrink-0 rounded-full p-4 shadow-inner ring-1 ring-black/5 dark:ring-white/5" style={{ backgroundImage: gradient }}>
        <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white text-center shadow-sm dark:bg-slate-800">
          <span className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400 dark:text-slate-500">Live Total</span>
          <span className="mt-2 text-4xl font-black text-gray-900 dark:text-white">{total}</span>
        </div>
      </div>

      <div className="w-full space-y-3">
        {segments.map((segment) => {
          const percentage = total > 0 ? Math.round((segment.value / total) * 100) : 0

          return (
            <div key={segment.label} className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <span className={`h-3 w-3 rounded-full ${segment.swatchClassName}`} />
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{segment.label}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{percentage}% of tracked records</p>
                </div>
              </div>
              <span className="text-lg font-black text-gray-900 dark:text-white">{segment.value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const TextInput = ({ label, value, onChange, placeholder, type = 'text', min }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: React.HTMLInputTypeAttribute; min?: number }) => (
  <label className="block">
    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 dark:text-slate-400">{label}</span>
    <input
      type={type}
      value={value}
      min={min}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
    />
  </label>
)

const SelectInput = ({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ label: string; value: string }> }) => (
  <label className="block">
    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 dark:text-slate-400">{label}</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
)

const formatCurrency = (value: number) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '-'
  return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const createInitialProductForm = (): ProductFormState => ({
  name: '',
  price: '',
  images: [],
  category: '',
  description: '',
  rating: '4.6',
  stock: '0',
  warranty_months: '12',
  is_active: true,
})

const createProductImageKey = (file: File) => `${file.name}-${file.lastModified}-${file.size}`

const createExistingImagePreviews = (images: string[]): ProductImagePreview[] =>
  images.map((src, index) => ({
    id: `existing-${index}-${src}`,
    src,
    kind: 'existing',
  }))

export const AdminManagementDashboard: React.FC<{ onClose: () => void; isAdmin?: boolean }> = ({ onClose, isAdmin }) => {
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<AppUser[]>([])
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [productForm, setProductForm] = useState<ProductFormState>(createInitialProductForm)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [expandedReqId, setExpandedReqId] = useState<string | null>(null)
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({})
  const [productImageFiles, setProductImageFiles] = useState<PendingProductImage[]>([])
  const [productImagePreviews, setProductImagePreviews] = useState<ProductImagePreview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const previewObjectUrlsRef = useRef<string[]>([])

  const lowStockProducts = useMemo(() => products.filter((product) => Number(product.stock ?? 0) > 0 && Number(product.stock ?? 0) <= LOW_STOCK_THRESHOLD), [products])
  const outOfStockProducts = useMemo(() => products.filter((product) => Number(product.stock ?? 0) <= 0), [products])
  const healthyStockProducts = useMemo(() => products.filter((product) => Number(product.stock ?? 0) > LOW_STOCK_THRESHOLD), [products])
  const activeProducts = useMemo(() => products.filter((product) => product.is_active !== false), [products])
  const inactiveProducts = useMemo(() => products.filter((product) => product.is_active === false), [products])
  const productCategoriesCount = useMemo(() => new Set(products.map((product) => (product.category || '').trim()).filter(Boolean)).size, [products])
  const totalRevenue = useMemo(() => orders.reduce((sum, order) => (order.status === 'delivered' || order.status === 'completed' ? sum + Number(order.total || 0) : sum), 0), [orders])
  const totalStockUnits = useMemo(() => products.reduce((sum, product) => sum + Number(product.stock ?? 0), 0), [products])
  const deliveredOrders = useMemo(() => orders.filter((order) => order.status === 'delivered' || order.status === 'completed'), [orders])
  const pendingOrders = useMemo(() => orders.filter((order) => order.status === 'pending' || order.status === 'processing'), [orders])
  const blockedUsers = useMemo(() => users.filter((user) => Boolean(user.is_blocked)), [users])
  const adminUsers = useMemo(() => users.filter((user) => Boolean(user.is_admin) || user.role === 'Admin'), [users])
  const activeUsers = useMemo(() => users.filter((user) => !user.is_blocked), [users])
  const pendingRequests = useMemo(() => requests.filter((request) => request.status === 'pending'), [requests])
  const processingRequests = useMemo(() => requests.filter((request) => request.status === 'processing'), [requests])
  const completedRequests = useMemo(() => requests.filter((request) => request.status === 'completed'), [requests])
  const overviewPieSegments = useMemo<PieSegment[]>(
    () => [
      { label: 'Products', value: products.length, color: '#2563eb', swatchClassName: 'bg-blue-600' },
      { label: 'Users', value: users.length, color: '#10b981', swatchClassName: 'bg-emerald-500' },
      { label: 'Orders', value: orders.length, color: '#f59e0b', swatchClassName: 'bg-amber-500' },
      { label: 'Requests', value: requests.length, color: '#f43f5e', swatchClassName: 'bg-rose-500' },
    ],
    [orders.length, products.length, requests.length, users.length],
  )
  const overviewPieTotal = useMemo(
    () => overviewPieSegments.reduce((sum, segment) => sum + segment.value, 0),
    [overviewPieSegments],
  )
  const inventoryPieSegments = useMemo<PieSegment[]>(
    () => [
      { label: 'Healthy', value: healthyStockProducts.length, color: '#10b981', swatchClassName: 'bg-emerald-500' },
      { label: 'Low stock', value: lowStockProducts.length, color: '#f59e0b', swatchClassName: 'bg-amber-500' },
      { label: 'Out of stock', value: outOfStockProducts.length, color: '#f43f5e', swatchClassName: 'bg-rose-500' },
    ],
    [healthyStockProducts.length, lowStockProducts.length, outOfStockProducts.length],
  )
  const inventoryPieTotal = useMemo(
    () => inventoryPieSegments.reduce((sum, segment) => sum + segment.value, 0),
    [inventoryPieSegments],
  )
  const tabStats = useMemo<Array<{ label: string; value: string | number; tone?: 'default' | 'success' | 'warning' | 'danger' }>>(() => {
    if (activeTab === 'products') {
      return [
        { label: 'Products', value: products.length },
        { label: 'Active Products', value: activeProducts.length, tone: 'success' },
        { label: 'Inactive Products', value: inactiveProducts.length, tone: 'warning' },
        { label: 'Categories', value: productCategoriesCount },
      ]
    }

    if (activeTab === 'inventory') {
      return [
        { label: 'Inventory Units', value: totalStockUnits },
        { label: 'Healthy Stock', value: healthyStockProducts.length, tone: 'success' },
        { label: 'Low Stock', value: lowStockProducts.length, tone: 'warning' },
        { label: 'Out Of Stock', value: outOfStockProducts.length, tone: 'danger' },
      ]
    }

    if (activeTab === 'users') {
      return [
        { label: 'Total Users', value: users.length },
        { label: 'Active Users', value: activeUsers.length, tone: 'success' },
        { label: 'Blocked Users', value: blockedUsers.length, tone: 'danger' },
        { label: 'Admins', value: adminUsers.length },
      ]
    }

    if (activeTab === 'orders') {
      return [
        { label: 'Orders', value: orders.length },
        { label: 'Pending Orders', value: pendingOrders.length, tone: 'warning' },
        { label: 'Delivered Orders', value: deliveredOrders.length, tone: 'success' },
        { label: 'Revenue', value: formatCurrency(totalRevenue), tone: 'success' },
      ]
    }

    if (activeTab === 'requests') {
      return [
        { label: 'Requests', value: requests.length },
        { label: 'Pending', value: pendingRequests.length, tone: 'warning' },
        { label: 'Processing', value: processingRequests.length },
        { label: 'Completed', value: completedRequests.length, tone: 'success' },
      ]
    }

    return []
  }, [
    activeProducts.length,
    activeTab,
    activeUsers.length,
    adminUsers.length,
    blockedUsers.length,
    completedRequests.length,
    deliveredOrders.length,
    healthyStockProducts.length,
    inactiveProducts.length,
    lowStockProducts.length,
    orders.length,
    outOfStockProducts.length,
    pendingOrders.length,
    pendingRequests.length,
    processingRequests.length,
    productCategoriesCount,
    products.length,
    requests.length,
    totalRevenue,
    totalStockUnits,
    users.length,
  ])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const [productData, userData, orderData, requestData] = await Promise.all([
        productsApi.fetchAllProducts(),
        usersApi.fetchAllUsers(),
        ordersApi.fetchAllOrders(),
        servicesApi.fetchAllServiceRequests(),
      ])

      setProducts(productData ?? [])
      setUsers(userData ?? [])
      setOrders((orderData ?? []) as AdminOrder[])
      setRequests((requestData ?? []) as ServiceRequest[])
    } catch (fetchError: any) {
      console.error('Error fetching admin data:', fetchError)
      setError(fetchError?.message || 'Failed to load admin data.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    setStockDrafts(
      Object.fromEntries(products.map((product) => [product.id, String(Number(product.stock ?? 0))])),
    )
  }, [products])

  useEffect(() => {
    return () => {
      previewObjectUrlsRef.current.forEach((previewUrl) => URL.revokeObjectURL(previewUrl))
      previewObjectUrlsRef.current = []
    }
  }, [])

  const showSuccessToast = (title: string, message: string) => {
    addToast({ type: 'success', title, message })
  }

  const showErrorToast = (title: string, message: string) => {
    addToast({ type: 'error', title, message })
  }

  const scrollAdminToTop = () => {
    window.requestAnimationFrame(() => {
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  const revokePreviewUrl = (previewUrl: string) => {
    if (!previewUrl.startsWith('blob:')) return
    URL.revokeObjectURL(previewUrl)
    previewObjectUrlsRef.current = previewObjectUrlsRef.current.filter((item) => item !== previewUrl)
  }

  const clearPendingImageFiles = () => {
    productImagePreviews.forEach((preview) => {
      if (preview.kind === 'upload') {
        revokePreviewUrl(preview.src)
      }
    })
    setProductImageFiles([])
    setProductImagePreviews([])
  }

  const uploadImages = async (files: PendingProductImage[]) => {
    if (files.length === 0) return []
    return Promise.all(files.map(({ file }) => uploadImageToCloudinary(file)))
  }

  const resetProductForm = () => {
    clearPendingImageFiles()
    setProductForm(createInitialProductForm())
    setEditingProductId(null)
  }

  const handleProductSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const trimmedName = productForm.name.trim()
    const trimmedImages = productForm.images.map((image) => image.trim()).filter(Boolean)
    const trimmedCategory = productForm.category.trim()
    const trimmedDescription = productForm.description.trim()
    const numericPrice = Number(productForm.price || 0)
    const numericStock = Number(productForm.stock || 0)
    const numericRating = Number(productForm.rating || 0)
    const numericWarrantyMonths = Number(productForm.warranty_months || 0)

    if (!trimmedName || !trimmedCategory) {
      const message = 'Name and category are required.'
      setError(message)
      showErrorToast('Product save failed', message)
      setIsSubmitting(false)
      return
    }

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      const message = 'Price must be a valid positive number.'
      setError(message)
      showErrorToast('Invalid price', message)
      setIsSubmitting(false)
      return
    }

    if (!Number.isFinite(numericStock) || numericStock < 0) {
      const message = 'Stock must be zero or higher.'
      setError(message)
      showErrorToast('Invalid stock', message)
      setIsSubmitting(false)
      return
    }

    if (!Number.isFinite(numericRating) || numericRating < 0 || numericRating > 5) {
      const message = 'Rating must be between 0 and 5.'
      setError(message)
      showErrorToast('Invalid rating', message)
      setIsSubmitting(false)
      return
    }

    let allImageUrls = trimmedImages

    if (allImageUrls.length === 0 && productImageFiles.length === 0) {
      const message = 'At least one product image is required.'
      setError(message)
      showErrorToast('Product save failed', message)
      setIsSubmitting(false)
      return
    }

    if (productImageFiles.length > 0) {
      setIsUploadingImage(true)
      try {
        const uploadedImageUrls = await uploadImages(productImageFiles)
        allImageUrls = Array.from(new Set([...allImageUrls, ...uploadedImageUrls]))
      } catch (uploadError: any) {
        console.error('Cloudinary upload error:', uploadError)
        const message = uploadError?.message || 'Failed to upload product images.'
        setError(message)
        showErrorToast('Upload failed', message)
        setIsUploadingImage(false)
        setIsSubmitting(false)
        return
      } finally {
        setIsUploadingImage(false)
      }
    }

    const payload: ProductPayload = {
      name: trimmedName,
      price: numericPrice,
      image: allImageUrls[0] ?? '',
      images: allImageUrls,
      category: trimmedCategory,
      description: trimmedDescription || null,
      rating: numericRating,
      stock: numericStock,
      warranty_months: Number.isFinite(numericWarrantyMonths) && numericWarrantyMonths >= 0 ? numericWarrantyMonths : 12,
      is_active: productForm.is_active,
    }

    try {
      if (editingProductId) {
        const updated = await productsApi.updateProduct(editingProductId, payload)
        setProducts((prev) => prev.map((product) => (product.id === editingProductId ? updated : product)))
        showSuccessToast('Product updated', `${updated.name} has been updated successfully.`)
      } else {
        const created = await productsApi.createProduct(payload)
        setProducts((prev) => [created, ...prev])
        showSuccessToast('Product added', `${created.name} has been added to the catalog.`)
      }
      resetProductForm()
    } catch (submitError: any) {
      console.error('Product submit error:', submitError)
      const message = submitError?.message || 'Failed to save product.'
      setError(message)
      showErrorToast('Product save failed', message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditProduct = (product: Product) => {
    const existingImages = Array.from(new Set((product.images?.length ? product.images : [product.image]).filter(Boolean)))

    clearPendingImageFiles()
    setEditingProductId(product.id)
    setProductImageFiles([])
    setProductImagePreviews(createExistingImagePreviews(existingImages))
    setProductForm({
      name: product.name ?? '',
      price: String(product.price ?? ''),
      images: existingImages,
      category: product.category ?? '',
      description: product.description ?? '',
      rating: String(product.rating ?? 4.6),
      stock: String(product.stock ?? 0),
      warranty_months: String(product.warranty_months ?? 12),
      is_active: product.is_active ?? true,
    })
    setActiveTab('products')
    scrollAdminToTop()
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Delete this product?')) return
    setIsSubmitting(true)
    setError(null)
    try {
      await productsApi.deleteProduct(productId)
      setProducts((prev) => prev.filter((product) => product.id !== productId))
      if (editingProductId === productId) resetProductForm()
      showSuccessToast('Product deleted', 'The product has been removed from the catalog.')
    } catch (deleteError: any) {
      console.error('Delete product error:', deleteError)
      const message = deleteError?.message || 'Failed to delete product.'
      setError(message)
      showErrorToast('Delete failed', message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStockDraftChange = (productId: string, value: string) => {
    setStockDrafts((prev) => ({
      ...prev,
      [productId]: value,
    }))
  }

  const handleQuickStockUpdate = async (product: Product) => {
    const draftValue = stockDrafts[product.id] ?? String(product.stock ?? 0)
    const numericStock = Number(draftValue)

    if (!Number.isFinite(numericStock) || numericStock < 0) {
      const message = 'Stock must be zero or higher.'
      setError(message)
      showErrorToast('Invalid stock', message)
      return
    }

    setIsSubmitting(true)
    setError(null)

    const nextIsActive =
      numericStock <= 0
        ? false
        : Number(product.stock ?? 0) <= 0
        ? true
        : (product.is_active ?? true)

    try {
      const updated = await productsApi.updateProductStock(product.id, numericStock, nextIsActive)
      const refreshedProducts = await productsApi.fetchAllProducts()
      const nextProducts = refreshedProducts.length > 0 ? refreshedProducts : products.map((item) => (item.id === product.id ? updated : item))
      const refreshedProduct = nextProducts.find((item) => item.id === product.id) ?? updated

      setProducts(nextProducts)
      setStockDrafts((prev) => ({
        ...prev,
        [product.id]: String(Number(refreshedProduct.stock ?? numericStock)),
      }))
      const savedStock = Number(refreshedProduct.stock ?? numericStock)
      const stockMessage =
        savedStock <= 0
          ? `${refreshedProduct.name} quantity updated to 0. Product is now out of stock.`
          : Number(product.stock ?? 0) <= 0
          ? `${refreshedProduct.name} quantity updated to ${savedStock}. Product has been restocked.`
          : `${refreshedProduct.name} quantity updated to ${savedStock}.`
      showSuccessToast('Stock updated', stockMessage)
    } catch (updateError: any) {
      console.error('Quick stock update error:', updateError)
      const message = updateError?.message || 'Failed to update product stock.'
      setError(message)
      showErrorToast('Stock update failed', message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleProductImageSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? [])
    if (nextFiles.length === 0) return

    const invalidFile = nextFiles.find((file) => !PRODUCT_IMAGE_MIME_TYPES.has(file.type))
    if (invalidFile) {
      const message = 'Only JPG, PNG, and WEBP images are supported.'
      setError(message)
      showErrorToast('Invalid image format', message)
      event.target.value = ''
      return
    }

    const pendingFiles = nextFiles.map((file) => ({ file, key: createProductImageKey(file) }))
    const previewItems = pendingFiles.map(({ file, key }) => {
      const objectUrl = URL.createObjectURL(file)
      previewObjectUrlsRef.current.push(objectUrl)
      return {
        id: `upload-${key}`,
        src: objectUrl,
        kind: 'upload' as const,
        fileKey: key,
      }
    })

    setProductImageFiles((prev) => [...prev, ...pendingFiles])
    setProductImagePreviews((prev) => [...prev, ...previewItems])
    setError(null)
    event.target.value = ''
  }

  const handleRemoveProductImage = (preview: ProductImagePreview) => {
    if (preview.kind === 'upload' && preview.fileKey) {
      setProductImageFiles((prev) => prev.filter((item) => item.key !== preview.fileKey))
      revokePreviewUrl(preview.src)
    }

    if (preview.kind === 'existing') {
      setProductForm((prev) => ({
        ...prev,
        images: prev.images.filter((imageUrl) => imageUrl !== preview.src),
      }))
    }

    setProductImagePreviews((prev) => prev.filter((item) => item.id !== preview.id))
  }

  const handleToggleUserBlock = async (user: AppUser) => {
    setIsSubmitting(true)
    setError(null)
    try {
      const updated = await usersApi.updateUserStatus(user.id, {
        is_blocked: !user.is_blocked,
        is_admin: Boolean(user.is_admin),
      })
      setUsers((prev) => prev.map((item) => (item.id === user.id ? updated : item)))
      showSuccessToast(user.is_blocked ? 'User unblocked' : 'User blocked', `${updated.name || updated.email || 'User'} status updated successfully.`)
    } catch (updateError: any) {
      console.error('Update user status error:', updateError)
      const message = updateError?.message || 'Failed to update user.'
      setError(message)
      showErrorToast('User update failed', message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOrderStatusChange = async (orderId: string, status: AdminOrder['status']) => {
    const previousOrders = orders
    const previousOrder = previousOrders.find((order) => order.id === orderId)
    if (!previousOrder || previousOrder.status === status) return
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status } : order)))
    try {
      await ordersApi.updateOrderStatus(orderId, status)
      showSuccessToast('Order updated', `Order #${orderId.slice(0, 8).toUpperCase()} marked as ${status}.`)
    } catch (updateError: any) {
      console.error('Order status update error:', updateError)
      setOrders(previousOrders)
      const message = updateError?.message || 'Failed to update order status.'
      setError(message)
      showErrorToast('Order update failed', message)
    }
  }

  const handleRequestStatusChange = async (requestId: string, status: ServiceRequest['status']) => {
    const previousRequests = requests
    const previousRequest = previousRequests.find((request) => request.id === requestId)
    if (!previousRequest || previousRequest.status === status) return
    setRequests((prev) => prev.map((request) => (request.id === requestId ? { ...request, status } : request)))
    try {
      await servicesApi.updateServiceStatus(requestId, status)
      showSuccessToast('Request updated', `Service request #${requestId.slice(0, 8).toUpperCase()} marked as ${status}.`)
    } catch (updateError: any) {
      console.error('Service request update error:', updateError)
      setRequests(previousRequests)
      const message = updateError?.message || 'Failed to update service request.'
      setError(message)
      showErrorToast('Request update failed', message)
    }
  }

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">Access denied</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">You do not have permission to open the admin console.</p>
          <button onClick={onClose} className="mt-6 rounded-2xl bg-gray-100 px-5 py-3 text-sm font-bold text-gray-800 transition hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
            Return
          </button>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="fixed inset-0 z-[100] h-full w-full overflow-y-auto bg-gray-50 dark:bg-slate-900">
      <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Admin Console</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Manage products, inventory, users, orders, and service requests.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchData} className="rounded-2xl bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
              Refresh
            </button>
            <button onClick={onClose} className="rounded-2xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-gray-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white">
              Exit Admin
            </button>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-4 md:px-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-8">
        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300">{error}</div> : null}

        {activeTab !== 'overview' ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {tabStats.map((stat) => (
              <StatCard key={stat.label} label={stat.label} value={isLoading ? '...' : stat.value} tone={stat.tone} />
            ))}
          </div>
        ) : null}

        {activeTab === 'overview' ? (
          <div className="space-y-6">
            <SectionCard title="Admin Overview" subtitle="High-level snapshot across products, inventory, orders, users, and requests.">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                <StatCard label="Products" value={isLoading ? '...' : products.length} />
                <StatCard label="Inventory Units" value={isLoading ? '...' : totalStockUnits} tone="warning" />
                <StatCard label="Orders" value={isLoading ? '...' : orders.length} tone="success" />
                <StatCard label="Users" value={isLoading ? '...' : users.length} />
                <StatCard label="Requests" value={isLoading ? '...' : requests.length} tone="danger" />
                <StatCard label="Revenue" value={isLoading ? '...' : formatCurrency(totalRevenue)} tone="success" />
              </div>
            </SectionCard>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <SectionCard title="Operations Summary" subtitle="Quick view of the most important admin signals.">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-gray-50 p-4 dark:bg-slate-900">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500 dark:text-slate-400">Delivered Orders</p>
                    <p className="mt-2 text-3xl font-black text-gray-900 dark:text-white">{isLoading ? '...' : deliveredOrders.length}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4 dark:bg-slate-900">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500 dark:text-slate-400">Pending Requests</p>
                    <p className="mt-2 text-3xl font-black text-gray-900 dark:text-white">{isLoading ? '...' : pendingRequests.length}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4 dark:bg-slate-900">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500 dark:text-slate-400">Out of Stock</p>
                    <p className="mt-2 text-3xl font-black text-gray-900 dark:text-white">{isLoading ? '...' : outOfStockProducts.length}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4 dark:bg-slate-900">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500 dark:text-slate-400">Blocked Users</p>
                    <p className="mt-2 text-3xl font-black text-gray-900 dark:text-white">{isLoading ? '...' : blockedUsers.length}</p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Inventory Alerts" subtitle="Products that need attention now.">
                <div className="space-y-3">
                  {isLoading ? (
                    <p className="text-sm text-gray-500 dark:text-slate-400">Loading alerts...</p>
                  ) : lowStockProducts.length === 0 && outOfStockProducts.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-slate-400">No stock alerts right now.</p>
                  ) : (
                    [...outOfStockProducts, ...lowStockProducts.filter((product) => Number(product.stock ?? 0) > 0)].slice(0, 6).map((product) => (
                      <div key={product.id} className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 dark:bg-slate-900">
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{product.name}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">{product.category || 'Uncategorized'}</p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            Number(product.stock ?? 0) <= 0
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                          }`}
                        >
                          {Number(product.stock ?? 0) <= 0 ? 'Out of stock' : `${product.stock} left`}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </SectionCard>

              <SectionCard
                title="Recent Orders"
                subtitle="Latest customer orders."
                rightSlot={
                  <button onClick={() => setActiveTab('orders')} className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    View all
                  </button>
                }
              >
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-slate-700">
                        <th className="pb-3 font-bold text-gray-500 dark:text-slate-400">Order</th>
                        <th className="pb-3 font-bold text-gray-500 dark:text-slate-400">Customer</th>
                        <th className="pb-3 font-bold text-gray-500 dark:text-slate-400">Total</th>
                        <th className="pb-3 font-bold text-gray-500 dark:text-slate-400">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                      {(isLoading ? [] : orders.slice(0, 5)).map((order) => (
                        <tr key={order.id}>
                          <td className="py-3 font-mono text-xs font-bold text-gray-600 dark:text-slate-300">#{order.id.slice(0, 8).toUpperCase()}</td>
                          <td className="py-3 text-gray-900 dark:text-white">{order.users?.name || order.users?.email || '-'}</td>
                          <td className="py-3 font-semibold text-gray-900 dark:text-white">{formatCurrency(order.total)}</td>
                          <td className="py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${STATUS_STYLES[order.status] || STATUS_STYLES.pending}`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!isLoading && orders.length === 0 ? <p className="py-6 text-sm text-gray-500 dark:text-slate-400">No orders found.</p> : null}
                </div>
              </SectionCard>

              <SectionCard title="Platform Mix" subtitle="Dynamic split of products, users, orders, and requests.">
                {isLoading ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-[220px_1fr]">
                    <div className="mx-auto h-48 w-48 animate-pulse rounded-full bg-gray-100 dark:bg-slate-900" />
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="h-16 animate-pulse rounded-2xl bg-gray-100 dark:bg-slate-900" />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <MinimalPieChart segments={overviewPieSegments} total={overviewPieTotal} />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 dark:bg-slate-900">
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">Blocked users</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">Accounts currently disabled.</p>
                        </div>
                        <span className="text-2xl font-black text-gray-900 dark:text-white">{blockedUsers.length}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 dark:bg-slate-900">
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">Open requests</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">Requests waiting for processing.</p>
                        </div>
                        <span className="text-2xl font-black text-gray-900 dark:text-white">{pendingRequests.length}</span>
                      </div>
                    </div>
                  </div>
                )}
              </SectionCard>
            </div>
          </div>
        ) : null}
        {activeTab === 'products' ? (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <SectionCard title={editingProductId ? 'Edit Product' : 'Add Product'} subtitle="Create new products or update existing catalog items.">
              <form className="space-y-4" onSubmit={handleProductSubmit}>
                <TextInput label="Product Name" value={productForm.name} onChange={(value) => setProductForm((prev) => ({ ...prev, name: value }))} placeholder="Smart TV" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextInput label="Price" type="number" min={0} value={productForm.price} onChange={(value) => setProductForm((prev) => ({ ...prev, price: value }))} placeholder="24999" />
                  <TextInput label="Stock" type="number" min={0} value={productForm.stock} onChange={(value) => setProductForm((prev) => ({ ...prev, stock: value }))} placeholder="10" />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextInput label="Category" value={productForm.category} onChange={(value) => setProductForm((prev) => ({ ...prev, category: value }))} placeholder="Electronics" />
                  <TextInput label="Rating" type="number" min={0} value={productForm.rating} onChange={(value) => setProductForm((prev) => ({ ...prev, rating: value }))} placeholder="4.6" />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextInput label="Warranty (Months)" type="number" min={0} value={productForm.warranty_months} onChange={(value) => setProductForm((prev) => ({ ...prev, warranty_months: value }))} placeholder="12" />
                  <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-3 text-xs font-medium text-gray-500 dark:border-slate-700 dark:text-slate-400">
                    Product details page will use rating, description, and warranty info directly from this form.
                  </div>
                </div>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 dark:text-slate-400">Description</span>
                  <textarea
                    rows={4}
                    value={productForm.description}
                    onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder="Short product overview, highlights, support promise..."
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </label>
                <div className="rounded-2xl border border-dashed border-gray-200 p-4 dark:border-slate-700">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">Product Images</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">Select multiple JPG, PNG, or WEBP images. First image becomes the main thumbnail.</p>
                    </div>
                    <label className={`inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-bold transition ${isUploadingImage || isSubmitting ? 'cursor-not-allowed bg-gray-200 text-gray-500 dark:bg-slate-700 dark:text-slate-400' : 'cursor-pointer bg-blue-600 text-white hover:bg-blue-700'}`}>
                      <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleProductImageSelection} disabled={isUploadingImage || isSubmitting} />
                      Select Images
                    </label>
                  </div>
                  <div className="mt-4 rounded-2xl bg-gray-50 px-4 py-3 text-xs font-medium text-gray-500 dark:bg-slate-900 dark:text-slate-400">
                    {productImagePreviews.length > 0 ? `${productImagePreviews.length} image${productImagePreviews.length > 1 ? 's' : ''} ready. Upload happens automatically when you save.` : 'No images selected yet.'}
                  </div>
                  {productImagePreviews.length > 0 ? (
                    <div className="mt-4 flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                      {productImagePreviews.map((preview, index) => (
                        <div key={preview.id} className="relative shrink-0">
                          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                            <img src={preview.src} alt={`Product preview ${index + 1}`} className="h-24 w-24 object-cover" />
                          </div>
                          <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] ${index === 0 ? 'bg-blue-600 text-white' : 'bg-white/90 text-gray-700 dark:bg-slate-900/90 dark:text-slate-200'}`}>
                            {index === 0 ? 'Cover' : `Img ${index + 1}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveProductImage(preview)}
                            className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs font-black text-white transition hover:scale-105 hover:bg-black"
                            aria-label={`Remove image ${index + 1}`}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
                <SelectInput
                  label="Availability"
                  value={productForm.is_active ? 'active' : 'inactive'}
                  onChange={(value) => setProductForm((prev) => ({ ...prev, is_active: value === 'active' }))}
                  options={[
                    { label: 'Active', value: 'active' },
                    { label: 'Inactive', value: 'inactive' },
                  ]}
                />

                <div className="flex flex-wrap gap-3">
                  <button type="submit" disabled={isSubmitting || isUploadingImage} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                    {isUploadingImage ? 'Uploading images...' : isSubmitting ? 'Saving...' : editingProductId ? 'Update Product' : 'Add Product'}
                  </button>
                  <button type="button" onClick={resetProductForm} className="rounded-2xl bg-gray-100 px-5 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-950">
                    Reset
                  </button>
                </div>
              </form>
            </SectionCard>

            <SectionCard title="Product List" subtitle="Current catalog with stock and status controls.">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-700">
                      <th className="pb-3 font-bold text-gray-500 dark:text-slate-400">Product</th>
                      <th className="pb-3 font-bold text-gray-500 dark:text-slate-400">Category</th>
                      <th className="pb-3 font-bold text-gray-500 dark:text-slate-400">Price</th>
                      <th className="pb-3 font-bold text-gray-500 dark:text-slate-400">Rating</th>
                      <th className="pb-3 font-bold text-gray-500 dark:text-slate-400">Stock</th>
                      <th className="pb-3 font-bold text-gray-500 dark:text-slate-400">Status</th>
                      <th className="pb-3 text-right font-bold text-gray-500 dark:text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {(isLoading ? [] : products).map((product) => {
                      const stockDraftValue = stockDrafts[product.id] ?? String(Number(product.stock ?? 0))
                      const hasPendingStockChange = stockDraftValue !== String(Number(product.stock ?? 0))

                      return (
                      <tr key={product.id}>
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <img src={product.image} alt={product.name} className="h-12 w-12 rounded-2xl object-cover" />
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white">{product.name}</p>
                              <p className="text-[11px] font-semibold text-gray-400 dark:text-slate-500">{Math.max(product.images?.length ?? 0, product.image ? 1 : 0)} image{Math.max(product.images?.length ?? 0, product.image ? 1 : 0) === 1 ? '' : 's'}</p>
                              <p className="text-xs text-gray-500 dark:text-slate-400">{formatDate(product.created_at)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-gray-700 dark:text-slate-300">{product.category || '-'}</td>
                        <td className="py-4 font-semibold text-gray-900 dark:text-white">{formatCurrency(product.price)}</td>
                        <td className="py-4 text-gray-700 dark:text-slate-300">{Number(product.rating ?? 4.6).toFixed(1)}</td>
                        <td className="py-4 text-gray-700 dark:text-slate-300">
                          <div className="flex items-center justify-start gap-2">
                            <input
                              type="number"
                              min={0}
                              value={stockDraftValue}
                              onChange={(event) => handleStockDraftChange(product.id, event.target.value)}
                              className="w-24 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleQuickStockUpdate(product)}
                              disabled={isSubmitting || !hasPendingStockChange}
                              className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Save
                            </button>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${product.is_active === false ? STATUS_STYLES.cancelled : STATUS_STYLES.completed}`}>
                            {product.is_active === false ? 'Inactive' : 'Active'}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleEditProduct(product)} className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-950">
                              Edit
                            </button>
                            <button onClick={() => handleDeleteProduct(product.id)} className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-300 dark:hover:bg-rose-900/30">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
                {!isLoading && products.length === 0 ? <p className="py-6 text-sm text-gray-500 dark:text-slate-400">No products found.</p> : null}
              </div>
            </SectionCard>
          </div>
        ) : null}
        {activeTab === 'inventory' ? (
          <div className="space-y-6">
            <SectionCard title="Stock Distribution" subtitle="Live catalog split by healthy, low, and out of stock items.">
              {isLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[220px_1fr]">
                  <div className="mx-auto h-48 w-48 animate-pulse rounded-full bg-gray-100 dark:bg-slate-900" />
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="h-16 animate-pulse rounded-2xl bg-gray-100 dark:bg-slate-900" />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <MinimalPieChart segments={inventoryPieSegments} total={inventoryPieTotal} />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-emerald-50 px-4 py-3 dark:bg-emerald-900/10">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">Healthy</p>
                      <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">{healthyStockProducts.length}</p>
                    </div>
                    <div className="rounded-2xl bg-amber-50 px-4 py-3 dark:bg-amber-900/10">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600 dark:text-amber-300">Low Stock</p>
                      <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">{lowStockProducts.length}</p>
                    </div>
                    <div className="rounded-2xl bg-rose-50 px-4 py-3 dark:bg-rose-900/10">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-600 dark:text-rose-300">Out of Stock</p>
                      <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">{outOfStockProducts.length}</p>
                    </div>
                  </div>
                </div>
              )}
            </SectionCard>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <SectionCard title="Low Stock Alerts" subtitle={`Products with ${LOW_STOCK_THRESHOLD} or fewer units available.`}>
                <div className="space-y-3">
                  {isLoading ? (
                    <p className="text-sm text-gray-500 dark:text-slate-400">Loading inventory alerts...</p>
                  ) : lowStockProducts.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-slate-400">No low stock products.</p>
                  ) : (
                    lowStockProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3 dark:bg-amber-900/10">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{product.name}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">{product.category || '-'}</p>
                        </div>
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          {product.stock} left
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </SectionCard>

              <SectionCard title="Out Of Stock Products" subtitle="Products unavailable for new orders.">
                <div className="space-y-3">
                  {isLoading ? (
                    <p className="text-sm text-gray-500 dark:text-slate-400">Loading stock status...</p>
                  ) : outOfStockProducts.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-slate-400">No out of stock products.</p>
                  ) : (
                    outOfStockProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between rounded-2xl bg-rose-50 px-4 py-3 dark:bg-rose-900/10">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{product.name}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">{product.category || '-'}</p>
                        </div>
                        <button onClick={() => handleEditProduct(product)} className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-slate-950">
                          Restock
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </SectionCard>
            </div>

            <SectionCard title="Full Inventory" subtitle="Live product stock levels for order fulfillment.">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-700">
                      <th className="pb-3 font-bold text-gray-500 dark:text-slate-400">Product</th>
                      <th className="pb-3 font-bold text-gray-500 dark:text-slate-400">Stock</th>
                      <th className="pb-3 font-bold text-gray-500 dark:text-slate-400">Availability</th>
                      <th className="pb-3 text-right font-bold text-gray-500 dark:text-slate-400">Manage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {(isLoading ? [] : products).map((product) => (
                      <tr key={product.id}>
                        <td className="py-4">
                          <p className="font-bold text-gray-900 dark:text-white">{product.name}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">{product.category || '-'}</p>
                        </td>
                        <td className="py-4 text-gray-900 dark:text-white">{product.stock ?? 0}</td>
                        <td className="py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            Number(product.stock ?? 0) <= 0 ? STATUS_STYLES.cancelled : Number(product.stock ?? 0) <= LOW_STOCK_THRESHOLD ? STATUS_STYLES.processing : STATUS_STYLES.completed
                          }`}>
                            {Number(product.stock ?? 0) <= 0 ? 'Out of stock' : Number(product.stock ?? 0) <= LOW_STOCK_THRESHOLD ? 'Low stock' : 'Healthy'}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button onClick={() => handleEditProduct(product)} className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-950">
                            Update Stock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        ) : null}
        {activeTab === 'users' ? (
          <SectionCard title="User Management" subtitle="Review customer details and control account access.">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-700">
                    <th className="pb-3 font-bold text-gray-500 dark:text-slate-400">User</th>
                    <th className="pb-3 font-bold text-gray-500 dark:text-slate-400">Phone</th>
                    <th className="pb-3 font-bold text-gray-500 dark:text-slate-400">Joined</th>
                    <th className="pb-3 font-bold text-gray-500 dark:text-slate-400">Role</th>
                    <th className="pb-3 font-bold text-gray-500 dark:text-slate-400">Status</th>
                    <th className="pb-3 text-right font-bold text-gray-500 dark:text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {(isLoading ? [] : users).map((user) => (
                    <tr key={user.id}>
                      <td className="py-4">
                        <p className="font-bold text-gray-900 dark:text-white">{user.name || 'Unknown User'}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{user.email}</p>
                      </td>
                      <td className="py-4 text-gray-700 dark:text-slate-300">{user.phone || '-'}</td>
                      <td className="py-4 text-gray-700 dark:text-slate-300">{formatDate(user.created_at)}</td>
                      <td className="py-4 text-gray-700 dark:text-slate-300">{user.is_admin ? 'Admin' : user.role || 'Customer'}</td>
                      <td className="py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${user.is_blocked ? STATUS_STYLES.cancelled : STATUS_STYLES.completed}`}>
                          {user.is_blocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => handleToggleUserBlock(user)}
                          className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                            user.is_blocked
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/30'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-300 dark:hover:bg-rose-900/30'
                          }`}
                        >
                          {user.is_blocked ? 'Unblock' : 'Block'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!isLoading && users.length === 0 ? <p className="py-6 text-sm text-gray-500 dark:text-slate-400">No users found.</p> : null}
            </div>
          </SectionCard>
        ) : null}
        {activeTab === 'orders' ? (
          <SectionCard
            title="Order Management"
            subtitle="Track order progress and recognized revenue."
            rightSlot={<span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">{pendingOrders.length} pending now</span>}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-700">
                    <th className="pb-3 font-bold text-gray-500 dark:text-slate-400">Order</th>
                    <th className="pb-3 font-bold text-gray-500 dark:text-slate-400">Customer</th>
                    <th className="pb-3 font-bold text-gray-500 dark:text-slate-400">Items</th>
                    <th className="pb-3 font-bold text-gray-500 dark:text-slate-400">Date</th>
                    <th className="pb-3 font-bold text-gray-500 dark:text-slate-400">Total</th>
                    <th className="pb-3 font-bold text-gray-500 dark:text-slate-400">Status</th>
                    <th className="pb-3 text-right font-bold text-gray-500 dark:text-slate-400">Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {(isLoading ? [] : orders).map((order) => (
                    <tr key={order.id}>
                      <td className="py-4 font-mono text-xs font-bold text-gray-600 dark:text-slate-300">#{order.id.slice(0, 8).toUpperCase()}</td>
                      <td className="py-4">
                        <p className="font-bold text-gray-900 dark:text-white">{order.users?.name || '-'}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{order.users?.email || '-'}</p>
                      </td>
                      <td className="py-4 text-gray-700 dark:text-slate-300">
                        {order.order_items?.length ? order.order_items.map((item) => `${item.products?.name || 'Item'} x${item.quantity}`).join(', ') : '-'}
                      </td>
                      <td className="py-4 text-gray-700 dark:text-slate-300">{formatDate(order.created_at)}</td>
                      <td className="py-4 font-semibold text-gray-900 dark:text-white">{formatCurrency(order.total)}</td>
                      <td className="py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${STATUS_STYLES[order.status] || STATUS_STYLES.pending}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <select
                          value={order.status}
                          onChange={(event) => handleOrderStatusChange(order.id, event.target.value as AdminOrder['status'])}
                          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-800 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        >
                          {ORDER_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!isLoading && orders.length === 0 ? <p className="py-6 text-sm text-gray-500 dark:text-slate-400">No orders found.</p> : null}
            </div>
          </SectionCard>
        ) : null}
        {activeTab === 'requests' ? (
          <SectionCard title="Service Requests" subtitle="Review applications, update status, and inspect submitted documents.">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-700">
                    <th className="pb-3 font-bold text-gray-500 dark:text-slate-400">Request</th>
                    <th className="pb-3 font-bold text-gray-500 dark:text-slate-400">Applicant</th>
                    <th className="pb-3 font-bold text-gray-500 dark:text-slate-400">Date</th>
                    <th className="pb-3 font-bold text-gray-500 dark:text-slate-400">Status</th>
                    <th className="pb-3 text-right font-bold text-gray-500 dark:text-slate-400">Update</th>
                    <th className="pb-3 text-right font-bold text-gray-500 dark:text-slate-400">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {(isLoading ? [] : requests).map((request) => {
                    const isOpen = expandedReqId === request.id
                    const formEntries = Object.entries((request.form_data as Record<string, unknown>) || {}).filter(([, value]) => value)
                    const documentUrls = Array.isArray(request.document_urls) ? request.document_urls : []

                    return (
                      <React.Fragment key={request.id}>
                        <tr className={isOpen ? 'bg-gray-50 dark:bg-slate-900/60' : ''}>
                          <td className="py-4">
                            <p className="font-bold text-gray-900 dark:text-white">{request.services?.name || 'Service request'}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">#{request.id.slice(0, 8).toUpperCase()}</p>
                          </td>
                          <td className="py-4">
                            <p className="font-bold text-gray-900 dark:text-white">{request.users?.name || '-'}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">{request.users?.email || '-'}</p>
                          </td>
                          <td className="py-4 text-gray-700 dark:text-slate-300">{formatDate(request.created_at)}</td>
                          <td className="py-4">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${STATUS_STYLES[request.status] || STATUS_STYLES.pending}`}>
                              {request.status}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <select
                              value={request.status}
                              onChange={(event) => handleRequestStatusChange(request.id, event.target.value as ServiceRequest['status'])}
                              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-800 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            >
                              {REQUEST_STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() => setExpandedReqId(isOpen ? null : request.id)}
                              className="inline-flex items-center gap-1 rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-950"
                            >
                              Details
                              <ChevronDownIcon open={isOpen} />
                            </button>
                          </td>
                        </tr>

                        {isOpen ? (
                          <tr>
                            <td colSpan={6} className="pb-5 pt-1">
                              <div className="grid grid-cols-1 gap-4 rounded-2xl bg-gray-50 p-4 dark:bg-slate-900 md:grid-cols-2">
                                <div>
                                  <h3 className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-gray-500 dark:text-slate-400">Form Data</h3>
                                  {formEntries.length === 0 ? (
                                    <p className="text-sm text-gray-500 dark:text-slate-400">No form data submitted.</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {formEntries.map(([key, value]) => (
                                        <div key={key} className="rounded-2xl bg-white px-4 py-3 dark:bg-slate-800">
                                          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-500 dark:text-slate-400">{key}</p>
                                          <p className="mt-1 break-all text-sm font-medium text-gray-900 dark:text-white">{String(value)}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <h3 className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-gray-500 dark:text-slate-400">Documents</h3>
                                  {documentUrls.length === 0 ? (
                                    <p className="text-sm text-gray-500 dark:text-slate-400">No documents uploaded.</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {documentUrls.map((url, index) => (
                                        <a
                                          key={`${request.id}-${index}`}
                                          href={url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-bold text-gray-900 transition hover:bg-gray-100 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                                        >
                                          <span>Document {index + 1}</span>
                                          <span className="text-xs text-blue-600 dark:text-blue-400">Open</span>
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
              {!isLoading && requests.length === 0 ? <p className="py-6 text-sm text-gray-500 dark:text-slate-400">No service requests found.</p> : null}
            </div>
          </SectionCard>
        ) : null}
      </div>
    </div>
  )
}

export default AdminManagementDashboard
