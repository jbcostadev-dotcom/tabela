// Cliente Supabase opcional; evite erro se pacote não instalado
export const supabase: any = null;

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
