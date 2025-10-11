import { Categoria, Produto, Marca } from './database';

const API_BASE_URL = (() => {
  // Em produção, use sempre o mesmo domínio com caminho /api.
  // Em desenvolvimento, o Vite proxy já redireciona /api para localhost:3001.
  const defaultBase = '/api';
  return import.meta.env.VITE_API_BASE_URL ?? defaultBase;
})();

export async function getCategorias(): Promise<Categoria[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/categorias`);
    if (!response.ok) {
      throw new Error('Erro ao buscar categorias');
    }
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    throw error;
  }
}

export async function getMarcas(): Promise<Marca[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/marcas`);
    if (!response.ok) {
      throw new Error('Erro ao buscar marcas');
    }
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar marcas:', error);
    throw error;
  }
}

export async function getProdutos(): Promise<Produto[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/produtos`);
    if (!response.ok) {
      throw new Error('Erro ao buscar produtos');
    }
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    throw error;
  }
}

export async function getProdutosByCategoria(categoriaId: number): Promise<Produto[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/produtos/categoria/${categoriaId}`);
    if (!response.ok) {
      throw new Error('Erro ao buscar produtos por categoria');
    }
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar produtos por categoria:', error);
    throw error;
  }
}

export async function getProdutosByMarca(marcaId: number): Promise<Produto[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/produtos/marca/${marcaId}`);
    if (!response.ok) {
      throw new Error('Erro ao buscar produtos por marca');
    }
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar produtos por marca:', error);
    throw error;
  }
}

export { type Categoria, type Produto, type Marca };