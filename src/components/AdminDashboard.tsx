import React, { useState, useEffect } from 'react'
import { usersApi } from '../api/users'
import { ordersApi } from '../api/orders'
import { servicesApi } from '../api/services'

// ── Status helpers ─────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-300',
  processing: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  shipped:    'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  completed:  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  delivered:  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled:  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  rejected:   'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
}

const ChevronDownIcon = ({ open }: { open: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"
    className={`w-4 h-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
)

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, gradient }: { label: string; value: string | number; gradient?: string }) => (
  <div className={`${gradient || 'bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700'} rounded-3xl p-6 shadow-sm`}>
    <p className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">{label}</p>
    <p className={`text-4xl lg:text-5xl font-black ${gradient ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{value}</p>
  </div>
)

// ── Admin Dashboard ────────────────────────────────────────────────────────────
export const AdminDashboard: React.FC<{ onClose: () => void; isAdmin?: boolean }> = ({ onClose, isAdmin }) => {
  const [stats, setStats] = useState({ users: 0, orders: 0, revenue: 0 })
  const [orders, setOrders] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'orders' | 'requests'>('orders')
  const [expandedReqId, setExpandedReqId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full text-center shadow-xl border border-gray-100 dark:border-slate-800 animate-scale-in">
          <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-500 dark:text-slate-400 mb-6">You do not have the required permissions to access this area.</p>
          <button onClick={onClose} className="px-6 py-3 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-slate-700 transition">Return to Home</button>
        </div>
      </div>
    );
  }

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const [fetchedUsers, fetchedOrders, fetchedRequests] = await Promise.all([
        usersApi.fetchAllUsers(),
        ordersApi.fetchAllOrders(),
        servicesApi.fetchAllServiceRequests(),
      ])

      setStats({
        users:   fetchedUsers.length,
        orders:  fetchedOrders.length,
        revenue: fetchedOrders.reduce((acc: any, o: any) => acc + (Number(o.total) || 0), 0),
      })
      setOrders(fetchedOrders)
      setRequests(fetchedRequests)
    } catch (err: any) {
      console.error('Error fetching admin data:', err)
      setError(err.message || 'Failed to fetch dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    try {
      await ordersApi.updateOrderStatus(orderId, newStatus);
    } catch (error) {
      console.error('Update order error:', error); fetchData()
    }
  }

  const handleUpdateServiceStatus = async (reqId: string, newStatus: string) => {
    setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: newStatus } : r))
    try {
      await servicesApi.updateServiceStatus(reqId, newStatus);
    } catch (error) {
      console.error('Update request error:', error); fetchData()
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-slate-900 z-[100] overflow-y-auto w-full h-full">

      {/* Sticky Header */}
      <div className="sticky top-0 bg-white/80 dark:bg-slate-900/80 border-b border-gray-100 dark:border-slate-800 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight">Admin Console</h1>
            <p className="text-xs text-gray-400 dark:text-slate-500 font-medium hidden sm:block">Gazi online Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all"
              title="Refresh data"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182M2.985 19.644l3.181-3.182" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-full text-sm font-bold transition-colors"
            >
              Exit Admin
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="Total Users"   value={isLoading ? '—' : stats.users} />
          <StatCard label="Total Orders"  value={isLoading ? '—' : stats.orders} />
          <StatCard
            label="Total Revenue"
            value={isLoading ? '—' : `₹${stats.revenue.toLocaleString()}`}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          />
        </div>

        {/* Main Table Card */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400 p-4 rounded-xl flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden relative">
          
          {/* Loading Overlay Spinner */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 z-20 flex flex-col items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm font-bold text-gray-600 dark:text-slate-300">Fetching latest data...</span>
            </div>
          )}

          {/* Tab Bar */}
          <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                activeTab === 'orders'
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700/50'
              }`}
            >
              📦 Orders ({orders?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                activeTab === 'requests'
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700/50'
              }`}
            >
              📋 Service Requests ({requests?.length || 0})
            </button>
          </div>

          <div className="overflow-x-auto">
            {activeTab === 'orders' ? (
              /* ── ORDERS TABLE ─────────────────────────────────────────────── */
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-slate-800/50">
                    {['Order ID', 'User', 'Date', 'Total', 'Status', 'Action'].map((h, i) => (
                      <th key={h} className={`px-6 py-4 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider ${i === 5 ? 'text-right' : ''}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {Array.from({ length: 6 }).map((__, j) => (
                          <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full max-w-[80%]" /></td>
                        ))}
                      </tr>
                    ))
                  ) : !orders || orders.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 dark:text-slate-500">No orders found.</td></tr>
                  ) : (
                    orders?.map(order => (
                      <tr key={order?.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/80 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-bold text-gray-500 dark:text-slate-400">
                            #{order?.id ? order.id.slice(0, 8).toUpperCase() : '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{order?.users?.name || '—'}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{order?.users?.email || '—'}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300">
                          {order?.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td className="px-6 py-4 text-base font-bold text-gray-900 dark:text-white">
                          ₹{Number(order?.total || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${STATUS_COLORS[order?.status] || STATUS_COLORS.pending}`}>
                            {order?.status || 'pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <select
                            value={order?.status || 'pending'}
                            onChange={e => handleUpdateStatus(order?.id, e.target.value)}
                            className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 w-full max-w-[160px]"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              /* ── SERVICE REQUESTS TABLE ───────────────────────────────────── */
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-slate-800/50">
                    {['ID', 'Service / Applicant', 'Date', 'Status', 'Action', ''].map((h, i) => (
                      <th key={i} className={`px-6 py-4 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider ${i === 4 ? 'text-right' : ''}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {Array.from({ length: 6 }).map((__, j) => (
                          <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-slate-700 rounded" /></td>
                        ))}
                      </tr>
                    ))
                  ) : !requests || requests.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 dark:text-slate-500">No service requests found.</td></tr>
                  ) : (
                    requests?.map(req => {
                      const isExpanded = expandedReqId === req?.id
                      const formEntries = req?.form_data ? Object.entries(req.form_data as Record<string, any>).filter(([, v]) => v) : []
                      return (
                        <React.Fragment key={req?.id}>
                          <tr className={`hover:bg-gray-50 dark:hover:bg-slate-800/80 transition-colors ${isExpanded ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}>
                            <td className="px-6 py-4">
                              <span className="font-mono text-xs font-bold text-gray-500 dark:text-slate-400">
                                #{req?.id ? req.id.slice(0, 8).toUpperCase() : '—'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{req?.services?.name || '—'}</p>
                              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{req?.users?.name || '—'} · {req?.users?.email || '—'}</p>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300 whitespace-nowrap">
                              {req?.created_at ? new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${STATUS_COLORS[req?.status] || STATUS_COLORS.pending}`}>
                                {req?.status || 'pending'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <select
                                value={req?.status || 'pending'}
                                onChange={e => handleUpdateServiceStatus(req?.id, e.target.value)}
                                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 w-full max-w-[160px]"
                              >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="completed">Completed</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => setExpandedReqId(isExpanded ? null : req?.id)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                                  isExpanded
                                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                                    : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                                }`}
                              >
                                Details
                                <ChevronDownIcon open={isExpanded} />
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Row */}
                          {isExpanded && (
                            <tr className="bg-indigo-50/50 dark:bg-indigo-900/10 border-t border-indigo-100 dark:border-indigo-800/30">
                              <td colSpan={6} className="px-6 py-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                  {/* Form Data */}
                                  {formEntries.length > 0 ? (
                                    <div>
                                      <h4 className="text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                                        📝 Application Details
                                      </h4>
                                      <div className="bg-white dark:bg-slate-900/60 rounded-xl border border-gray-100 dark:border-slate-700/50 overflow-hidden">
                                        {formEntries.map(([key, value], i) => (
                                          <div
                                            key={key}
                                            className={`flex justify-between items-start gap-4 px-4 py-2.5 ${i < formEntries.length - 1 ? 'border-b border-gray-50 dark:border-slate-800' : ''}`}
                                          >
                                            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-slate-500 mt-0.5 shrink-0 capitalize">
                                              {key}
                                            </span>
                                            <span className="text-sm font-bold text-gray-900 dark:text-white text-right break-all">
                                              {String(value)}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <h4 className="text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">📝 Application Details</h4>
                                      <p className="text-sm text-gray-400 dark:text-slate-500 italic">No form data submitted.</p>
                                    </div>
                                  )}

                                  {/* Documents */}
                                  <div>
                                    <h4 className="text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                                      📎 Uploaded Documents
                                    </h4>
                                    {req?.document_urls && req.document_urls.length > 0 ? (
                                      <div className="space-y-2">
                                        {req.document_urls.map((url: string, i: number) => (
                                          <a
                                            key={i}
                                            href={url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900/60 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700/50 transition-colors group"
                                          >
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                              </svg>
                                            </div>
                                            <span className="text-sm font-bold text-gray-800 dark:text-slate-200 flex-1">Document {i + 1}</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors">
                                              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
                                            </svg>
                                          </a>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-400 dark:text-slate-500 italic">No documents uploaded.</p>
                                    )}
                                  </div>

                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
