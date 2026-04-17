import { supabase } from '../lib/supabase';
import { type ServiceItem, type ServiceRequest } from '../lib/types';
import { uploadFileToCloudinary } from '../lib/cloudinary';

const GUEST_SERVICE_REQUESTS_STORAGE_KEY = 'civic-atelier:guest-service-requests';
const MAX_DOCUMENT_SIZE_MB = 5;
const MAX_DOCUMENT_SIZE_BYTES = MAX_DOCUMENT_SIZE_MB * 1024 * 1024;
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

type GuestServiceRequest = {
  id: string;
  service_title: string;
  status: 'pending';
  form_data: Record<string, unknown>;
  document_urls: string[];
  created_at: string;
  guest: true;
};

const canUseBrowserStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const readGuestServiceRequests = (): GuestServiceRequest[] => {
  if (!canUseBrowserStorage()) return [];

  try {
    const rawValue = window.localStorage.getItem(GUEST_SERVICE_REQUESTS_STORAGE_KEY);
    if (!rawValue) return [];

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue as GuestServiceRequest[] : [];
  } catch (error) {
    console.error('Failed to read guest service requests from local storage:', error);
    return [];
  }
};

const writeGuestServiceRequests = (requests: GuestServiceRequest[]) => {
  if (!canUseBrowserStorage()) return;

  try {
    window.localStorage.setItem(GUEST_SERVICE_REQUESTS_STORAGE_KEY, JSON.stringify(requests));
  } catch (error) {
    console.error('Failed to write guest service requests to local storage:', error);
    throw new Error('Guest order could not be saved on this device. Please try again.');
  }
};

const generateGuestRequestId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const mapGuestServiceRequestToServiceRequest = (request: GuestServiceRequest): ServiceRequest => ({
  id: request.id.replace(/^guest-/, '').replace(/-/g, '').toUpperCase(),
  user_id: '',
  service_id: '',
  status: request.status,
  form_data: request.form_data,
  document_urls: request.document_urls,
  created_at: request.created_at,
  guest: true,
  services: {
    name: request.service_title,
  },
});

export const servicesApi = {
  // Fetch active services list
  async fetchServices() {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('fetchServices active filter failed, retrying without is_active:', error);

      const { data: fallbackData, error: fallbackError } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

      if (fallbackError) {
        console.error('Error fetching services:', fallbackError);
        return [];
      }

      console.log('fetchServices fallback data:', fallbackData);
      return (fallbackData ?? []) as ServiceItem[];
    }

    console.log('fetchServices data:', data);
    return (data ?? []) as ServiceItem[];
  },

  // Apply for a service
  async applyService(userId: string, serviceTitle: string, payload: any) {
    // 1. Find service ID by title
    const { data: serviceRes } = await supabase
      .from('services')
      .select('id')
      .eq('name', serviceTitle)
      .single();

    if (serviceRes) {
      // 2. Insert service request
      const { data, error } = await supabase
        .from('service_requests')
        .insert({
          user_id: userId,
          service_id: serviceRes.id,
          status: 'pending',
          form_data: payload.form_data || {},
          document_urls: payload.document_urls || []
        })
        .select('id')
        .single();

      if (error) throw error;
      return data;
    } else {
      throw new Error("Service not found");
    }
  },

  async applyGuestService(serviceTitle: string, payload: any) {
    const requestId = generateGuestRequestId();
    const existingRequests = readGuestServiceRequests();

    const nextRequest: GuestServiceRequest = {
      id: requestId,
      service_title: serviceTitle,
      status: 'pending',
      form_data: payload.form_data || {},
      document_urls: payload.document_urls || [],
      created_at: new Date().toISOString(),
      guest: true,
    };

    writeGuestServiceRequests([nextRequest, ...existingRequests]);
    return { id: requestId };
  },

  fetchGuestServiceRequests() {
    return readGuestServiceRequests().map(mapGuestServiceRequestToServiceRequest);
  },

  // Fetch requests for user dashboard
  async fetchServiceRequests(userId: string) {
    const { data, error } = await supabase
      .from('service_requests')
      .select('*, services(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as ServiceRequest[];
  },

  // Fetch all requests for admin dashboard
  async fetchAllServiceRequests() {
    const { data, error } = await supabase
      .from('service_requests')
      .select('*, services(name), users(name, email, phone)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  // Update status from admin
  async updateServiceStatus(reqId: string, status: string) {
    const { error } = await supabase
      .from('service_requests')
      .update({ status })
      .eq('id', reqId);
    
    if (error) throw error;
  },

  // Upload document
  async uploadDocument(file: File, bucketName: string = 'documents'): Promise<string> {
    if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
      throw new Error('Upload a PDF, JPG, PNG, or WEBP file only.');
    }

    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      throw new Error(`Each file must be ${MAX_DOCUMENT_SIZE_MB}MB or smaller.`);
    }

    try {
      return await uploadFileToCloudinary(file, { folder: bucketName });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Document upload failed.';
      throw new Error(message);
    }
  }
};
