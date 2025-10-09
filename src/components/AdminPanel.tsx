import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, LogOut, Package, Tag, Save, X, Building2, Truck, ShoppingCart } from 'lucide-react';

interface Categoria {
  id: number;
  nome: string;
  descricao: string;
}

interface Marca {
  id: number;
  nome: string;
  logo_url?: string;
  ordem?: number;
  created_at?: string;
  updated_at?: string;
}

interface Pedido {
  id: number;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  cep: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  metodo_pagamento: string;
  frete: number;
  total_pedido: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}

interface Frete {
  id: number;
  nome: string;
  ac: number;
  al: number;
  ap: number;
  am: number;
  ba: number;
  ce: number;
  df: number;
  es: number;
  go: number;
  ma: number;
  mt: number;
  ms: number;
  mg: number;
  pa: number;
  pb: number;
  pr: number;
  pe: number;
  pi: number;
  rj: number;
  rn: number;
  rs: number;
  ro: number;
  rr: number;
  sc: number;
  sp: number;
  se: number;
  tocantins: number;
  seguro: number;
  created_at?: string;
  updated_at?: string;
}

interface Produto {
  id: number;
  nome: string;
  preco: number;
  categoria_id: number;
  categoria_nome?: string;
  marca_id?: number;
  imagem_url?: string;
}

interface AdminPanelProps {
  onLogout: () => void;
  adminUser: any;
}

