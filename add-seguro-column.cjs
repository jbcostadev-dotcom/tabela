const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://lockpharma:Zreel123!@easypanel.lockpainel.shop:1112/tabela'
});

async function addSeguroColumn() {
  try {
    await client.connect();
    console.log('Conectado ao PostgreSQL');

    // Verificar se a coluna já existe
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pedidos' AND column_name = 'seguro';
    `);

    if (checkColumn.rows.length === 0) {
      // Adicionar coluna seguro
      await client.query(`
        ALTER TABLE pedidos 
        ADD COLUMN seguro VARCHAR(3) DEFAULT 'não';
      `);
      console.log('✅ Coluna seguro adicionada com sucesso!');
    } else {
      console.log('ℹ️ Coluna seguro já existe na tabela');
    }

    // Verificar estrutura atualizada
    const result = await client.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'pedidos' 
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Estrutura atualizada da tabela pedidos:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (default: ${row.column_default || 'NULL'})`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

addSeguroColumn();