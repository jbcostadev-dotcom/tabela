import React, { useState } from 'react';
import { ArrowLeft, CreditCard, MapPin, User, FileText, Truck } from 'lucide-react';

interface CarrinhoItem {
  produto: {
    id: number;
    nome: string;
    preco: number;
    imagem_url?: string;
  };
  quantidade: number;
}

interface CheckoutProps {
  carrinho: CarrinhoItem[];
  totalCarrinho: number;
  onVoltar: () => void;
  onFinalizarPedido: (dadosPedido: any) => void;
}

export default function Checkout({ carrinho, totalCarrinho, onVoltar, onFinalizarPedido }: CheckoutProps) {
  // Estados do formulário
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState('');
  const [frete, setFrete] = useState(0);
  const [fretesDisponiveis, setFretesDisponiveis] = useState<any[]>([]);
  const [freteEscolhido, setFreteEscolhido] = useState<any>(null);
  const [seguroAtivo, setSeguroAtivo] = useState(false);
  const [valorSeguro, setValorSeguro] = useState(0);
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  // Função para buscar endereço pelo CEP
  const buscarCep = async (cepValue: string) => {
    const cepLimpo = cepValue.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;

    setCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setRua(data.logradouro || '');
        setBairro(data.bairro || '');
        setCidade(data.localidade || '');
        setEstado(data.uf || '');
        
        // Calcular frete baseado no estado (simulação)
      buscarFretesDisponiveis(data.uf);
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setCepLoading(false);
    }
  };

  // Função para buscar fretes disponíveis baseado no estado
  const buscarFretesDisponiveis = async (uf: string) => {
    try {
    const response = await fetch('/api/frete');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const fretes = await response.json();
      
      if (fretes && fretes.length > 0) {
        // Mapear fretes com valores para o estado específico
        const fretesComValores = fretes.map((freteItem: any) => ({
          ...freteItem,
          valor: Number(freteItem[uf.toLowerCase()] || freteItem.sp || 15)
        }));
        
        setFretesDisponiveis(fretesComValores);
        
        // Selecionar automaticamente o primeiro frete (mais barato)
        const primeiroFrete = fretesComValores[0];
        setFreteEscolhido(primeiroFrete);
        setFrete(Number(primeiroFrete.valor) || 15);
      } else {
        // Fallback para fretes padrão
        const fretesDefault = [
          { id: 1, nome: 'Correios PAC', valor: 15, seguro: 1.8 },
          { id: 2, nome: 'Sedex', valor: 25, seguro: 2.5 }
        ];
        setFretesDisponiveis(fretesDefault);
        setFreteEscolhido(fretesDefault[0]);
        setFrete(15);
      }
    } catch (error) {
      console.error('Erro ao buscar fretes:', error);
      // Em caso de erro, usar valores fixos
      const fretesDefault = [
        { id: 1, nome: 'Correios PAC', valor: 15, seguro: 1.8 },
        { id: 2, nome: 'Sedex', valor: 25, seguro: 2.5 }
      ];
      setFretesDisponiveis(fretesDefault);
      setFreteEscolhido(fretesDefault[0]);
      setFrete(15);
    }
  };

  // Função para calcular valor do seguro
  const calcularSeguro = () => {
    if (seguroAtivo && freteEscolhido) {
      const percentualSeguro = Number(freteEscolhido.seguro) || 0;
      const valorSeguroCalculado = (totalCarrinho * percentualSeguro) / 100;
      setValorSeguro(valorSeguroCalculado);
      return valorSeguroCalculado;
    }
    setValorSeguro(0);
    return 0;
  };

  // Função para selecionar frete
  const selecionarFrete = (frete: any) => {
    setFreteEscolhido(frete);
    setFrete(Number(frete.valor) || 15);
  };

  // Função para formatar CPF
  const formatarCpf = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  // Função para formatar telefone
  const formatarTelefone = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  // Função para formatar CEP
  const formatarCep = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    return numeros.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  // Função para finalizar pedido
  const handleFinalizarPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dadosPedido = {
        nome,
        cpf: cpf.replace(/\D/g, ''),
        email,
        telefone: telefone.replace(/\D/g, ''),
        cep: cep.replace(/\D/g, ''),
        rua,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        metodo_pagamento: metodoPagamento,
        frete,
        total_pedido: totalCarrinho + frete + valorSeguro,
        seguro: seguroAtivo ? 'sim' : 'não',
        status: 'pendente'
      };

      await onFinalizarPedido(dadosPedido);
    } catch (error) {
      console.error('Erro ao finalizar pedido:', error);
      alert('Erro ao finalizar pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Recalcular seguro sempre que necessário
  React.useEffect(() => {
    calcularSeguro();
  }, [seguroAtivo, freteEscolhido, totalCarrinho]);

  const totalFinal = totalCarrinho + frete + valorSeguro;

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onVoltar}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold">Finalizar Pedido</h1>
        </div>


        {/* Resumo do Carrinho - Mobile (topo) */}
        <div className="lg:hidden bg-zinc-800 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="text-amber-400" size={20} />
            <h2 className="text-xl font-semibold">Resumo do Pedido</h2>
          </div>

          {/* Itens do Carrinho */}
          <div className="space-y-4 mb-6">
            {carrinho.map((item) => (
              <div key={item.produto.id} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <img 
                    src={item.produto.imagem_url} 
                    alt={item.produto.nome}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <div>
                    <p className="font-medium">{item.produto.nome}</p>
                    <p className="text-sm text-zinc-400">Qtd: {item.quantidade}</p>
                  </div>
                </div>
                <p className="font-semibold">
                  R$ {(item.produto.preco * item.quantidade).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          {/* Totais */}
          <div className="border-t border-zinc-700 pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>R$ {totalCarrinho.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Frete:</span>
              <span>R$ {frete.toFixed(2)}</span>
            </div>
            {seguroAtivo && valorSeguro > 0 && (
              <div className="flex justify-between">
                <span>Seguro:</span>
                <span>R$ {valorSeguro.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-amber-400 border-t border-zinc-700 pt-2">
              <span>Total:</span>
              <span>R$ {totalFinal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulário de Checkout */}
          <div className="lg:col-span-2">
            <form onSubmit={handleFinalizarPedido} className="space-y-8">
              {/* Dados Pessoais */}
              <div className="bg-zinc-800 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-6">
                  <User className="text-amber-400" size={20} />
                  <h2 className="text-xl font-semibold">Dados Pessoais</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nome Completo *</label>
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">CPF *</label>
                    <input
                      type="text"
                      value={cpf}
                      onChange={(e) => setCpf(formatarCpf(e.target.value))}
                      maxLength={14}
                      className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:border-amber-400"
                      placeholder="000.000.000-00"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Telefone *</label>
                    <input
                      type="text"
                      value={telefone}
                      onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                      maxLength={15}
                      className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:border-amber-400"
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="bg-zinc-800 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-6">
                  <MapPin className="text-amber-400" size={20} />
                  <h2 className="text-xl font-semibold">Endereço de Entrega</h2>
                </div>
                
                <div className="space-y-4">
                  {/* Primeira linha: CEP, Cidade e Estado */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">CEP *</label>
                      <input
                        type="text"
                        value={cep}
                        onChange={(e) => {
                          const formatted = formatarCep(e.target.value);
                          setCep(formatted);
                          if (formatted.replace(/\D/g, '').length === 8) {
                            buscarCep(formatted);
                          }
                        }}
                        maxLength={9}
                        className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:border-amber-400"
                        placeholder="00000-000"
                        required
                      />
                      {cepLoading && <p className="text-sm text-amber-400 mt-1">Buscando endereço...</p>}
                    </div>
                    
                    {/* Cidade e Estado - aparecem após buscar CEP */}
                    {cidade && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Cidade *</label>
                        <input
                          type="text"
                          value={cidade}
                          onChange={(e) => setCidade(e.target.value)}
                          className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:border-amber-400"
                          required
                        />
                      </div>
                    )}
                    
                    {estado && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Estado *</label>
                        <input
                          type="text"
                          value={estado}
                          onChange={(e) => setEstado(e.target.value)}
                          maxLength={2}
                          className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:border-amber-400"
                          placeholder="SP"
                          required
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Campos de endereço - aparecem apenas após CEP válido */}
                  {rua && (
                    <>
                      {/* Segunda linha: Rua e Bairro */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Rua *</label>
                          <input
                            type="text"
                            value={rua}
                            onChange={(e) => setRua(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:border-amber-400"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Bairro *</label>
                          <input
                            type="text"
                            value={bairro}
                            onChange={(e) => setBairro(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:border-amber-400"
                            required
                          />
                        </div>
                      </div>
                      
                      {/* Terceira linha: Número e Complemento */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Número *</label>
                          <input
                            type="text"
                            value={numero}
                            onChange={(e) => setNumero(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:border-amber-400"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Complemento</label>
                          <input
                            type="text"
                            value={complemento}
                            onChange={(e) => setComplemento(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Seção de Fretes - Exibe após CEP válido */}
              {estado && fretesDisponiveis.length > 0 && (
                <div className="bg-zinc-800 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Truck className="text-amber-400" size={20} />
                    <h2 className="text-xl font-semibold">Opções de Frete</h2>
                  </div>
                  
                  <div className="space-y-3">
                    {fretesDisponiveis.map((freteOpcao) => (
                      <label
                        key={freteOpcao.id}
                        className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                          freteEscolhido?.id === freteOpcao.id
                            ? 'border-amber-400 bg-amber-400/10'
                            : 'border-zinc-600 hover:border-zinc-500'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="frete"
                            value={freteOpcao.id}
                            checked={freteEscolhido?.id === freteOpcao.id}
                            onChange={() => selecionarFrete(freteOpcao)}
                            className="text-amber-400"
                          />
                          <div>
                            <div className="font-medium">{freteOpcao.nome}</div>
                          </div>
                        </div>
                        <div className="text-amber-400 font-semibold">
                          R$ {Number(freteOpcao.valor || 0).toFixed(2)}
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Toggle do Seguro */}
                  {freteEscolhido && (
                    <div className="mt-6 p-4 border border-zinc-600 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Seguro da Encomenda</h3>
                          <p className="text-sm text-zinc-400">
                            Proteja seu pedido contra danos e extravios
                            {Number(freteEscolhido.seguro) > 0 && (
                              <span className="text-amber-400">
                                {' '}(+{Number(freteEscolhido.seguro).toFixed(1)}% do valor do pedido)
                              </span>
                            )}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={seguroAtivo}
                            onChange={(e) => setSeguroAtivo(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-zinc-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400"></div>
                        </label>
                      </div>
                      {seguroAtivo && valorSeguro > 0 && (
                        <div className="mt-2 text-sm text-amber-400">
                          Valor do seguro: R$ {valorSeguro.toFixed(2)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Método de Pagamento - Exibe após CEP válido */}
              {estado && (
                <div className="bg-zinc-800 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <CreditCard className="text-amber-400" size={20} />
                    <h2 className="text-xl font-semibold">Método de Pagamento</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { value: 'cartao_credito', label: 'Cartão de Crédito' },
                      { value: 'cartao_debito', label: 'Cartão de Débito' },
                      { value: 'pix', label: 'PIX' },
                      { value: 'boleto', label: 'Boleto Bancário' },
                      { value: 'dinheiro', label: 'Dinheiro' }
                    ].map((metodo) => (
                      <label key={metodo.value} className="flex items-center gap-3 p-4 bg-zinc-700 rounded-lg cursor-pointer hover:bg-zinc-600 transition-colors">
                        <input
                          type="radio"
                          name="metodoPagamento"
                          value={metodo.value}
                          checked={metodoPagamento === metodo.value}
                          onChange={(e) => setMetodoPagamento(e.target.value)}
                          className="text-amber-400 focus:ring-amber-400"
                          required
                        />
                        <span>{metodo.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Botão Finalizar - Exibe após CEP válido */}
              {estado && (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-400 hover:bg-amber-500 disabled:bg-amber-600 text-black font-semibold py-4 rounded-lg transition-colors text-lg"
                >
                  {loading ? 'Processando...' : `Finalizar Pedido - R$ ${totalFinal.toFixed(2)}`}
                </button>
              )}
            </form>
          </div>

          {/* Resumo do Pedido - Desktop (lateral) */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="bg-zinc-800 rounded-lg p-6 sticky top-8">
              <div className="flex items-center gap-2 mb-6">
                <FileText className="text-amber-400" size={20} />
                <h2 className="text-xl font-semibold">Resumo do Pedido</h2>
              </div>

              {/* Itens do Carrinho */}
              <div className="space-y-4 mb-6">
                {carrinho.map((item) => (
                  <div key={item.produto.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <img 
                        src={item.produto.imagem_url} 
                        alt={item.produto.nome}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div>
                        <p className="font-medium">{item.produto.nome}</p>
                        <p className="text-sm text-zinc-400">Qtd: {item.quantidade}</p>
                      </div>
                    </div>
                    <p className="font-semibold">
                      R$ {(item.produto.preco * item.quantidade).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totais */}
              <div className="border-t border-zinc-700 pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R$ {totalCarrinho.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frete:</span>
                  <span>R$ {frete.toFixed(2)}</span>
                </div>
                {seguroAtivo && valorSeguro > 0 && (
                  <div className="flex justify-between">
                    <span>Seguro:</span>
                    <span>R$ {valorSeguro.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-amber-400 border-t border-zinc-700 pt-2">
                  <span>Total:</span>
                  <span>R$ {totalFinal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}