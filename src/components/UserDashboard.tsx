import React, { useState, useEffect, useMemo } from 'react'
import { type User } from '@supabase/supabase-js'
import { type Order, type ServiceRequest, type Warranty, type WarrantyStatus } from '../lib/types'
import { usersApi } from '../api/users'
import { ordersApi } from '../api/orders'
import { servicesApi } from '../api/services'
import { getServiceDisplayName } from '../lib/serviceDisplay'

// ── Icons ────────────────────────────────────────────────────────────────────

const PackageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
  </svg>
)

const ClipboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
)

const RefreshIcon = ({ spinning }: { spinning?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182M2.985 19.644l3.181-3.182" />
  </svg>
)

const ShieldIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
  </svg>
)

const EmptyBoxIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-16 h-16 text-gray-300 dark:text-slate-600">
    <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
  </svg>
)

// ── Status Helpers ───────────────────────────────────────────────────────────

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'delivered' | 'cancelled'
type RequestStatus = 'pending' | 'processing' | 'completed' | 'rejected' | 'cancelled'

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string; ring: string }> = {
  pending:    { label: 'Pending',    dot: 'bg-gray-400',    bg: 'bg-gray-100 dark:bg-slate-700/60',       text: 'text-gray-600 dark:text-slate-300',    ring: 'ring-gray-200 dark:ring-slate-600' },
  processing: { label: 'Processing', dot: 'bg-amber-500',   bg: 'bg-amber-50 dark:bg-amber-900/30',       text: 'text-amber-700 dark:text-amber-400',   ring: 'ring-amber-200 dark:ring-amber-800' },
  shipped:    { label: 'Shipped',    dot: 'bg-sky-500',     bg: 'bg-sky-50 dark:bg-sky-900/30',           text: 'text-sky-700 dark:text-sky-400',       ring: 'ring-sky-200 dark:ring-sky-800' },
  completed:  { label: 'Completed',  dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/30',   text: 'text-emerald-700 dark:text-emerald-400', ring: 'ring-emerald-200 dark:ring-emerald-800' },
  delivered:  { label: 'Delivered',  dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/30',   text: 'text-emerald-700 dark:text-emerald-400', ring: 'ring-emerald-200 dark:ring-emerald-800' },
  cancelled:  { label: 'Cancelled',  dot: 'bg-red-500',     bg: 'bg-red-50 dark:bg-red-900/30',           text: 'text-red-700 dark:text-red-400',       ring: 'ring-red-200 dark:ring-red-800' },
  rejected:   { label: 'Rejected',   dot: 'bg-rose-500',    bg: 'bg-rose-50 dark:bg-rose-900/30',         text: 'text-rose-700 dark:text-rose-400',     ring: 'ring-rose-200 dark:ring-rose-800' },
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ring-1 ${config.bg} ${config.text} ${config.ring}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}

// ── Extended Order type with items ───────────────────────────────────────────
interface OrderWithItems extends Order {
  order_items?: {
    id: string
    quantity: number
    price: number
    products?: {
      name: string
      image: string | null
    } | null
  }[]
}

// ── Tab Filter Component ─────────────────────────────────────────────────────

type DashTab = 'overview' | 'orders' | 'requests' | 'warranties'

const DASH_TABS: { id: DashTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg> },
  { id: 'orders', label: 'Orders', icon: <PackageIcon /> },
  { id: 'requests', label: 'Requests', icon: <ClipboardIcon /> },
  { id: 'warranties', label: 'Warranty', icon: <ShieldIcon /> },
]

// ── Skeleton Placeholders ────────────────────────────────────────────────────

const SkeletonCard: React.FC = () => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700/50 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-slate-700 shrink-0" />
      <div className="flex-1">
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-2/5 mb-2" />
        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/4" />
      </div>
      <div className="w-20 h-6 bg-gray-200 dark:bg-slate-700 rounded-full" />
    </div>
  </div>
)

const SkeletonProfileCard: React.FC = () => (
  <div className="bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-[24px] p-8 animate-pulse">
    <div className="flex items-center gap-6">
      <div className="w-20 h-20 rounded-full bg-slate-300 dark:bg-slate-600" />
      <div className="flex-1">
        <div className="h-6 bg-slate-300 dark:bg-slate-600 rounded w-1/3 mb-3" />
        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-1/2" />
      </div>
    </div>
  </div>
)

