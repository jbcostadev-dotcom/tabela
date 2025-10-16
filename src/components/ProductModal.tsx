import { useEffect, useRef, useState } from 'react';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import type { Produto } from '../lib/api';

interface ProductModalProps {
  produto: Produto;
  onClose: () => void;
  onAddToCart: (produto: Produto, quantidade: number) => void;
}

export default function ProductModal({ produto, onClose, onAddToCart }: ProductModalProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [quantidade, setQuantidade] = useState<number>(1);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const startDrag = (e: React.MouseEvent) => {
    if (scale === 1) return; // drag apenas quando zoom > 1
    setDragging(true);
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const onDrag = (e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - lastPos.x;
    const dy = e.clientY - lastPos.y;
    setLastPos({ x: e.clientX, y: e.clientY });
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const endDrag = () => setDragging(false);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => {
      const next = Math.min(3, Math.max(1, prev + delta));
      // se voltar ao 1, reseta offset
      if (next === 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const closeIfOverlay = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  const resetZoom = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const diminuirQuantidade = () => setQuantidade(q => Math.max(1, q - 1));
  const aumentarQuantidade = () => setQuantidade(q => Math.min(99, q + 1));

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center"
      onClick={closeIfOverlay}
    >
      <div className="bg-zinc-900 border border-amber-400/30 rounded-xl shadow-2xl w-full max-w-[22rem] md:max-w-2xl mx-2 md:mx-4 mb-40 md:mb-0 md:mt-40 max-h-[85vh] overflow-hidden">

        {/* Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 overflow-y-auto">
          {/* Imagem com zoom */}
          <div
            className="relative bg-white h-64 md:h-[20rem] overflow-hidden cursor-zoom-in"
            onWheel={onWheel}
            onMouseDown={startDrag}
            onMouseMove={onDrag}
            onMouseUp={endDrag}
            onMouseLeave={endDrag}
          >
            {produto.imagem_url ? (
              <img
                ref={imgRef}
                src={produto.imagem_url}
                alt={produto.nome}
                className="select-none"
                draggable={false}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                  transition: dragging ? 'none' : 'transform 120ms ease-out',
                  cursor: scale > 1 ? 'move' : 'zoom-in',
                }}
                onClick={() => setScale(s => (s === 1 ? 2 : 1))}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-zinc-500">Sem imagem</span>
              </div>
            )}
          </div>

          {/* Detalhes */}
          <div className="p-3 md:p-4 flex flex-col min-h-64 md:min-h-[20rem]">
            {/* Linha com Categoria/Marca à esquerda e botão Fechar à direita */}
            <div className="flex items-center justify-between w-full">
              <div className="text-amber-400 text-[10px] md:text-[11px] font-semibold uppercase tracking-wider">
                {produto.categoria?.nome || 'Categoria'} {produto.marca ? `• ${produto.marca.nome}` : ''}
              </div>
              <button
                onClick={onClose}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 text-[11px]"
              >
                Fechar
              </button>
            </div>
            {/* Título acima do preço */}
            <h3 className="text-white text-[1.2rem] font-bold mt-1 break-words">
              {produto.nome}
            </h3>
            {/* Rodapé: preço acima da quantidade e botão abaixo, ancorado ao fundo */}
            <div className="mt-auto">
              <div className="text-amber-400 text-[1.95rem] leading-none font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.preco)}
              </div>
              <div className="mt-2 md:mt-2.5">
                <div className="flex items-center gap-2">
                  <button
                    onClick={diminuirQuantidade}
                    className="w-8 h-8 bg-zinc-700 hover:bg-zinc-600 rounded-full flex items-center justify-center transition-colors"
                    aria-label="Diminuir quantidade"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={quantidade}
                    onChange={(e) => {
                      const val = parseInt(e.target.value || '1', 10);
                      if (isNaN(val)) return;
                      setQuantidade(Math.min(99, Math.max(1, val)));
                    }}
                    className="w-14 bg-zinc-800 text-white text-center rounded py-1.5"
                  />
                  <button
                    onClick={aumentarQuantidade}
                    className="w-8 h-8 bg-zinc-700 hover:bg-zinc-600 rounded-full flex items-center justify-center transition-colors"
                    aria-label="Aumentar quantidade"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <button
                  onClick={() => { onAddToCart(produto, quantidade); onClose(); }}
                  disabled={produto.estoque === 0}
                  className={`w-full py-2.5 rounded-full font-semibold transition-all flex items-center justify-center gap-2 ${
                    produto.estoque > 0
                      ? 'bg-amber-400 hover:bg-amber-500 text-black hover:shadow-lg hover:shadow-amber-400/30'
                      : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                  }`}
                  title={produto.estoque > 0 ? 'Adicionar ao Carrinho' : 'Indisponível'}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>{produto.estoque > 0 ? 'Adicionar ao Carrinho' : 'Indisponível'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}