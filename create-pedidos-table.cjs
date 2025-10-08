const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://lockpharma:Zreel123!@easypanel.lockpainel.shop:1112/tabela'
});

async function createPedidosTable() {
  try {
    await client.connect();
    console.log('Conectado ao PostgreSQL');

    // Criar tabela de pedidos
    console.log('\nCriando tabela "pedidos"...');
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS pedidos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(200) NOT NULL,
        cpf VARCHAR(14) NOT NULL,
        email VARCHAR(255) NOT NULL,
        telefone VARCHAR(20) NOT NULL,
        cep VARCHAR(10) NOT NULL,
        rua VARCHAR(255) NOT NULL,
        numero VARCHAR(20) NOT NULL,
        complemento VARCHAR(100),
        bairro VARCHAR(100) NOT NULL,
        cidade VARCHAR(100) NOT NULL,
        estado VARCHAR(2) NOT NULL,
        metodo_pagamento VARCHAR(50) NOT NULL,
        frete DECIMAL(10,2) NOT NULL DEFAULT 0,
        total_pedido DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'Pendente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await client.query(createTableQuery);
    console.log('✅ Tabela "pedidos" criada com sucesso!');

    // Verificar se a tabela foi criada
    const checkTable = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'pedidos' 
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Estrutura da tabela "pedidos":');
    checkTable.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`);
    });

    console.log('\n🎉 Tabela de pedidos criada com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao criar tabela de pedidos:', error);
  } finally {
    await client.end();
  }
}

createPedidosTable();