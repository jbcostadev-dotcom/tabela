import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://lockpharma:Zreel123!@easypanel.lockpainel.shop:1112/tabela?sslmode=disable',
  ssl: false
});

export { pool };

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
  categoria?: Categoria;
  marca?: Marca;
};