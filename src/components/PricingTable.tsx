import { useEffect, useState } from 'react';
import { ShoppingCart, Pill, Syringe } from 'lucide-react';
import { supabase, type Product } from '../lib/supabase';

type Brand = {
  id: string;
  name: string;
  logo?: string;
};

const brands: Brand[] = [
  { id: 'landerlan', name: 'LANDERLAN' },
  { id: 'king-pharma', name: 'KING PHARMA' },
  { id: 'gold-labs', name: 'GOLD LABS' },
  { id: 'dragon-pharma', name: 'DRAGON PHARMA' },
  { id: 'innovagen', name: 'INNOVAGEN' },
  { id: 'sp-labs', name: 'SP LABS' },
  { id: 'balkan', name: 'BALKAN' },
  { id: 'alpha-pharma', name: 'ALPHA PHARMA' },
];

export default function PricingTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'injectable' | 'oral' | 'all'>('all');
  const [activeBrand, setActiveBrand] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const categoryMatch = activeCategory === 'all' ? true : product.category === activeCategory;
    const brandMatch = activeBrand === null ? true : product.brand.toLowerCase() === activeBrand.toLowerCase();
    return categoryMatch && brandMatch;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
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
      {/* Header */}
      <header className="border-b border-amber-400/20 bg-black/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">LOCK</h1>
              <p className="text-amber-400 text-sm md:text-base tracking-widest">PHARMA</p>
            </div>
            <button className="bg-amber-400 hover:bg-amber-500 text-black px-6 py-3 rounded-full flex items-center gap-2 transition-all transform hover:scale-105">
              <ShoppingCart size={20} />
              <span className="font-semibold">Carrinho</span>
            </button>
          </div>
        </div>
      </header>

      {/* Category Filter */}
      <div className="bg-zinc-900 border-b border-amber-400/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-6 py-3 rounded-full font-semibold transition-all ${
                activeCategory === 'all'
                  ? 'bg-amber-400 text-black'
                  : 'bg-zinc-800 text-white hover:bg-zinc-700'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setActiveCategory('injectable')}
              className={`px-6 py-3 rounded-full font-semibold transition-all flex items-center justify-center gap-2 ${
                activeCategory === 'injectable'
                  ? 'bg-amber-400 text-black'
                  : 'bg-zinc-800 text-white hover:bg-zinc-700'
              }`}
            >
              <Syringe size={18} />
              Injetáveis
            </button>
            <button
              onClick={() => setActiveCategory('oral')}
              className={`px-6 py-3 rounded-full font-semibold transition-all flex items-center justify-center gap-2 ${
                activeCategory === 'oral'
                  ? 'bg-amber-400 text-black'
                  : 'bg-zinc-800 text-white hover:bg-zinc-700'
              }`}
            >
              <Pill size={18} />
              Orais
            </button>
          </div>
        </div>
      </div>

      {/* Brand Filter Cards */}
      <div className="bg-zinc-950 border-b border-amber-400/20 py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">
            Filtrar por Marca
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
            {brands.map((brand) => (
              <button
                key={brand.id}
                onClick={() => setActiveBrand(activeBrand === brand.name ? null : brand.name)}
                className={`bg-amber-400 hover:bg-amber-500 rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-8 flex items-center justify-center transition-all transform hover:scale-105 hover:shadow-xl hover:shadow-amber-400/30 ${
                  activeBrand === brand.name
                    ? 'ring-4 ring-amber-300 shadow-2xl shadow-amber-400/50'
                    : ''
                }`}
              >
                <span className="text-black font-bold text-base md:text-xl lg:text-2xl tracking-tight text-center">
                  {brand.name}
                </span>
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

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-12">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-400 text-lg">Nenhum produto encontrado nesta categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-zinc-900 border border-amber-400/20 rounded-3xl overflow-hidden hover:border-amber-400/50 transition-all hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-amber-400/10"
              >
                {/* Product Image */}
                <div className="bg-zinc-800 p-4 md:p-8 flex items-center justify-center h-32 md:h-48">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-amber-400/30">
                      {product.category === 'injectable' ? (
                        <Syringe className="w-12 h-12 md:w-16 md:h-16" />
                      ) : (
                        <Pill className="w-12 h-12 md:w-16 md:h-16" />
                      )}
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-3 md:p-6">
                  <div className="mb-1 md:mb-2">
                    <span className="text-amber-400 text-[10px] md:text-xs font-semibold uppercase tracking-wider">
                      {product.brand}
                    </span>
                  </div>
                  <h3 className="text-sm md:text-xl font-bold text-white mb-2 md:mb-3 line-clamp-2">{product.name}</h3>
                  <p className="text-zinc-400 text-xs md:text-sm mb-3 md:mb-4 line-clamp-2 md:line-clamp-3">
                    {product.description}
                  </p>

                  {/* Stock Status */}
                  <div className="mb-2 md:mb-4">
                    {product.stock > 0 ? (
                      <span className="text-green-400 text-[10px] md:text-xs font-semibold">
                        Em estoque ({product.stock})
                      </span>
                    ) : (
                      <span className="text-red-400 text-[10px] md:text-xs font-semibold">
                        Fora de estoque
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mb-3 md:mb-4">
                    <div className="text-lg md:text-2xl font-bold text-amber-400">
                      {formatPrice(product.price)}
                    </div>
                  </div>

                  <button
                    disabled={product.stock === 0}
                    className={`w-full py-2 md:py-3 rounded-full text-xs md:text-base font-semibold transition-all flex items-center justify-center gap-1 md:gap-2 ${
                      product.stock > 0
                        ? 'bg-amber-400 hover:bg-amber-500 text-black hover:shadow-lg hover:shadow-amber-400/30'
                        : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="hidden sm:inline">{product.stock > 0 ? 'Adicionar ao Carrinho' : 'Indisponível'}</span>
                    <span className="sm:hidden">{product.stock > 0 ? 'Adicionar' : 'Indisponível'}</span>
                  </button>
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
            LOCK PHARMA - Produtos farmacêuticos de alta qualidade
          </p>
        </div>
      </footer>
    </div>
  );
}
