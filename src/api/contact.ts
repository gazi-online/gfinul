import { supabase } from '../lib/supabase'

export const contactApi = {
  fetchAllMessages: async () => {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
      
    if (error) throw error
    return data || []
  },

  updateMessageStatus: async (id: string, status: string) => {
    const { data, error } = await supabase
      .from('contact_messages')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  saveReply: async (id: string, reply: string) => {
    const { data, error } = await supabase
      .from('contact_messages')
      .update({ admin_reply: reply, status: 'replied' })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },
}
