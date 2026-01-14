import { useEffect, useState } from "react";
import { MdAttachMoney } from "react-icons/md";
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { Edit2, Trash2, X, Save } from "lucide-react";
import Skeleton from "./Skeleton";
import { useDataCache } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "./ConfirmModal";

function Financeiro() {
  const { user } = useAuth();
  const { fetchData, invalidateCache } = useDataCache();
  const [transacoes, setTransacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [resumo, setResumo] = useState({ receita: 0, despesa: 0, lucro: 0, lucratividade: 0 });
  const [editar, setEditar] = useState(null);
  const [formEditar, setFormEditar] = useState(null);
  const [criarNovo, setCriarNovo] = useState(false);
  const [formNovo, setFormNovo] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [sucessoMsg, setSucessoMsg] = useState("");
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');

  const atualizarResumoFromData = (dataResumo) => {
    const resumoFix = {
      receita: Number(dataResumo?.receita || 0),
      despesa: Number(dataResumo?.despesa || 0),
      lucro: Number(dataResumo?.lucro || 0),
      lucratividade: Number(dataResumo?.lucratividade || 0)
    };
    setResumo(resumoFix);
  };

  const calcularResumoLocal = (lista) => {
    const receita = (lista || []).reduce((sum, t) => sum + (t.tipo === 'Receita' ? Number(t.valor || 0) : 0), 0);
    const despesa = (lista || []).reduce((sum, t) => sum + (t.tipo === 'Despesa' ? Number(t.valor || 0) : 0), 0);
    const lucro = receita - despesa;
    const lucratividade = receita > 0 ? (lucro / receita) * 100 : 0;
    setResumo({ receita, despesa, lucro, lucratividade });
  };

  const carregarDados = async (useFresh = false) => {
    try {
      setCarregando(true);
      const fetchTransacoes = useFresh
        ? async () => (await fetch(`http://localhost:5000/financeiro?oficina_id=${user.oficina_id}`)).json()
        : async () => await fetchData('financeiro', `http://localhost:5000/financeiro?oficina_id=${user.oficina_id}`);

      const fetchResumo = useFresh
        ? async () => (await fetch(`http://localhost:5000/financeiro/resumo?oficina_id=${user.oficina_id}`)).json()
        : async () => await fetchData('financeiro-resumo', `http://localhost:5000/financeiro/resumo?oficina_id=${user.oficina_id}`);

      const dataTransacoes = await fetchTransacoes();
      const dataResumo = await fetchResumo();
      setTransacoes(dataTransacoes || []);
      atualizarResumoFromData(dataResumo || {});
    } catch (error) {
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (!user?.oficina_id) return;
    setTransacoes([]);
    setResumo({ receita: 0, despesa: 0, lucro: 0, lucratividade: 0 });
    carregarDados();
  }, [user?.oficina_id]);

  // Filtra transações pelo período selecionado
  const getFilteredTransacoes = () => {
    return (transacoes || []).filter((t) => {
      const d = new Date(t.created_at);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const monthMatch = selectedMonth === 'all' || Number(selectedMonth) === m;
      const yearMatch = selectedYear === 'all' || Number(selectedYear) === y;
      return monthMatch && yearMatch;
    });
  };

  // Atualiza resumo ao mudar período
  useEffect(() => {
    const filtered = getFilteredTransacoes();
    if (filtered.length > 0) {
      calcularResumoLocal(filtered);
    } else {
      setResumo({ receita: 0, despesa: 0, lucro: 0, lucratividade: 0 });
    }
  }, [selectedMonth, selectedYear, transacoes]);

  const salvarNovaTransacao = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/financeiro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formNovo, oficina_id: user.oficina_id }),
      });
      if (!response.ok) { alert("Erro ao criar transação"); return; }
      
      invalidateCache('financeiro');
      invalidateCache('financeiro-resumo');
      await carregarDados(true);
      
      setCriarNovo(false);
      setFormNovo(null);
    } catch (error) {}
  };

  const salvarEdicao = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/financeiro/${formEditar.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formEditar, oficina_id: user.oficina_id }),
      });
      if (!response.ok) { alert("Erro ao editar transação"); return; }
      // Otimista: atualiza a linha e recalcula cards imediatamente
      setTransacoes(prev => {
        const updated = prev.map(t => t.id === formEditar.id ? { ...t, ...formEditar } : t);
        calcularResumoLocal(updated);
        return updated;
      });

      invalidateCache('financeiro');
      invalidateCache('financeiro-resumo');
      await carregarDados(true);
      
      setEditar(null);
      setFormEditar(null);
    } catch (error) {}
  };

  const excluirTransacao = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/financeiro/${id}?oficina_id=${user.oficina_id}`, { method: "DELETE" });
      if (!response.ok) { alert("Erro ao excluir"); return; }
      // Otimista: remove a linha e recalcula cards imediatamente
      setTransacoes(prev => {
        const updated = prev.filter(t => t.id !== id);
        calcularResumoLocal(updated);
        return updated;
      });

      invalidateCache('financeiro');
      invalidateCache('financeiro-resumo');
      await carregarDados(true);
      setSucessoMsg("Transação excluída com sucesso");
      setTimeout(() => setSucessoMsg(""), 2000);
    } catch (error) {}
  };

  const safe = (value) => (value === null || value === undefined || value === "" ? "-" : value);

  // Preparar dados para o gráfico
  const filteredTransacoes = getFilteredTransacoes();
  const dataset = filteredTransacoes.length > 0 ? [
    {
      month: "Período",
      receita: resumo.receita || 0,
      despesa: resumo.despesa || 0,
      lucro: resumo.lucro || 0
    }
  ] : [];

  const isBarPlaceholder = dataset.length === 0;
  const datasetForChart = isBarPlaceholder
    ? [{ month: 'Sem dados', receita: 0, despesa: 0, lucro: 0 }]
    : dataset;

  const valueFormatter = (value) => {
    const numero = Number(value) || 0;
    return `R$ ${numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Calcular lucro acumulado por mês
  const calcularLucroAcumulado = () => {
    const mesesMap = {};
    
    (filteredTransacoes || []).forEach((t) => {
      const data = new Date(t.created_at);
      const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`;
      const mesPt = data.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
      
      if (!mesesMap[mesAno]) {
        mesesMap[mesAno] = { label: mesPt, valor: 0, data: new Date(data.getFullYear(), data.getMonth(), 1) };
      }
      
      const valor = t.tipo === 'Receita' ? Number(t.valor || 0) : -(Number(t.valor || 0));
      mesesMap[mesAno].valor += valor;
    });

    // Se não houver transações, retornar vazio
    if (Object.keys(mesesMap).length === 0) {
      return { meses: [], lucros: [] };
    }

    // Encontrar intervalo de meses
    const datas = Object.values(mesesMap).map(m => m.data).sort((a, b) => a - b);
    const dataInicio = datas[0];
    const dataFim = datas[datas.length - 1];

    // Gerar todos os meses no intervalo
    const mesesCompletos = {};
    let dataAtual = new Date(dataInicio);
    while (dataAtual <= dataFim) {
      const mes = dataAtual.getMonth() + 1;
      const ano = dataAtual.getFullYear();
      const mesAno = `${mes}/${ano}`;
      const mesPt = dataAtual.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
      
      mesesCompletos[mesAno] = { label: mesPt, valor: mesesMap[mesAno]?.valor || 0 };
      dataAtual.setMonth(dataAtual.getMonth() + 1);
    }

    // Calcular acumulado
    const dados = { meses: [], lucros: [] };
    let acumulado = 0;
    Object.values(mesesCompletos).forEach((mes) => {
      acumulado += mes.valor;
      dados.meses.push(mes.label);
      dados.lucros.push(acumulado);
    });
    
    return dados;
  };

  const lucroAcumulado = calcularLucroAcumulado();
  const isLinePlaceholder = lucroAcumulado.meses.length === 0;
  const lucroChartData = isLinePlaceholder
    ? { meses: ['Sem dados'], lucros: [0] }
    : lucroAcumulado;

  const tipoAtual = editar ? formEditar?.tipo : formNovo?.tipo;

  return (
    <div className="financeiro-page">
      {/* CARDS DE RESUMO */}
      <div className="dashboard-header w-full flex gap-6 mb-6 mt-20">
        <div className="receita bg-green-600 text-white p-4 rounded-box">
          <p>Receita</p>
          <p className="numero text-xl font-bold">R$ {(resumo.receita || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="despesa bg-red-600 text-white p-4 rounded-box">
          <p>Despesa</p>
          <p className="numero text-xl font-bold">R$ {(resumo.despesa || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="lucro bg-blue-600 text-white p-4 rounded-box">
          <p>Lucro</p>
          <p className={`numero text-xl font-bold`}>R$ {(resumo.lucro || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="lucratividade bg-purple-600 text-white p-4 rounded-box">
          <p>Lucratividade</p>
          <p className={`numero text-xl font-bold`}>{resumo.lucratividade.toFixed(2)}%</p>
        </div>
      </div>

      {/* FILTRO DE PERÍODO */}
      <div className="flex-financeiro items-center gap-3 mb-4 mt-10">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">Mês:</span>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="select select-xs">
            <option value="all">Todos</option>
            <option value="1">Jan</option>
            <option value="2">Fev</option>
            <option value="3">Mar</option>
            <option value="4">Abr</option>
            <option value="5">Mai</option>
            <option value="6">Jun</option>
            <option value="7">Jul</option>
            <option value="8">Ago</option>
            <option value="9">Set</option>
            <option value="10">Out</option>
            <option value="11">Nov</option>
            <option value="12">Dez</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">Ano:</span>
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="select select-xs">
            <option value="all">Todos</option>
            {(() => {
              const yearsFromTrans = Array.from(new Set((transacoes || []).map(t => {
                const d = new Date(t.created_at);
                return d.getFullYear();
              }).filter(Boolean))).sort((a, b) => a - b);
              const years = yearsFromTrans.length > 0 ? yearsFromTrans : [new Date().getFullYear()];
              return years.map(y => (<option key={y} value={y}>{y}</option>));
            })()}
          </select>
        </div>
      </div>

      {/* GRÁFICOS */}
      <div className="financeiro-charts">
        <div className="rounded-box border border-base-content/5 bg-base-200 p-2">
          <h3 className="ultimas-ordens text-lg font-bold mb-4">Receitas vs Despesas</h3>
          <BarChart
            dataset={datasetForChart}
            xAxis={[{ dataKey: 'month' }]}
            series={[
              { dataKey: 'receita', label: 'Receita', color: '#16a34a', valueFormatter },
              { dataKey: 'despesa', label: 'Despesa', color: '#dc2626', valueFormatter }
            ]}
            height={300}
          />
          {isBarPlaceholder && (
            <p className="text-gray-500 text-center mt-3">Sem transações no período selecionado</p>
          )}
        </div>
        <div className="rounded-box border border-base-content/5 bg-base-200 p-2">
          <h3 className="ultimas-ordens text-lg font-bold mb-4">Lucro Acumulado</h3>
          <LineChart
            xAxis={[{ 
              data: lucroChartData.meses, 
              scaleType: 'band',
              label: 'Mês'
            }]}
            series={[
              {
                data: lucroChartData.lucros,
                color: '#7c3aed',
                label: 'Lucro Acumulado',
                valueFormatter: (value) => `R$ ${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              }
            ]}
            slotProps={{
              legend: { hidden: false },
              tooltip: { trigger: 'axis' }
            }}
            height={300}
          />
          {isLinePlaceholder && (
            <p className="text-gray-500 text-center mt-3">Nenhuma transação registrada</p>
          )}
        </div>
      </div>

      {/* TABELA DE TRANSAÇÕES */}
      <div className="dashboard-table mb-6 mt-32">
        <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-200 p-4">
          <h3 className="ultimas-ordens text-lg font-bold mb-4 flex items-center justify-between">
            <span>Últimas Transações</span>
            <button 
              onClick={() => {
                setCriarNovo(true);
                setFormNovo({ ordem_servico_id: null, tipo: "Receita", valor: 0, descricao: "" });
              }} 
              className="btn btn-sm bg-blue-500 text-white px-6">
              + Nova Transação
            </button>
          </h3>

          {carregando ? (
            <div className="w-full">
              <Skeleton />
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th className="pr-6">Tipo</th>
                    <th className="pl-6">Valor</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                {(filteredTransacoes || []).length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-gray-500 py-6">
                      Sem transações no período selecionado
                    </td>
                  </tr>
                ) : (
                  filteredTransacoes.map((transacao) => (
                    <tr key={transacao.id}>
                      <td>{new Date(transacao.created_at).toLocaleDateString('pt-BR')}</td>
                      <td>{safe(transacao.descricao)}</td>
                      <td className="pr-6">
                        <span className={`${transacao.tipo === 'Receita' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'} w-20 inline-block px-3 py-1 rounded text-center text-xs`}>
                          {transacao.tipo}
                        </span>
                      </td>
                      <td className={`pl-6 font-bold ${transacao.tipo === 'Receita' ? 'text-green-600' : 'text-red-600'}`}>
                        {transacao.tipo === 'Receita' ? '+' : '-'} R$ {Number(transacao.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <div className="flex gap-2 min-w-max items-center">
                          <button
                            className="btn btn-sm transition-all duration-150 min-w-[96px] gap-2 text-gray-700 hover:text-green-600 hover:bg-green-50"
                            onClick={() => { setEditar(transacao); setFormEditar({ ...transacao }); }}
                          >
                            <Edit2 size={15} /> Editar
                          </button>
                          <button className="btn btn-sm" onClick={() => setConfirmDelete({ open: true, id: transacao.id })}>
                            <Trash2 size={15} /> Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      {(editar || criarNovo) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-blue-900/80 to-slate-900/80 backdrop-blur-md" onClick={() => { setEditar(null); setCriarNovo(false); }} />
          <div className="relative w-full max-w-xl bg-gradient-to-br from-white via-blue-50/30 to-white rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col border border-blue-200/50">
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <MdAttachMoney size={24} className="text-white" />
                  </div>
                  {editar ? `Editar Transação #${formEditar.id}` : "Nova Transação"}
                </h2>
                <button onClick={() => { setEditar(null); setCriarNovo(false); }} className="text-white/80 hover:text-white hover:bg-white/20 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:rotate-90">
                  <X size={22} />
                </button>
              </div>
            </div>
            <form onSubmit={editar ? salvarEdicao : salvarNovaTransacao} className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 py-6 overflow-y-auto flex-1 bg-white/50">
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-800 block">Tipo *</label>
                    <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs" required
                      value={editar ? formEditar.tipo : formNovo?.tipo}
                      onChange={(e) => editar ? setFormEditar({ ...formEditar, tipo: e.target.value }) : setFormNovo({ ...formNovo, tipo: e.target.value })}
                      disabled={Boolean(editar && formEditar?.ordem_servico_id && (formEditar?.tipo === 'Receita'))}
                    >
                      <option value="Receita">Receita</option>
                      <option value="Despesa">Despesa</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-800 block">Valor *</label>
                    <div className={`flex items-center border rounded overflow-hidden ${tipoAtual === 'Despesa' ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'}`}>
                      <span className={`px-3 py-2 text-xs ${tipoAtual === 'Despesa' ? 'text-red-700 bg-red-100' : 'text-gray-600 bg-gray-50'}`}>R$</span>
                      <input type="number" step="0.01" className={`flex-1 px-3 py-2 text-xs outline-none ${tipoAtual === 'Despesa' ? 'bg-red-50 text-red-700' : 'bg-white'}`} placeholder="0.00" required
                        value={editar ? (formEditar.valor === 0 || formEditar.valor === null ? "" : formEditar.valor) : (formNovo?.valor === 0 || formNovo?.valor === null ? "" : formNovo?.valor)}
                        onChange={(e) => editar ? setFormEditar({ ...formEditar, valor: e.target.value === "" ? 0 : Number(e.target.value) }) : setFormNovo({ ...formNovo, valor: e.target.value === "" ? 0 : Number(e.target.value) })}
                        disabled={Boolean(editar && formEditar?.ordem_servico_id && (formEditar?.tipo === 'Receita'))}
                      />
                    </div>
                    {(editar ? formEditar.valor : formNovo?.valor) > 0 && (
                      <p className={`text-xs font-semibold mt-1 ${tipoAtual === 'Despesa' ? 'text-red-600' : 'text-green-600'}`}>
                        R$ {(editar ? formEditar.valor : formNovo?.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    )}
                    {Boolean(editar && formEditar?.ordem_servico_id && (formEditar?.tipo === 'Receita')) && (
                      <p className="text-xs text-gray-600 mt-1">Valor controlado pela OS #{formEditar.ordem_servico_id}. Ajuste o desconto/total na ordem de serviço.</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-800 block">Descrição</label>
                    <input type="text" className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs" placeholder="Descrição da transação"
                      value={editar ? formEditar.descricao || "" : formNovo?.descricao || ""}
                      onChange={(e) => editar ? setFormEditar({ ...formEditar, descricao: e.target.value }) : setFormNovo({ ...formNovo, descricao: e.target.value })}
                    />
                  </div>
                  { (editar ? formEditar.tipo : formNovo?.tipo) !== 'Despesa' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-800 block">Ordem de Serviço (opcional)</label>
                      <input type="number" className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs" placeholder="ID da OS"
                        value={editar ? (formEditar.ordem_servico_id === 0 || formEditar.ordem_servico_id === null ? "" : formEditar.ordem_servico_id) : (formNovo?.ordem_servico_id === 0 || formNovo?.ordem_servico_id === null ? "" : formNovo?.ordem_servico_id)}
                        onChange={(e) => editar ? setFormEditar({ ...formEditar, ordem_servico_id: e.target.value ? Number(e.target.value) : null }) : setFormNovo({ ...formNovo, ordem_servico_id: e.target.value ? Number(e.target.value) : null })}
                      />
                      {Boolean(editar && formEditar?.ordem_servico_id) && (
                        <p className="text-xs text-gray-600 mt-1">Vinculada à OS #{formEditar.ordem_servico_id}.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gradient-to-r from-slate-50 via-blue-50/50 to-slate-50 border-t-2 border-slate-200 px-6 py-4 flex-shrink-0">
                <div className="flex items-center justify-end gap-3">
                  <button type="button" className="px-6 py-3 text-slate-700 font-bold border-2 border-slate-300 rounded-xl hover:bg-slate-100 hover:border-slate-400 transition-all duration-300 text-sm"
                    onClick={() => { setEditar(null); setCriarNovo(false); }}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 flex items-center justify-center gap-2 min-w-[140px] text-sm">
                    <Save size={16} /> {editar ? "Salvar" : "Criar"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={confirmDelete.open}
        title="Excluir Transação"
        message={`Deseja realmente excluir esta transação?`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={() => { const id = confirmDelete.id; setConfirmDelete({ open: false, id: null }); excluirTransacao(id); }}
        onCancel={() => setConfirmDelete({ open: false, id: null })}
      />
      {sucessoMsg && (
        <div className="fixed top-20 right-4 bg-green-600 text-white px-4 py-2 rounded shadow">
          {sucessoMsg}
        </div>
      )}
    </div>
  );
}

export default Financeiro;
