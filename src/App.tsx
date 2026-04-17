import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import Header from './components/Header'
import BottomNav, { type TabId } from './components/BottomNav'
import { 
  PopularServicesSection, 
  RecentApplicationsSection, 
  FooterSection, 
  SearchSection, 
  QuickServicesGrid, 
  FeaturedProducts, 
  OffersBanner, 
  CustomerReviews, 
  WhyChooseUs, 
  AppCTASection, 
  EmptyState
} from './components/HomeSections'
import { type Product, type ServiceItem, type CartItem, type ServiceRequest } from './lib/types'
import { ServicesPage, ProductsPage, TrackPage, ProfilePage } from './components/OtherPages'
import ServiceFlow from './components/ServiceFlow'
import CartPage from './components/CartPage'
import CheckoutPage from './components/CheckoutPage'
import OrderSuccessPage from './components/OrderSuccessPage'
import ProductDetailsPage from './components/ProductDetailsPage'
import WhatsAppButton from './components/WhatsAppButton'
import AuthModal from './components/AuthModal'
import UserDashboard from './components/UserDashboard'
import AdminDashboard from './components/AdminManagementDashboard'
import { translations, type Language } from './lib/translations'
import { type User } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { getServiceKind } from './lib/serviceDisplay'

import { authApi } from './api/auth'
import { productsApi } from './api/products'
import { servicesApi } from './api/services'
import { ordersApi } from './api/orders'

// ── Page titles per tab ───────────────────────────────────────────────────────
const PAGE_TITLES: Record<TabId, string> = {
  home:      'Gazi online',
  services:  'All Services',
  products:  'Products',
  track:     'Track Application',
  dashboard: 'Dashboard',
  profile:   'My Profile',
}

const TAB_PATHS: Record<TabId, string> = {
  home: '/',
  services: '/services',
  products: '/products',
  track: '/track',
  dashboard: '/dashboard',
  profile: '/profile',
}

const PATH_TO_TAB: Record<string, TabId> = Object.entries(TAB_PATHS).reduce(
  (acc, [tab, path]) => {
    acc[path] = tab as TabId
    return acc
  },
  {} as Record<string, TabId>
)

const getTabFromPathname = (pathname: string): TabId => PATH_TO_TAB[pathname] ?? 'home'

const getReadableErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) {
      return message
    }
  }

  return fallback
}

export type ActiveService = { title: string; desc: string } | null;
export type ActiveProduct = Product | null;

// Default warranty duration in months
const WARRANTY_MONTHS = 12;

// CartItem moved to types.ts

