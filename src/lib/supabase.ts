import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Product = {
  id: string;
  name: string;
  description: string;
  category: 'injectable' | 'oral';
  price: number;
  image_url?: string;
  brand: string;
  stock: number;
  created_at: string;
  updated_at: string;
};
