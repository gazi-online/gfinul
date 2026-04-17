import React from 'react'

// ── Tab Icon Components ───────────────────────────────────────────────────────
const HomeIcon = ({ filled }: { filled?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
    {filled
      ? <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689ZM12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
      : <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    }
  </svg>
)

const GridIcon = ({ filled }: { filled?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
    {filled
      ? <path fillRule="evenodd" d="M3 6a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3V6ZM3 15.75a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-2.25Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3v-2.25Z" clipRule="evenodd" />
      : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
    }
  </svg>
)

const ShoppingBagIcon = ({ filled }: { filled?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
    {filled
      ? <path fillRule="evenodd" d="M6.75 5.25A2.25 2.25 0 0 1 9 3h6a2.25 2.25 0 0 1 2.25 2.25v1.13h1.125A1.875 1.875 0 0 1 20.25 8.25v10.125a2.625 2.625 0 0 1-2.625 2.625H6.375A2.625 2.625 0 0 1 3.75 18.375V8.25A1.875 1.875 0 0 1 5.625 6.375H6.75V5.25ZM9 6.375h6V5.25a.75.75 0 0 0-.75-.75H9.75A.75.75 0 0 0 9 5.25v1.125Z" clipRule="evenodd" />
      : <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.375V5.25A2.25 2.25 0 0 1 9 3h6a2.25 2.25 0 0 1 2.25 2.25v1.125m-10.5 0h10.5m-10.5 0H5.625A1.875 1.875 0 0 0 3.75 8.25v10.125A2.625 2.625 0 0 0 6.375 21h11.25a2.625 2.625 0 0 0 2.625-2.625V8.25a1.875 1.875 0 0 0-1.875-1.875H17.25" />
    }
  </svg>
)

const ClockIcon = ({ filled }: { filled?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
    {filled
      ? <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z" clipRule="evenodd" />
      : <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    }
  </svg>
)

const DashboardIcon = ({ filled }: { filled?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
    {filled
      ? <path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 0 1 8.25-8.25.75.75 0 0 1 .75.75v6.75H18a.75.75 0 0 1 .75.75 8.25 8.25 0 0 1-16.5 0Z" clipRule="evenodd" />
      : <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
    }
    {filled
      ? <path fillRule="evenodd" d="M12.75 3a.75.75 0 0 1 .75-.75 8.25 8.25 0 0 1 8.25 8.25.75.75 0 0 1-.75.75h-7.5a.75.75 0 0 1-.75-.75V3Z" clipRule="evenodd" />
      : <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
    }
  </svg>
)

const UserIcon = ({ filled }: { filled?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
    {filled
      ? <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
      : <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    }
  </svg>
)

export type TabId = 'home' | 'services' | 'products' | 'track' | 'dashboard' | 'profile'

interface NavTab {
  id: TabId
  label: string
  Icon: React.FC<{ filled?: boolean }>
}

const TABS: NavTab[] = [
  { id: 'home',      label: 'Home',      Icon: HomeIcon      },
  { id: 'services',  label: 'Services',  Icon: GridIcon      },
  { id: 'products',  label: 'Products',  Icon: ShoppingBagIcon },
  { id: 'track',     label: 'Track',     Icon: ClockIcon     },
  { id: 'dashboard', label: 'Dashboard', Icon: DashboardIcon },
]

interface BottomNavProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav
      id="bottom-nav"
      aria-label="Main navigation"
      className="glass-nav fixed inset-x-0 bottom-0 z-40 bg-white dark:bg-slate-900 border-t border-gray-100/60 dark:border-slate-800 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] lg:hidden transition-colors duration-300"
    >
      <div className="flex items-stretch max-w-lg mx-auto h-[72px]">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              id={`nav-tab-${id}`}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onTabChange(id)}
              className={`
                relative flex flex-col items-center justify-center flex-1 pt-2 pb-3 gap-1
                transition-all duration-300 tap-scale
                ${isActive
                  ? 'text-blue-600 dark:text-blue-400 scale-110'
                  : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 active:text-gray-700 dark:active:text-slate-200'
                }
              `}
            >
              {/* Active indicator line */}
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-[4px] w-10 bg-blue-600 dark:bg-blue-400 rounded-b-full shadow-lg shadow-blue-500/40"
                  style={{ animation: 'scaleIn 250ms cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
                />
              )}

              {/* Icon */}
              <span
                className="transition-transform duration-300"
              >
                <Icon filled={isActive} />
              </span>

              <span
                className={`
                  text-[11px] font-bold tracking-tight leading-none transition-colors duration-300
                  ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500'}
                `}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav
