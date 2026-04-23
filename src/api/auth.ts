import { supabase } from '../lib/supabase';

export const authApi = {
  async fetchUserFlags(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_admin, is_blocked')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return {
        is_admin: data?.role === 'admin',
        is_blocked: false,
      };
    }
  },

  // Check active session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  // Auth state listener
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },

  // Sign up
  async signUp(email: string, password: string, name: string) {
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });
    if (error) throw error;
    
    // Explicitly create profile
    if (signUpData.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: signUpData.user.id,
          name: name,
          email: email,
        });
      if (profileError && profileError.code !== '23505') console.error(profileError);
    }
    
    return signUpData;
  },

  // Log in
  async loginUser(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

     if (data.user) {
      const flags = await this.fetchUserFlags(data.user.id);
      if (flags?.is_blocked) {
        await supabase.auth.signOut();
        throw new Error('Your account has been blocked by an administrator.');
      }
    }

    return data;
  },

  // Log out
  async logoutUser() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Fetch user role (for admin access)
  async checkUserRole(userId: string) {
    try {
      const flags = await this.fetchUserFlags(userId);
      return Boolean(flags?.is_admin);
    } catch (err) {
      console.error("Error fetching user role:", err);
      return false;
    }
  },

  async updateProfile(data: { name?: string; phone?: string; email?: string }) {
    const payload: {
      email?: string;
      data?: {
        name?: string;
        phone?: string;
      };
    } = {};

    if (data.email !== undefined) {
      payload.email = data.email;
    }

    if (data.name !== undefined || data.phone !== undefined) {
      payload.data = { name: data.name, phone: data.phone };
    }

    const { data: userData, error } = await supabase.auth.updateUser(payload);
    if (error) throw error;
    
    if (userData.user && (data.name !== undefined || data.phone !== undefined || data.email !== undefined)) {
      const updates: any = {};
      if (data.name !== undefined) updates.name = data.name;
      if (data.phone !== undefined) updates.phone = data.phone;
      if (data.email !== undefined) updates.email = data.email;
      
      const { error: dbError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userData.user.id);
      if (dbError) console.error("Error syncing profile to users table:", dbError);
    }
    return userData;
  },

  async verifyCurrentPassword(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  },

  async updatePassword(password: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: password
    });
    if (error) throw error;
    return data;
  },

  async requestPasswordReset(email: string) {
    const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
    const { data, error } = await supabase.auth.resetPasswordForEmail(
      email,
      redirectTo ? { redirectTo } : undefined
    );
    if (error) throw error;
    return data;
  }
};
