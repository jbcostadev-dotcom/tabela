import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const port = 3001;
const JWT_SECRET = 'lockpharma_secret_key_2024';

// Configuração do banco SQLite
const db = new sqlite3.Database('./database.sqlite');

// Criar tabelas se não existirem
db.serialize(() => {
  // Tabela de pedidos
  db.run(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cpf TEXT NOT NULL,
      email TEXT NOT NULL,
      telefone TEXT NOT NULL,
      cep TEXT NOT NULL,
      rua TEXT NOT NULL,
      numero TEXT NOT NULL,
      complemento TEXT,
      bairro TEXT NOT NULL,
      cidade TEXT NOT NULL,
      estado TEXT NOT NULL,
      metodo_pagamento TEXT NOT NULL,
      frete REAL NOT NULL DEFAULT 0,
      total_pedido REAL NOT NULL,
      seguro TEXT DEFAULT 'não',
      status TEXT DEFAULT 'pendente',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de produtos
  db.run(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      preco REAL NOT NULL,
      categoria_id INTEGER,
      imagem_url TEXT,
      descricao TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de categorias
  db.run(`
    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de admin
  db.run(`
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT NOT NULL UNIQUE,
      senha TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Inserir dados de exemplo
  db.run(`INSERT OR IGNORE INTO categorias (id, nome) VALUES (1, 'Suplementos')`);
  db.run(`INSERT OR IGNORE INTO produtos (id, nome, preco, categoria_id, imagem_url, descricao) VALUES 
    (1, 'Whey Protein', 89.90, 1, '/produtos/produto-1759809930658-447613549.webp', 'Proteína de alta qualidade')
  `);
  
  // Inserir admin padrão (senha: admin123)
  const saltRounds = 10;
  bcrypt.hash('admin123', saltRounds, (err, hash) => {
    if (!err) {
      db.run(`INSERT OR IGNORE INTO admin (id, usuario, senha) VALUES (1, 'admin', ?)`, [hash]);
    }
  });
});

app.use(cors());
app.use(express.json());

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// ===== ENDPOINTS DE PEDIDOS =====

// Listar todos os pedidos
app.get('/api/pedidos', (req, res) => {
  db.all('SELECT * FROM pedidos ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      console.error('Erro ao buscar pedidos:', err);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
    res.json(rows);
  });
});

// Buscar pedido por ID
app.get('/api/pedidos/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM pedidos WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Erro ao buscar pedido:', err);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    res.json(row);
  });
});

// Criar novo pedido (rota pública para checkout)
app.post('/api/pedidos', (req, res) => {
  console.log('Dados recebidos:', req.body);
  
  const {
    nome, cpf, email, telefone, cep, rua, numero, complemento,
    bairro, cidade, estado, metodo_pagamento, frete, total_pedido, seguro
  } = req.body;

  // Validar campos obrigatórios
  if (!nome || !cpf || !email || !telefone || !cep || !rua || !numero || 
      !bairro || !cidade || !estado || !metodo_pagamento || 
      total_pedido === undefined || frete === undefined) {
    console.log('Campos obrigatórios faltando');
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  const stmt = db.prepare(`
    INSERT INTO pedidos (
      nome, cpf, email, telefone, cep, rua, numero, complemento,
      bairro, cidade, estado, metodo_pagamento, frete, total_pedido, seguro
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run([
    nome, cpf, email, telefone, cep, rua, numero, complemento,
    bairro, cidade, estado, metodo_pagamento, frete, total_pedido, seguro || 'não'
  ], function(err) {
    if (err) {
      console.error('Erro ao criar pedido:', err);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    // Buscar o pedido criado
    db.get('SELECT * FROM pedidos WHERE id = ?', [this.lastID], (err, row) => {
      if (err) {
        console.error('Erro ao buscar pedido criado:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      
      console.log('Pedido criado com sucesso:', row);
      res.status(201).json(row);
    });
  });

  stmt.finalize();
});

// ===== ENDPOINTS DE PRODUTOS =====

// Listar todos os produtos
app.get('/api/produtos', (req, res) => {
  db.all(`
    SELECT p.*, c.nome as categoria_nome 
    FROM produtos p 
    LEFT JOIN categorias c ON p.categoria_id = c.id 
    ORDER BY p.created_at DESC
  `, (err, rows) => {
    if (err) {
      console.error('Erro ao buscar produtos:', err);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
    res.json(rows);
  });
});

// ===== ENDPOINTS DE CATEGORIAS =====

// Listar todas as categorias
app.get('/api/categorias', (req, res) => {
  db.all('SELECT * FROM categorias ORDER BY nome', (err, rows) => {
    if (err) {
      console.error('Erro ao buscar categorias:', err);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
    res.json(rows);
  });
});

// ===== ENDPOINTS DE FRETE =====

// Listar tipos de frete
app.get('/api/frete', (req, res) => {
  // Dados mockados para frete
  const freteOptions = [
    { id: 1, nome: 'PAC', preco: 15.00, prazo: '7-10 dias' },
    { id: 2, nome: 'SEDEX', preco: 25.00, prazo: '2-3 dias' }
  ];
  res.json(freteOptions);
});

// ===== ENDPOINTS DE ADMIN =====

// Login do admin
app.post('/api/admin/login', async (req, res) => {
  try {
    const { usuario, senha } = req.body;
    console.log('Tentativa de login:', { usuario, senha: '***' });
    
    db.get('SELECT * FROM admin WHERE usuario = ?', [usuario], async (err, admin) => {
      if (err) {
        console.error('Erro ao buscar admin:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      
      if (!admin) {
        console.log('Usuário não encontrado na tabela admin');
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }
      
      console.log('Dados do admin encontrado:', { 
        id: admin.id, 
        usuario: admin.usuario,
        senhaHash: admin.senha ? 'existe' : 'não existe'
      });
      
      try {
        const validPassword = await bcrypt.compare(senha, admin.senha);
        console.log('Verificação de senha:', { valida: validPassword });
        
        if (!validPassword) {
          console.log('Senha inválida para o usuário:', usuario);
          return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        
        const token = jwt.sign(
          { id: admin.id, usuario: admin.usuario },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        console.log('Login realizado com sucesso para:', usuario);
        res.json({ 
          token,
          admin: { id: admin.id, usuario: admin.usuario }
        });
      } catch (bcryptError) {
        console.error('Erro ao verificar senha:', bcryptError);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.listen(port, () => {
  console.log(`Servidor local rodando na porta ${port}`);
  console.log('Usando banco SQLite local para testes');
});