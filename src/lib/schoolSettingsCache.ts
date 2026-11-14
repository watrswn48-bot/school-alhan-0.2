import { useEffect, useState } from 'react';
import { SchoolSettings } from '../types/database';
import { getSupabaseClient } from './supabase';

const CACHE_STORAGE_KEY = 'etchrompi_public_settings_v1';

const LIGHT_SETTINGS_COLUMNS = [
  'id',
  'school_name',
  'church_name',
  'parish_name',
  'dean_name',
  'spiritual_supervisor',
  'phone_number',
  'whatsapp_number',
  'email',
  'address',
  'facebook_url',
  'youtube_url',
  'announcement_banner',
  'show_banner',
  'results_disclaimer',
  'academic_year_id',
  'about_text',
  'primary_color',
  'accent_color',
  'updated_at',
].join(',');

export const DEFAULT_PUBLIC_SETTINGS: SchoolSettings = {
  id: '',
  school_name: 'مدرسة تي اتشرومبي للألحان',
  church_name: '',
  parish_name: '',
  dean_name: '',
  spiritual_supervisor: '',
  phone_number: '',
  whatsapp_number: '',
  email: '',
  address: '',
  logo_url: '',
  facebook_url: '',
  youtube_url: '',
  announcement_banner: '',
  show_banner: false,
  results_disclaimer: 'النتائج المعروضة هي النتائج التي اعتمدتها إدارة المدرسة ونشرتها.',
  academic_year_id: '',
  about_text: '',
  primary_color: '#0c1a30',
  accent_color: '#c5a059',
  updated_at: '',
};

interface StoredCachePayload {
  settings: SchoolSettings;
  hasLogoChecked: boolean;
}

function applyThemeColors(settings: Partial<SchoolSettings>): void {
  if (typeof document === 'undefined') return;
  if (settings.primary_color) {
    document.documentElement.style.setProperty('--school-primary', settings.primary_color);
  }
  if (settings.accent_color) {
    document.documentElement.style.setProperty('--school-accent', settings.accent_color);
  }
}

function readFromLocalStorage(): StoredCachePayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CACHE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredCachePayload;
    if (!parsed || typeof parsed !== 'object' || !parsed.settings) return null;
    return {
      settings: { ...DEFAULT_PUBLIC_SETTINGS, ...parsed.settings },
      hasLogoChecked: Boolean(parsed.hasLogoChecked),
    };
  } catch {
    return null;
  }
}

function writeToLocalStorage(payload: StoredCachePayload): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Fallback: if logo is extremely large for localStorage quota, still cache text metadata
    try {
      window.localStorage.setItem(
        CACHE_STORAGE_KEY,
        JSON.stringify({
          settings: { ...payload.settings, logo_url: '' },
          hasLogoChecked: false,
        })
      );
    } catch {
      // Ignore storage quota errors
    }
  }
}

const initialCached = readFromLocalStorage();
let memorySettings: SchoolSettings = initialCached?.settings ?? DEFAULT_PUBLIC_SETTINGS;
let hasLogoSynced: boolean = initialCached?.hasLogoChecked ?? false;
let isLoadingLogo: boolean = !hasLogoSynced;
let inFlightPromise: Promise<SchoolSettings> | null = null;

if (initialCached?.settings) {
  applyThemeColors(initialCached.settings);
}

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

export function getCachedSchoolSettings(): SchoolSettings {
  return memorySettings;
}

export function updateSchoolSettingsCache(next: Partial<SchoolSettings>): SchoolSettings {
  memorySettings = { ...memorySettings, ...next };
  if ('logo_url' in next) {
    hasLogoSynced = true;
    isLoadingLogo = false;
  }
  applyThemeColors(memorySettings);
  writeToLocalStorage({ settings: memorySettings, hasLogoChecked: hasLogoSynced });
  notifyListeners();
  return memorySettings;
}

