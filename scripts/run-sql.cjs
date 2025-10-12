const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL || 'postgres://lockpharma:Zreel123!@easypanel.lockpainel.shop:1112/tabela';
const sqlFile = process.argv[2] || path.join(__dirname, 'create-tables.sql');

async function runSQL() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Conectado ao PostgreSQL');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    await client.query(sql);
    console.log('SQL executado com sucesso:', path.basename(sqlFile));
  } catch (error) {
    console.error('Erro ao executar SQL:', error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  runSQL();
}

module.exports = { runSQL };