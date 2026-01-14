import { useEffect, useState } from "react";
import { MdInventory2 } from "react-icons/md";
import { Edit2, Trash2, X, Save } from "lucide-react";
import Skeleton from "./Skeleton";
import { useDataCache } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "./ConfirmModal";

function Pecas() {
  const { user } = useAuth();
  const { fetchData, invalidateCache } = useDataCache();
  const [pecas, setPecas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [editar, setEditar] = useState(null);
  const [formEditar, setFormEditar] = useState(null);
  const [criarNovo, setCriarNovo] = useState(false);
  const [formNovo, setFormNovo] = useState(null);
  const [stats, setStats] = useState({
    totalPecas: 0,
    baixoEstoque: 0,
    valorTotal: 0,
  });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, name: null });
  const [sucessoMsg, setSucessoMsg] = useState("");

  const atualizarStats = (data) => {
    const totalPecas = data?.length || 0;
    const baixoEstoque = (data || []).filter(p => (p.quantidade || 0) <= (p.minimo || 0)).length;
    const valorTotal = (data || []).reduce((sum, p) => sum + ((p.quantidade || 0) * (p.preco_unitario || 0)), 0);
    setStats({ totalPecas, baixoEstoque, valorTotal });
  };

  const carregarDados = async (useFresh = false) => {
    try {
      setCarregando(true);
      const fetchPecas = useFresh
        ? async () => (await fetch(`http://localhost:5000/pecas?oficina_id=${user.oficina_id}`)).json()
        : async () => await fetchData('pecas', `http://localhost:5000/pecas?oficina_id=${user.oficina_id}`);

      const data = await fetchPecas();
      setPecas(data || []);
      atualizarStats(data);
    } catch (error) {    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (!user?.oficina_id) return;
    setPecas([]);
    setStats({ totalPecas: 0, baixoEstoque: 0, valorTotal: 0 });
    carregarDados();
  }, [user?.oficina_id]);

  const salvarNovoPeca = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/pecas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formNovo, oficina_id: user.oficina_id }),
      });
      if (!response.ok) { 
        const errorData = await response.json();
        alert(`Erro ao criar peça: ${errorData.erro || 'Erro desconhecido'}`); 
        return; 
      }
      invalidateCache('pecas');
      await carregarDados(true);
      setCriarNovo(false);
      setFormNovo(null);
    } catch (error) { 
      alert(`Erro: ${error.message}`);
    }
  };

  const salvarEdicao = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/pecas/${formEditar.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formEditar, oficina_id: user.oficina_id }),
      });
      if (!response.ok) { alert("Erro ao editar peça"); return; }
      setPecas(prev => {
        const updated = prev.map(p => p.id === formEditar.id ? { ...p, ...formEditar } : p);
        atualizarStats(updated);
        return updated;
      });

      invalidateCache('pecas');
      await carregarDados(true);
      setEditar(null);
      setFormEditar(null);
    } catch (error) { }
  };

  const excluirPeca = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/pecas/${id}?oficina_id=${user.oficina_id}`, { method: "DELETE" });
      if (!response.ok) { alert("Erro ao excluir"); return; }
      setPecas(prev => {
        const updated = prev.filter(p => p.id !== id);
        atualizarStats(updated);
        return updated;
      });

      invalidateCache('pecas');
      await carregarDados(true);
      setSucessoMsg("Peça excluída com sucesso");
      setTimeout(() => setSucessoMsg(""), 2000);
    } catch (error) { }
  };

  const safe = (value) => (value === null || value === undefined || value === "" ? "-" : value);
  const getStatusColor = (status) => {
    const cleanStatus = (status || "").trim().toLowerCase();
    
    if (cleanStatus === "sem estoque") return "bg-red-600 text-white";
    if (cleanStatus === "baixo") return "bg-yellow-400 text-black";
    if (cleanStatus === "em estoque") return "bg-green-600 text-white";
    
    return "bg-gray-400 text-white";
  };

  return (
    <div className="pecas-page">
      {/* CARDS */}
      <div className="dashboard-header w-full flex gap-6 mb-6 mt-20">
        <div className="os-aberta bg-base-200 p-4 rounded-box">
          <p>Total de Peças</p>
          <p className="numero text-xl font-bold">{stats.totalPecas}</p>
        </div>
        <div className="em-andamento bg-base-200 p-4 rounded-box">
          <p>Itens com Estoque Baixo</p>
          <p className="numero text-xl font-bold">{stats.baixoEstoque}</p>
        </div>
        <div className="faturamento bg-base-200 p-4 rounded-box">
          <p>Valor Total em Estoque</p>
          <p className="numero text-xl font-bold">R$ {stats.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* TABELA */}
      <div className="dashboard-table mb-6">
        <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-200 p-4">
          <h3 className="ultimas-ordens text-lg font-bold mb-4 flex items-center justify-between">
            <span>Peças</span>
            <button 
              onClick={() => {
                setCriarNovo(true);
                setFormNovo({ nome: "", codigo: "", quantidade: 0, minimo: 0, preco_unitario: 0 });
              }} 
              className="btn btn-sm bg-blue-500 text-white px-6">
              + Nova Peça
            </button>
          </h3>

          {carregando ? (
            <Skeleton />
          ) : (
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Peça</th>
                  <th>Código</th>
                  <th>Qtd</th>
                  <th className="pr-6">Mín.</th>
                  <th className="pl-6">Preço Unit.</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {(pecas || []).map((peca) => (
                  <tr key={peca.id}>
                    <td>{safe(peca.nome)}</td>
                    <td>{safe(peca.codigo)}</td>
                    <td>{safe(peca.quantidade)}</td>
                    <td className="pr-6">{safe(peca.minimo)}</td>
                    <td className="pl-6">R$ {safe(peca.preco_unitario)}</td>
                    <td>
                      <span className={`${getStatusColor(peca.status)} w-24 inline-block px-3 py-1 rounded text-center text-xs`}>
                        {peca.status || "Em Estoque"}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2 min-w-max items-center">
                        <button
                          className="btn btn-sm transition-all duration-150 min-w-[96px] gap-2 text-gray-700 hover:text-green-600 hover:bg-green-50"
                          onClick={() => { setEditar(peca); setFormEditar({ ...peca }); }}
                        >
                          <Edit2 size={15} /> Editar
                        </button>
                        <button className="btn btn-sm" onClick={() => setConfirmDelete({ open: true, id: peca.id, name: peca.nome })}>
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
                    <MdInventory2 size={24} className="text-white" />
                  </div>
                  {editar ? `Editar Peça #${formEditar.id}` : "Nova Peça"}
                </h2>
                <button onClick={() => { setEditar(null); setCriarNovo(false); }} className="text-white/80 hover:text-white hover:bg-white/20 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:rotate-90">
                  <X size={22} />
                </button>
              </div>
            </div>
            <form onSubmit={editar ? salvarEdicao : salvarNovoPeca} className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 py-6 overflow-y-auto flex-1 bg-white/50">
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-800 block">Peça *</label>
                      <input type="text" className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs" placeholder="Nome"
                        value={editar ? formEditar.nome || "" : formNovo?.nome || ""} required
                        onChange={(e) => editar ? setFormEditar({ ...formEditar, nome: e.target.value }) : setFormNovo({ ...formNovo, nome: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-800 block">Código *</label>
                      <input type="text" className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs" placeholder="Código"
                        value={editar ? formEditar.codigo || "" : formNovo?.codigo || ""} required
                        onChange={(e) => editar ? setFormEditar({ ...formEditar, codigo: e.target.value }) : setFormNovo({ ...formNovo, codigo: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-800 block">Quantidade</label>
                      <input type="number" className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs" placeholder="0"
                        value={editar ? (formEditar.quantidade === 0 || formEditar.quantidade === null ? "" : formEditar.quantidade) : (formNovo?.quantidade === 0 || formNovo?.quantidade === null ? "" : formNovo?.quantidade)}
                        onChange={(e) => editar ? setFormEditar({ ...formEditar, quantidade: e.target.value === "" ? 0 : Number(e.target.value) }) : setFormNovo({ ...formNovo, quantidade: e.target.value === "" ? 0 : Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-800 block">Quantidade Mín.</label>
                      <input type="number" className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs" placeholder="0"
                        value={editar ? (formEditar.minimo === 0 || formEditar.minimo === null ? "" : formEditar.minimo) : (formNovo?.minimo === 0 || formNovo?.minimo === null ? "" : formNovo?.minimo)}
                        onChange={(e) => editar ? setFormEditar({ ...formEditar, minimo: e.target.value === "" ? 0 : Number(e.target.value) }) : setFormNovo({ ...formNovo, minimo: e.target.value === "" ? 0 : Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-800 block">Preço Unitário</label>
                    <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                      <span className="px-3 py-2 text-xs text-gray-600 bg-gray-50">R$</span>
                      <input type="number" step="0.01" className="flex-1 px-3 py-2 bg-white text-xs outline-none" placeholder="0.00"
                        value={editar ? (formEditar.preco_unitario === 0 || formEditar.preco_unitario === null ? "" : formEditar.preco_unitario) : (formNovo?.preco_unitario === 0 || formNovo?.preco_unitario === null ? "" : formNovo?.preco_unitario)}
                        onChange={(e) => editar ? setFormEditar({ ...formEditar, preco_unitario: e.target.value === "" ? 0 : Number(e.target.value) }) : setFormNovo({ ...formNovo, preco_unitario: e.target.value === "" ? 0 : Number(e.target.value) })}
                      />
                    </div>
                    {(editar ? formEditar.preco_unitario : formNovo?.preco_unitario) > 0 && (
                      <p className="text-xs text-green-600 font-semibold mt-1">R$ {(editar ? formEditar.preco_unitario : formNovo?.preco_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    )}
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
        title="Excluir Peça"
        message={`Deseja realmente excluir a peça \"${confirmDelete.name || ''}\"?`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={() => { const id = confirmDelete.id; setConfirmDelete({ open: false, id: null, name: null }); excluirPeca(id); }}
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

export default Pecas;
