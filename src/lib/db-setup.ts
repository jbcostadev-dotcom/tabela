import { pool } from './database';

export async function createTables() {
  const client = await pool.connect();
  
  try {
    // Criar tabela de categorias
    await client.query(`
      CREATE TABLE IF NOT EXISTS categorias (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(100) NOT NULL,
          imagem_url TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Criar tabela de produtos
    await client.query(`
      CREATE TABLE IF NOT EXISTS produtos (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(200) NOT NULL,
          preco DECIMAL(10,2) NOT NULL,
          id_categoria INTEGER NOT NULL,
          descricao TEXT,
          imagem_url TEXT,
          estoque INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (id_categoria) REFERENCES categorias(id)
      );
    `);

    // Inserir categorias de exemplo
    await client.query(`
      INSERT INTO categorias (nome, imagem_url) VALUES 
      ('Injetáveis', '/category-injetaveis.png'),
      ('Oral', '/category-oral.png'),
      ('Tópicos', '/category-topicos.png')
      ON CONFLICT DO NOTHING;
    `);

    // Inserir produtos de exemplo
    await client.query(`
      INSERT INTO produtos (nome, preco, id_categoria, descricao, imagem_url, estoque) VALUES 
      ('Produto Injectable 1', 25.50, 1, 'Descrição do produto injetável', '/produto1.png', 10),
      ('Produto Oral 1', 15.75, 2, 'Descrição do produto oral', '/produto2.png', 25),
      ('Produto Tópico 1', 30.00, 3, 'Descrição do produto tópico', '/produto3.png', 8),
      ('Produto Injectable 2', 45.90, 1, 'Outro produto injetável', '/produto4.png', 5),
      ('Produto Oral 2', 22.30, 2, 'Outro produto oral', '/produto5.png', 15)
      ON CONFLICT DO NOTHING;
    `);

    console.log('Tabelas criadas com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabelas:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  createTables()
    .then(() => {
      console.log('Setup do banco concluído!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erro no setup:', error);
      process.exit(1);
    });
}