import { useEffect, useMemo, useState } from 'react';
import { FaEye, FaListAlt, FaTimes } from 'react-icons/fa';
import { BarChart } from '@mui/x-charts/BarChart';
import { useAuth } from '../context/AuthContext';

function Dashboards() {
  const { user } = useAuth();

  const [ordens, setOrdens] = useState([]);
  const [filteredOrdens, setFilteredOrdens] = useState([]);
  const [pecas, setPecas] = useState([]);
  const [movimentacao, setMovimentacao] = useState([]);
  const [resumoBackend, setResumoBackend] = useState({ entrada: 0, saida: 0, saldo: 0 });
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [showAllOrdens, setShowAllOrdens] = useState(false);

  useEffect(() => {
    if (!user?.oficina_id) return;

    setOrdens([]);
    setFilteredOrdens([]);
    setPecas([]);
    setMovimentacao([]);
    setResumoBackend({ entrada: 0, saida: 0, saldo: 0 });

    const fetchDados = async () => {
      try {
        setCarregando(true);

        const url = `http://localhost:5000/dashboard?oficina_id=${user.oficina_id}`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Erro na requisição: ${response.statusText}`);
        }

        const data = await response.json();
        const ordensData = data.ordens_servico || [];

        setOrdens(ordensData);
        setPecas(data.pecas || []);
        setMovimentacao(data.movimentacao_mensal || []);
        setResumoBackend(data.resumo_mensal || { entrada: 0, saida: 0, saldo: 0 });
        setFilteredOrdens(ordensData);

        setErro(null);
      } catch (err) {
        setErro(err.message || 'Erro ao carregar dados');
      } finally {
        setCarregando(false);
      }
    };

    fetchDados();
  }, [user?.oficina_id]);

  // Filtrar ordens quando mês/ano mudarem
  useEffect(() => {
    if (selectedMonth !== 'all' && selectedYear !== 'all') {
      const filtered = ordens.filter((ordem) => {
        const dataOrdem = new Date(ordem.created_at);
        return (
          dataOrdem.getMonth() + 1 === Number(selectedMonth) &&
          dataOrdem.getFullYear() === Number(selectedYear)
        );
      });
      setFilteredOrdens(filtered);
    } else {
      setFilteredOrdens(ordens);
    }
  }, [selectedMonth, selectedYear, ordens]);

  const handleShowAllOrdens = () => setShowAllOrdens(true);
  const handleCloseModal = () => setShowAllOrdens(false);

  const corUltimasOrdens = (status) => {
    if (status === 'Aberta') return 'bg-yellow-400';
    if (status === 'Em Andamento') return 'bg-blue-600 text-white';
    return 'bg-green-600 text-white';
  };

  const corEstoque = (quantidade) => {
    if (quantidade <= 5 && quantidade > 0) return 'bg-yellow-400';
    if (quantidade > 5) return 'bg-green-600 text-white';
    return 'bg-red-600 text-white';
  };

  const years = useMemo(() => (
    Array.from(new Set(movimentacao.map((i) => Number(i.ano)).filter(Boolean))).sort((a, b) => a - b)
  ), [movimentacao]);

  const filteredMovimentacao = useMemo(() => (
    movimentacao.filter((item) => {
      const monthMatch = selectedMonth === 'all' || Number(item.mes) === Number(selectedMonth);
      const yearMatch = selectedYear === 'all' || Number(item.ano) === Number(selectedYear);
      return monthMatch && yearMatch;
    })
  ), [movimentacao, selectedMonth, selectedYear]);

  const saldoAtualNegativo = useMemo(() => (
    resumoBackend.saldo < 0 ? 'text-red-600' : ''
  ), [resumoBackend.saldo]);

  const totaisMovimentacao = useMemo(() => {
    const entradas = filteredMovimentacao.reduce((sum, item) => sum + (Number(item.entradas) || 0), 0);
    const saidas = filteredMovimentacao.reduce((sum, item) => sum + (Number(item.saidas) || 0), 0);
    return { entradas, saidas, saldo: entradas - saidas };
  }, [filteredMovimentacao]);

  // Atualizar resumo quando há filtro de período (incluindo "Todos")
  useEffect(() => {
    setResumoBackend({
      entrada: totaisMovimentacao.entradas,
      saida: totaisMovimentacao.saidas,
      saldo: totaisMovimentacao.saldo
    });
  }, [totaisMovimentacao, selectedMonth, selectedYear]);

  const dataset = filteredMovimentacao.map((item) => {
    const entradas = Number(item.entradas) || 0;
    const saidas = Number(item.saidas) || 0;

    return {
      month: `${String(item.mes).padStart(2, '0')}/${item.ano}`,
      entradas,
      saidas,
      saldo: entradas - saidas,
    };
  });

  const valueFormatter = (value) => {
    const numero = Number(value) || 0;
    return `R$ ${numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatCurrency = (value) => {
    const numero = Number(value) || 0;
    return `R$ ${numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const chartDataset = dataset.length > 0
    ? dataset
    : [{ month: 'Sem dados', entradas: 0, saidas: 0, saldo: 0 }];
  const isChartPlaceholder = dataset.length === 0;

  if (!user?.oficina_id) {
    return <div className="p-6">Faça login para visualizar o dashboard.</div>;
  }

  if (carregando) {
    return <div className="p-6">Carregando...</div>;
  }

  if (erro) {
    return <div className="p-6 text-red-600">Erro: {erro}</div>;
  }

  return (
    <div className='flex-1'>
      <div className="dashboard-header flex gap-6 mb-6">
        <div className="os-aberta bg-base-200 p-4 rounded-box">
          <p>OS Abertas</p>
          <p className="numero text-xl font-bold">{ordens.filter((item) => item.status === 'Aberta').length}</p>
        </div>
        <div className="em-andamento bg-base-200 p-4 rounded-box">
          <p>Em Andamento</p>
          <p className="numero text-xl font-bold">{ordens.filter((item) => item.status === 'Em Andamento').length}</p>
        </div>
        <div className="faturamento bg-base-200 p-4 rounded-box">
          <p>Faturamento do Mês</p>
          <p className={`numero text-xl font-bold ${saldoAtualNegativo}`}>
            {formatCurrency(resumoBackend.saldo)}
          </p>
        </div>
      </div>

      <div className="dashboard-table mb-16">
        <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-200 p-4">
          <h3 className="ultimas-ordens text-lg font-bold mb-4 flex items-center gap-2">
            Últimas Ordens de Serviço
            <button onClick={handleShowAllOrdens} className="btn btn-ghost btn-xs ml-2" title="Ver todas as ordens">
              <FaListAlt className="text-primary" />
            </button>
          </h3>

          <table className="table table-zebra">
            <thead>
              <tr>
                <th>OS</th>
                <th>Cliente</th>
                <th>Veículo</th>
                <th>Status</th>
                <th>Total</th>
                <th>Observações</th>
                <th className="w-16">Ações</th>
              </tr>
            </thead>
            <tbody>
              {ordens.map((item) => (
                <tr key={item.ordem_id}>
                  <th>{item.ordem_id}</th>
                  <td>{item.nome_cliente}</td>
                  <td>{item.marca_veiculo} - {item.modelo_veiculo}</td>
                  <td>
                    <span className={`${corUltimasOrdens(item.status)} px-3 py-1 rounded text-center inline-block min-w-[120px]`}>
                      {item.status}
                    </span>
                  </td>
                  <td>R$ {item.total}</td>
                  <td>
                    <span className="truncate max-w-[200px] block" title={item.observacao}>
                      {item.observacao}
                    </span>
                  </td>
                  <td>
                    <button onClick={handleShowAllOrdens} className="btn btn-ghost btn-xs text-blue-500 hover:text-blue-700 hover:bg-blue-100" title="Ver todas as ordens">
                      <FaEye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAllOrdens && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-base-100 rounded-box w-full max-w-7xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-base-content/10 bg-base-200">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaListAlt className="text-primary" />
                  Todas as Ordens de Serviço
                </h2>
                <p className="text-base-content/70 mt-1">
                  Total: {filteredOrdens.length} ordens
                  {selectedMonth !== 'all' && selectedYear !== 'all' && ` - Filtrado: ${selectedMonth}/${selectedYear}`}
                </p>
              </div>
              <button onClick={handleCloseModal} className="btn btn-circle btn-sm btn-ghost hover:bg-base-300">
                <FaTimes size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="overflow-x-auto">
                <table className="table table-zebra table-auto w-full">
                  <thead className="bg-base-200">
                    <tr>
                      <th>OS</th>
                      <th>Cliente</th>
                      <th>Veículo</th>
                      <th>Status</th>
                      <th>Total</th>
                      <th>Observações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrdens.map((ordem) => (
                      <tr key={ordem.ordem_id}>
                        <td>{ordem.ordem_id}</td>
                        <td>{ordem.nome_cliente}</td>
                        <td>{ordem.marca_veiculo} - {ordem.modelo_veiculo}</td>
                        <td>
                          <span className={`${corUltimasOrdens(ordem.status)} px-3 py-1 rounded text-center inline-block min-w-[120px]`}>
                            {ordem.status}
                          </span>
                        </td>
                        <td>R$ {ordem.total}</td>
                        <td>{ordem.observacao}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredOrdens.length === 0 && (
                <div className="text-center py-12 text-base-content/60">
                  <FaListAlt size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg">Nenhuma ordem de serviço encontrada</p>
                  <p className="text-sm mt-2">
                    {selectedMonth !== 'all' && selectedYear !== 'all' ? `para o período ${selectedMonth}/${selectedYear}` : 'no sistema'}
                  </p>
                </div>
              )}

              {filteredOrdens.length > 0 && (
                <div className="mt-8 pt-6 border-t border-base-content/10">
                  <div className="flex flex-wrap gap-6 justify-center">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                      <div>
                        <span className="font-medium">Abertas: </span>
                        <span className="ml-2">{filteredOrdens.filter((o) => o.status === 'Aberta').length}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-blue-600 rounded"></div>
                      <div>
                        <span className="font-medium">Em Andamento: </span>
                        <span className="ml-2">{filteredOrdens.filter((o) => o.status === 'Em Andamento').length}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-green-600 rounded"></div>
                      <div>
                        <span className="font-medium">Finalizadas: </span>
                        <span className="ml-2">{filteredOrdens.filter((o) => o.status === 'Finalizada' || o.status === 'Fechada').length}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-base-300 rounded"></div>
                      <div>
                        <span className="font-medium">Total Geral: </span>
                        <span className="ml-2 font-bold">
                          R$ {filteredOrdens.reduce((sum, o) => sum + Number(o.total || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-base-content/10 bg-base-200 flex justify-between items-center">
              <div className="text-sm text-base-content/70">{filteredOrdens.length} ordens listadas</div>
              <div className="flex gap-3">
                <button onClick={() => window.print()} className="btn btn-outline btn-sm">Imprimir</button>
                <button onClick={handleCloseModal} className="btn btn-primary btn-sm">Fechar Visualização</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-table-estoque">
        <div className="bg-base-200 p-4 rounded-box border border-base-content/5">
          <h3 className="ultimas-ordens text-lg font-bold mb-4">Estoque (Peças)</h3>
          <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Peça</th>
                  <th>Quantidade</th>
                  <th>Status</th>
                  <th>Preço Unitário</th>
                </tr>
              </thead>
              <tbody>
                {pecas.length > 0 ? (
                  pecas.map((peca) => (
                    <tr key={peca.id}>
                      <td>{peca.nome || '-'}</td>
                      <td>{peca.quantidade ?? 0}</td>
                      <td>
                        <span className={`${corEstoque(peca.quantidade)} px-3 py-1 rounded text-center inline-block min-w-[120px]`}>
                          {peca.status || 'Sem status'}
                        </span>
                      </td>
                      <td>{formatCurrency(peca.preco_unitario)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center text-base-content/60 py-6">
                      Nenhuma peça cadastrada no estoque
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-base-200 p-4 rounded-box border border-base-content/5">
          <h3 className="ultimas-ordens text-lg font-bold mb-4">Movimentação Mensal</h3>
          <div className="movimentacao-selects flex items-center justify-center gap-6 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Mês:</span>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="select select-xs">
                <option value="all">Todos</option>
                {[...Array(12)].map((_, i) => {
                  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                  return <option key={i + 1} value={i + 1}>{meses[i]}</option>;
                })}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Ano:</span>
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="select select-xs">
                <option value="all">Todos</option>
                {years.map((ano) => (
                  <option key={ano} value={ano}>{ano}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ height: '24px' }}></div>
          <div className="flex flex-row gap-3 mb-4 px-4 movimentacao-cards">
            <div className="bg-blue-600 text-white rounded-box p-3 flex-1">
              <p className="text-sm text-white">Entradas</p>
              <p className="text-lg font-bold">{formatCurrency(totaisMovimentacao.entradas)}</p>
            </div>
            <div className="bg-red-600 text-white rounded-box p-3 flex-1">
              <p className="text-sm text-white">Despesas</p>
              <p className="text-lg font-bold">{formatCurrency(totaisMovimentacao.saidas)}</p>
            </div>
            <div className={`${totaisMovimentacao.saldo < 0 ? 'bg-red-600' : 'bg-green-600'} text-white rounded-box p-3 flex-1`}>
              <p className="text-sm text-white">Saldo</p>
              <p className="text-lg font-bold">{formatCurrency(totaisMovimentacao.saldo)}</p>
            </div>
          </div>
          <div className="bg-base-100 rounded-box p-4">
            <BarChart
              dataset={chartDataset}
              xAxis={[{ dataKey: 'month' }]}
              series={[
                { dataKey: 'entradas', label: 'Entradas', color: '#2563eb', valueFormatter },
                { dataKey: 'saidas', label: 'Despesas', color: '#dc2626', valueFormatter },
                { dataKey: 'saldo', label: 'Saldo', color: '#16a34a', valueFormatter },
              ]}
              height={300}
            />
            {isChartPlaceholder && (
              <p className="text-center text-base-content/60 mt-3">Sem movimentações para o período selecionado</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboards;
