import React, { useEffect, useMemo, useState } from 'react';
import { type Product } from '../lib/types';
import { productsApi } from '../api/products';
import { useToast } from './toast/useToast';
import { useTranslation } from 'react-i18next';

type ProductDetailsPageProps = {
  productId: string;
  initialProduct?: Product | null;
  allProducts?: Product[];
  cartQuantity?: number;
  onClose: () => void;
  onAddToCart: (product: Pick<Product, 'id' | 'name' | 'price' | 'image'>) => Promise<void> | void;
  onCheckout?: () => void;
  onViewProduct?: (product: Product) => void;
  warrantyMonths?: number;
};

const formatCurrency = (value: number) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`;

const normalizeRating = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return 4.6;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.min(5, value));
  }

  if (typeof value === 'string') {
    const numericValue = Number(value);
    if (Number.isFinite(numericValue)) {
      return Math.max(0, Math.min(5, numericValue));
    }
  }

  return 4.6;
};

const normalizeReviewCount = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return 124;
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return 124;
  }

  return Math.round(numericValue);
};

const deriveProductDescription = (product: Product, t: (key: string, options?: Record<string, unknown>) => string) => {
  if (product.description?.trim()) {
    return product.description.trim();
  }

  const categoryLabel = product.category?.trim() || 'daily essential';
  return t('products.details.autoDescription', {
    name: product.name,
    category: categoryLabel.toLowerCase(),
  });
};

const getStockLabel = (stock: number | undefined, t: (key: string, options?: Record<string, unknown>) => string) => {
  if (typeof stock !== 'number') {
    return {
      label: t('products.details.availabilityOnRequest'),
      shortLabel: t('products.details.limited'),
      tone: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-500/10 dark:border-amber-500/20',
    };
  }

  if (stock <= 0) {
    return {
      label: t('products.details.outOfStock'),
      shortLabel: t('products.details.outOfStockShort'),
      tone: 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-500/10 dark:border-rose-500/20',
    };
  }

  if (stock <= 5) {
    return {
      label: t('products.details.leftInStock', { count: stock }),
      shortLabel: t('products.details.lowStock'),
      tone: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-500/10 dark:border-amber-500/20',
    };
  }

  return {
    label: t('products.details.inStock'),
    shortLabel: t('products.details.inStockShort'),
    tone: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/20',
  };
};

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const CartIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386a1.5 1.5 0 0 1 1.464 1.175l.346 1.558m0 0h13.608a1.5 1.5 0 0 1 1.465 1.824l-1.106 4.975a1.5 1.5 0 0 1-1.465 1.176H8.23a1.5 1.5 0 0 1-1.465-1.176L5.446 5.733ZM8.25 19.5a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm9 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
  </svg>
);

const ArrowIcon = ({ direction, className = 'h-4 w-4' }: { direction: 'left' | 'right'; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d={direction === 'left' ? 'm15.75 19.5-7.5-7.5 7.5-7.5' : 'm8.25 4.5 7.5 7.5-7.5 7.5'} />
  </svg>
);

type ActionButtonVariant = 'primary' | 'secondary' | 'ghost';

const ACTION_BUTTON_BASE =
  'ui-hover-pill inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-black transform-gpu focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 hover:scale-105 active:scale-95 disabled:scale-100 disabled:cursor-not-allowed';

const ACTION_BUTTON_VARIANTS: Record<ActionButtonVariant, string> = {
  primary:
    'bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/25 disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-400',
  secondary:
    'border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-900/40 dark:hover:bg-slate-800 dark:disabled:border-slate-800 dark:disabled:bg-slate-900 dark:disabled:text-slate-500',
  ghost:
    'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:text-slate-400 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-white dark:disabled:text-slate-600',
};

type ActionButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: ActionButtonVariant;
  icon?: React.ReactNode;
  className?: string;
};

const ActionButton = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  icon,
  className = '',
}: ActionButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`${ACTION_BUTTON_BASE} ${ACTION_BUTTON_VARIANTS[variant]} ${className}`.trim()}
  >
    {icon ? <span className="shrink-0">{icon}</span> : null}
    <span>{children}</span>
  </button>
);

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5 text-amber-400">
    {Array.from({ length: 5 }).map((_, index) => (
      <svg key={index} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={index < Math.round(rating) ? 'currentColor' : 'none'} stroke="currentColor" className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
      </svg>
    ))}
  </div>
);

const DEFAULT_GALLERY_LABELS = ['Front', 'Back', 'Side', 'Zoom', 'Usage', 'Detail'];

const buildProductGallery = (product: Product | null) => {
  if (!product) return [];

  const uniqueImages = Array.from(new Set([product.image, ...(product.images ?? [])].filter(Boolean)));

  return uniqueImages.map((src, index) => ({
    src,
    label: product.image_labels?.[index]?.trim() || DEFAULT_GALLERY_LABELS[index] || `View ${index + 1}`,
  }));
};

export const ProductDetailsPage: React.FC<ProductDetailsPageProps> = ({
  productId,
  initialProduct = null,
  allProducts = [],
  cartQuantity = 0,
  onClose,
  onAddToCart,
  onCheckout,
  onViewProduct,
  warrantyMonths = 12,
}) => {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [product, setProduct] = useState<Product | null>(initialProduct);
  const [isLoading, setIsLoading] = useState(!initialProduct);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isCompactMobileViewport, setIsCompactMobileViewport] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setProduct(initialProduct);

    const loadProduct = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await productsApi.fetchProductById(productId);
        if (isMounted) {
          setProduct(data);
        }
      } catch (loadError) {
        console.error('Failed to load product details:', loadError);
        if (isMounted) {
          setError(t('products.details.loadError'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [initialProduct, productId, t]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const updateViewportMode = () => {
      setIsCompactMobileViewport(window.innerWidth < 640 && window.innerHeight < 760);
    };

    updateViewportMode();
    window.addEventListener('resize', updateViewportMode);

    return () => {
      window.removeEventListener('resize', updateViewportMode);
    };
  }, []);

  useEffect(() => {
    setActionMessage(null);
  }, [productId]);

  const galleryImages = useMemo(() => buildProductGallery(product), [product]);
  const selectedGalleryImage = galleryImages[selectedImageIndex] ?? galleryImages[0] ?? null;
  const description = useMemo(() => (product ? deriveProductDescription(product, t) : ''), [product, t]);
  const stockMeta = useMemo(() => getStockLabel(product?.stock, t), [product?.stock, t]);
  const rating = useMemo(() => normalizeRating(product?.rating), [product?.rating]);
  const ratingCount = useMemo(() => normalizeReviewCount(product?.review_count), [product?.review_count]);
  const isOutOfStock = Number(product?.stock ?? 0) <= 0 || product?.is_active === false;
  const canCheckout = cartQuantity > 0 && Boolean(onCheckout);
  const isActionSuccess = actionMessage === t('products.details.addedToCart');
  const primaryActionLabel = isOutOfStock
    ? t('products.details.outOfStockShort')
    : isAdding
      ? t('products.details.addingToCart')
      : t('products.details.addToCart');
  const showStickyMobileCta = !isCompactMobileViewport;

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [productId, product?.image]);

  useEffect(() => {
    if (selectedImageIndex >= galleryImages.length) {
      setSelectedImageIndex(0);
    }
  }, [galleryImages.length, selectedImageIndex]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];

    return allProducts
      .filter((item) => item.id !== product.id)
      .filter((item) => item.category?.trim().toLowerCase() === product.category?.trim().toLowerCase())
      .filter((item) => item.is_active !== false)
      .slice(0, 8);
  }, [allProducts, product]);

  const handleAddToCart = async () => {
    if (!product || isOutOfStock) return;

    setIsAdding(true);
    setActionMessage(null);
    try {
      await onAddToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      });
      setActionMessage(t('products.details.addedToCart'));
      addToast({
        type: 'success',
        title: t('products.details.addedToCart'),
        message: t('products.details.addedToCartMessage', { name: product.name }),
      });
    } catch (addError: any) {
      const message = addError?.message || t('products.details.couldNotAdd');
      setActionMessage(message);
      addToast({
        type: 'error',
        title: t('products.details.addToCartFailed'),
        message,
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleSelectImage = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handlePreviousImage = () => {
    if (galleryImages.length <= 1) return;
    setSelectedImageIndex((currentIndex) => (currentIndex === 0 ? galleryImages.length - 1 : currentIndex - 1));
  };

  const handleNextImage = () => {
    if (galleryImages.length <= 1) return;
    setSelectedImageIndex((currentIndex) => (currentIndex + 1) % galleryImages.length);
  };

  return (
    <div className="fixed inset-0 z-[110] overflow-y-auto bg-[#F8FAFC]/95 px-3 py-3 backdrop-blur-sm dark:bg-[#020617]/95 animate-fade-in sm:px-4 sm:py-6">
      <div className={`mx-auto flex min-h-full w-full max-w-6xl flex-col ${showStickyMobileCta ? 'pb-[calc(env(safe-area-inset-bottom)+5.75rem)]' : 'pb-6'} lg:pb-0`}>
        <div className="mb-4 flex items-center justify-between sm:mb-6">
          <button
            type="button"
            onClick={onClose}
            className="ui-hover-pill inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 19.5-7.5-7.5 7.5-7.5" />
            </svg>
            {t('products.details.back')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ui-hover-icon inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:rotate-90 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:text-white"
            aria-label={t('products.details.closeAria')}
          >
            <CloseIcon />
          </button>
        </div>

        {isLoading ? (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] animate-pulse">
            <div className="aspect-square rounded-[32px] bg-slate-200 dark:bg-slate-800" />
            <div className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 lg:p-8">
              <div className="mb-4 h-6 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="mb-3 h-10 w-5/6 rounded-2xl bg-slate-200 dark:bg-slate-800" />
              <div className="mb-6 h-8 w-40 rounded-2xl bg-slate-200 dark:bg-slate-800" />
              <div className="space-y-3">
                <div className="h-4 w-full rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-4/5 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-3/5 rounded-full bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="mt-8 h-14 w-full rounded-2xl bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        ) : error || !product ? (
          <div className="mx-auto mt-16 max-w-md rounded-[28px] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">{t('products.details.productUnavailableTitle')}</h2>
            <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">{error ?? t('products.details.productUnavailableMessage')}</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6">
              <div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 sm:rounded-[32px]">
                <div className="group relative aspect-[4/3] max-h-[52svh] overflow-hidden bg-slate-100 dark:bg-slate-950/70 sm:aspect-square sm:max-h-none">
                  <img
                    key={selectedGalleryImage?.src ?? product.image}
                    src={selectedGalleryImage?.src ?? product.image}
                    alt={`${product.name} ${selectedGalleryImage?.label ?? 'preview'}`}
                    className="h-full w-full object-contain object-center p-3 transition duration-300 ease-out group-hover:scale-[1.04] sm:object-cover sm:p-0 sm:group-hover:scale-110"
                  />
                  <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3 sm:p-4">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-800 shadow-sm backdrop-blur dark:bg-slate-950/80 dark:text-slate-200">
                      {product.category}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] backdrop-blur ${stockMeta.tone}`}>
                      {stockMeta.shortLabel}
                    </span>
                  </div>
                  {galleryImages.length > 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={handlePreviousImage}
                        className="ui-hover-icon absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm backdrop-blur transition hover:scale-105 hover:bg-white dark:bg-slate-950/80 dark:text-slate-200 dark:hover:bg-slate-900"
                        aria-label={t('products.details.showPreviousImage')}
                      >
                        <ArrowIcon direction="left" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextImage}
                        className="ui-hover-icon absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm backdrop-blur transition hover:scale-105 hover:bg-white dark:bg-slate-950/80 dark:text-slate-200 dark:hover:bg-slate-900"
                        aria-label={t('products.details.showNextImage')}
                      >
                        <ArrowIcon direction="right" />
                      </button>
                    </>
                  ) : null}
                </div>
                {galleryImages.length > 1 ? (
                  <div className="flex gap-3 overflow-x-auto px-3 py-3 scrollbar-none sm:px-4 sm:py-4">
                    {galleryImages.map((image, index) => {
                      const isActive = index === selectedImageIndex;

                      return (
                        <button
                          key={`${image.src}-${index}`}
                          type="button"
                          onClick={() => handleSelectImage(index)}
                          className={`group/thumb relative shrink-0 overflow-hidden rounded-2xl border transition duration-200 ${isActive ? 'border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900/40' : 'border-slate-200 hover:border-blue-200 dark:border-slate-700 dark:hover:border-blue-900/40'}`}
                          aria-label={t('products.details.showImage', { label: image.label.toLowerCase() })}
                          aria-pressed={isActive}
                        >
                          <img
                            src={image.src}
                            alt={`${product.name} thumbnail ${index + 1}`}
                            className="h-20 w-20 object-cover transition duration-300 group-hover/thumb:scale-105 sm:h-24 sm:w-24"
                          />
                          <span className={`absolute inset-x-1 bottom-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] backdrop-blur ${isActive ? 'bg-blue-600 text-white' : 'bg-white/90 text-slate-600 dark:bg-slate-950/80 dark:text-slate-300'}`}>
                            {image.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 sm:rounded-[32px] sm:p-6 lg:p-8">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <StarRating rating={rating} />
                    <span className="text-sm font-black text-slate-900 dark:text-white">{rating.toFixed(1)}</span>
                  </div>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('products.details.verifiedReviews', { count: ratingCount })}</span>
                </div>

                <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl lg:text-3xl">{product.name}</h1>
                <p className="mt-3 text-2xl font-black text-blue-600 dark:text-blue-400 sm:mt-4 sm:text-3xl">{formatCurrency(product.price)}</p>

                <div className="mt-8">
                  <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{t('products.details.descriptionHeading')}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300 lg:text-base">{description}</p>
                </div>

                <div className="mt-8">
                  <div className="flex flex-col gap-3">
                  <ActionButton
                    onClick={handleAddToCart}
                    disabled={isAdding || isOutOfStock}
                      variant="primary"
                      icon={<CartIcon />}
                      className={`${showStickyMobileCta ? 'hidden sm:inline-flex' : 'inline-flex'} py-4 text-base`}
                    >
                      {primaryActionLabel}
                    </ActionButton>
                  <ActionButton
                    onClick={canCheckout ? onCheckout : undefined}
                    disabled={!canCheckout}
                    variant="secondary"
                  >
                    Continue to Checkout
                  </ActionButton>
                </div>
                  {actionMessage ? (
                    <p className={`mt-4 text-sm font-semibold transition ${isActionSuccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {actionMessage}
                    </p>
                  ) : null}
                  {cartQuantity <= 0 && !actionMessage ? (
                    <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                      {t('products.details.addToCartHint')}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <section className="mt-6 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 sm:mt-8 sm:rounded-[32px] sm:p-6 lg:p-8">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">{t('products.details.relatedProducts')}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('products.details.relatedSubtitle')}</p>
                </div>
              </div>

              {relatedProducts.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 px-6 py-10 text-center dark:border-slate-700">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('products.details.relatedEmpty')}</p>
                </div>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                  {relatedProducts.map((item) => {
                    const itemRating = normalizeRating(item.rating);
                    const itemOutOfStock = Number(item.stock ?? 0) <= 0 || item.is_active === false;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onViewProduct?.(item)}
                        className="group min-w-[220px] rounded-[28px] border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-lg dark:border-slate-700 dark:bg-slate-950/40 dark:hover:border-blue-900/40 dark:hover:bg-slate-900"
                      >
                        <div className="relative mb-4 aspect-[1/1] overflow-hidden rounded-2xl bg-white dark:bg-slate-800">
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                          <span className={`absolute right-2 top-2 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.15em] ${itemOutOfStock ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
                            {itemOutOfStock ? t('products.details.outBadge') : t('products.details.stockBadge')}
                          </span>
                        </div>
                        <p className="truncate text-sm font-black text-slate-900 dark:text-white">{item.name}</p>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <span className="text-sm font-black text-blue-600 dark:text-blue-400">{formatCurrency(item.price)}</span>
                          <div className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                            <StarRating rating={itemRating} />
                            <span>{itemRating.toFixed(1)}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
      {!isLoading && !error && product && showStickyMobileCta ? (
        <div className="fixed inset-x-3 bottom-[max(env(safe-area-inset-bottom),0.75rem)] z-[120] rounded-[24px] border border-slate-200/80 bg-white/92 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-950/92">
          <div className="mx-auto flex w-full max-w-6xl items-center">
            <ActionButton
              onClick={handleAddToCart}
              disabled={isAdding || isOutOfStock}
              variant="primary"
              icon={<CartIcon className="h-4 w-4" />}
              className="min-h-[3.5rem] px-5 py-3.5 text-sm shadow-blue-500/25"
            >
              {primaryActionLabel}
            </ActionButton>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ProductDetailsPage;
