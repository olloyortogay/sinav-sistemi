import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Supabase Storage 'assets' bucket'ından dosya URL'si oluşturur.
 * @param {string} path - Dosya adı veya yolu (örn: 'a1-dinleme1.mp3')
 * @returns {string} - Tam public URL
 */
export const getPublicUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path; // Zaten tam URL ise dokunma
  
  // Eğer yol /assets/ ile başlıyorsa temizle (data'daki eski yollar için uyumluluk)
  const cleanPath = path.replace(/^\/?assets\//, '');
  
  return `${supabaseUrl}/storage/v1/object/public/assets/${cleanPath}`;
};
