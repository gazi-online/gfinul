import { supabase } from '../lib/supabase';
import { type AppUser } from '../lib/types';

export const usersApi = {
  async fetchAllUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, phone, created_at, updated_at, is_admin, is_blocked, role')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as AppUser[];
    } catch {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, phone, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []).map((user: any) => ({
        ...user,
        is_admin: false,
        is_blocked: false,
        role: null,
      })) as AppUser[];
    }
  },

  async updateUserStatus(userId: string, updates: Pick<AppUser, 'is_blocked' | 'is_admin'>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select('id, name, email, phone, created_at, updated_at, is_admin, is_blocked, role')
      .single();

    if (error) throw error;
    return data as AppUser;
  },

  async fetchWarranties(userId: string) {
    const { data, error } = await supabase
      .from('warranties')
      .select('*, products(name, image, category)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};
