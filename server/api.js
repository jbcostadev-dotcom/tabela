import express from 'express';
import cors from 'cors';
import pkg from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
const { Pool } = pkg;

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'lockpharma_secret_key_2024';

// Configuração do banco
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://lockpharma:Zreel123!@easypanel.lockpainel.shop:1112/tabela?sslmode=disable',
  ssl: false
});

app.use(cors());
app.use(express.json());

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(process.cwd(), 'public', 'logos');
    
    // Criar diretório se não existir
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Gerar nome único para o arquivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Aceitar apenas imagens
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Servir arquivos estáticos da pasta public
app.use('/logos', express.static(path.join(process.cwd(), 'public', 'logos')));
app.use('/produtos', express.static(path.join(process.cwd(), 'public', 'produtos')));
// Healthcheck simples
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Login do admin
app.post('/api/admin/login', async (req, res) => {
  try {
    const { usuario, senha } = req.body;
    console.log('Tentativa de login:', { usuario, senha: '***' });
    
    const result = await pool.query('SELECT * FROM admin WHERE usuario = $1', [usuario]);
    console.log('Resultado da consulta:', { 
      encontrado: result.rows.length > 0,
      usuario: result.rows.length > 0 ? result.rows[0].usuario : 'não encontrado'
    });
    
    if (result.rows.length === 0) {
      console.log('Usuário não encontrado na tabela admin');
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const admin = result.rows[0];
    console.log('Dados do admin encontrado:', { 
      id: admin.id, 
      usuario: admin.usuario,
      senhaHash: admin.senha ? 'existe' : 'não existe'
    });
    
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
      admin: {
        id: admin.id,
        usuario: admin.usuario
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Verificar token
app.get('/api/admin/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// Buscar categorias
app.get('/api/categorias', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categorias ORDER BY nome');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar marcas
app.get('/api/marcas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM marcas ORDER BY nome');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar marcas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar produtos
app.get('/api/produtos', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        c.nome as categoria_nome,
        m.nome as marca_nome,
        m.logo_url as marca_logo_url
      FROM produtos p
      LEFT JOIN categorias c ON p.id_categoria = c.id
      LEFT JOIN marcas m ON p.marca_id = m.id
      ORDER BY m.id ASC, p.preco ASC
    `);
    
    const produtos = result.rows.map(row => ({
      id: row.id,
      nome: row.nome,
      preco: parseFloat(row.preco),
      descricao: row.descricao,
      imagem_url: row.imagem_url,
      estoque: row.estoque,
      id_categoria: row.id_categoria,
      marca_id: row.marca_id,
      categoria: row.categoria_nome ? {
        id: row.id_categoria,
        nome: row.categoria_nome
      } : null,
      marca: row.marca_nome ? {
        id: row.marca_id,
        nome: row.marca_nome,
        logo_url: row.marca_logo_url
      } : null,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
    
    res.json(produtos);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar produtos por categoria
app.get('/api/produtos/categoria/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        p.*,
        c.nome as categoria_nome,
        m.nome as marca_nome
      FROM produtos p
      LEFT JOIN categorias c ON p.id_categoria = c.id
      LEFT JOIN marcas m ON p.marca_id = m.id
      WHERE p.id_categoria = $1
      ORDER BY p.nome
    `, [id]);
    
    const produtos = result.rows.map(row => ({
      id: row.id,
      nome: row.nome,
      preco: parseFloat(row.preco),
      descricao: row.descricao,
      imagem_url: row.imagem_url,
      estoque: row.estoque,
      id_categoria: row.id_categoria,
      marca_id: row.marca_id,
      categoria: row.categoria_nome ? {
        id: row.id_categoria,
        nome: row.categoria_nome
      } : null,
      marca: row.marca_nome ? {
        id: row.marca_id,
        nome: row.marca_nome
      } : null,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
    
    res.json(produtos);
  } catch (error) {
    console.error('Erro ao buscar produtos por categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar produtos por marca
app.get('/api/produtos/marca/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        p.*,
        c.nome as categoria_nome,
        m.nome as marca_nome
      FROM produtos p
      LEFT JOIN categorias c ON p.id_categoria = c.id
      LEFT JOIN marcas m ON p.marca_id = m.id
      WHERE p.marca_id = $1
      ORDER BY p.nome
    `, [id]);
    
    const produtos = result.rows.map(row => ({
      id: row.id,
      nome: row.nome,
      preco: parseFloat(row.preco),
      descricao: row.descricao,
      imagem_url: row.imagem_url,
      estoque: row.estoque,
      id_categoria: row.id_categoria,
      marca_id: row.marca_id,
      categoria: row.categoria_nome ? {
        id: row.id_categoria,
        nome: row.categoria_nome
      } : null,
      marca: row.marca_nome ? {
        id: row.marca_id,
        nome: row.marca_nome
      } : null,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
    
    res.json(produtos);
  } catch (error) {
    console.error('Erro ao buscar produtos por marca:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// CRUD para Categorias (Admin)
app.post('/api/admin/categorias', authenticateToken, async (req, res) => {
  try {
    const { nome, imagem_url } = req.body;
    
    const result = await pool.query(
      'INSERT INTO categorias (nome, imagem_url) VALUES ($1, $2) RETURNING *',
      [nome, imagem_url]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.put('/api/admin/categorias/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, imagem_url } = req.body;
    
    const result = await pool.query(
      'UPDATE categorias SET nome = $1, imagem_url = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [nome, imagem_url, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.delete('/api/admin/categorias/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM categorias WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    
    res.json({ message: 'Categoria deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// CRUD para Marcas (Admin)
// Upload de logo
// Endpoint para upload de logo
app.post('/api/admin/upload-logo', authenticateToken, (req, res) => {
  upload.single('logo')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      console.error('Erro do Multer:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Arquivo muito grande. Máximo 5MB.' });
      }
      return res.status(400).json({ error: 'Erro no upload: ' + err.message });
    } else if (err) {
      console.error('Erro no upload:', err);
      return res.status(400).json({ error: 'Erro no upload da imagem: ' + err.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }

      // Retornar o caminho do arquivo
      const logoUrl = `/logos/${req.file.filename}`;
      
      console.log('Upload realizado com sucesso:', logoUrl);
      
      res.json({ 
        message: 'Upload realizado com sucesso',
        logo_url: logoUrl,
        filename: req.file.filename
      });
    } catch (error) {
      console.error('Erro interno no upload:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
});

// Upload de imagem para produtos
app.post('/api/admin/upload-produto', authenticateToken, (req, res) => {
  // Configuração específica para produtos
  const produtoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadPath = path.join(process.cwd(), 'public', 'produtos');
      
      // Criar diretório se não existir
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      // Gerar nome único para o arquivo
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      cb(null, 'produto-' + uniqueSuffix + extension);
    }
  });

  const produtoUpload = multer({ 
    storage: produtoStorage,
    fileFilter: function (req, file, cb) {
      // Aceitar apenas imagens
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Apenas arquivos de imagem são permitidos!'), false);
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB
    }
  });

  produtoUpload.single('imagem')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Arquivo muito grande. Máximo 5MB.' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    // Retornar a URL da imagem
    const imagemUrl = `/produtos/${req.file.filename}`;
    res.json({ 
      message: 'Upload realizado com sucesso',
      imagem_url: imagemUrl,
      filename: req.file.filename
    });
  });
});

app.post('/api/admin/marcas', authenticateToken, async (req, res) => {
  try {
    const { nome, logo_url } = req.body;
    
    if (!nome) {
      return res.status(400).json({ error: 'Nome da marca é obrigatório' });
    }

    const result = await pool.query(
      'INSERT INTO marcas (nome, logo_url) VALUES ($1, $2) RETURNING *',
      [nome, logo_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar marca:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.put('/api/admin/marcas/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, logo_url } = req.body;

    const result = await pool.query(
      'UPDATE marcas SET nome = $1, logo_url = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [nome, logo_url, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Marca não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar marca:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.delete('/api/admin/marcas/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM marcas WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Marca não encontrada' });
    }

    res.json({ message: 'Marca deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar marca:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// CRUD para Produtos (Admin)
app.post('/api/admin/produtos', authenticateToken, async (req, res) => {
  try {
    const { nome, preco, categoria_id, marca_id, imagem_url } = req.body;
    
    console.log('Dados recebidos:', { nome, preco, categoria_id, marca_id, imagem_url });
    
    if (!nome || !preco || !categoria_id) {
      return res.status(400).json({ error: 'Nome, preço e categoria são obrigatórios' });
    }
    
    const result = await pool.query(
      'INSERT INTO produtos (nome, preco, id_categoria, marca_id, imagem_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nome, preco, categoria_id, marca_id || null, imagem_url || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.put('/api/admin/produtos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, preco, categoria_id, marca_id, imagem_url } = req.body;
    
    const result = await pool.query(
      'UPDATE produtos SET nome = $1, preco = $2, id_categoria = $3, marca_id = $4, imagem_url = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [nome, preco, categoria_id, marca_id || null, imagem_url || null, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.delete('/api/admin/produtos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM produtos WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    res.json({ message: 'Produto deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para buscar tipos de frete
app.get('/api/frete', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM frete ORDER BY nome');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar tipos de frete:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar novo frete
app.post('/api/admin/fretes', authenticateToken, async (req, res) => {
  try {
    const { nome, ac, al, ap, am, ba, ce, df, es, go, ma, mt, ms, mg, pa, pb, pr, pe, pi, rj, rn, rs, ro, rr, sc, sp, se, tocantins, seguro } = req.body;
    
    const result = await pool.query(`
      INSERT INTO frete (nome, ac, al, ap, am, ba, ce, df, es, go, ma, mt, ms, mg, pa, pb, pr, pe, pi, rj, rn, rs, ro, rr, sc, sp, se, tocantins, seguro)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
      RETURNING *
    `, [nome, ac, al, ap, am, ba, ce, df, es, go, ma, mt, ms, mg, pa, pb, pr, pe, pi, rj, rn, rs, ro, rr, sc, sp, se, tocantins, seguro]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar frete:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar frete
app.put('/api/admin/fretes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, ac, al, ap, am, ba, ce, df, es, go, ma, mt, ms, mg, pa, pb, pr, pe, pi, rj, rn, rs, ro, rr, sc, sp, se, tocantins, seguro } = req.body;
    
    const result = await pool.query(`
      UPDATE frete 
      SET nome = $1, ac = $2, al = $3, ap = $4, am = $5, ba = $6, ce = $7, df = $8, es = $9, go = $10, ma = $11, mt = $12, ms = $13, mg = $14, pa = $15, pb = $16, pr = $17, pe = $18, pi = $19, rj = $20, rn = $21, rs = $22, ro = $23, rr = $24, sc = $25, sp = $26, se = $27, tocantins = $28, seguro = $29, updated_at = CURRENT_TIMESTAMP
      WHERE id = $30
      RETURNING *
    `, [nome, ac, al, ap, am, ba, ce, df, es, go, ma, mt, ms, mg, pa, pb, pr, pe, pi, rj, rn, rs, ro, rr, sc, sp, se, tocantins, seguro, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Frete não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar frete:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar frete
app.delete('/api/admin/fretes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM frete WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Frete não encontrado' });
    }
    
    res.json({ message: 'Frete deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar frete:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== ENDPOINTS DE PEDIDOS =====

// Listar todos os pedidos
app.get('/api/pedidos', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM pedidos 
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar pedido por ID
app.get('/api/pedidos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM pedidos WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar novo pedido (rota pública para checkout)
app.post('/api/pedidos', async (req, res) => {
  try {
    const {
      nome, cpf, email, telefone, cep, rua, numero, complemento,
      bairro, cidade, estado, metodo_pagamento, frete, total_pedido, seguro
    } = req.body;

    const result = await pool.query(`
      INSERT INTO pedidos (
        nome, cpf, email, telefone, cep, rua, numero, complemento,
        bairro, cidade, estado, metodo_pagamento, frete, total_pedido, seguro
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      nome, cpf, email, telefone, cep, rua, numero, complemento,
      bairro, cidade, estado, metodo_pagamento, frete, total_pedido, seguro || 'não'
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar novo pedido
app.post('/api/admin/pedidos', authenticateToken, async (req, res) => {
  try {
    const {
      nome, cpf, email, telefone, cep, rua, numero, complemento,
      bairro, cidade, estado, metodo_pagamento, frete, total_pedido, status, seguro
    } = req.body;

    const result = await pool.query(`
      INSERT INTO pedidos (
        nome, cpf, email, telefone, cep, rua, numero, complemento,
        bairro, cidade, estado, metodo_pagamento, frete, total_pedido, status, seguro
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `, [
      nome, cpf, email, telefone, cep, rua, numero, complemento,
      bairro, cidade, estado, metodo_pagamento, frete, total_pedido, status || 'Pendente', seguro || 'não'
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar pedido
app.put('/api/admin/pedidos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome, cpf, email, telefone, cep, rua, numero, complemento,
      bairro, cidade, estado, metodo_pagamento, frete, total_pedido, status, seguro
    } = req.body;

    const result = await pool.query(`
      UPDATE pedidos SET 
        nome = $1, cpf = $2, email = $3, telefone = $4, cep = $5, 
        rua = $6, numero = $7, complemento = $8, bairro = $9, cidade = $10,
        estado = $11, metodo_pagamento = $12, frete = $13, total_pedido = $14,
        status = $15, seguro = $16, updated_at = CURRENT_TIMESTAMP
      WHERE id = $17
      RETURNING *
    `, [
      nome, cpf, email, telefone, cep, rua, numero, complemento,
      bairro, cidade, estado, metodo_pagamento, frete, total_pedido, status, seguro, id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar pedido
app.delete('/api/admin/pedidos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM pedidos WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    res.json({ message: 'Pedido deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar apenas o status do pedido
app.patch('/api/admin/pedidos/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(`
      UPDATE pedidos SET 
        status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});