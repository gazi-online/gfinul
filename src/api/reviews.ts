import { supabase } from '../lib/supabase';
import { type CustomerReview } from '../lib/types';

const CUSTOMER_REVIEWS_STORAGE_KEY = 'civic-atelier:customer-reviews';

const SEED_REVIEWS: CustomerReview[] = [
  {
    id: 'seed-r1',
    name: 'Arjun Das',
    rating: 5,
    comment: 'Super fast service! My PAN card application took only 10 minutes.',
    avatar: 'https://i.pravatar.cc/150?u=a1',
    created_at: '2026-03-24T10:30:00.000Z',
  },
  {
    id: 'seed-r2',
    name: 'Priya Sharma',
    rating: 4,
    comment: 'Very clean UI. It was easy to track my income certificate status.',
    avatar: 'https://i.pravatar.cc/150?u=a2',
    created_at: '2026-03-20T14:10:00.000Z',
  },
  {
    id: 'seed-r3',
    name: 'Rahul Sen',
    rating: 5,
    comment: 'The digital security keys are actually high quality. Recommended!',
    avatar: 'https://i.pravatar.cc/150?u=a3',
    created_at: '2026-03-18T09:00:00.000Z',
  },
];

const canUseBrowserStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const generateReviewId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `review-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const sortReviews = (reviews: CustomerReview[]) =>
  [...reviews].sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime());

const readLocalReviews = (): CustomerReview[] => {
  if (!canUseBrowserStorage()) return [];

  try {
    const rawValue = window.localStorage.getItem(CUSTOMER_REVIEWS_STORAGE_KEY);
    if (!rawValue) return [];

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? (parsedValue as CustomerReview[]) : [];
  } catch (error) {
    console.error('Failed to read customer reviews from local storage:', error);
    return [];
  }
};

const writeLocalReviews = (reviews: CustomerReview[]) => {
  if (!canUseBrowserStorage()) return;

  try {
    window.localStorage.setItem(CUSTOMER_REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
  } catch (error) {
    console.error('Failed to write customer reviews to local storage:', error);
    throw new Error('Review could not be saved on this device. Please try again.');
  }
};

const dedupeReviews = (reviews: CustomerReview[]) => {
  const reviewMap = new Map<string, CustomerReview>();

  for (const review of reviews) {
    reviewMap.set(review.id, review);
  }

  return Array.from(reviewMap.values());
};

export const reviewsApi = {
  async fetchReviews() {
    const localReviews = readLocalReviews();

    try {
      const { data, error } = await supabase
        .from('customer_reviews')
        .select('id, name, rating, comment, avatar, created_at')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return sortReviews(dedupeReviews([...(data as CustomerReview[] ?? []), ...localReviews, ...SEED_REVIEWS]));
    } catch (error) {
      console.warn('Falling back to local customer reviews:', error);
      return sortReviews(dedupeReviews([...localReviews, ...SEED_REVIEWS]));
    }
  },

  async submitReview(input: Pick<CustomerReview, 'name' | 'rating' | 'comment'>) {
    const nextReview: CustomerReview = {
      id: generateReviewId(),
      name: input.name.trim(),
      rating: input.rating,
      comment: input.comment.trim(),
      avatar: null,
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('customer_reviews')
        .insert({
          name: nextReview.name,
          rating: nextReview.rating,
          comment: nextReview.comment,
          avatar: nextReview.avatar,
          is_approved: true,
        })
        .select('id, name, rating, comment, avatar, created_at')
        .single();

      if (error) {
        throw error;
      }

      return data as CustomerReview;
    } catch (error) {
      console.warn('Saving review locally because remote insert failed:', error);
      writeLocalReviews([nextReview, ...readLocalReviews()]);
      return nextReview;
    }
  },
};