export default function AdminPanel({ onLogout, adminUser }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'categorias' | 'produtos' | 'marcas' | 'fretes' | 'pedidos'>('categorias');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [fretes, setFretes] = useState<Frete[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidosError, setPedidosError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [showFreteForm, setShowFreteForm] = useState(false);
  const [showPedidoForm, setShowPedidoForm] = useState(false);
  const [draggedMarcaId, setDraggedMarcaId] = useState<number | null>(null);
  const [marcasDirty, setMarcasDirty] = useState(false);

  const token = localStorage.getItem('admin_token');

  useEffect(() => {
    loadCategorias();
    loadProdutos();
    loadMarcas();
    loadFretes();
    loadPedidos();
  }, []);

  // Recarrega pedidos sempre que a aba "Pedidos" for ativada
  useEffect(() => {
    if (activeTab === 'pedidos') {
      loadPedidos();
    }
  }, [activeTab]);

  const apiRequest = async (url: string, options: any = {}) => {
    // Base dinâmica: se VITE_API_BASE_URL não estiver setado, usa proxy no dev ("/api")
    // ou aponta diretamente para o backend em 3001 quando não estiver rodando no mesmo host.
    const defaultBase = (typeof window !== 'undefined' && window.location && window.location.port !== '3001')
      ? 'http://localhost:3001/api'
      : '/api';
    const base = import.meta.env.VITE_API_BASE_URL ?? defaultBase;
    const cleanBase = String(base).replace(/\/+$/, '');
    const path = url.startsWith('/') ? url : `/${url}`;
    const fullUrl = cleanBase.endsWith('/api') && path.startsWith('/api')
      ? `${cleanBase}${path.slice(4)}`
      : `${cleanBase}${path}`;

    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    return response.json();
  };

  const loadCategorias = async () => {
    try {
      const data = await fetch('http://localhost:3001/api/categorias').then(r => r.json());
      setCategorias(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadProdutos = async () => {
    try {
      const data = await fetch('http://localhost:3001/api/produtos').then(r => r.json());
      setProdutos(data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const loadMarcas = async () => {
    try {
      const data = await apiRequest('/api/marcas', { method: 'GET' });
      setMarcas(data);
      setMarcasDirty(false);
    } catch (error) {
      console.error('Erro ao carregar marcas:', error);
    }
  };

  const loadFretes = async () => {
    try {
      console.log('Carregando fretes...');
      const data = await apiRequest('/api/frete', { method: 'GET' });
      console.log('Fretes carregados:', data);
      setFretes(data);
    } catch (error) {
      console.error('Erro ao carregar fretes:', error);
      setFretes([]);
    }
  };

  const loadPedidos = async () => {
    try {
      console.log('[AdminPanel] Carregando pedidos...');
      setPedidosError(null);
      const data = await apiRequest('/api/pedidos', { method: 'GET' });
      console.log('[AdminPanel] Pedidos recebidos:', Array.isArray(data) ? data.length : typeof data);
      const mapped = (Array.isArray(data) ? data : []).map((p: any) => ({
        ...p,
        frete: p.frete !== undefined ? parseFloat(p.frete) : 0,
        total_pedido: p.total_pedido !== undefined ? parseFloat(p.total_pedido) : 0,
        status: (p.status || 'pendente')
      }));
      setPedidos(mapped);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      setPedidos([]);
      setPedidosError('Não foi possível carregar os pedidos. Tente novamente.');
    }
  };

  const handleSaveCategoria = async (categoria: Partial<Categoria>) => {
    setLoading(true);
    try {
      if (categoria.id) {
        await apiRequest(`/api/admin/categorias/${categoria.id}`, {
          method: 'PUT',
          body: JSON.stringify(categoria),
        });
      } else {
        await apiRequest('/api/admin/categorias', {
          method: 'POST',
          body: JSON.stringify(categoria),
        });
      }
      await loadCategorias();
      setEditingItem(null);
      setShowForm(false);
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduto = async (produto: Partial<Produto>) => {
    setLoading(true);
    try {
      if (produto.id) {
        await apiRequest(`/api/admin/produtos/${produto.id}`, {
          method: 'PUT',
          body: JSON.stringify(produto),
        });
      } else {
        await apiRequest('/api/admin/produtos', {
          method: 'POST',
          body: JSON.stringify(produto),
        });
      }
      await loadProdutos();
      setEditingItem(null);
      setShowForm(false);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategoria = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;
    
    setLoading(true);
    try {
      await apiRequest(`/api/admin/categorias/${id}`, { method: 'DELETE' });
      await loadCategorias();
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduto = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    
    setLoading(true);
    try {
      await apiRequest(`/api/admin/produtos/${id}`, { method: 'DELETE' });
      await loadProdutos();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMarca = async (marca: Partial<Marca>) => {
    setLoading(true);
    try {
      if (marca.id) {
        await apiRequest(`/api/admin/marcas/${marca.id}`, {
          method: 'PUT',
          body: JSON.stringify(marca),
        });
      } else {
        await apiRequest('/api/admin/marcas', {
          method: 'POST',
          body: JSON.stringify(marca),
        });
      }
      await loadMarcas();
      setEditingItem(null);
      setShowForm(false);
    } catch (error) {
      console.error('Erro ao salvar marca:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMarca = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta marca?')) return;
    
    setLoading(true);
    try {
      await apiRequest(`/api/admin/marcas/${id}`, { method: 'DELETE' });
      await loadMarcas();
    } catch (error) {
      console.error('Erro ao excluir marca:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFrete = async (frete: Partial<Frete>) => {
    setLoading(true);
    try {
      if (frete.id) {
        await apiRequest(`/api/admin/fretes/${frete.id}`, {
          method: 'PUT',
          body: JSON.stringify(frete),
        });
      } else {
        await apiRequest('/api/admin/fretes', {
          method: 'POST',
          body: JSON.stringify(frete),
        });
      }
      await loadFretes();
      setEditingItem(null);
      setShowForm(false);
    } catch (error) {
      console.error('Erro ao salvar frete:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFrete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este frete?')) return;
    
    setLoading(true);
    try {
      await apiRequest(`/api/admin/fretes/${id}`, { method: 'DELETE' });
      await loadFretes();
    } catch (error) {
      console.error('Erro ao excluir frete:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePedido = async (pedido: Partial<Pedido>) => {
    setLoading(true);
    try {
      if (pedido.id) {
        await apiRequest(`/api/admin/pedidos/${pedido.id}`, {
          method: 'PUT',
          body: JSON.stringify(pedido)
        });
      } else {
        await apiRequest('/api/admin/pedidos', {
          method: 'POST',
          body: JSON.stringify(pedido)
        });
      }
      await loadPedidos();
      setShowPedidoForm(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePedido = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este pedido?')) return;
    
    setLoading(true);
    try {
      await apiRequest(`/api/admin/pedidos/${id}`, { method: 'DELETE' });
      await loadPedidos();
    } catch (error) {
      console.error('Erro ao excluir pedido:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatusPedido = async (id: number, status: string) => {
    setLoading(true);
    try {
      await apiRequest(`/api/admin/pedidos/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      await loadPedidos();
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error);
    } finally {
      setLoading(false);
    }
  };

  const CategoriaForm = ({ categoria, onSave, onCancel }: any) => {
    const [nome, setNome] = useState(categoria?.nome || '');
    const [descricao, setDescricao] = useState(categoria?.descricao || '');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({ ...categoria, nome, descricao });
    };

    return (
      <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
        </div>
      </form>
    );
  };

  const PedidoForm = ({ pedido, onSave, onCancel }: any) => {
    const [nome, setNome] = useState(pedido?.nome || '');
    const [cpf, setCpf] = useState(pedido?.cpf || '');
    const [email, setEmail] = useState(pedido?.email || '');
    const [telefone, setTelefone] = useState(pedido?.telefone || '');
    const [cep, setCep] = useState(pedido?.cep || '');
    const [rua, setRua] = useState(pedido?.rua || '');
    const [numero, setNumero] = useState(pedido?.numero || '');
    const [complemento, setComplemento] = useState(pedido?.complemento || '');
    const [bairro, setBairro] = useState(pedido?.bairro || '');
    const [cidade, setCidade] = useState(pedido?.cidade || '');
    const [estado, setEstado] = useState(pedido?.estado || '');
    const [metodo_pagamento, setMetodoPagamento] = useState(pedido?.metodo_pagamento || '');
    const [frete, setFrete] = useState(pedido?.frete || '');
    const [total_pedido, setTotalPedido] = useState(pedido?.total_pedido || '');
    const [status, setStatus] = useState(pedido?.status || 'pendente');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({ 
        ...pedido, 
        nome, 
        cpf, 
        email, 
        telefone, 
        cep, 
        rua, 
        numero, 
        complemento, 
        bairro, 
        cidade, 
        estado, 
        metodo_pagamento, 
        frete: parseFloat(frete) || 0, 
        total_pedido: parseFloat(total_pedido) || 0,
        status
      });
    };

    return (
      <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
            <input
              type="text"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input
              type="text"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
            <input
              type="text"
              value={cep}
              onChange={(e) => setCep(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rua</label>
            <input
              type="text"
              value={rua}
              onChange={(e) => setRua(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
            <input
              type="text"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
            <input
              type="text"
              value={complemento}
              onChange={(e) => setComplemento(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
            <input
              type="text"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
            <input
              type="text"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <input
              type="text"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pagamento</label>
            <select
              value={metodo_pagamento}
              onChange={(e) => setMetodoPagamento(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecione...</option>
              <option value="cartao_credito">Cartão de Crédito</option>
              <option value="cartao_debito">Cartão de Débito</option>
              <option value="pix">PIX</option>
              <option value="boleto">Boleto</option>
              <option value="dinheiro">Dinheiro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frete (R$)</label>
            <input
              type="number"
              step="0.01"
              value={frete}
              onChange={(e) => setFrete(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total do Pedido (R$)</label>
            <input
              type="number"
              step="0.01"
              value={total_pedido}
              onChange={(e) => setTotalPedido(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="pendente">Pendente</option>
              <option value="confirmado">Confirmado</option>
              <option value="enviado">Enviado</option>
              <option value="entregue">Entregue</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
        </div>
      </form>
    );
  };

  const FreteForm = ({ frete, onSave, onCancel }: any) => {
    const [nome, setNome] = useState(frete?.nome || '');
    const [valorPadrao, setValorPadrao] = useState(frete?.sp || '');
    const [seguro, setSeguro] = useState(frete?.seguro || '');
    const [personalizarEstados, setPersonalizarEstados] = useState(false);
    
    const estados = [
      { sigla: 'ac', nome: 'Acre' },
      { sigla: 'al', nome: 'Alagoas' },
      { sigla: 'ap', nome: 'Amapá' },
      { sigla: 'am', nome: 'Amazonas' },
      { sigla: 'ba', nome: 'Bahia' },
      { sigla: 'ce', nome: 'Ceará' },
      { sigla: 'df', nome: 'Distrito Federal' },
      { sigla: 'es', nome: 'Espírito Santo' },
      { sigla: 'go', nome: 'Goiás' },
      { sigla: 'ma', nome: 'Maranhão' },
      { sigla: 'mt', nome: 'Mato Grosso' },
      { sigla: 'ms', nome: 'Mato Grosso do Sul' },
      { sigla: 'mg', nome: 'Minas Gerais' },
      { sigla: 'pa', nome: 'Pará' },
      { sigla: 'pb', nome: 'Paraíba' },
      { sigla: 'pr', nome: 'Paraná' },
      { sigla: 'pe', nome: 'Pernambuco' },
      { sigla: 'pi', nome: 'Piauí' },
      { sigla: 'rj', nome: 'Rio de Janeiro' },
      { sigla: 'rn', nome: 'Rio Grande do Norte' },
      { sigla: 'rs', nome: 'Rio Grande do Sul' },
      { sigla: 'ro', nome: 'Rondônia' },
      { sigla: 'rr', nome: 'Roraima' },
      { sigla: 'sc', nome: 'Santa Catarina' },
      { sigla: 'sp', nome: 'São Paulo' },
      { sigla: 'se', nome: 'Sergipe' },
      { sigla: 'tocantins', nome: 'Tocantins' }
    ];

    const [valoresEstados, setValoresEstados] = useState(() => {
      const valores: any = {};
      estados.forEach(estado => {
        valores[estado.sigla] = frete?.[estado.sigla] || '';
      });
      return valores;
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      let freteData: any = {
        ...frete,
        nome,
        seguro: parseFloat(seguro) || 0
      };

      if (personalizarEstados) {
        // Usar valores personalizados para cada estado
        estados.forEach(estado => {
          freteData[estado.sigla] = parseFloat(valoresEstados[estado.sigla]) || 0;
        });
      } else {
        // Usar valor padrão para todos os estados
        const valor = parseFloat(valorPadrao) || 0;
        estados.forEach(estado => {
          freteData[estado.sigla] = valor;
        });
      }

      onSave(freteData);
    };

    const handleValorPadraoChange = (valor: string) => {
      setValorPadrao(valor);
      if (!personalizarEstados) {
        // Atualizar todos os estados com o valor padrão
        const novosValores: any = {};
        estados.forEach(estado => {
          novosValores[estado.sigla] = valor;
        });
        setValoresEstados(novosValores);
      }
    };

    const handlePersonalizarChange = (checked: boolean) => {
      setPersonalizarEstados(checked);
      if (!checked && valorPadrao) {
        // Se desmarcar personalização, aplicar valor padrão a todos os estados
        const novosValores: any = {};
        estados.forEach(estado => {
          novosValores[estado.sigla] = valorPadrao;
        });
        setValoresEstados(novosValores);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Frete</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              placeholder="Ex: Sedex, PAC, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor Padrão (R$)</label>
            <input
              type="number"
              step="0.01"
              value={valorPadrao}
              onChange={(e) => handleValorPadraoChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seguro (%)</label>
            <input
              type="number"
              step="0.01"
              value={seguro}
              onChange={(e) => setSeguro(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={personalizarEstados}
              onChange={(e) => handlePersonalizarChange(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Personalizar valor por estado</span>
          </label>
        </div>

        {personalizarEstados && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Valores por Estado</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {estados.map(estado => (
                <div key={estado.sigla}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {estado.nome} ({estado.sigla.toUpperCase()})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={valoresEstados[estado.sigla]}
                    onChange={(e) => setValoresEstados((prev: Record<string, string>) => ({
                      ...prev,
                      [estado.sigla]: e.target.value
                    }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
        </div>
      </form>
    );
  };

  const ProdutoForm = ({ produto, onSave, onCancel }: any) => {
    const [nome, setNome] = useState(produto?.nome || '');
    const [preco, setPreco] = useState(produto?.preco || '');
    const [categoria_id, setCategoriaId] = useState(produto?.categoria_id || '');
    const [marca_id, setMarcaId] = useState(produto?.marca_id || '');
    const [imagemFile, setImagemFile] = useState<File | null>(null);
    const [imagemPreview, setImagemPreview] = useState(produto?.imagem_url || '');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setImagemFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagemPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      let imagem_url = produto?.imagem_url || '';
      
      // Se há uma nova imagem, fazer upload
      if (imagemFile) {
        const formData = new FormData();
        formData.append('imagem', imagemFile);
        
        try {
      const response = await fetch('/api/admin/upload-produto', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          });
          
          if (response.ok) {
            const result = await response.json();
            imagem_url = result.imagem_url;
          }
        } catch (error) {
          console.error('Erro ao fazer upload da imagem:', error);
        }
      }
      
      onSave({ 
        ...produto, 
        nome, 
        preco: parseFloat(preco), 
        categoria_id: categoria_id ? parseInt(categoria_id) : null,
        marca_id: marca_id ? parseInt(marca_id) : null,
        imagem_url 
      });
      
      console.log('Dados enviados:', { 
        nome, 
        preco: parseFloat(preco), 
        categoria_id: categoria_id ? parseInt(categoria_id) : null,
        marca_id: marca_id ? parseInt(marca_id) : null,
        imagem_url 
      });
    };

    return (
      <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço</label>
            <input
              type="number"
              step="0.01"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select
              value={categoria_id}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Selecione uma categoria</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
            <select
              value={marca_id}
              onChange={(e) => setMarcaId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione uma marca (opcional)</option>
              {marcas.map((marca) => (
                <option key={marca.id} value={marca.id}>
                  {marca.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Imagem do Produto</label>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {imagemPreview && (
              <div className="flex-shrink-0">
                <img
                  src={imagemPreview}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded-md border"
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
        </div>
      </form>
    );
  };

  const MarcaForm = ({ marca, onSave, onCancel }: any) => {
    const [nome, setNome] = useState(marca?.nome || '');
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState(marca?.logo_url || '');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setLogoFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setLogoPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      let logoUrl = marca?.logo_url || '';
      
      // Se há um novo arquivo, fazer upload
      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);
        
        try {
          const token = localStorage.getItem('admin_token');
          const response = await fetch('/api/admin/upload-logo', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          });
          
          if (response.ok) {
            const result = await response.json();
            logoUrl = result.logo_url;
          } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro no upload da imagem');
          }
        } catch (error) {
          console.error('Erro ao fazer upload:', error);
          const message = error instanceof Error ? error.message : 'Erro desconhecido';
          alert(`Erro ao fazer upload: ${message}`);
          return;
        }
      }
      
      onSave({ ...marca, nome, logo_url: logoUrl });
    };

    return (
      <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Marca</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo da Marca</label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {logoPreview && (
                <img
                  src={logoPreview}
                  alt="Preview"
                  className="w-16 h-8 object-contain border rounded"
                />
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Olá, {adminUser?.usuario}</span>
              <button
                onClick={onLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('categorias')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'categorias'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex items-center gap-2`}
              >
                <Tag className="w-4 h-4" />
                Categorias
              </button>
              <button
                onClick={() => setActiveTab('produtos')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'produtos'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex items-center gap-2`}
              >
                <Package className="w-4 h-4" />
                Produtos
              </button>
              <button
                onClick={() => setActiveTab('marcas')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'marcas'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex items-center gap-2`}
              >
                <Building2 className="w-4 h-4" />
                Marcas
              </button>
              <button
                onClick={() => setActiveTab('fretes')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'fretes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex items-center gap-2`}
              >
                <Truck className="w-4 h-4" />
                Fretes
              </button>
              <button
                onClick={() => { setActiveTab('pedidos'); loadPedidos(); }}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'pedidos'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex items-center gap-2`}
              >
                <ShoppingCart className="w-4 h-4" />
                Pedidos
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Categorias Tab */}
            {activeTab === 'categorias' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Gerenciar Categorias</h2>
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      setShowForm(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Nova Categoria
                  </button>
                </div>

                {showForm && activeTab === 'categorias' && (
                  <CategoriaForm
                    categoria={editingItem}
                    onSave={handleSaveCategoria}
                    onCancel={() => {
                      setShowForm(false);
                      setEditingItem(null);
                    }}
                  />
                )}

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nome
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descrição
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {categorias.map((categoria) => (
                        <tr key={categoria.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {categoria.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {categoria.nome}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {categoria.descricao}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingItem(categoria);
                                  setShowForm(true);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategoria(categoria.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Produtos Tab */}
            {activeTab === 'produtos' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Gerenciar Produtos</h2>
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      setShowForm(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Novo Produto
                  </button>
                </div>

                {showForm && activeTab === 'produtos' && (
                  <ProdutoForm
                    produto={editingItem}
                    onSave={handleSaveProduto}
                    onCancel={() => {
                      setShowForm(false);
                      setEditingItem(null);
                    }}
                  />
                )}

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nome
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Preço
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Categoria
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {produtos.map((produto) => (
                        <tr key={produto.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {produto.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {produto.nome}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            R$ {produto.preco.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {produto.categoria_nome || `ID: ${produto.categoria_id}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingItem(produto);
                                  setShowForm(true);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduto(produto.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Marcas Tab */}
            {activeTab === 'marcas' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Gerenciar Marcas</h2>
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      setShowForm(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Nova Marca
                  </button>
                </div>

                {showForm && activeTab === 'marcas' && (
                  <MarcaForm
                    marca={editingItem}
                    onSave={handleSaveMarca}
                    onCancel={() => {
                      setShowForm(false);
                      setEditingItem(null);
                    }}
                  />
                )}

                <div className="overflow-x-auto">
                  <div className="flex justify-end mb-2">
                    <button
                      disabled={!marcasDirty || loading}
                      onClick={async () => {
                        try {
                          setLoading(true);
                          const order = marcas.map(m => m.id);
                          await apiRequest('/api/admin/marcas/reorder', {
                            method: 'POST',
                            body: JSON.stringify({ order }),
                          });
                          await loadMarcas();
                        } catch (error) {
                          console.error('Erro ao salvar ordem de marcas:', error);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className={`px-3 py-2 rounded-md text-white ${marcasDirty ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
                    >
                      Salvar ordem
                    </button>
                  </div>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nome
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Logo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {marcas.map((marca, index) => (
                        <tr
                          key={marca.id}
                          draggable
                          onDragStart={() => setDraggedMarcaId(marca.id)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => {
                            if (draggedMarcaId === null || draggedMarcaId === marca.id) return;
                            const draggedIndex = marcas.findIndex(m => m.id === draggedMarcaId);
                            if (draggedIndex === -1) return;
                            const updated = [...marcas];
                            const [moved] = updated.splice(draggedIndex, 1);
                            updated.splice(index, 0, moved);
                            setMarcas(updated);
                            setMarcasDirty(true);
                          }}
                          className="hover:bg-gray-50 cursor-move"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {marca.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {marca.nome}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {marca.logo_url && (
                              <img
                                src={marca.logo_url}
                                alt={marca.nome}
                                className="w-16 h-8 object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingItem(marca);
                                  setShowForm(true);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteMarca(marca.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Fretes Tab */}
            {activeTab === 'fretes' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Gerenciar Fretes</h2>
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      setShowFreteForm(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Novo Frete
                  </button>
                </div>

                {showFreteForm && (
                  <FreteForm
                    frete={editingItem}
                    onSave={handleSaveFrete}
                    onCancel={() => {
                      setShowFreteForm(false);
                      setEditingItem(null);
                    }}
                  />
                )}

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nome
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Seguro (%)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor Padrão (SP)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {fretes && fretes.length > 0 ? (
                        fretes.map((frete) => (
                          <tr key={frete.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {frete.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {frete.nome}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {frete.seguro}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              R$ {Number((frete as any).sp ?? 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setEditingItem(frete);
                                    setShowFreteForm(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteFrete(frete.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                            Nenhum frete encontrado
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pedidos Tab */}
            {activeTab === 'pedidos' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Gerenciar Pedidos</h2>
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      setShowPedidoForm(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Novo Pedido
                  </button>
                </div>

                {showPedidoForm && activeTab === 'pedidos' && (
                  <PedidoForm
                    pedido={editingItem}
                    onSave={handleSavePedido}
                    onCancel={() => {
                      setShowPedidoForm(false);
                      setEditingItem(null);
                    }}
                  />
                )}

                <div className="overflow-x-auto">
                  {pedidosError && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
                      {pedidosError}
                    </div>
                  )}
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-sm text-gray-600">Pedidos carregados: {pedidos.length}</div>
                    <button
                      onClick={loadPedidos}
                      className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                    >
                      Recarregar
                    </button>
                  </div>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Telefone
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cidade/Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pagamento
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pedidos && pedidos.length > 0 ? (
                        pedidos.map((pedido) => (
                          <tr key={pedido.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {pedido.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {pedido.nome}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {pedido.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {pedido.telefone}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {pedido.cidade}/{pedido.estado}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {pedido.metodo_pagamento}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              R$ {Number(pedido.total_pedido ?? 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <select
                                value={(pedido.status || 'pendente').toLowerCase()}
                                onChange={(e) => handleUpdateStatusPedido(pedido.id, e.target.value)}
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  ((pedido.status || '').toLowerCase()) === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                                  ((pedido.status || '').toLowerCase()) === 'confirmado' ? 'bg-blue-100 text-blue-800' :
                                  ((pedido.status || '').toLowerCase()) === 'enviado' ? 'bg-purple-100 text-purple-800' :
                                  ((pedido.status || '').toLowerCase()) === 'entregue' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }`}
                              >
                                <option value="pendente">Pendente</option>
                                <option value="confirmado">Confirmado</option>
                                <option value="enviado">Enviado</option>
                                <option value="entregue">Entregue</option>
                                <option value="cancelado">Cancelado</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {pedido.created_at ? new Date(pedido.created_at).toLocaleDateString('pt-BR') : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => {
                                  setEditingItem(pedido);
                                  setShowPedidoForm(true);
                                }}
                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePedido(pedido.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={10} className="px-6 py-4 text-center text-gray-500">
                            Nenhum pedido encontrado
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}