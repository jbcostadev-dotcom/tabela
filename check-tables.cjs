const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://lockpharma:Zreel123!@easypanel.lockpainel.shop:1112/tabela'
});

async function checkTables() {
  try {
    await client.connect();
    console.log('Conectado ao PostgreSQL');

    // Verificar estrutura da tabela produtos
    console.log('\n📋 Estrutura da tabela produtos:');
    const produtosStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'produtos'
      ORDER BY ordinal_position
    `);
    
    if (produtosStructure.rows.length > 0) {
      produtosStructure.rows.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } else {
      console.log('❌ Tabela produtos não encontrada');
    }

    // Verificar estrutura da tabela categorias
    console.log('\n📋 Estrutura da tabela categorias:');
    const categoriasStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'categorias'
      ORDER BY ordinal_position
    `);
    
    if (categoriasStructure.rows.length > 0) {
      categoriasStructure.rows.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } else {
      console.log('❌ Tabela categorias não encontrada');
    }

    // Listar todas as categorias
    console.log('\n📂 Categorias existentes:');
    try {
      const categorias = await client.query('SELECT * FROM categorias ORDER BY id');
      categorias.rows.forEach(cat => {
        console.log(`- ID: ${cat.id}, Nome: ${cat.nome}`);
      });
    } catch (error) {
      console.log('❌ Erro ao buscar categorias:', error.message);
    }

    // Listar alguns produtos
    console.log('\n📦 Produtos existentes (primeiros 5):');
    try {
      const produtos = await client.query('SELECT * FROM produtos LIMIT 5');
      produtos.rows.forEach(prod => {
        console.log(`- ID: ${prod.id}, Nome: ${prod.nome}, Preço: ${prod.preco}`);
      });
    } catch (error) {
      console.log('❌ Erro ao buscar produtos:', error.message);
    }

    // Verificar se tabela marcas existe
    console.log('\n🏷️  Verificando tabela marcas:');
    const marcasExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'marcas'
      )
    `);
    
    if (marcasExists.rows[0].exists) {
      console.log('✅ Tabela marcas existe');
      const marcas = await client.query('SELECT * FROM marcas ORDER BY id');
      marcas.rows.forEach(marca => {
        console.log(`- ID: ${marca.id}, Nome: ${marca.nome}`);
      });
    } else {
      console.log('❌ Tabela marcas não existe');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
  }
}

checkTables();