export async function loadSchoolSettings(forceRefresh = false): Promise<SchoolSettings> {
  if (inFlightPromise && !forceRefresh) {
    return inFlightPromise;
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    isLoadingLogo = false;
    notifyListeners();
    return memorySettings;
  }

  const run = async (): Promise<SchoolSettings> => {
    try {
      // Step 1: Fetch lightweight metadata (~1 KB) without downloading the large logo_url payload
      const { data: meta, error: metaError } = await supabase
        .from('school_settings')
        .select(LIGHT_SETTINGS_COLUMNS)
        .limit(1)
        .maybeSingle();

      if (metaError || !meta) {
        isLoadingLogo = false;
        notifyListeners();
        return memorySettings;
      }

      const metaObj = meta as unknown as Partial<SchoolSettings>;
      const cachedUpdatedAt = memorySettings.updated_at || '';
      const remoteUpdatedAt = metaObj.updated_at || '';
      const shouldFetchLogo =
        forceRefresh ||
        !hasLogoSynced ||
        !cachedUpdatedAt ||
        cachedUpdatedAt !== remoteUpdatedAt;

      memorySettings = {
        ...DEFAULT_PUBLIC_SETTINGS,
        ...memorySettings,
        ...metaObj,
      };
      applyThemeColors(memorySettings);

      if (!shouldFetchLogo) {
        isLoadingLogo = false;
        writeToLocalStorage({ settings: memorySettings, hasLogoChecked: true });
        notifyListeners();
        return memorySettings;
      }

      // Notify UI immediately with text/colors while logo downloads once
      notifyListeners();

      // Step 2: Download logo_url only once when missing or updated
      const { data: logoRow } = await supabase
        .from('school_settings')
        .select('logo_url,updated_at')
        .limit(1)
        .maybeSingle();

      memorySettings = {
        ...memorySettings,
        logo_url: logoRow?.logo_url ?? '',
        updated_at: logoRow?.updated_at ?? memorySettings.updated_at,
      };
      hasLogoSynced = true;
      isLoadingLogo = false;
      writeToLocalStorage({ settings: memorySettings, hasLogoChecked: true });
      notifyListeners();
      return memorySettings;
    } catch {
      isLoadingLogo = false;
      notifyListeners();
      return memorySettings;
    } finally {
      inFlightPromise = null;
    }
  };

  inFlightPromise = run();
  return inFlightPromise;
}

export function useSchoolSettings(): { settings: SchoolSettings; logoLoading: boolean } {
  const [snapshot, setSnapshot] = useState<{ settings: SchoolSettings; logoLoading: boolean }>(() => ({
    settings: memorySettings,
    logoLoading: isLoadingLogo,
  }));

  useEffect(() => {
    const sync = () => {
      setSnapshot({
        settings: memorySettings,
        logoLoading: isLoadingLogo,
      });
    };
    listeners.add(sync);
    // Sync immediately in case state updated before effect ran
    sync();
    void loadSchoolSettings(false);
    return () => {
      listeners.delete(sync);
    };
  }, []);

  return snapshot;
}

/**
 * Compresses and resizes an uploaded image File or base64 data URL on the client
 * using an HTML5 Canvas so logos load almost instantaneously (~20-50 KB instead of 900+ KB).
 */
export async function optimizeLogoImage(
  input: File | string,
  maxDimension = 420
): Promise<{ dataUrl: string; originalBytes: number; compressedBytes: number }> {
  const rawDataUrl =
    typeof input === 'string'
      ? input
      : await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('تعذر قراءة ملف الصورة.'));
          reader.readAsDataURL(input);
        });

  const originalBytes = rawDataUrl.length;

  // Keep SVG vectors untouched
  if (rawDataUrl.startsWith('data:image/svg+xml')) {
    return { dataUrl: rawDataUrl, originalBytes, compressedBytes: originalBytes };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxDimension / Math.max(img.width || 1, img.height || 1));
        const width = Math.max(1, Math.round((img.width || maxDimension) * scale));
        const height = Math.max(1, Math.round((img.height || maxDimension) * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ dataUrl: rawDataUrl, originalBytes, compressedBytes: originalBytes });
          return;
        }

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first (supports transparency & small size), then PNG/JPEG fallback
        const candidates: string[] = [];
        const webpUrl = canvas.toDataURL('image/webp', 0.85);
        if (webpUrl.startsWith('data:image/webp')) {
          candidates.push(webpUrl);
        }

        // Check if image has transparent pixels
        let hasAlpha = false;
        try {
          const pixels = ctx.getImageData(0, 0, width, height).data;
          for (let i = 3; i < pixels.length; i += 16) {
            if (pixels[i] < 250) {
              hasAlpha = true;
              break;
            }
          }
        } catch {
          hasAlpha = false;
        }

        if (hasAlpha) {
          candidates.push(canvas.toDataURL('image/png'));
        } else {
          candidates.push(canvas.toDataURL('image/jpeg', 0.84));
        }

        const smallest = candidates.reduce((best, cur) => (cur.length < best.length ? cur : best), rawDataUrl);
        resolve({
          dataUrl: smallest,
          originalBytes,
          compressedBytes: smallest.length,
        });
      } catch {
        resolve({ dataUrl: rawDataUrl, originalBytes, compressedBytes: originalBytes });
      }
    };
    img.onerror = () => reject(new Error('تعذر معالجة ملف الصورة.'));
    img.src = rawDataUrl;
  });
}
