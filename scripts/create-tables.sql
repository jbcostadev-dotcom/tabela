-- Criar tabela de categorias
CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    imagem_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de marcas
CREATE TABLE IF NOT EXISTS marcas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de produtos
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

-- Criar tabela de admin
CREATE TABLE IF NOT EXISTS admin (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    usuario VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de frete
CREATE TABLE IF NOT EXISTS frete (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL, -- Nome do tipo de frete (Sedex, Correios, etc.)
    AC DECIMAL(10,2) DEFAULT 0, -- Acre
    AL DECIMAL(10,2) DEFAULT 0, -- Alagoas
    AP DECIMAL(10,2) DEFAULT 0, -- Amapá
    AM DECIMAL(10,2) DEFAULT 0, -- Amazonas
    BA DECIMAL(10,2) DEFAULT 0, -- Bahia
    CE DECIMAL(10,2) DEFAULT 0, -- Ceará
    DF DECIMAL(10,2) DEFAULT 0, -- Distrito Federal
    ES DECIMAL(10,2) DEFAULT 0, -- Espírito Santo
    GO DECIMAL(10,2) DEFAULT 0, -- Goiás
    MA DECIMAL(10,2) DEFAULT 0, -- Maranhão
    MT DECIMAL(10,2) DEFAULT 0, -- Mato Grosso
    MS DECIMAL(10,2) DEFAULT 0, -- Mato Grosso do Sul
    MG DECIMAL(10,2) DEFAULT 0, -- Minas Gerais
    PA DECIMAL(10,2) DEFAULT 0, -- Pará
    PB DECIMAL(10,2) DEFAULT 0, -- Paraíba
    PR DECIMAL(10,2) DEFAULT 0, -- Paraná
    PE DECIMAL(10,2) DEFAULT 0, -- Pernambuco
    PI DECIMAL(10,2) DEFAULT 0, -- Piauí
    RJ DECIMAL(10,2) DEFAULT 0, -- Rio de Janeiro
    RN DECIMAL(10,2) DEFAULT 0, -- Rio Grande do Norte
    RS DECIMAL(10,2) DEFAULT 0, -- Rio Grande do Sul
    RO DECIMAL(10,2) DEFAULT 0, -- Rondônia
    RR DECIMAL(10,2) DEFAULT 0, -- Roraima
    SC DECIMAL(10,2) DEFAULT 0, -- Santa Catarina
    SP DECIMAL(10,2) DEFAULT 0, -- São Paulo
    SE DECIMAL(10,2) DEFAULT 0, -- Sergipe
    tocantins DECIMAL(10,2) DEFAULT 0, -- Tocantins
    seguro DECIMAL(5,2) DEFAULT 0, -- Porcentagem do seguro (ex: 2.50 para 2.5%)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir categorias de exemplo
INSERT INTO categorias (nome, imagem_url) VALUES 
('Injetáveis', '/category-injetaveis.png'),
('Oral', '/category-oral.png')
ON CONFLICT DO NOTHING;

-- Inserir marcas de exemplo
INSERT INTO marcas (nome, logo_url) VALUES 
('Marca A', '/logos/marca-a.png'),
('Marca B', '/logos/marca-b.png'),
('Marca C', '/logos/marca-c.png')
ON CONFLICT DO NOTHING;

-- Inserir produtos de exemplo
INSERT INTO produtos (nome, preco, id_categoria, descricao, imagem_url, estoque) VALUES 
('Produto Injectable 1', 25.50, 1, 'Descrição do produto injetável', '/produto1.png', 10),
('Produto Oral 1', 15.75, 2, 'Descrição do produto oral', '/produto2.png', 25),
('Produto Injectable 2', 45.90, 1, 'Outro produto injetável', '/produto4.png', 5),
('Produto Oral 2', 22.30, 2, 'Outro produto oral', '/produto5.png', 15)
ON CONFLICT DO NOTHING;

-- Criar tabela de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL, -- Nome do cliente
    cpf VARCHAR(14) NOT NULL, -- CPF do cliente (formato: 000.000.000-00)
    email VARCHAR(255) NOT NULL, -- Email do cliente
    telefone VARCHAR(20) NOT NULL, -- Telefone do cliente
    cep VARCHAR(10) NOT NULL, -- CEP (formato: 00000-000)
    rua VARCHAR(255) NOT NULL, -- Endereço - Rua
    numero VARCHAR(20) NOT NULL, -- Número da residência
    complemento VARCHAR(100), -- Complemento (opcional)
    bairro VARCHAR(100) NOT NULL, -- Bairro
    cidade VARCHAR(100) NOT NULL, -- Cidade
    estado VARCHAR(2) NOT NULL, -- Estado (sigla: SP, RJ, etc.)
    metodo_pagamento VARCHAR(50) NOT NULL, -- Método de pagamento (PIX, Cartão, etc.)
    frete DECIMAL(10,2) NOT NULL DEFAULT 0, -- Valor do frete
    total_pedido DECIMAL(10,2) NOT NULL, -- Valor total do pedido
    itens TEXT, -- Lista de itens e quantidades
    status VARCHAR(50) DEFAULT 'Pendente', -- Status do pedido
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir tipos de frete de exemplo
INSERT INTO frete (nome, SP, RJ, MG, RS, SC, PR, BA, GO, DF, ES, CE, PE, PB, RN, AL, SE, PI, MA, tocantins, PA, AP, AM, AC, RO, RR, MT, MS, seguro) VALUES 
('Sedex', 15.50, 18.90, 16.75, 22.30, 20.15, 19.80, 25.40, 17.60, 16.90, 19.20, 28.70, 26.80, 27.50, 28.90, 29.10, 27.80, 30.20, 32.50, 35.80, 38.90, 42.30, 45.60, 48.90, 41.20, 44.50, 24.80, 26.30, 2.50),
('Correios PAC', 12.80, 15.20, 13.90, 18.50, 16.80, 16.20, 21.30, 14.70, 14.10, 15.90, 24.60, 22.90, 23.40, 24.80, 25.10, 23.70, 26.20, 28.90, 31.50, 34.20, 37.80, 40.90, 43.70, 36.50, 39.80, 20.40, 21.90, 1.80)
ON CONFLICT DO NOTHING;