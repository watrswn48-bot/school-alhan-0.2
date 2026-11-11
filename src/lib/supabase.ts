import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration keys for custom admin-provided credentials
const STORAGE_KEY_URL = 'ti_etchrompi_supabase_url';
const STORAGE_KEY_KEY = 'ti_etchrompi_supabase_anon_key';

export function getSupabaseCredentials() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  
  const savedUrl = localStorage.getItem(STORAGE_KEY_URL) || envUrl;
  const savedKey = localStorage.getItem(STORAGE_KEY_KEY) || envKey;

  return {
    url: savedUrl,
    key: savedKey,
    isConfigured: Boolean(savedUrl && savedKey && savedUrl.startsWith('https://'))
  };
}

export function saveSupabaseCredentials(url: string, key: string) {
  if (url) localStorage.setItem(STORAGE_KEY_URL, url.trim());
  else localStorage.removeItem(STORAGE_KEY_URL);

  if (key) localStorage.setItem(STORAGE_KEY_KEY, key.trim());
  else localStorage.removeItem(STORAGE_KEY_KEY);

  // Reset client instance
  clientInstance = null;
}

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (clientInstance) return clientInstance;

  const { url, key, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) return null;

  try {
    clientInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
    return clientInstance;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
}

/**
 * Test connectivity with Supabase
 */
export async function testSupabaseConnection(url?: string, key?: string): Promise<{ success: boolean; message: string }> {
  try {
    const testUrl = url || getSupabaseCredentials().url;
    const testKey = key || getSupabaseCredentials().key;

    if (!testUrl || !testKey) {
      return { success: false, message: 'بيانات الاتصال بـ Supabase غير مكتملة. يرجى إدخال الرابط ومفتاح الوصول (Anon Key).' };
    }

    const client = createClient(testUrl, testKey);
    // Ping public table or auth
    const { error } = await client.from('academic_years').select('id').limit(1);

    if (error && error.code !== 'PGRST116') {
      // Table might not exist yet if migrations haven't run, test basic connection
      if (error.message.includes('relation "academic_years" does not exist') || error.code === '42P01') {
        return {
          success: true,
          message: 'تم الاتصال بخادم Supabase بنجاح! يلزم تنفيذ ملف تهيئة الجداول (SQL Migrations).'
        };
      }
      return { success: false, message: `تعذر الاتصال بـ Supabase: ${error.message}` };
    }

    return { success: true, message: 'تم الاتصال بقاعدة بيانات Supabase بنجاح، وجميع الجداول جاهزة للعمل!' };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, message: `خطأ أثناء الاتصال: ${error?.message || 'خطأ غير متوقع'}` };
  }
}
