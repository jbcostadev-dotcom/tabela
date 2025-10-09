import { CheckCircle, MessageCircle, Send } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function Confirmacao() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const pedidoId = params.get('id');
  const [pedido, setPedido] = useState<any | null>(null);

  useEffect(() => {
    const fetchPedido = async () => {
      if (!pedidoId) return;
      try {
        const res = await fetch(`/api/pedidos/${pedidoId}`);
        if (res.ok) {
          const data = await res.json();
          setPedido(data);
        }
      } catch (e) {
        console.error('Erro ao buscar pedido para confirmação:', e);
      }
    };
    fetchPedido();
  }, [pedidoId]);

  const formatCurrency = (value: number | string | null | undefined) => {
    const num = typeof value === 'number' ? value : parseFloat(String(value ?? '0'));
    if (isNaN(num)) return 'R$0.00';
    return `R$${num.toFixed(2)}`;
  };

  const buildMensagem = () => {
    if (!pedido) {
      const linhasFallback = [
        `Nome Completo:`,
        `CPF:`,
        `E-mail:`,
        `Telefone:`,
        `Rua:`,
        `Número:`,
        `Complemento:`,
        `Bairro:`,
        `Cidade:`,
        `Ponto de referência:`,
        `CEP:`,
        '',
        `Forma de Pagamento:`,
        '',
        'Pedido:',
        '',
        `Loggi/Estado:`,
        `Total:`
      ];
      return linhasFallback.join('\n');
    }

    const itensRaw = pedido.itens;
    let itens: any[] = [];
    try {
      if (Array.isArray(itensRaw)) {
        itens = itensRaw;
      } else if (typeof itensRaw === 'string') {
        itens = JSON.parse(itensRaw);
      }
    } catch {}

    const itensTexto = (itens || []).map((item) => {
      const nome = item?.produto?.nome ?? item?.nome ?? 'Item';
      const preco = item?.produto?.preco ?? item?.preco ?? 0;
      const qtd = item?.quantidade ?? 1;
      return `${qtd}x ${nome} - ${formatCurrency(preco)}`;
    }).join('\n');

    const numericOnly = (s: any) => String(s ?? '').replace(/\D/g, '');

    const metodo = String(pedido.metodo_pagamento ?? '').trim().toLowerCase();
    const metodoLabelMap: Record<string, string> = {
      pix: 'PIX',
      cartao_credito: 'Cartão de Crédito',
      cartao_debito: 'Cartão de Débito',
      boleto: 'Boleto Bancário',
      dinheiro: 'Dinheiro'
    };
    const metodoLabel = metodoLabelMap[metodo] ?? (metodo ? metodo.toUpperCase() : '');

    const linhas = [
      `Nome Completo: ${pedido.nome ?? ''}`,
      `CPF: ${numericOnly(pedido.cpf)}`,
      `E-mail: ${pedido.email ?? ''}`,
      `Telefone: ${numericOnly(pedido.telefone)}`,
      `Rua: ${pedido.rua ?? ''}`,
      `Número: ${pedido.numero ?? ''}`,
      `Complemento: ${pedido.complemento ?? ''}`,
      `Bairro: ${pedido.bairro ?? ''}`,
      `Cidade: ${pedido.cidade ?? ''}`,
      `Ponto de referência: ${pedido.referencia ?? ''}`,
      `CEP: ${numericOnly(pedido.cep)}`,
      '',
      `Forma de Pagamento: ${metodoLabel}`,
      '',
      'Pedido:',
      itensTexto,
      '',
      `Loggi/Estado: ${pedido.estado ?? ''} - ${formatCurrency(pedido.frete)}`,
      `Total: ${formatCurrency(pedido.total_pedido)}`
    ];

    // Monta texto puro com quebras de linha para posterior encoding
    return linhas.join('\n');
  };

  const whatsappNumber = '5511993929062';
  const mensagemText = buildMensagem();
  const mensagem = encodeURIComponent(mensagemText);
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${mensagem}`;
  const telegramUrl = `https://t.me/lockpharma?text=${mensagem}`;

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-zinc-900 rounded-xl p-6 shadow-lg border border-zinc-800">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="text-amber-400" size={28} />
          <h1 className="text-2xl font-bold">Pedido registrado com sucesso</h1>
        </div>
        {pedidoId && (
          <div className="bg-zinc-800 rounded-lg p-4 mb-4">
            <div className="text-sm text-zinc-400">ID do pedido</div>
            <div className="text-lg font-mono text-zinc-200">#{pedidoId}</div>
          </div>
        )}

        <div className="bg-amber-50/10 border border-amber-400/30 rounded-lg p-4 mb-6">
          <div className="text-amber-400 font-semibold">Pagamento pendente</div>
          <p className="text-zinc-300 mt-2 text-sm">
            Você receberá a chave de pagamento via WhatsApp ou Telegram. Clique em um dos botões abaixo para continuar.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg transition-colors"
          >
            <MessageCircle size={20} />
            WhatsApp
          </a>

          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition-colors"
          >
            <Send size={20} />
            Telegram
          </a>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-amber-400 hover:text-amber-300">Voltar para a loja</Link>
        </div>
      </div>
    </div>
  );
}