// ── Empty State ──────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
    <EmptyBoxIcon />
    <p className="mt-4 text-lg font-bold text-gray-400 dark:text-slate-500">{title}</p>
    <p className="text-sm text-gray-400 dark:text-slate-600 mt-1">{subtitle}</p>
  </div>
)

// ── Sign-In Prompt ───────────────────────────────────────────────────────────

const SignInPrompt: React.FC<{ onSignIn: () => void }> = ({ onSignIn }) => (
  <div className="min-h-[60vh] flex items-center justify-center px-4">
    <div className="text-center animate-scale-in">
      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-12 h-12">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      </div>
      <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Welcome Back</h2>
      <p className="text-gray-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">Sign in to access your dashboard, view your orders, and track service requests.</p>
      <button
        onClick={onSignIn}
        className="px-10 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-300"
      >
        Sign In to Continue
      </button>
    </div>
  </div>
)

// ══════════════════════════════════════════════════════════════════════════════
// ▸ USER DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════

interface UserDashboardProps {
  user: User | null
  onLogout: () => void
  onSignIn: () => void
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, onLogout, onSignIn }) => {
  const [activeTab, setActiveTab] = useState<DashTab>('overview')
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [warranties, setWarranties] = useState<Warranty[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // ── Fetch Data ──────────────────────────────────────────────────────────────
  const fetchDashboardData = async (showRefresh = false) => {
    if (!user) return
    if (showRefresh) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      const [ordersRes, requestsRes, warrantiesRes] = await Promise.all([
        ordersApi.fetchUserOrders(user.id),
        servicesApi.fetchServiceRequests(user.id),
        usersApi.fetchWarranties(user.id)
      ])

      if (ordersRes) setOrders(ordersRes as OrderWithItems[])
      if (requestsRes) setRequests(requestsRes as ServiceRequest[])
      if (warrantiesRes) setWarranties(warrantiesRes as Warranty[])
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (user) fetchDashboardData()
  }, [user])

  // ── Computed Stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    totalOrders: orders.length,
    completedOrders: orders.filter(o => o.status === 'completed' || o.status === 'delivered').length,
    totalSpent: orders.reduce((sum, o) => sum + Number(o.total), 0),
    activeRequests: requests.filter(r => r.status === 'pending' || r.status === 'processing').length,
    totalRequests: requests.length,
    completedRequests: requests.filter(r => r.status === 'completed').length,
    activeWarranties: warranties.filter(w => {
      const today = new Date(); today.setHours(0,0,0,0)
      return new Date(w.warranty_end_date) >= today
    }).length,
    totalWarranties: warranties.length,
  }), [orders, requests, warranties])

  // ── Filtered Data ───────────────────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders
    return orders.filter(o => o.status === statusFilter)
  }, [orders, statusFilter])

  const filteredRequests = useMemo(() => {
    if (statusFilter === 'all') return requests
    return requests.filter(r => r.status === statusFilter)
  }, [requests, statusFilter])

  // ── Not Signed In ───────────────────────────────────────────────────────────
  if (!user) return <SignInPrompt onSignIn={onSignIn} />

  // ── Profile Card ────────────────────────────────────────────────────────────
  const ProfileCard = () => (
    <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 rounded-[24px] p-6 lg:p-8 text-white overflow-hidden animate-scale-in">
      <div className="relative z-10">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-3xl lg:text-4xl font-black shadow-2xl">
            {user.user_metadata?.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl lg:text-2xl font-black truncate">
              {user.user_metadata?.name || 'Citizen'}
            </h2>
            <p className="text-white/60 text-sm font-medium truncate mt-0.5">{user.email}</p>
            {user.phone && (
              <p className="text-white/50 text-xs font-medium mt-0.5">{user.phone}</p>
            )}
          </div>
        </div>

        {/* Mini stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: stats.totalOrders, label: 'Orders' },
            { value: stats.totalRequests, label: 'Requests' },
            { value: `₹${stats.totalSpent.toLocaleString()}`, label: 'Spent' },
          ].map(({ value, label }) => (
            <div key={label} className="bg-white/10 rounded-xl p-3 text-center border border-white/10">
              <p className="text-lg lg:text-xl font-black">{value}</p>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ── Overview Stats Cards ────────────────────────────────────────────────────
  const OverviewStats = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in">
      {[
        { value: stats.totalOrders,       label: 'Total Orders',      icon: '📦', gradient: 'from-blue-500 to-blue-600',    bgLight: 'bg-blue-50 dark:bg-blue-900/20',      textColor: 'text-blue-600 dark:text-blue-400' },
        { value: stats.completedOrders,   label: 'Completed',         icon: '✅', gradient: 'from-emerald-500 to-emerald-600', bgLight: 'bg-emerald-50 dark:bg-emerald-900/20', textColor: 'text-emerald-600 dark:text-emerald-400' },
        { value: stats.activeRequests,    label: 'Active Requests',   icon: '⏳', gradient: 'from-amber-500 to-orange-500', bgLight: 'bg-amber-50 dark:bg-amber-900/20',    textColor: 'text-amber-600 dark:text-amber-400' },
        { value: stats.activeWarranties,  label: 'Active Warranties', icon: '🛡️', gradient: 'from-violet-500 to-purple-600', bgLight: 'bg-violet-50 dark:bg-violet-900/20', textColor: 'text-violet-600 dark:text-violet-400' },
      ].map(({ value, label, icon, bgLight, textColor }, i) => (
        <div
          key={label}
          className={`${bgLight} rounded-2xl p-4 lg:p-5 border border-transparent hover:border-gray-200 dark:hover:border-slate-600 transition-all duration-300 animate-slide-up`}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <span className="text-xl block mb-2">{icon}</span>
          <p className={`text-2xl lg:text-3xl font-black ${textColor}`}>{value}</p>
          <p className="text-[10px] lg:text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mt-1">{label}</p>
        </div>
      ))}
    </div>
  )

  // ── Order Card ──────────────────────────────────────────────────────────────
  const OrderCard: React.FC<{ order: OrderWithItems; index: number }> = ({ order, index }) => {
    const isExpanded = expandedOrder === order.id
    const itemCount = order.order_items?.length || 0

    return (
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 hover:shadow-md transition-all duration-300 overflow-hidden animate-slide-up"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className="p-4 lg:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 border border-blue-100 dark:border-blue-800/30">
              <PackageIcon />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  Order #{order.id.slice(0, 8).toUpperCase()}
                </p>
                <StatusBadge status={order.status} />
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                  {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-600"></span>
                <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full border-t sm:border-t-0 border-gray-100 dark:border-slate-700/50 pt-3 sm:pt-0">
            <div className="text-left sm:text-right">
              <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 mb-0.5">Total Amount</p>
              <p className="text-base font-black text-gray-900 dark:text-white">₹{Number(order.total).toLocaleString()}</p>
            </div>
            
            <button
              onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
              className="group flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors shrink-0"
            >
              {isExpanded ? 'Hide Details' : 'View Details'}
              <span className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'group-hover:translate-y-0.5'}`}>
                <ChevronDownIcon />
              </span>
            </button>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t border-gray-100 dark:border-slate-700/50 p-4 lg:p-5 bg-gray-50/50 dark:bg-slate-800/50 animate-fade-in relative">
            <div className="absolute top-0 left-6 w-px h-full bg-gray-200 dark:bg-slate-700/50 hidden sm:block -z-0" />
            <h4 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4 sm:pl-16 relative z-10">Items in this order</h4>
            
            {order.order_items && order.order_items.length > 0 ? (
              <div className="space-y-3 sm:pl-16 relative z-10">
                {order.order_items.map(item => (
                  <div key={item.id} className="flex items-center gap-4 bg-white dark:bg-slate-800 rounded-xl p-3 border border-gray-100 dark:border-slate-700/50 shadow-sm transition-all hover:shadow-md hover:border-blue-100 dark:hover:border-blue-900/30">
                    <div className="relative">
                      {item.products?.image ? (
                        <img src={item.products.image} alt={item.products?.name || 'Product'} className="w-12 h-12 rounded-lg object-cover bg-gray-50 dark:bg-slate-700" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-slate-700/50 flex items-center justify-center text-gray-400 dark:text-slate-500 text-lg">📦</div>
                      )}
                      <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold border-2 border-white dark:border-slate-800 shadow-sm">
                        x{item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <p className="text-sm font-bold text-gray-800 dark:text-slate-200 truncate pr-4">{item.products?.name || 'Product'}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">₹{Number(item.price).toLocaleString()} each</p>
                    </div>
                    <p className="text-sm lg:text-base font-black text-gray-900 dark:text-white shrink-0 pr-1">
                      ₹{(Number(item.price) * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-slate-500 italic sm:pl-16">No item details available</p>
            )}
          </div>
        )}
      </div>
    )
  }

  // ── Warranty Card ───────────────────────────────────────────────────────────
  const WarrantyCard: React.FC<{ warranty: Warranty; index: number }> = ({ warranty, index }) => {
    const today = new Date(); today.setHours(0,0,0,0)
    const endDate = new Date(warranty.warranty_end_date)
    const startDate = new Date(warranty.warranty_start_date)
    const isActive = endDate >= today
    const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const progressPct = isActive ? Math.max(0, Math.min(100, Math.round((daysLeft / totalDays) * 100))) : 0

    const badgeCfg = isActive
      ? { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', ring: 'ring-emerald-200 dark:ring-emerald-800', dot: 'bg-emerald-500', label: 'Active' }
      : { bg: 'bg-red-50 dark:bg-red-900/30',     text: 'text-red-700 dark:text-red-400',       ring: 'ring-red-200 dark:ring-red-800',       dot: 'bg-red-500',     label: 'Expired' }

    const barColor = isActive
      ? daysLeft <= 30
        ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
        : 'linear-gradient(90deg,#10b981,#34d399)'
      : 'linear-gradient(90deg,#ef4444,#f87171)'

    return (
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 hover:shadow-md transition-all duration-300 overflow-hidden animate-slide-up"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className="p-4 lg:p-5">
          <div className="flex items-start gap-4">
            {/* Product image / icon */}
            <div className="relative shrink-0">
              {warranty.products?.image ? (
                <img
                  src={warranty.products.image}
                  alt={warranty.products?.name || 'Product'}
                  className="w-14 h-14 rounded-xl object-cover bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-700"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center border border-violet-100 dark:border-violet-800/30">
                  <ShieldIcon className="w-7 h-7 text-violet-500 dark:text-violet-400" />
                </div>
              )}
              {/* Status dot overlay */}
              <span className={`absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-800 shadow-sm ${badgeCfg.dot}`} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {warranty.products?.name || 'Product'}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5 capitalize">
                    {warranty.products?.category || 'General'}
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ring-1 shrink-0 ${badgeCfg.bg} ${badgeCfg.text} ${badgeCfg.ring}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${badgeCfg.dot}`} />
                  {badgeCfg.label}
                </span>
              </div>

              {/* Dates row */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-gray-500 dark:text-slate-400 mb-3">
                <span className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                  Starts: {new Date(warranty.warranty_start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-red-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  Expires: {endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              {/* Progress bar + days left */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Warranty Period</p>
                  {isActive ? (
                    <p className={`text-[10px] font-bold ${
                      daysLeft <= 30 ? 'text-amber-500' : 'text-emerald-500'
                    }`}>
                      {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                    </p>
                  ) : (
                    <p className="text-[10px] font-bold text-red-400">Warranty ended</p>
                  )}
                </div>
                <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progressPct}%`, background: barColor }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Service Request Card ────────────────────────────────────────────────────
  const RequestCard: React.FC<{ request: ServiceRequest; index: number }> = ({ request, index }) => {
    const isExpanded = expandedRequest === request.id
    const progress = request.status === 'completed' ? 100 : request.status === 'processing' ? 60 : 20

    return (
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 hover:shadow-md transition-all duration-300 overflow-hidden animate-slide-up"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className="p-4 lg:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 border border-indigo-100 dark:border-indigo-800/30">
              <ClipboardIcon />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  {getServiceDisplayName(request.services?.name) || 'Service Request'}
                </p>
                <StatusBadge status={request.status} />
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                  {new Date(request.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-600"></span>
                <span>Req #{request.id.slice(0, 8).toUpperCase()}</span>
              </div>
            </div>
          </div>
          
          <div className="w-full sm:w-1/3 mt-3 sm:mt-0 flex flex-col justify-center border-t sm:border-t-0 border-gray-100 dark:border-slate-700/50 pt-3 sm:pt-0">
            {/* Progress bar */}
            {request.status !== 'rejected' && (
              <div className="w-full">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-1.5">
                  <span className={request.status === 'pending' || request.status === 'processing' || request.status === 'completed' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500'}>Pending</span>
                  <span className={request.status === 'processing' || request.status === 'completed' ? 'text-amber-500 dark:text-amber-400' : 'text-gray-400 dark:text-slate-500'}>Processing</span>
                  <span className={request.status === 'completed' ? 'text-emerald-500 dark:text-emerald-400' : 'text-gray-400 dark:text-slate-500'}>Completed</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${progress}%`,
                      background: request.status === 'completed'
                        ? 'linear-gradient(90deg, #10b981, #34d399)'
                        : request.status === 'processing'
                        ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                        : 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                    }}
                  />
                </div>
              </div>
            )}
            {request.status === 'rejected' && (
              <div className="text-right sm:text-right">
                <p className="text-xs font-bold text-rose-500">Request Rejected</p>
                <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">Please check your email for details</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setExpandedRequest(isExpanded ? null : request.id)}
            className="mt-3 sm:mt-0 ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors shrink-0"
          >
            {isExpanded ? 'Hide Details' : 'View Details'}
            <span className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
              <ChevronDownIcon />
            </span>
          </button>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t border-gray-100 dark:border-slate-700/50 p-4 lg:p-5 bg-gray-50/50 dark:bg-slate-800/50 animate-fade-in text-sm text-gray-700 dark:text-slate-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Form Data */}
              {request.form_data && Object.keys(request.form_data).length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">Application Details</h4>
                  <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 border border-gray-100 dark:border-slate-700/50 space-y-2">
                    {Object.entries(request.form_data).map(([key, value]) => (
                      <div key={key} className="flex flex-col border-b border-gray-50 dark:border-slate-800/50 last:border-0 pb-2 last:pb-0">
                        <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider">{key}</span>
                        <span className="font-medium text-gray-900 dark:text-white mt-0.5">{String(value) || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Uploaded Documents */}
              {request.document_urls && request.document_urls.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">Uploaded Documents</h4>
                  <div className="space-y-2.5">
                    {request.document_urls.map((url, i) => (
                      <a 
                        key={i} 
                        href={url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900/50 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700/50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                        </div>
                        <span className="text-sm font-bold truncate flex-1">Document {i + 1}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Status Filter Chips ─────────────────────────────────────────────────────
  const STATUS_FILTERS = ['all', 'pending', 'processing', 'shipped', 'completed', 'delivered']

  const FilterChips = () => (
    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
      {STATUS_FILTERS.map(status => (
        <button
          key={status}
          onClick={() => setStatusFilter(status)}
          className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 tap-scale ${
            statusFilter === status
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
              : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
          }`}
        >
          {status === 'all' ? 'All' : STATUS_CONFIG[status]?.label || status}
        </button>
      ))}
    </div>
  )

  // ── Recent Items for Overview ───────────────────────────────────────────────
  const recentOrders = orders.slice(0, 3)
  const recentRequests = requests.slice(0, 3)

  return (
    <div className="px-4 py-6 lg:px-12 lg:py-10 min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Profile Card */}
        {isLoading ? <SkeletonProfileCard /> : <ProfileCard />}

        {/* Tab Navigation */}
        <div className="flex items-center justify-between mt-8 mb-6">
          <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 rounded-2xl p-1">
            {DASH_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setStatusFilter('all') }}
                className={`flex items-center gap-1.5 px-4 lg:px-5 py-2.5 rounded-xl text-xs lg:text-sm font-bold transition-all duration-200 tap-scale ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchDashboardData(true)}
            className="p-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all tap-scale"
            title="Refresh"
          >
            <RefreshIcon spinning={isRefreshing} />
          </button>
        </div>

        {/* ── OVERVIEW TAB ──────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            <OverviewStats />

            {/* Recent Orders Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm lg:text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="text-blue-500">📦</span> Recent Orders
                </h3>
                {orders.length > 3 && (
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
                  >
                    View All →
                  </button>
                )}
              </div>
              {isLoading ? (
                <div className="space-y-3">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
              ) : recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {recentOrders.map((order, i) => <OrderCard key={order.id} order={order} index={i} />)}
                </div>
              ) : (
                <EmptyState title="No orders yet" subtitle="Your purchase history will appear here" />
              )}
            </section>

            {/* Recent Service Requests Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm lg:text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="text-indigo-500">📋</span> Recent Requests
                </h3>
                {requests.length > 3 && (
                  <button
                    onClick={() => setActiveTab('requests')}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
                  >
                    View All →
                  </button>
                )}
              </div>
              {isLoading ? (
                <div className="space-y-3">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
              ) : recentRequests.length > 0 ? (
                <div className="space-y-3">
                  {recentRequests.map((req, i) => <RequestCard key={req.id} request={req} index={i} />)}
                </div>
              ) : (
                <EmptyState title="No service requests" subtitle="Apply for a service to get started" />
              )}
            </section>
          </div>
        )}

        {/* ── ORDERS TAB ────────────────────────────────────────────────── */}
        {activeTab === 'orders' && (
          <div className="space-y-4 animate-fade-in">
            <FilterChips />
            {isLoading ? (
              <div className="space-y-3">{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</div>
            ) : filteredOrders.length > 0 ? (
              <div className="space-y-3">
                {filteredOrders.map((order, i) => <OrderCard key={order.id} order={order} index={i} />)}
              </div>
            ) : (
              <EmptyState 
                title={statusFilter === 'all' ? 'No orders yet' : `No ${statusFilter} orders`} 
                subtitle="Orders you place will show up here" 
              />
            )}
          </div>
        )}

        {/* ── REQUESTS TAB ──────────────────────────────────────────────── */}
        {activeTab === 'requests' && (
          <div className="space-y-4 animate-fade-in">
            <FilterChips />
            {isLoading ? (
              <div className="space-y-3">{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</div>
            ) : filteredRequests.length > 0 ? (
              <div className="space-y-3">
                {filteredRequests.map((req, i) => <RequestCard key={req.id} request={req} index={i} />)}
              </div>
            ) : (
              <EmptyState 
                title={statusFilter === 'all' ? 'No service requests' : `No ${statusFilter} requests`} 
                subtitle="Apply for government services to track them here" 
              />
            )}
          </div>
        )}

        {/* ── WARRANTY TAB ──────────────────────────────────────────────── */}
        {activeTab === 'warranties' && (
          <div className="space-y-4 animate-fade-in">
            {/* Summary banner */}
            {!isLoading && warranties.length > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 bg-violet-50 dark:bg-violet-900/20 rounded-2xl border border-violet-100 dark:border-violet-800/30">
                <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center shrink-0 shadow-sm shadow-violet-500/30">
                  <ShieldIcon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-violet-700 dark:text-violet-300">
                    {stats.activeWarranties} of {stats.totalWarranties} warranties active
                  </p>
                  <p className="text-[10px] text-violet-500 dark:text-violet-400 mt-0.5">Coverage: 1 year from purchase date</p>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="space-y-3">{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</div>
            ) : warranties.length > 0 ? (
              <div className="space-y-3">
                {warranties.map((w, i) => <WarrantyCard key={w.id} warranty={w} index={i} />)}
              </div>
            ) : (
              <EmptyState
                title="No warranties yet"
                subtitle="Warranties are created automatically when you place an order"
              />
            )}
          </div>
        )}

        {/* Sign Out Button */}
        <button
          onClick={onLogout}
          className="w-full mt-10 mb-4 py-4 text-red-500 dark:text-red-400 font-bold text-sm rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5 hover:bg-red-100 dark:hover:bg-red-500/10 transition-all tap-scale"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}

export default UserDashboard
