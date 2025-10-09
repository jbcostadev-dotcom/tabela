const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://lockpharma:Zreel123!@easypanel.lockpainel.shop:1112/tabela'
});

async function updateDatabase() {
  try {
    await client.connect();
    console.log('Conectado ao PostgreSQL');

    // 1. Remover categoria "Tópicos"
    console.log('\n1. Removendo categoria "Tópicos"...');
    
    // Primeiro, verificar se existem produtos vinculados a esta categoria
    const produtosVinculados = await client.query(
      "SELECT COUNT(*) as count FROM produtos WHERE id_categoria = (SELECT id FROM categorias WHERE nome = 'Tópicos')"
    );
    
    if (produtosVinculados.rows[0].count > 0) {
      console.log(`⚠️  Encontrados ${produtosVinculados.rows[0].count} produtos vinculados à categoria "Tópicos"`);
      
      // Mover produtos para uma categoria padrão (primeira categoria disponível)
      const primeiraCategoria = await client.query(
        "SELECT id FROM categorias WHERE nome != 'Tópicos' ORDER BY id LIMIT 1"
      );
      
      if (primeiraCategoria.rows.length > 0) {
        await client.query(
          "UPDATE produtos SET id_categoria = $1 WHERE id_categoria = (SELECT id FROM categorias WHERE nome = 'Tópicos')",
          [primeiraCategoria.rows[0].id]
        );
        console.log(`✅ Produtos movidos para categoria ID: ${primeiraCategoria.rows[0].id}`);
      }
    }
    
    // Remover a categoria "Tópicos"
    const deleteResult = await client.query("DELETE FROM categorias WHERE nome = 'Tópicos'");
    console.log(`✅ Categoria "Tópicos" removida (${deleteResult.rowCount} linha(s) afetada(s))`);

    // 2. Criar tabela "marcas"
    console.log('\n2. Criando tabela "marcas"...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS marcas (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL UNIQUE,
        descricao TEXT,
        logo_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela "marcas" criada');

    // 3. Adicionar campo marca_id na tabela produtos
    console.log('\n3. Adicionando campo marca_id na tabela produtos...');
    
    // Verificar se a coluna já existe
    const columnExists = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'produtos' AND column_name = 'marca_id'
    `);
    
    if (columnExists.rows.length === 0) {
      await client.query(`
        ALTER TABLE produtos 
        ADD COLUMN marca_id INTEGER REFERENCES marcas(id) ON DELETE SET NULL
      `);
      console.log('✅ Campo marca_id adicionado à tabela produtos');
    } else {
      console.log('ℹ️  Campo marca_id já existe na tabela produtos');
    }

    // 4. Verificar marcas existentes no banco
    console.log('\n4. Verificando marcas existentes no banco...');
    
    const marcasExistentes = await client.query('SELECT COUNT(*) as count FROM marcas');
    console.log(`ℹ️  Encontradas ${marcasExistentes.rows[0].count} marcas no banco de dados`);

    // 5. Adicionar coluna itens na tabela pedidos
    console.log('\n5. Verificando coluna "itens" na tabela pedidos...');
    const itensColumn = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'pedidos' AND column_name = 'itens'
    `);
    if (itensColumn.rows.length === 0) {
      await client.query(`ALTER TABLE pedidos ADD COLUMN itens TEXT`);
      console.log('✅ Coluna itens adicionada à tabela pedidos');
    } else {
      console.log('ℹ️  Coluna itens já existe na tabela pedidos');
    }

    // 5. Atualizar alguns produtos com marcas (exemplo)
    console.log('\n5. Vinculando produtos às marcas...');
    
    const produtos = await client.query('SELECT id, nome FROM produtos LIMIT 10');
    const marcas = await client.query('SELECT id, nome FROM marcas');
    
    if (produtos.rows.length > 0 && marcas.rows.length > 0) {
      for (let i = 0; i < produtos.rows.length; i++) {
        const produto = produtos.rows[i];
        const marca = marcas.rows[i % marcas.rows.length]; // Distribuir marcas ciclicamente
        
        await client.query(
          'UPDATE produtos SET marca_id = $1 WHERE id = $2',
          [marca.id, produto.id]
        );
        console.log(`✅ Produto "${produto.nome}" vinculado à marca "${marca.nome}"`);
      }
    }

    // 6. Mostrar estatísticas finais
    console.log('\n📊 Estatísticas finais:');
    
    const totalCategorias = await client.query('SELECT COUNT(*) as count FROM categorias');
    const totalMarcas = await client.query('SELECT COUNT(*) as count FROM marcas');
    const totalProdutos = await client.query('SELECT COUNT(*) as count FROM produtos');
    const produtosComMarca = await client.query('SELECT COUNT(*) as count FROM produtos WHERE marca_id IS NOT NULL');
    
    console.log(`- Categorias: ${totalCategorias.rows[0].count}`);
    console.log(`- Marcas: ${totalMarcas.rows[0].count}`);
    console.log(`- Produtos: ${totalProdutos.rows[0].count}`);
    console.log(`- Produtos com marca: ${produtosComMarca.rows[0].count}`);

    console.log('\n🎉 Atualização do banco de dados concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao atualizar banco de dados:', error);
  } finally {
    await client.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  updateDatabase()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Erro:', error);
      process.exit(1);
    });
}

module.exports = { updateDatabase };