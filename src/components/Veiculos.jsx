import { useEffect, useState } from "react";
import { MdDirectionsCar } from "react-icons/md";
import { Edit2, Trash2, X, Save, ChevronDown } from "lucide-react";
import Skeleton from "./Skeleton";
import { useDataCache } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "./ConfirmModal";

function Veiculos() {
  const { user } = useAuth();
  const { fetchData, invalidateCache } = useDataCache();
  const [veiculos, setVeiculos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [clientes, setClientes] = useState([]);
  const [editar, setEditar] = useState(null);
  const [formEditar, setFormEditar] = useState(null);
  const [criarNovo, setCriarNovo] = useState(false);
  const [formNovo, setFormNovo] = useState(null);
  const [stats, setStats] = useState({
    totalVeiculos: 0,
    anoMedio: null,
    marcasDiferentes: 0,
  });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, name: null });
  const [sucessoMsg, setSucessoMsg] = useState("");

  // Carregar dados (cache ou fresh) e recalcular cards
  const carregarDados = async (useFresh = false) => {
    try {
      setCarregando(true);
      const fetchVeiculos = useFresh
        ? async () => (await fetch(`http://localhost:5000/veiculos?oficina_id=${user.oficina_id}`)).json()
        : async () => await fetchData('veiculos', `http://localhost:5000/veiculos?oficina_id=${user.oficina_id}`);

      const fetchClientes = useFresh
        ? async () => (await fetch(`http://localhost:5000/clientes?oficina_id=${user.oficina_id}`)).json()
        : async () => await fetchData('clientes', `http://localhost:5000/clientes?oficina_id=${user.oficina_id}`);

      const data = await fetchVeiculos();
      const dataClientes = await fetchClientes();
      setVeiculos(data || []);
      setClientes(dataClientes || []);

      const totalVeiculos = data?.length || 0;
      const marcasDiferentes = new Set((data || []).map(v => v.marca).filter(Boolean)).size;
      const anos = (data || []).map(v => Number(v.ano)).filter(n => !Number.isNaN(n) && n > 0);
      const anoMedio = anos.length ? Math.round(anos.reduce((a, b) => a + b, 0) / anos.length) : null;

      setStats({ totalVeiculos, anoMedio, marcasDiferentes });
    } catch (error) {    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (!user?.oficina_id) return;
    setVeiculos([]);
    setClientes([]);
    setStats({ totalVeiculos: 0, anoMedio: null, marcasDiferentes: 0 });
    carregarDados();
  }, [user?.oficina_id]);

  const salvarNovoVeiculo = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/veiculos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formNovo, oficina_id: user.oficina_id }),
      });
      if (!response.ok) {
        const data = await response.json();
        alert(data.erro || "Erro ao criar veículo");
        return;
      }
      invalidateCache('veiculos');
      invalidateCache('clientes');
      await carregarDados(true);
      setCriarNovo(false);
      setFormNovo(null);
    } catch (error) { }
  };

  const salvarEdicao = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/veiculos/${formEditar.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formEditar, oficina_id: user.oficina_id }),
      });
      if (!response.ok) {
        const data = await response.json();
        alert(data.erro || "Erro ao editar veículo");
        return;
      }
      // Atualiza imediatamente a linha editada
      setVeiculos(prev => prev.map(v => v.id === formEditar.id ? { ...v, ...formEditar } : v));

      invalidateCache('veiculos');
      invalidateCache('clientes');
      await carregarDados(true);
      setEditar(null);
      setFormEditar(null);
    } catch (error) { }
  };

  const excluirVeiculo = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/veiculos/${id}?oficina_id=${user.oficina_id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) { alert(data.erro || "Erro ao excluir veículo"); return; }
      invalidateCache('veiculos');
      invalidateCache('clientes');
      await carregarDados(true);
      setSucessoMsg("Veículo excluído com sucesso");
      setTimeout(() => setSucessoMsg(""), 2000);
    } catch (error) { }
  };

  const safe = (value) => (value === null || value === undefined || value === "" ? "-" : value);
  const nomeProprietario = (veiculo) => veiculo?.proprietario_nome || clientes.find(c => c.id === veiculo?.cliente_id)?.nome || "-";

  return (
    <div className="veiculos-page">
      {/* CARDS DE ESTATÍSTICAS */}
      <div className="dashboard-header w-full flex gap-6 mb-6 mt-20">
        <div className="os-aberta bg-base-200 p-4 rounded-box">
          <p>Total de Veículos</p>
          <p className="numero text-xl font-bold">{stats.totalVeiculos}</p>
        </div>

        <div className="em-andamento bg-base-200 p-4 rounded-box">
          <p>Ano Médio</p>
          <p className="numero text-xl font-bold">{stats.anoMedio ?? "0"}</p>
        </div>

        <div className="faturamento bg-base-200 p-4 rounded-box">
          <p>Marcas Diferentes</p>
          <p className="numero text-xl font-bold">{stats.marcasDiferentes}</p>
        </div>
      </div>

      {/* TABELA DE VEÍCULOS */}
      <div className="dashboard-table mb-6">
        <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-200 p-4">
          <h3 className="ultimas-ordens text-lg font-bold mb-4 flex items-center justify-between">
            <span>Veículos</span>
            <button 
              onClick={() => {
                setCriarNovo(true);
                setFormNovo({
                  placa: "",
                  modelo: "",
                  marca: "",
                  ano: "",
                  km: "",
                  cliente_id: null
                });
              }} 
              className="btn btn-sm bg-blue-500 text-white px-6">
              + Novo Veículo
            </button>
          </h3>

          {carregando ? (
            <Skeleton />
          ) : (
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Placa</th>
                  <th>Modelo</th>
                  <th>Marca</th>
                  <th className="pr-6">Proprietário</th>
                  <th className="pl-6">Ano</th>
                  <th>Km</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {(veiculos || []).map((veiculo) => (
                  <tr key={veiculo.id}>
                    <td>{safe(veiculo.placa)}</td>
                    <td>{safe(veiculo.modelo)}</td>
                    <td>{safe(veiculo.marca)}</td>
                    <td className="pr-6">{nomeProprietario(veiculo)}</td>
                    <td className="pl-6">{safe(veiculo.ano)}</td>
                    <td>{safe(veiculo.km)}</td>
                    <td>
                      <div className="flex gap-2 min-w-max items-center">
                        <button
                          className="btn btn-sm transition-all duration-150 min-w-[96px] gap-2 text-gray-700 hover:text-green-600 hover:bg-green-50"
                          onClick={() => { setEditar(veiculo); setFormEditar({ ...veiculo }); }}
                        >
                          <Edit2 size={15} /> Editar
                        </button>

                        <button
                          className="btn btn-sm"
                          onClick={() => setConfirmDelete({ open: true, id: veiculo.id, name: `${veiculo.marca} ${veiculo.modelo}` })}
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

      {/* MODAL NOVO/EDITAR VEÍCULO */}
      {(editar || criarNovo) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-blue-900/80 to-slate-900/80 backdrop-blur-md" onClick={() => { setEditar(null); setCriarNovo(false); }} />
          <div className="relative w-full max-w-xl bg-gradient-to-br from-white via-blue-50/30 to-white rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col border border-blue-200/50">
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <MdDirectionsCar size={24} className="text-white" />
                  </div>
                  {editar ? `Editar Veículo #${formEditar.id}` : "Novo Veículo"}
                </h2>
                <button onClick={() => { setEditar(null); setCriarNovo(false); }} className="text-white/80 hover:text-white hover:bg-white/20 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:rotate-90">
                  <X size={22} />
                </button>
              </div>
            </div>
            <form onSubmit={editar ? salvarEdicao : salvarNovoVeiculo} className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 py-6 overflow-y-auto flex-1 bg-white/50">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 block flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Placa *
                    </label>
                    <input type="text" className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none" placeholder="ABC1234 ou ABC1D23"
                      value={editar ? formEditar.placa || "" : formNovo?.placa || ""} required
                      onChange={(e) => editar ? setFormEditar({ ...formEditar, placa: e.target.value }) : setFormNovo({ ...formNovo, placa: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 block flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Modelo *
                      </label>
                      <input type="text" className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none" placeholder="Ex: Civic"
                        value={editar ? formEditar.modelo || "" : formNovo?.modelo || ""}
                        onChange={(e) => editar ? setFormEditar({ ...formEditar, modelo: e.target.value }) : setFormNovo({ ...formNovo, modelo: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 block flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Marca *
                      </label>
                      <input type="text" className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none" placeholder="Ex: Honda"
                        value={editar ? formEditar.marca || "" : formNovo?.marca || ""}
                        onChange={(e) => editar ? setFormEditar({ ...formEditar, marca: e.target.value }) : setFormNovo({ ...formNovo, marca: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 block flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Proprietário
                    </label>
                    <select className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                      value={editar ? (formEditar.cliente_id ?? "") : (formNovo?.cliente_id ?? "")}
                      onChange={(e) => editar ? setFormEditar({ ...formEditar, cliente_id: Number(e.target.value) || null }) : setFormNovo({ ...formNovo, cliente_id: Number(e.target.value) || null })}
                    >
                      <option value="">Selecione um cliente</option>
                      {clientes.map(c => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 block flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Ano
                      </label>
                      <input type="number" className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none" placeholder="2023"
                        value={editar ? formEditar.ano || "" : formNovo?.ano || ""}
                        onChange={(e) => editar ? setFormEditar({ ...formEditar, ano: e.target.value }) : setFormNovo({ ...formNovo, ano: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 block flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Km
                      </label>
                      <input type="number" className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none" placeholder="0"
                        value={editar ? formEditar.km || "" : formNovo?.km || ""}
                        onChange={(e) => editar ? setFormEditar({ ...formEditar, km: e.target.value }) : setFormNovo({ ...formNovo, km: e.target.value })}
                      />
                    </div>
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
        title="Excluir Veículo"
        message={`Deseja realmente excluir o veículo \"${confirmDelete.name || ''}\"?`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={() => { const id = confirmDelete.id; setConfirmDelete({ open: false, id: null, name: null }); excluirVeiculo(id); }}
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

export default Veiculos;
