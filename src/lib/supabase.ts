import { createClient, SupabaseClient } from '@supabase/supabase-js';

const PROJECT_URL = 'https://csicpieponynbfuklzfh.supabase.co';
const PUBLISHABLE_KEY = 'sb_publishable_aNOD4PHatT_Tclwk7lcipw_Ghai6mCS';

export function getSupabaseCredentials() {
  const url = import.meta.env.VITE_SUPABASE_URL || PROJECT_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || PUBLISHABLE_KEY;
  return { url, key, isConfigured: Boolean(url && key && url === PROJECT_URL) };
}

export function saveSupabaseCredentials(_url: string, _key: string) {
  clientInstance = null;
}

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (clientInstance) return clientInstance;
  const { url, key, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) return null;
  try {
    clientInstance = createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    return clientInstance;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
}

export async function testSupabaseConnection(_url?: string, _key?: string): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, message: 'تعذر تهيئة الاتصال بمشروع المدرسة المعتمد.' };
  try {
    const { error } = await client.from('academic_years').select('id').limit(1);
    if (error) return { success: false, message: `تعذر الاتصال بمشروع المدرسة: ${error.message}` };
    return { success: true, message: 'تم الاتصال بمشروع قاعدة بيانات المدرسة بنجاح.' };
  } catch (error) {
    return { success: false, message: `خطأ أثناء الاتصال: ${(error as Error).message}` };
  }
}
