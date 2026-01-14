import { useEffect, useState } from "react";
import { MdAssignment } from "react-icons/md";
import { Edit2, Trash2, X, Save, CheckCircle2, ChevronDown, User, Car, DollarSign, AlertCircle, ClipboardList, Calendar, FileText } from "lucide-react";
import Skeleton from "./Skeleton";
import { useDataCache } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "./ConfirmModal";

function Ordem_Servico() {
  const { user } = useAuth();
  const { fetchData, invalidateCache } = useDataCache();
  const [ordens, setOrdens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [editar, setEditar] = useState(null);
  const [formEditar, setFormEditar] = useState(null);
  const [criarNova, setCriarNova] = useState(false);
  const [formNova, setFormNova] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [sucessoMsg, setSucessoMsg] = useState("");

  // Calcular total automaticamente baseado nos serviços selecionados
  const calcularTotal = (servicoIds) => {
    if (!servicoIds || servicoIds.length === 0) return 0;
    const total = servicoIds.reduce((acc, id) => {
      const servico = servicos.find(s => s.id === id);
      return acc + (parseFloat(servico?.preco) || 0);
    }, 0);
    return Number(total);
  };

  useEffect(() => {
    if (!user?.oficina_id) return;
    setOrdens([]);
    setClientes([]);
    setVeiculos([]);
    setServicos([]);

    const fetchDados = async () => {
      try {
        setCarregando(true);
        const data = await fetchData('ordens-servico', `http://localhost:5000/ordens-servico?oficina_id=${user.oficina_id}`);
        setOrdens(data || []);
        const dataClientes = await fetchData('clientes', `http://localhost:5000/clientes?oficina_id=${user.oficina_id}`);
        setClientes(dataClientes || []);
        const dataVeiculos = await fetchData('veiculos', `http://localhost:5000/veiculos?oficina_id=${user.oficina_id}`);
        setVeiculos(dataVeiculos || []);
        const dataServicos = await fetchData('servicos', `http://localhost:5000/servicos?oficina_id=${user.oficina_id}`);
        setServicos(dataServicos || []);
      } finally {
        setCarregando(false);
      }
    };
    fetchDados();
  }, [user?.oficina_id]);

  // Atualizar total automaticamente quando serviços mudarem (apenas para nova ordem)
  useEffect(() => {
    if (criarNova && formNova) {
      const novoTotal = calcularTotal(formNova.servico_ids || []);
      setFormNova(prev => ({ ...prev, total: novoTotal }));
    }
  }, [formNova?.servico_ids, criarNova]);

  const corUltimasOrdens = (status) => {
    if (status === "Aberta") return "bg-yellow-400";
    if (status === "Em Andamento") return "bg-blue-600 text-white";
    return "bg-green-600 text-white";
  };

  const salvarEdicao = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/ordens-servico/${formEditar.ordem_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: formEditar.status,
          total: Number(formEditar.total) || 0,
          observacao: formEditar.observacao,
          oficina_id: user.oficina_id
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.erro || `Erro ${response.status}: ${response.statusText}`;
        alert(errorMsg);
        throw new Error(errorMsg);
      }

      // Atualiza imediatamente na UI para evitar esperar nova requisição
      setOrdens(prev => prev.map((o) =>
        o.ordem_id === formEditar.ordem_id
          ? { ...o, status: formEditar.status, total: Number(formEditar.total) || 0, observacao: formEditar.observacao }
          : o
      ));

      // Busca direto do backend para garantir estado fresco
      const respList = await fetch(`http://localhost:5000/ordens-servico?oficina_id=${user.oficina_id}`);
      const data = await respList.json();
      setOrdens(data || []);

      // Zera cache para próximas telas usarem dados atualizados
      invalidateCache('ordens-servico');
      // Invalida também o financeiro, pois status/total da OS ajusta receita vinculada
      invalidateCache('financeiro');
      invalidateCache('financeiro-resumo');
      setEditar(null);
      setFormEditar(null);
    } catch (error) { 
    }
  };

  const salvarNovaOrdem = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Validação antes de enviar
    if (!formNova.cliente_id || formNova.cliente_id === "") {
      alert("Por favor, selecione um cliente!");
      return;
    }
    
    if (!formNova.veiculo_id || formNova.veiculo_id === "") {
      alert("Por favor, selecione um veículo!");
      return;
    }
    
    try {
      const response = await fetch("http://localhost:5000/ordens-servico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id: formNova.cliente_id,
          veiculo_id: formNova.veiculo_id,
          servico_ids: formNova.servico_ids || [],
          status: formNova.status,
          total: formNova.total || 0,
          observacao: formNova.observacao || "",
          oficina_id: user.oficina_id
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.erro || "Erro ao criar ordem");
        return;
      }
      
      invalidateCache('ordens-servico');
      // Pode impactar financeiro se criada como Finalizada
      invalidateCache('financeiro');
      invalidateCache('financeiro-resumo');
      
      // Faz fetch fresh (sem cache) para obter a ordem recém-criada
      const response2 = await fetch(`http://localhost:5000/ordens-servico?oficina_id=${user.oficina_id}`);
      const data = await response2.json();
      setOrdens(data || []);
      
      setCriarNova(false);
      setFormNova(null);
      alert("Ordem criada com sucesso!");
    } catch (error) { 
      alert("Erro ao criar ordem: " + error.message);
    }
  };

  const excluirOrdem = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/ordens-servico/${id}?oficina_id=${user.oficina_id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) { alert(data.erro); return; }
      
      // Atualiza imediatamente na UI sem esperar novo fetch
      setOrdens(prev => prev.filter(o => o.ordem_id !== id));
      
      // Invalida cache e recarrega em background
      invalidateCache('ordens-servico');
      invalidateCache('financeiro');
      invalidateCache('financeiro-resumo');
      
      setSucessoMsg("Ordem de serviço excluída com sucesso");
      setTimeout(() => setSucessoMsg(""), 2000);
    } catch (error) {}
  };


  // Obter a data atual formatada
  const obterDataAtual = () => {
    const hoje = new Date();
    return hoje.toLocaleDateString('pt-BR');
  };

  // Formatar valor monetário
  const formatarValor = (valor) => {
    if (!valor) return "0,00";
    const num = parseFloat(valor);
    return num.toFixed(2).replace('.', ',');
  };

  // Formatar tempo (assume que vem em minutos do banco)
  const formatarTempo = (tempo) => {
    if (!tempo) return "0m";
    const minutos = parseFloat(tempo);
    
    // Se for 60 ou mais minutos, converter para horas
    if (minutos >= 60) {
      const horas = Math.floor(minutos / 60);
      const mins = minutos % 60;
      return mins > 0 ? `${horas}h ${mins}m` : `${horas}h`;
    }
    
    // Menos de 60 minutos
    return `${minutos}m`;
  };

  return (
    <div className="table-os">
      {/* MANTENDO SUA TABELA ORIGINAL EXATAMENTE COMO ESTAVA */}
      <div className="dashboard-table mb-6 mt-20">
        <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-200 p-4">
          <h3 className="ultimas-ordens text-lg font-bold mb-4 flex items-center justify-between">
            <span>Ordens de Serviço</span>
            <button 
              onClick={() => {
                setCriarNova(true);
                setFormNova({
                  cliente_id: "",
                  veiculo_id: "",
                  servico_ids: [],
                  status: "Aberta",
                  total: "",
                  observacao: ""
                });
              }}
              className="btn btn-sm bg-blue-500 text-white px-6">
              + Nova Ordem
            </button>
          </h3>

          {carregando ? (
            <Skeleton />
          ) : (
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>OS</th>
                  <th>Cliente</th>
                  <th>Veículo</th>
                  <th className="pr-6">Serviço</th>
                  <th className="pl-6">Status</th>
                  <th>Total</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {ordens.map((ordem) => (
                  <tr key={ordem.ordem_id}>
                    <th>{ordem.ordem_id}</th>
                    <td>{ordem.nome_cliente}</td>
                    <td>
                      {ordem.marca_veiculo} - {ordem.modelo_veiculo}
                    </td>
                    <td className="pr-6">{ordem.servico_nome}</td>
                    <td className="pl-6">
                      <span
                        className={`${corUltimasOrdens(
                          ordem.status
                        )} w-32 inline-block px-3 py-1 rounded text-center`}
                      >
                        {ordem.status}
                      </span>
                    </td>
                    <td>R$ {ordem.total}</td>
                    <td>
                      <div className="flex gap-2 min-w-max items-center">
                        <button
                          className="btn btn-sm transition-all duration-150 min-w-[96px] gap-2 text-gray-700 hover:text-green-600 hover:bg-green-50"
                          onClick={() => {
                            setEditar(ordem);
                            setFormEditar({ ...ordem });
                          }}
                        >
                          <Edit2 size={15} /> Editar
                        </button>

                        <button
                          disabled={ordem.tem_financeiro > 0}
                          className="btn btn-sm"
                          title={
                            ordem.tem_financeiro > 0
                              ? "OS possui financeiro vinculado"
                              : "Excluir"
                          }
                          onClick={() => setConfirmDelete({ open: true, id: ordem.ordem_id })}
                        >
                          <Trash2 size={15} />
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL NOVO - Design Moderno e Profissional */}
      {(editar || criarNova) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop com blur */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-blue-900/80 to-slate-900/80 backdrop-blur-md" 
            onClick={() => { setEditar(null); setCriarNova(false); }} 
          />
          
          {/* Modal Container */}
          <div className="relative w-full max-w-3xl bg-gradient-to-br from-white via-blue-50/40 to-white rounded-[28px] shadow-[0_25px_60px_-18px_rgba(0,0,0,0.35)] overflow-hidden max-h-[90vh] flex flex-col border border-blue-200/60 backdrop-blur-sm animate-in zoom-in-95 duration-300 ring-1 ring-white/60">
            
            {/* Header com gradiente */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 px-6 py-5 flex-shrink-0 shadow-lg">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-xl border border-white/25">
                    <MdAssignment size={24} className="text-white" />
                  </div>
                  <span className="text-shadow-lg drop-shadow-[0_6px_16px_rgba(0,0,0,0.35)]">{editar ? `Editar Ordem #${formEditar.ordem_id}` : "Nova Ordem de Serviço"}</span>
                </h2>
                <button 
                  onClick={() => { setEditar(null); setCriarNova(false); }}
                  className="text-white/80 hover:text-white hover:bg-white/20 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:rotate-90 hover:bg-white/30 hover:shadow-lg"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={editar ? salvarEdicao : salvarNovaOrdem} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-5 overflow-y-auto flex-1 bg-gradient-to-b from-white/85 via-blue-50/30 to-white/85 backdrop-blur-[2px]">
                {/* Grid Principal - 2 colunas */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  
                  {/* Coluna 1 & 2: Informações Principais (2/3 do espaço) */}
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      Informações Básicas
                    </h3>

                    {/* Informações Principais */}
                    <div className="bg-white/80 rounded-xl border border-slate-200 p-4 space-y-3 shadow-sm ring-1 ring-slate-100/60 transition-all duration-200">
                      {/* Cliente */}
                      <div className="group">
                        <label className="block">
                          <span className="text-xs font-semibold font-sans text-slate-600 flex items-center gap-1 mb-1.5 whitespace-nowrap">
                            <User size={12} className="text-slate-400 flex-shrink-0" />
                            <span className="flex items-center gap-1 whitespace-nowrap">Cliente <span className="text-red-500">*</span></span>
                          </span>
                        </label>
                        <div className="relative">
                          <select
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all appearance-none hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium outline-none"
                            value={editar ? formEditar.cliente_id : formNova.cliente_id}
                            onChange={(e) => editar 
                              ? setFormEditar({ ...formEditar, cliente_id: e.target.value })
                              : setFormNova({ ...formNova, cliente_id: e.target.value })
                            }
                            required={criarNova}
                            disabled={editar}
                          >
                            <option value="">Selecione um cliente</option>
                            {clientes.map(c => (
                              <option key={c.id} value={c.id}>{c.nome}</option>
                            ))}
                          </select>
                          <ChevronDown size={12} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* Veículo */}
                      <div className="group">
                        <label className="block">
                          <span className="text-xs font-semibold font-sans text-slate-600 flex items-center gap-1 mb-1.5 whitespace-nowrap">
                            <Car size={12} className="text-slate-400 flex-shrink-0" />
                            <span className="flex items-center gap-1 whitespace-nowrap">Veículo <span className="text-red-500">*</span></span>
                          </span>
                        </label>
                        <div className="relative">
                          <select
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all appearance-none hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium outline-none"
                            value={editar ? formEditar.veiculo_id : formNova.veiculo_id}
                            onChange={(e) => editar 
                              ? setFormEditar({ ...formEditar, veiculo_id: e.target.value })
                              : setFormNova({ ...formNova, veiculo_id: e.target.value })
                            }
                            required={criarNova}
                            disabled={editar}
                          >
                            <option value="">Selecione um veículo</option>
                            {veiculos.map(v => (
                              <option key={v.id} value={v.id}>
                                {v.marca} - {v.modelo}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={12} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* Grid de 2 colunas para dados secundários */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Data */}
                        <div>
                          <label className="block">
                            <span className="text-xs font-semibold font-sans text-slate-600 flex items-center gap-1 mb-1.5 whitespace-nowrap">
                              <Calendar size={12} className="text-slate-400 flex-shrink-0" />
                              <span className="whitespace-nowrap">Data</span>
                            </span>
                          </label>
                          <input
                            type="text"
                            readOnly
                            className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed font-medium text-xs"
                            value={obterDataAtual()}
                          />
                        </div>

                        {/* Status */}
                        <div>
                          <label className="block">
                            <span className="text-xs font-semibold font-sans text-slate-600 flex items-center gap-1 mb-1.5 whitespace-nowrap">
                              <AlertCircle size={12} className="text-slate-400 flex-shrink-0" />
                              <span className="whitespace-nowrap">Status</span>
                            </span>
                          </label>
                          <div className="relative">
                            <select
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all appearance-none hover:border-slate-300 font-medium outline-none"
                              value={editar ? formEditar.status : formNova.status}
                              onChange={(e) => editar 
                                ? setFormEditar({ ...formEditar, status: e.target.value })
                                : setFormNova({ ...formNova, status: e.target.value })
                              }
                            >
                              <option value="Aberta">Aberta</option>
                              <option value="Em Andamento">Em Andamento</option>
                              <option value="Finalizada">Finalizada</option>
                            </select>
                            <ChevronDown size={12} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      {/* Valor Total */}
                      <div>
                        <label className="block">
                          <span className="text-xs font-semibold font-sans text-slate-600 flex items-center gap-1 mb-1.5 whitespace-nowrap">
                            <DollarSign size={12} className="text-slate-400 flex-shrink-0" />
                            <span className="flex items-center gap-1 whitespace-nowrap">Valor Total (R$) {criarNova && <span className="text-[11px] text-slate-500 font-normal">(Editável para desconto)</span>}</span>
                          </span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="99999999.99"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs font-bold focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all hover:border-slate-300 outline-none"
                          placeholder="0,00"
                          value={editar ? (formEditar.total === 0 ? "" : formEditar.total) : (formNova?.total === 0 ? "" : formNova?.total || "")}
                          onChange={(e) => {
                            const valor = e.target.value === "" ? 0 : parseFloat(e.target.value);
                            if (valor > 99999999.99) {
                              alert("Valor total máximo permitido: R$ 99.999.999,99");
                              return;
                            }
                            editar
                              ? setFormEditar({ ...formEditar, total: valor })
                              : setFormNova({ ...formNova, total: valor });
                          }}
                        />
                        {criarNova && formNova?.servico_ids?.length > 0 && (
                          <p className="text-xs text-blue-600 font-semibold mt-1">
                            💡 Valor dos serviços: R$ {Number(calcularTotal(formNova.servico_ids)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Serviços - Apenas para Nova Ordem */}
                    {criarNova && (
                      <div className="bg-white/80 rounded-xl border border-slate-200 p-4 shadow-sm ring-1 ring-slate-100/60 transition-all duration-200">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xs font-semibold font-sans text-slate-700 flex items-center gap-1 whitespace-nowrap">
                            <FileText size={12} className="text-slate-400 flex-shrink-0" />
                            <span className="whitespace-nowrap">Serviços</span>
                          </h3>
                          {formNova?.servico_ids?.length > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[26px] px-2.5 py-1 text-sm font-bold text-white bg-blue-600 rounded-full tracking-tight leading-none shadow-sm">
                              {formNova.servico_ids.length}
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50/80">
                          {servicos.map((s) => {
                            const isChecked = formNova.servico_ids?.includes(s.id);
                            return (
                              <div key={s.id} className="relative">
                                <input
                                  type="checkbox"
                                  id={`servico-${s.id}`}
                                  className="hidden peer"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const ids = e.target.checked 
                                      ? [...(formNova.servico_ids || []), s.id]
                                      : (formNova.servico_ids || []).filter(id => id !== s.id);
                                    setFormNova({ ...formNova, servico_ids: ids });
                                  }}
                                />
                                <label 
                                  htmlFor={`servico-${s.id}`}
                                  className={`block p-2 border rounded-lg cursor-pointer transition-all hover:shadow-sm peer-checked:shadow-md ${
                                    isChecked 
                                      ? 'border-blue-400 bg-blue-50' 
                                      : 'border-slate-200 bg-white hover:border-slate-300'
                                  }`}
                                >
                                  <div className="flex items-start gap-2">
                                    <div className={`w-3.5 h-3.5 border rounded-md mt-0.5 flex items-center justify-center transition-all flex-shrink-0 ${
                                      isChecked 
                                        ? 'bg-blue-600 border-blue-600' 
                                        : 'border-slate-300'
                                    }`}>
                                      {isChecked && <CheckCircle2 size={9} className="text-white" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-bold text-slate-900 text-xs truncate mb-0.5">
                                        {s.nome}
                                      </div>
                                      <div className="flex items-center justify-between gap-1">
                                        <span className="text-xs font-bold text-blue-600">
                                          R$ {formatarValor(s.preco)}
                                        </span>
                                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-bold">
                                          {formatarTempo(s.duracao)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Coluna 3: Observações e Info (1/3 do espaço) */}
                  <div className="lg:col-span-1 space-y-3">
                    {/* Caixa de Observações */}
                    <div className="bg-white/80 rounded-xl border border-slate-200 p-4 shadow-sm ring-1 ring-slate-100/60 transition-all duration-200">
                      <label className="block">
                        <span className="text-xs font-semibold font-sans text-slate-600 flex items-center gap-1 mb-1.5 whitespace-nowrap">
                          <FileText size={12} className="text-slate-400 flex-shrink-0" />
                          <span className="whitespace-nowrap">Observações</span>
                        </span>
                      </label>
                      
                      <textarea
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all hover:border-slate-300 resize-none outline-none"
                        placeholder="Anotações adicionais..."
                        rows="4"
                        value={editar ? (formEditar.observacao || "") : (formNova.observacao || "")}
                        onChange={(e) => editar
                          ? setFormEditar({ ...formEditar, observacao: e.target.value })
                          : setFormNova({ ...formNova, observacao: e.target.value })
                        }
                        maxLength={1000}
                      />
                      <div className="text-right text-xs text-slate-500 font-bold mt-1">
                        {editar 
                          ? (formEditar.observacao?.length || 0) 
                          : (formNova.observacao?.length || 0)
                        }/1000
                      </div>
                    </div>

                    {/* Info Card */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-700 font-bold flex items-start gap-1.5">
                        <span className="text-red-600 leading-none mt-0">*</span>
                        <span>Campos obrigatórios</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gradient-to-r from-slate-50 via-blue-50/50 to-slate-50 border-t border-slate-200 px-6 py-3 flex-shrink-0 shadow-inner">
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    className="min-w-[126px] px-5 py-2.5 text-slate-700 font-bold border border-slate-300 rounded-lg hover:bg-slate-100 hover:border-slate-400 transition-all duration-300 text-sm hover:shadow-md active:scale-95"
                    onClick={() => { setEditar(null); setCriarNova(false); }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="min-w-[150px] px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 flex items-center justify-center gap-2 text-sm active:scale-95"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"/><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd"/></svg>
                    {editar ? "Salvar" : "Criar"}
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
        title="Excluir Ordem de Serviço"
        message={`Deseja realmente excluir esta ordem de serviço?`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={() => { const id = confirmDelete.id; setConfirmDelete({ open: false, id: null }); excluirOrdem(id); }}
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

export default Ordem_Servico;