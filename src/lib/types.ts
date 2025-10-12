export type Categoria = {
  id: number;
  nome: string;
  imagem_url?: string;
  created_at: string;
  updated_at: string;
};

export type Marca = {
  id: number;
  nome: string;
  logo_url?: string;
  ordem?: number;
  created_at: string;
  updated_at: string;
};

export type Produto = {
  id: number;
  nome: string;
  preco: number;
  id_categoria: number;
  marca_id?: number;
  descricao?: string;
  imagem_url?: string;
  estoque: number;
  created_at: string;
  updated_at: string;
  categoria?: Categoria | null;
  marca?: Marca | null;
};