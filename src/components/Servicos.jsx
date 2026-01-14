import { useEffect, useState } from "react";
import { MdBuild } from "react-icons/md";
import { Edit2, Trash2, X, Save } from "lucide-react";
import Skeleton from "./Skeleton";
import { useDataCache } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "./ConfirmModal";

function Servicos() {
  const { user } = useAuth();
  const { fetchData, invalidateCache } = useDataCache();
  const [servicos, setServicos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [editar, setEditar] = useState(null);
  const [formEditar, setFormEditar] = useState(null);
  const [criarNovo, setCriarNovo] = useState(false);
  const [formNovo, setFormNovo] = useState(null);
  const [stats, setStats] = useState({
    totalServicos: 0,
    servicosAtivos: 0,
    categorias: 0,
  });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, name: null });
  const [sucessoMsg, setSucessoMsg] = useState("");

  const atualizarStats = (data) => {
    const totalServicos = data?.length || 0;
    const servicosAtivos = (data || []).filter(s => s.status === "Ativo").length;
    const categorias = new Set((data || []).map(s => s.categoria).filter(Boolean)).size;
    setStats({ totalServicos, servicosAtivos, categorias });
  };

  const carregarDados = async (useFresh = false) => {
    try {
      setCarregando(true);
      const fetchServicos = useFresh
        ? async () => (await fetch(`http://localhost:5000/servicos/list?oficina_id=${user.oficina_id}`)).json()
        : async () => await fetchData('servicos-list', `http://localhost:5000/servicos/list?oficina_id=${user.oficina_id}`);

      const data = await fetchServicos();
      setServicos(data || []);
      atualizarStats(data);
    } catch (error) {    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (!user?.oficina_id) return;
    setServicos([]);
    setStats({ totalServicos: 0, servicosAtivos: 0, categorias: 0 });
    carregarDados();
  }, [user?.oficina_id]);

  const salvarNovoServico = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/servicos/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formNovo, oficina_id: user.oficina_id }),
      });
      if (!response.ok) { alert("Erro ao criar serviço"); return; }
      invalidateCache('servicos-list');
      invalidateCache('servicos');
      await carregarDados(true);
      setCriarNovo(false);
      setFormNovo(null);
    } catch (error) { }
  };

  const salvarEdicao = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/servicos/list/${formEditar.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formEditar, oficina_id: user.oficina_id }),
      });
      if (!response.ok) { alert("Erro ao editar serviço"); return; }
      setServicos(prev => {
        const updated = prev.map(s => s.id === formEditar.id ? { ...s, ...formEditar } : s);
        atualizarStats(updated);
        return updated;
      });

      invalidateCache('servicos-list');
      invalidateCache('servicos');
      await carregarDados(true);
      setEditar(null);
      setFormEditar(null);
    } catch (error) { }
  };

  const excluirServico = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/servicos/list/${id}?oficina_id=${user.oficina_id}`, { method: "DELETE" });
      if (!response.ok) { alert("Erro ao excluir"); return; }
      setServicos(prev => {
        const updated = prev.filter(s => s.id !== id);
        atualizarStats(updated);
        return updated;
      });

      invalidateCache('servicos-list');
      invalidateCache('servicos');
      await carregarDados(true);
      setSucessoMsg("Serviço excluído com sucesso");
      setTimeout(() => setSucessoMsg(""), 2000);
    } catch (error) { }
  };

  const safe = (value) => (value === null || value === undefined || value === "" ? "-" : value);

  return (
    <div className="servicos-page">
      {/* CARDS */}
      <div className="dashboard-header w-full flex gap-6 mb-6 mt-20">
        <div className="total-servicos bg-base-200 p-4 rounded-box">
          <p>Total de Serviços</p>
          <p className="numero text-xl font-bold">{stats.totalServicos}</p>
        </div>
        <div className="servicos-ativos bg-base-200 p-4 rounded-box">
          <p>Serviços Ativos</p>
          <p className="numero text-xl font-bold">{stats.servicosAtivos}</p>
        </div>
        <div className="categorias bg-base-200 p-4 rounded-box">
          <p>Categorias</p>
          <p className="numero text-xl font-bold">{stats.categorias}</p>
        </div>
      </div>
      {/* TABELA */}
      <div className="dashboard-table mb-6">
        <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-200 p-4">
          <h3 className="ultimas-ordens text-lg font-bold mb-4 flex items-center justify-between">
            <span>Serviços</span>
            <button 
              onClick={() => {
                setCriarNovo(true);
                setFormNovo({ nome: "", categoria: "", tempo_estimado: "", preco_base: "", status: "Ativo" });
              }} 
              className="btn btn-sm bg-blue-500 text-white px-6">
              + Novo Serviço
            </button>
          </h3>

          {carregando ? (
            <Skeleton />
          ) : (
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Serviço</th>
                  <th>Categoria</th>
                  <th>Tempo Est.</th>
                  <th className="pr-6">Preço Base</th>
                  <th className="pl-6">Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {(servicos || []).map((servico) => (
                  <tr key={servico.id}>
                    <td>{safe(servico.nome)}</td>
                    <td>{safe(servico.categoria)}</td>
                    <td>{safe(servico.tempo_estimado)}</td>
                    <td className="pr-6">R$ {safe(servico.preco_base)}</td>
                    <td className="pl-6">
                      <span className={`${servico.status === "Ativo" ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'} w-20 inline-block px-3 py-1 rounded text-center text-xs`}>
                        {servico.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2 min-w-max items-center">
                        <button
                          className="btn btn-sm transition-all duration-150 min-w-[96px] gap-2 text-gray-700 hover:text-green-600 hover:bg-green-50"
                          onClick={() => { setEditar(servico); setFormEditar({ ...servico }); }}
                        >
                          <Edit2 size={15} /> Editar
                        </button>
                        <button className="btn btn-sm" onClick={() => setConfirmDelete({ open: true, id: servico.id, name: servico.nome })}>
                          <Trash2 size={15} /> Excluir
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

      {/* MODAL */}
      {(editar || criarNovo) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-blue-900/80 to-slate-900/80 backdrop-blur-md" onClick={() => { setEditar(null); setCriarNovo(false); }} />
          <div className="relative w-full max-w-xl bg-gradient-to-br from-white via-blue-50/30 to-white rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col border border-blue-200/50">
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <MdBuild size={24} className="text-white" />
                  </div>
                  {editar ? `Editar Serviço #${formEditar.id}` : "Novo Serviço"}
                </h2>
                <button onClick={() => { setEditar(null); setCriarNovo(false); }} className="text-white/80 hover:text-white hover:bg-white/20 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:rotate-90">
                  <X size={22} />
                </button>
              </div>
            </div>
            <form onSubmit={editar ? salvarEdicao : salvarNovoServico} className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 py-6 overflow-y-auto flex-1 bg-white/50">
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-800 block">Serviço *</label>
                    <input type="text" className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs" placeholder="Nome do serviço"
                      value={editar ? formEditar.nome || "" : formNovo?.nome || ""} required
                      onChange={(e) => editar ? setFormEditar({ ...formEditar, nome: e.target.value }) : setFormNovo({ ...formNovo, nome: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-800 block">Categoria</label>
                    <input type="text" className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs" placeholder="Categoria"
                      value={editar ? formEditar.categoria || "" : formNovo?.categoria || ""}
                      onChange={(e) => editar ? setFormEditar({ ...formEditar, categoria: e.target.value }) : setFormNovo({ ...formNovo, categoria: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-800 block">Tempo Estimado</label>
                    <div className="flex gap-3">
                      <input type="number" className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-xs" placeholder="0"
                        value={editar ? formEditar.tempo_estimado?.replace(/[^\d]/g, '') || "" : formNovo?.tempo_estimado?.replace(/[^\d]/g, '') || ""}
                        onChange={(e) => {
                          const numValue = e.target.value;
                          const unidade = editar ? (formEditar.tempo_estimado?.includes('h') ? 'h' : 'min') : (formNovo?.tempo_estimado?.includes('h') ? 'h' : 'min');
                          const valor = numValue ? `${numValue} ${unidade}` : '';
                          editar ? setFormEditar({ ...formEditar, tempo_estimado: valor }) : setFormNovo({ ...formNovo, tempo_estimado: valor });
                        }}
                      />
                      <select className="px-3 py-2 bg-white border border-gray-300 rounded text-xs w-24"
                        value={editar ? (formEditar.tempo_estimado?.includes('h') ? 'h' : 'min') : (formNovo?.tempo_estimado?.includes('h') ? 'h' : 'min')}
                        onChange={(e) => {
                          const numValue = editar ? formEditar.tempo_estimado?.replace(/[^\d]/g, '') : formNovo?.tempo_estimado?.replace(/[^\d]/g, '');
                          const valor = numValue ? `${numValue} ${e.target.value}` : '';
                          editar ? setFormEditar({ ...formEditar, tempo_estimado: valor }) : setFormNovo({ ...formNovo, tempo_estimado: valor });
                        }}
                      >
                        <option value="min">min</option>
                        <option value="h">h</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-800 block">Preço Base (R$)</label>
                    <input type="number" step="0.01" className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs" placeholder="0,00"
                      value={editar ? formEditar.preco_base || "" : formNovo?.preco_base || ""}
                      onChange={(e) => editar ? setFormEditar({ ...formEditar, preco_base: e.target.value }) : setFormNovo({ ...formNovo, preco_base: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-800 block">Status</label>
                    <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs"
                      value={editar ? formEditar.status : formNovo?.status}
                      onChange={(e) => editar ? setFormEditar({ ...formEditar, status: e.target.value }) : setFormNovo({ ...formNovo, status: e.target.value })}
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  </div>
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
        title="Excluir Serviço"
        message={`Deseja realmente excluir o serviço \"${confirmDelete.name || ''}\"?`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={() => { const id = confirmDelete.id; setConfirmDelete({ open: false, id: null, name: null }); excluirServico(id); }}
        onCancel={() => setConfirmDelete({ open: false, id: null, name: null })}
      />
      {sucessoMsg && (
        <div className="fixed top-20 right-4 bg-green-600 text-white px-4 py-2 rounded shadow">
          {sucessoMsg}
        </div>
      )}
    </div>
  );
}

export default Servicos;