// ── App ───────────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  // App States
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (typeof window === 'undefined') return 'home'
    return getTabFromPathname(window.location.pathname)
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [activeServiceFlow, setActiveServiceFlow] = useState<ActiveService>(null)
  const [language, setLanguage] = useState<Language>('en')
  const [notifications, setNotifications] = useState<number>(3)
  
  // Auth & User States
  const [user, setUser] = useState<User | null>(null)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  
  // Data States
  const [products, setProducts] = useState<Product[]>([])
  const [services, setServices] = useState<ServiceItem[]>([])
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRequestsLoading, setIsRequestsLoading] = useState(false)
  const [isRequestsRefreshing, setIsRequestsRefreshing] = useState(false)
  const [requestsLastUpdatedAt, setRequestsLastUpdatedAt] = useState<string | null>(null)

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null)
  const [activeProduct, setActiveProduct] = useState<ActiveProduct>(null)

  const mainRef = useRef<HTMLElement>(null)
  
  const t = translations[language];

  const refreshServiceRequests = useCallback(async (
    userId?: string,
    options?: { background?: boolean }
  ) => {
    const targetUserId = userId

    if (!targetUserId) {
      setServiceRequests(servicesApi.fetchGuestServiceRequests())
      setIsRequestsLoading(false)
      setIsRequestsRefreshing(false)
      setRequestsLastUpdatedAt(null)
      return
    }

    if (options?.background) {
      setIsRequestsRefreshing(true)
    } else {
      setIsRequestsLoading(true)
    }

    try {
      const data = await servicesApi.fetchServiceRequests(targetUserId)
      setServiceRequests(data)
      setRequestsLastUpdatedAt(new Date().toISOString())
    } catch (err) {
      console.error('Error fetching service requests:', err)
    } finally {
      setIsRequestsLoading(false)
      setIsRequestsRefreshing(false)
    }
  }, [])

  // ── Initialization ──────────────────────────────────────────────
  useEffect(() => {
    const checkAdminStatus = async (userId: string | undefined) => {
      if (!userId) {
        setIsAdmin(false);
        return;
      }
      const isRoleAdmin = await authApi.checkUserRole(userId);
      setIsAdmin(isRoleAdmin);
    };

    // Initial Auth Check
    authApi.getSession().then((session) => {
      setUser(session?.user ?? null)
      checkAdminStatus(session?.user?.id)
      refreshServiceRequests(session?.user?.id)
      document.body.classList.add('ready')
    })

    // Listen for Auth Changes
    const { data: { subscription } } = authApi.onAuthStateChange((session) => {
      setUser(session?.user ?? null)
      checkAdminStatus(session?.user?.id)
      refreshServiceRequests(session?.user?.id)
    })

    // Fetch Products and Services
    const fetchData = async () => {
      try {
        const [productsData, servicesData] = await Promise.all([
          productsApi.fetchProducts(),
          servicesApi.fetchServices()
        ])

        console.log('Fetched products:', productsData)
        console.log('Fetched services:', servicesData)

        setProducts(productsData || [])
        setServices(servicesData || [])
      } catch (err) {
        console.error('Error fetching data:', err)
        setProducts([])
        setServices([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    return () => subscription.unsubscribe()
  }, [refreshServiceRequests])

  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`service-requests:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_requests',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          refreshServiceRequests(user.id, { background: true })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refreshServiceRequests, user?.id])

  // ── Sync Cart with Supabase ──────────────────────────────────────────────
  useEffect(() => {
    if (user) {
      const fetchCart = async () => {
        try {
          const data = await ordersApi.fetchCart(user.id);
          const mappedItems: CartItem[] = data.map((item: any) => ({
            id: item.product_id,
            name: item.products.name,
            price: item.products.price,
            image: item.products.image,
            quantity: item.quantity
          }))
          setCartItems(mappedItems)
        } catch (err) {
          console.error("Fetch cart error:", err);
        }
      }
      fetchCart()
    } else {
      setCartItems([]) // Clear cart on logout
    }
  }, [user])

  useEffect(() => {
    console.log(products)
  }, [products])

  useEffect(() => {
    console.log(services)
  }, [services])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handlePopState = () => {
      setActiveTab(getTabFromPathname(window.location.pathname))
      setSearchQuery('')
      if (mainRef.current) {
        mainRef.current.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleTabChange = useCallback((tab: TabId) => {
    if (typeof window !== 'undefined') {
      const nextPath = TAB_PATHS[tab]
      if (window.location.pathname !== nextPath) {
        window.history.pushState({}, '', nextPath)
      }
    }
    setActiveTab(tab)
    setSearchQuery('')
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  const handleStartService = useCallback((title: string, desc: string) => {
    setActiveServiceFlow({ title, desc })
  }, [])

  const handleViewProduct = useCallback((product: Product) => {
    setActiveProduct(product)
  }, [])

  const handleCheckoutFromProductDetails = useCallback(() => {
    setActiveProduct(null)
    setIsCartOpen(false)
    setIsCheckoutOpen(true)
  }, [])

  const handleCompleteService = async (payload: { form_data: any, document_urls: string[] }) => {
    if (!activeServiceFlow?.title) {
      throw new Error('Service details are missing.')
    }

    const serviceKind = getServiceKind(activeServiceFlow.title)
    const allowsGuestSubmission = serviceKind === 'google_play_redeem_codes'

    if (!user && !allowsGuestSubmission) {
      setIsAuthOpen(true)
      throw new Error('Please sign in to submit this service request.')
    }

    try {
      if (!user && allowsGuestSubmission) {
        const guestRequest = await servicesApi.applyGuestService(activeServiceFlow.title, payload)
        setServiceRequests(servicesApi.fetchGuestServiceRequests())
        setRequestsLastUpdatedAt(new Date().toISOString())
        return { requestId: guestRequest?.id ?? '', guestSubmission: true }
      }

      const signedInUser = user
      if (!signedInUser) {
        throw new Error('Please sign in to submit this service request.')
      }

      const createdRequest = await servicesApi.applyService(signedInUser.id, activeServiceFlow.title, payload);
      await refreshServiceRequests(signedInUser.id, { background: true })
      setNotifications(prev => prev + 1)
      return { requestId: createdRequest?.id ?? '' }
    } catch (err) {
      console.error('Error saving service request:', err)
      throw err
    }
  }

  const handleAddToCart = useCallback(async (product: Omit<CartItem, 'quantity'>) => {
    if (!user) {
      setIsAuthOpen(true)
      return
    }

    try {
      await ordersApi.addToCart(user.id, product.id, 1);

      // Update local state for immediate feedback
      setCartItems(prev => {
        const existing = prev.find(item => item.id === product.id)
        if (existing) {
          return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
        }
        return [...prev, { ...product, quantity: 1 }]
      })
    } catch (err) {
      console.error('Error adding to cart:', err)
      throw err
    }
  }, [user, cartItems])

  const updateCartQuantity = async (id: string, delta: number) => {
    if (!user) return

    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + delta;
        if (newQuantity <= 0) return item;
        
        // Async update in background
        ordersApi.updateCartQuantity(user.id, item.id, newQuantity).catch(err => console.error(err));

        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const removeCartItem = async (id: string) => {
    if (!user) return

    try {
      await ordersApi.removeByProductId(user.id, id);
      setCartItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error removing item:', err)
    }
  };

  const handlePlaceOrder = async (orderDetails: any) => {
    if (!user) {
      throw new Error('Please sign in before placing your order.')
    }

    if (cartItems.length === 0) {
      throw new Error('Your cart is empty.')
    }

    try {
      const order = await ordersApi.createOrder(user.id, cartItems);
      if (!order?.id) {
        throw new Error('Order confirmation could not be generated.')
      }
      const latestProducts = await productsApi.fetchProducts()

      setIsCheckoutOpen(false);
      setOrderSuccessId(order.id);
      setCartItems([]);
      setProducts(latestProducts || [])
    } catch (err) {
      console.error('Error placing order:', err)
      throw new Error(getReadableErrorMessage(err, 'We could not place your order right now.'))
    }
  }

  const handleLogout = async () => {
    await authApi.logoutUser()
    setUser(null)
    setCartItems([])
  }

  const cartCount = useMemo(() => cartItems.reduce((acc, item) => acc + item.quantity, 0), [cartItems])

  // ── Search & Filter Logic ────────────────────────────────────────────────
  const isSearching = searchQuery.length > 0
  
  // Example of using useMemo as requested
  const hasResults = useMemo(() => {
    if (!isSearching) return true
    // This could be more complex filtering logic if needed
    return true 
  }, [isSearching])

  const TAB_CONTENT: Record<TabId, React.ReactNode> = {
    home: (
      <>
        {/* Search Section */}
        <SearchSection query={searchQuery} onChange={setSearchQuery} isLoading={isLoading} />
        
        {!isSearching ? (
          <>
            {/* Quick Services Grid */}
             <QuickServicesGrid 
               services={services}
               isLoading={isLoading}
               onStartService={handleStartService} 
               onViewAll={() => handleTabChange('services')}
               title={t.quick_services}
             />
            
            {/* Featured Products */}
             <FeaturedProducts 
               products={products}
               isLoading={isLoading}
               query={searchQuery} 
               onAddToCart={handleAddToCart} 
               onViewProduct={handleViewProduct}
               title={t.featured_products} 
             />
            
            {/* Offers Banner */}
            <OffersBanner isLoading={isLoading} />
            
            {/* Popular Services */}
             <PopularServicesSection 
               services={services}
               isLoading={isLoading}
               onStartService={handleStartService} 
               onViewAll={() => handleTabChange('services')}
               title={t.popular_services}
             />
            
            {/* Customer Reviews */}
            <CustomerReviews title={t.reviews} />
            
            {/* Why Choose Us */}
            <WhyChooseUs title={t.why_us} isLoading={isLoading} />
            
            {/* Recent Applications */}
            <RecentApplicationsSection title={t.recent_apps} />
            
            {/* App CTA */}
            <AppCTASection isLoading={isLoading} />
          </>
        ) : (
          <div className="animate-fade-in px-3 lg:px-8 pb-10">
            <FeaturedProducts products={products} isLoading={isLoading} query={searchQuery} onAddToCart={handleAddToCart} onViewProduct={handleViewProduct} title={t.featured_products} />
            <PopularServicesSection
              services={services}
              isLoading={isLoading}
              onStartService={handleStartService}
              onViewAll={() => handleTabChange('services')}
              title={t.popular_services}
            />
            {!hasResults && <EmptyState />}
          </div>
        )}
        
        <FooterSection rights={t.footer_rights} />
      </>
    ),
    services: <ServicesPage services={services} isLoading={isLoading} onStartService={handleStartService} />,
    products: <ProductsPage products={products} isLoading={isLoading} onAddToCart={handleAddToCart} onViewProduct={handleViewProduct} />,
    track:    (
      <TrackPage
        requests={serviceRequests}
        isLoading={isRequestsLoading}
        isRefreshing={isRequestsRefreshing}
        isSignedIn={Boolean(user)}
        lastUpdatedAt={requestsLastUpdatedAt}
        onRefresh={() => refreshServiceRequests(user?.id, { background: true })}
      />
    ),
    dashboard: <UserDashboard user={user} onLogout={handleLogout} onSignIn={() => setIsAuthOpen(true)} />,
    profile:  <ProfilePage user={user} onLogout={handleLogout} isAdmin={isAdmin} onOpenAdmin={() => setShowAdminPanel(true)} />,
  }

  const pageTitle = language === 'en' ? PAGE_TITLES[activeTab] : t[`nav_${activeTab}` as keyof typeof t] || PAGE_TITLES[activeTab];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface)] dark:bg-slate-900 transition-colors duration-300">
      <Header 
        title={pageTitle as string} 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        cartCount={cartCount} 
        onOpenCart={() => setIsCartOpen(true)}
        language={language}
        onLanguageChange={setLanguage}
        notificationCount={notifications}
      />

      <main
        ref={mainRef}
        id="main-content"
        className="main-scroll flex-1 pb-20 lg:pb-12"
        role="main"
        aria-label={PAGE_TITLES[activeTab]}
      >
        <div className="max-w-7xl mx-auto">
          <div
            key={activeTab}
            className="animate-fade-slide-in"
          >
            {TAB_CONTENT[activeTab]}
          </div>
        </div>
      </main>

      {/* Bottom nav only visible on mobile */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Full Screen Service Flow Modal */}
      {activeServiceFlow && (
        <ServiceFlow
          serviceTitle={activeServiceFlow.title}
          serviceDescription={activeServiceFlow.desc}
          onClose={() => setActiveServiceFlow(null)}
          onTrackApplication={() => {
            setActiveServiceFlow(null);
            handleTabChange('track');
          }}
          onGoHome={() => {
            setActiveServiceFlow(null);
            handleTabChange('home');
          }}
          onComplete={handleCompleteService}
        />
      )}

      {/* Full Screen Cart Modal */}
      {isCartOpen && (
        <CartPage 
          cartItems={cartItems}
          updateQuantity={updateCartQuantity}
          removeItem={removeCartItem}
          onClose={() => setIsCartOpen(false)}
          onCheckout={() => {
            setIsCartOpen(false);
            setIsCheckoutOpen(true);
          }}
          user={user}
        />
      )}

      {activeProduct && (
        <ProductDetailsPage
          productId={activeProduct.id}
          initialProduct={activeProduct}
          allProducts={products}
          cartQuantity={cartItems.find((item) => item.id === activeProduct.id)?.quantity ?? 0}
          warrantyMonths={WARRANTY_MONTHS}
          onClose={() => setActiveProduct(null)}
          onAddToCart={handleAddToCart}
          onCheckout={handleCheckoutFromProductDetails}
          onViewProduct={handleViewProduct}
        />
      )}

      {/* Full Screen Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutPage 
          cartItems={cartItems}
          onClose={() => setIsCheckoutOpen(false)}
          onPlaceOrder={handlePlaceOrder}
          user={user}
        />
      )}

      {/* Order Success View */}
      {orderSuccessId && (
        <OrderSuccessPage 
          orderId={orderSuccessId}
          onTrackOrder={() => {
            setOrderSuccessId(null);
            handleTabChange('track');
          }}
          onGoHome={() => {
            setOrderSuccessId(null);
            handleTabChange('home');
          }}
        />
      )}

      {/* Floating Buttons */}
      <WhatsAppButton />

      {/* Auth Modal */}
      {isAuthOpen && (
        <AuthModal 
          onClose={() => setIsAuthOpen(false)} 
          onSuccess={() => setIsAuthOpen(false)} 
        />
      )}

      {/* Admin Dashboard */}
      {showAdminPanel && (
        <AdminDashboard onClose={() => setShowAdminPanel(false)} isAdmin={isAdmin} />
      )}
    </div>
  )
}

export default App
