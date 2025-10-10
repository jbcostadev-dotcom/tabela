import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Pill, Syringe, X, Plus, Minus, MessageCircle } from 'lucide-react';
import { getCategorias, getProdutos, getMarcas, type Categoria, type Produto, type Marca } from '../lib/api';
import Checkout from './Checkout';

// Tipo para item do carrinho
interface CarrinhoItem {
  produto: Produto;
  quantidade: number;
}

// Tipo para dados salvos no localStorage
interface CarrinhoSalvo {
  itens: CarrinhoItem[];
  timestamp: number;
}

export default function PricingTable() {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [activeBrand, setActiveBrand] = useState<number | null>(null);
  
  // Estados do carrinho
  const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [checkoutAberto, setCheckoutAberto] = useState(false);
  const [suporteAberto, setSuporteAberto] = useState(false);

  // Função para carregar carrinho do localStorage
  const carregarCarrinhoSalvo = () => {
    try {
      const carrinhoSalvo = localStorage.getItem('lockpharma_carrinho');
      if (carrinhoSalvo) {
        const dados: CarrinhoSalvo = JSON.parse(carrinhoSalvo);
        const agora = Date.now();
        const tempoExpiracao = 24 * 60 * 60 * 1000; // 24 horas em millisegundos
        
        // Verificar se o carrinho não expirou
        if (agora - dados.timestamp < tempoExpiracao) {
          setCarrinho(dados.itens);
          console.log('Carrinho restaurado do cache');
        } else {
          // Carrinho expirado, remover do localStorage
          localStorage.removeItem('lockpharma_carrinho');
          console.log('Carrinho expirado, cache limpo');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar carrinho salvo:', error);
      localStorage.removeItem('lockpharma_carrinho');
    }
  };

  // Função para salvar carrinho no localStorage
  const salvarCarrinho = (novoCarrinho: CarrinhoItem[]) => {
    try {
      const dadosParaSalvar: CarrinhoSalvo = {
        itens: novoCarrinho,
        timestamp: Date.now()
      };
      localStorage.setItem('lockpharma_carrinho', JSON.stringify(dadosParaSalvar));
    } catch (error) {
      console.error('Erro ao salvar carrinho:', error);
    }
  };

  useEffect(() => {
    loadData();
    carregarCarrinhoSalvo();
  }, []);

  // Salvar carrinho sempre que ele mudar
  useEffect(() => {
    if (carrinho.length > 0) {
      salvarCarrinho(carrinho);
    } else {
      // Se carrinho estiver vazio, remover do localStorage
      localStorage.removeItem('lockpharma_carrinho');
    }
  }, [carrinho]);

  const loadData = async () => {
    try {
      const [produtosData, categoriasData, marcasData] = await Promise.all([
        getProdutos(),
        getCategorias(),
        getMarcas()
      ]);
      
      setProdutos(produtosData);
      setCategorias(categoriasData);
      setMarcas(marcasData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = produtos.filter(produto => {
    const categoryMatch = activeCategory === null ? true : produto.id_categoria === activeCategory;
    const brandMatch = activeBrand === null ? true : produto.marca_id === activeBrand;
    return categoryMatch && brandMatch;
  });

  // Agrupar produtos por marca
  const groupedByBrand = filteredProducts.reduce((groups: any, produto) => {
    const brandId = produto.marca_id || 'sem-marca';
    if (!groups[brandId]) {
      groups[brandId] = {
        marca: produto.marca,
        produtos: []
      };
    }
    groups[brandId].produtos.push(produto);
    return groups;
  }, {});

  // Ordenar grupos por ID da marca
  const sortedBrandGroups = Object.entries(groupedByBrand).sort(([a], [b]) => {
    if (a === 'sem-marca') return 1;
    if (b === 'sem-marca') return -1;
    return parseInt(a) - parseInt(b);
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  // Funções do carrinho
  const adicionarAoCarrinho = (produto: Produto) => {
    setCarrinho(prev => {
      const itemExistente = prev.find(item => item.produto.id === produto.id);
      if (itemExistente) {
        return prev.map(item =>
          item.produto.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      }
      return [...prev, { produto, quantidade: 1 }];
    });
    setCarrinhoAberto(true);
  };

  const removerDoCarrinho = (produtoId: number) => {
    setCarrinho(prev => prev.filter(item => item.produto.id !== produtoId));
  };

  const alterarQuantidade = (produtoId: number, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      removerDoCarrinho(produtoId);
      return;
    }
    setCarrinho(prev =>
      prev.map(item =>
        item.produto.id === produtoId
          ? { ...item, quantidade: novaQuantidade }
          : item
      )
    );
  };

  const limparCarrinho = () => {
    setCarrinho([]);
    setCarrinhoAberto(false);
  };

  // Funções do checkout
  const abrirCheckout = () => {
    setCheckoutAberto(true);
    setCarrinhoAberto(false);
  };

  const voltarDoCheckout = () => {
    setCheckoutAberto(false);
    setCarrinhoAberto(true);
  };

  const finalizarPedido = async (dadosPedido: any) => {
    try {
    const response = await fetch('/api/pedidos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosPedido),
      });

      if (response.ok) {
        const pedidoCriado = await response.json();
        setCarrinho([]);
        setCheckoutAberto(false);
        const pedidoId = pedidoCriado?.id ?? '';
        navigate(`/confirmacao${pedidoId ? `?id=${pedidoId}` : ''}`);
      } else {
        throw new Error('Erro ao criar pedido');
      }
    } catch (error) {
      console.error('Erro ao finalizar pedido:', error);
      throw error;
    }
  };

  const totalCarrinho = carrinho.reduce((total, item) => {
    return total + (item.produto.preco * item.quantidade);
  }, 0);

  const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);

  const handleWhatsAppClick = () => {
    setSuporteAberto(true);
  };

  const openWhatsApp = () => {
    const phoneNumber = '5511993929062';
    const message = 'Olá! Preciso de suporte da Lock Pharma.';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const openTelegram = () => {
    const telegramUrl = 'https://t.me/lockpharma';
    window.open(telegramUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-amber-400 text-xl">Carregando produtos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Componente Checkout */}
      {checkoutAberto ? (
        <Checkout
          carrinho={carrinho}
          totalCarrinho={totalCarrinho}
          onVoltar={voltarDoCheckout}
          onFinalizarPedido={finalizarPedido}
        />
      ) : (
        <>
          {/* Header */}
          <header className="border-b border-amber-400/20 bg-black/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="/logos/lockpharma.png" 
                alt="Lock Pharma Logo" 
                className="h-20 md:h-24 w-auto"
              />
            </div>
            <button 
              onClick={() => setCarrinhoAberto(true)}
              className="bg-amber-400 hover:bg-amber-500 text-black px-6 py-3 rounded-full flex items-center gap-2 transition-all transform hover:scale-105 relative"
            >
              <ShoppingCart size={20} />
              <span className="font-semibold">Carrinho</span>
              {totalItens > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                  {totalItens}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Information Cards Section */}
      <div className="bg-zinc-900 border-b border-amber-400/20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1 */}
            <div className="bg-zinc-800 rounded-lg p-6 border border-amber-400/20 hover:border-amber-400/40 transition-all">
              <div className="text-center">
                <div className="w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Syringe className="w-6 h-6 text-black" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Envio Seguro</h3>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  Nosso envio é totalmente discreto, com a opção de seguro onde reenviamos seu pedido em caso de apreensão/extravio.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-zinc-800 rounded-lg p-6 border border-amber-400/20 hover:border-amber-400/40 transition-all">
              <div className="text-center">
                <div className="w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="w-6 h-6 text-black" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Suporte</h3>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  Tiramos todas suas dúvidas e ajudamos a montar seu ciclo, clique no botão de atendimento no canto direito da tela.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Brand Filter */}
      <div className="bg-zinc-950 border-b border-amber-400/20 py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">
            Filtrar por Marca
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-3 gap-4 md:gap-6 mb-0 md:mb-6 justify-items-center">
            <button
              onClick={() => setActiveBrand(null)}
              className={`w-24 h-16 md:w-62.5 md:h-19 rounded-full md:rounded-lg text-sm md:text-base font-semibold transition-all flex items-center justify-center ${
                activeBrand === null
                  ? 'bg-amber-400 text-black'
                  : 'bg-zinc-800 text-white hover:bg-zinc-700'
              }`}
            >
              Todas
            </button>
            {marcas.map((marca) => (
              <button
              key={marca.id}
              onClick={() => setActiveBrand(activeBrand === marca.id ? null : marca.id)}
              className={`relative overflow-hidden w-24 h-16 md:w-62.5 md:h-19 rounded-full md:rounded-lg text-sm md:text-base font-semibold transition-all flex items-center justify-center ${
                activeBrand === marca.id
                  ? 'bg-amber-400 text-black'
                  : 'bg-zinc-800 text-white hover:bg-zinc-700'
              }`}
              title={marca.nome}
            >
                {marca.logo_url ? (
                  <img
                    src={marca.logo_url}
                    alt={`Logo ${marca.nome}`}
                    className="absolute inset-0 w-full h-full object-cover rounded-full md:rounded-lg"
                    onError={(e) => {
                      // Se a logo falhar, mostrar o nome da marca
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) parent.innerHTML = marca.nome;
                    }}
                  />
                ) : (
                  marca.nome
                )}
              </button>
            ))}
          </div>
          {activeBrand && (
            <div className="text-center">
              <button
                onClick={() => setActiveBrand(null)}
                className="text-amber-400 hover:text-amber-300 text-sm md:text-base underline transition-colors"
              >
                Limpar filtro de marca
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-zinc-900 border-b border-amber-400/20">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-3 gap-3 md:flex md:flex-row md:flex-wrap md:gap-4 md:justify-center">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3 md:px-6 py-3 rounded-full text-sm md:text-base font-semibold transition-all ${
                activeCategory === null
                  ? 'bg-amber-400 text-black'
                  : 'bg-zinc-800 text-white hover:bg-zinc-700'
              }`}
            >
              Todos
            </button>
            {categorias.map((categoria) => (
              <button
                key={categoria.id}
                onClick={() => setActiveCategory(categoria.id)}
                className={`px-3 md:px-6 py-3 rounded-full text-sm md:text-base font-semibold transition-all flex items-center justify-center gap-1 md:gap-2 ${
                  activeCategory === categoria.id
                    ? 'bg-amber-400 text-black'
                    : 'bg-zinc-800 text-white hover:bg-zinc-700'
                }`}
              >
                {categoria.nome === 'Injetáveis' ? (
                  <Syringe className="w-4 h-4 md:w-[18px] md:h-[18px]" />
                ) : categoria.nome === 'Oral' ? (
                  <Pill className="w-4 h-4 md:w-[18px] md:h-[18px]" />
                ) : categoria.imagem_url ? (
                  <img 
                    src={categoria.imagem_url} 
                    alt={categoria.nome}
                    className="w-4 h-4 md:w-[18px] md:h-[18px]"
                  />
                ) : null}
                <span className="hidden xs:inline">{categoria.nome}</span>
                <span className="xs:hidden">{categoria.nome.substring(0, 5)}.</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-12">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-400 text-lg">Nenhum produto encontrado nesta categoria.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {sortedBrandGroups.map(([brandId, group]: [string, any]) => (
              <div key={brandId} className="space-y-6">
                {/* Brand Header */}
                {group.marca && (
                  <div className="text-center py-8 border-b border-amber-400/20">
                    <div className="flex flex-col items-center gap-4">
                      <h2 className="text-2xl md:text-3xl font-bold text-amber-400 uppercase tracking-wider">
                        {group.marca.nome}
                      </h2>
                    </div>
                  </div>
                )}
                
                {/* Products Grid for this brand */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
                  {group.produtos.map((produto: any) => (
              <div
                key={produto.id}
                className="bg-zinc-900 border border-amber-400/20 rounded-3xl overflow-hidden hover:border-amber-400/50 transition-all hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-amber-400/10"
              >
                {/* Product Image */}
                <div className="bg-white p-4 md:p-8 flex items-center justify-center aspect-square">
                  {produto.imagem_url ? (
                    <img
                      src={produto.imagem_url}
                      alt={produto.nome}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-amber-400/60">
                      <Pill className="w-12 h-12 md:w-16 md:h-16" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-3 md:p-6">
                  <div className="mb-1 md:mb-2 flex items-center justify-between">
                    <div>
                      <span className="text-amber-400 text-[10px] md:text-xs font-semibold uppercase tracking-wider">
                        {produto.categoria?.nome || 'Categoria'}
                      </span>
                      {produto.marca && (
                        <span className="ml-2 text-zinc-400 text-[10px] md:text-xs font-semibold uppercase tracking-wider">
                          • {produto.marca.nome}
                        </span>
                      )}
                    </div>
                  </div>
                  <h3 className="text-sm md:text-xl font-bold text-white mb-2 md:mb-3 line-clamp-2">{produto.nome}</h3>

                  {/* Price */}
                  <div className="mb-3 md:mb-4">
                    <div className="text-lg md:text-2xl font-bold text-amber-400">
                      {formatPrice(produto.preco)}
                    </div>
                  </div>

                  <button
                    onClick={() => produto.estoque > 0 && adicionarAoCarrinho(produto)}
                    disabled={produto.estoque === 0}
                    className={`w-full py-2 md:py-3 rounded-full text-xs md:text-base font-semibold transition-all flex items-center justify-center gap-1 md:gap-2 ${
                      produto.estoque > 0
                        ? 'bg-amber-400 hover:bg-amber-500 text-black hover:shadow-lg hover:shadow-amber-400/30'
                        : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="hidden sm:inline">{produto.estoque > 0 ? 'Adicionar ao Carrinho' : 'Indisponível'}</span>
                    <span className="sm:hidden">{produto.estoque > 0 ? 'Adicionar' : 'Indisponível'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )}
</div>

      {/* Footer */}
      <footer className="border-t border-amber-400/20 bg-zinc-900 mt-20">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-zinc-400 text-sm">
            Lock Pharma® - High Quality Products
          </p>
        </div>
      </footer>

      {/* Carrinho Suspenso */}
      {carrinhoAberto && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setCarrinhoAberto(false)}
          />
          
          {/* Carrinho Panel */}
          <div className="absolute right-0 top-0 h-full w-full md:max-w-md max-w-[50%] bg-zinc-900 shadow-2xl transform transition-transform duration-300 ease-in-out">
            {/* Header do Carrinho */}
            <div className="flex items-center justify-between p-6 border-b border-amber-400/20">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShoppingCart size={24} />
                Carrinho ({totalItens})
              </h2>
              <button
                onClick={() => setCarrinhoAberto(false)}
                className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
              >
                <X size={20} className="text-zinc-400" />
              </button>
            </div>

            {/* Conteúdo do Carrinho */}
            <div className="flex-1 overflow-y-auto p-6">
              {carrinho.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart size={48} className="mx-auto text-zinc-600 mb-4" />
                  <p className="text-zinc-400">Seu carrinho está vazio</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {carrinho.map((item) => (
                    <div key={item.produto.id} className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                      <div className="flex items-start gap-3">
                        {/* Imagem do produto */}
                        <div className="w-16 h-16 bg-white rounded-lg flex-shrink-0 overflow-hidden">
                          {item.produto.imagem_url ? (
                            <img
                              src={item.produto.imagem_url}
                              alt={item.produto.nome}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Pill className="w-8 h-8 text-zinc-400" />
                            </div>
                          )}
                        </div>

                        {/* Informações do produto */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-sm line-clamp-2 mb-1">
                            {item.produto.nome}
                          </h3>
                          <p className="text-amber-400 font-bold text-sm">
                            {formatPrice(item.produto.preco)}
                          </p>
                          
                          {/* Controles de quantidade */}
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => alterarQuantidade(item.produto.id, item.quantidade - 1)}
                              className="w-8 h-8 bg-zinc-700 hover:bg-zinc-600 rounded-full flex items-center justify-center transition-colors"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center font-semibold">
                              {item.quantidade}
                            </span>
                            <button
                              onClick={() => alterarQuantidade(item.produto.id, item.quantidade + 1)}
                              className="w-8 h-8 bg-zinc-700 hover:bg-zinc-600 rounded-full flex items-center justify-center transition-colors"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Botão remover */}
                        <button
                          onClick={() => removerDoCarrinho(item.produto.id)}
                          className="p-1 hover:bg-zinc-700 rounded transition-colors"
                        >
                          <X size={16} className="text-zinc-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer do Carrinho */}
            {carrinho.length > 0 && (
              <div className="border-t border-amber-400/20 p-6 bg-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-xl font-bold text-amber-400">
                    {formatPrice(totalCarrinho)}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <button 
                    onClick={abrirCheckout}
                    className="w-full bg-amber-400 hover:bg-amber-500 text-black font-semibold py-3 rounded-lg transition-colors"
                  >
                    Finalizar Pedido
                  </button>
                  <button
                    onClick={limparCarrinho}
                    className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    Limpar Carrinho
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
        </>
      )}

      {/* Botão flutuante de Suporte - escondido quando checkout aberto */}
      {!checkoutAberto && (
        <>
          <button
            onClick={handleWhatsAppClick}
            className="fixed bottom-6 right-6 bg-amber-400 hover:bg-amber-500 text-black p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-40"
            aria-label="Suporte"
            title="Suporte"
          >
            <MessageCircle className="w-6 h-6" />
          </button>

          {suporteAberto && (
            <div className="fixed inset-0 z-50">
              {/* Overlay */}
              <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setSuporteAberto(false)}
              />

              {/* Card de Suporte */}
              <div className="absolute bottom-6 right-6 w-[92%] max-w-sm bg-zinc-900 border border-amber-400/30 rounded-2xl shadow-2xl">
                <div className="flex items-center justify-between p-4 border-b border-amber-400/20">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-amber-400" />
                    <span className="text-white font-semibold">Atendimento</span>
                  </div>
                  <button
                    className="p-2 rounded hover:bg-zinc-800 text-zinc-400"
                    onClick={() => setSuporteAberto(false)}
                    aria-label="Fechar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-zinc-300 text-sm">
                    Escolha por onde deseja ser atendido:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={openWhatsApp}
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-all"
                    >
                      WhatsApp
                    </button>
                    <button
                      onClick={openTelegram}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-all"
                    >
                      Telegram
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
