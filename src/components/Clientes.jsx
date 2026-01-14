import { useEffect, useState } from "react";
import { Edit2, Trash2, X, Save, User, Phone, Mail, MapPin } from "lucide-react";
import { MdPerson } from "react-icons/md";
import Skeleton from "./Skeleton";
import { useDataCache } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "./ConfirmModal";

function Clientes() {
  const { user } = useAuth();
  const { fetchData, invalidateCache } = useDataCache();
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [editar, setEditar] = useState(null);
  const [formEditar, setFormEditar] = useState(null);
  const [criarNovo, setCriarNovo] = useState(false);
  const [formNovo, setFormNovo] = useState(null);
  const [stats, setStats] = useState({
    totalClientes: 0,
    clientesAtivos: 0,
    totalServicos: 0
  });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, name: null });
  const [sucessoMsg, setSucessoMsg] = useState("");
  const [estados, setEstados] = useState([]);
  const [cidades, setCidades] = useState([]);
  const [ufSelecionada, setUfSelecionada] = useState("");

  // Função única para carregar dados e calcular cards
  const carregarDados = async (useFresh = false) => {
    try {
      setCarregando(true);
      const fetchClientes = useFresh
        ? async () => (await fetch(`http://localhost:5000/clientes?oficina_id=${user.oficina_id}`)).json()
        : async () => await fetchData('clientes', `http://localhost:5000/clientes?oficina_id=${user.oficina_id}`);

      const fetchOrdens = useFresh
        ? async () => (await fetch(`http://localhost:5000/ordens-servico?oficina_id=${user.oficina_id}`)).json()
        : async () => await fetchData('ordens-servico', `http://localhost:5000/ordens-servico?oficina_id=${user.oficina_id}`);

      const data = await fetchClientes();
      const dataOrdens = await fetchOrdens();

      setClientes(data || []);

      const total = data?.length || 0;
      const ativos = data?.filter(c => c.status === "Ativo")?.length || 0;
      const totalServicos = dataOrdens?.length || 0;

      setStats({
        totalClientes: total,
        clientesAtivos: ativos,
        totalServicos
      });
    } catch (error) {
    } finally {
      setCarregando(false);
    }
  };

  // Formata números de telefone brasileiros para exibição na tabela
  // Exemplos:
  // 11 dígitos (celular): 19991668445 -> (19) 99166-8445
  // 10 dígitos (fixo):   1133667788   -> (11) 3366-7788
  // 9 dígitos (cel s/DDD): 991668445 -> 99166-8445
  // 8 dígitos (fixo s/DDD): 33667788 -> 3366-7788
  const formatPhone = (value) => {
    if (!value) return "-";
    const digits = String(value).replace(/\D/g, "");
    if (!digits) return "-";

    if (digits.length === 11) {
      const ddd = digits.slice(0, 2);
      const part1 = digits.slice(2, 7);
      const part2 = digits.slice(7);
      return `(${ddd}) ${part1}-${part2}`;
    }

    if (digits.length === 10) {
      const ddd = digits.slice(0, 2);
      const part1 = digits.slice(2, 6);
      const part2 = digits.slice(6);
      return `(${ddd}) ${part1}-${part2}`;
    }

    if (digits.length === 9) {
      const part1 = digits.slice(0, 5);
      const part2 = digits.slice(5);
      return `${part1}-${part2}`;
    }

    if (digits.length === 8) {
      const part1 = digits.slice(0, 4);
      const part2 = digits.slice(4);
      return `${part1}-${part2}`;
    }

    // Fallback: retorna os dígitos como estão
    return digits;
  };

  useEffect(() => {
    if (!user?.oficina_id) return;
    setClientes([]); // evita mostrar dados da oficina anterior
    setStats({ totalClientes: 0, clientesAtivos: 0, totalServicos: 0 });
    carregarDados();
  }, [user?.oficina_id]);

  // Carregar lista de estados do IBGE (uma vez)
  useEffect(() => {
    const fetchEstados = async () => {
      try {
        const resp = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
        const data = await resp.json();
        // Ordena por nome e mantém apenas campos úteis
        const list = (data || []).map(e => ({ id: e.id, sigla: e.sigla, nome: e.nome })).sort((a,b) => a.nome.localeCompare(b.nome));
        setEstados(list);
      } catch (err) {
        setEstados([]);
      }
    };
    fetchEstados();
  }, []);

  const carregarCidadesPorUF = async (ufId) => {
    if (!ufId) { setCidades([]); return; }
    try {
      const resp = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ufId}/municipios?orderBy=nome`);
      const data = await resp.json();
      const list = (data || []).map(m => m.nome);
      setCidades(list);
    } catch (err) {
      setCidades([]);
    }
  };

  const salvarEdicao = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/clientes/${formEditar.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: formEditar.nome,
          telefone: formEditar.telefone,
          email: formEditar.email,
          cidade: formEditar.cidade,
          status: formEditar.status || "Ativo",
          oficina_id: user.oficina_id
        }),
      });
      if (!response.ok) throw new Error("Erro ao editar");
      // Atualiza imediatamente na lista
      setClientes(prev => prev.map(c => c.id === formEditar.id ? { ...c, ...formEditar } : c));

      // Dados frescos e atualização dos cards
      invalidateCache('clientes');
      invalidateCache('ordens-servico');
      await carregarDados(true);
      setEditar(null);
      setFormEditar(null);
    } catch (error) { 
      alert("Erro ao editar cliente");
    }
  };

  const salvarNovoCliente = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: formNovo.nome,
          telefone: formNovo.telefone,
          email: formNovo.email,
          cidade: formNovo.cidade,
          status: formNovo.status || "Ativo",
          oficina_id: user.oficina_id
        }),
      });
      if (!response.ok) throw new Error("Erro ao criar cliente");
      invalidateCache('clientes');
      invalidateCache('ordens-servico');
      await carregarDados(true);
      setCriarNovo(false);
      setFormNovo(null);
    } catch (error) { 
      alert("Erro ao criar cliente");
    }
  };

  const excluirCliente = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/clientes/${id}?oficina_id=${user.oficina_id}`, { method: "DELETE" });
      if (!response.ok) { 
        const data = await response.json();
        alert(data.erro || "Erro ao excluir cliente"); 
        return; 
      }
      invalidateCache('clientes');
      invalidateCache('ordens-servico');
      await carregarDados(true);
      setSucessoMsg("Cliente excluído com sucesso");
      setTimeout(() => setSucessoMsg(""), 2000);
    } catch (error) { 
      alert("Erro ao excluir cliente");
    }
  };

  return (
    <div className="clientes-page">
      {/* CARDS DE ESTATÍSTICAS */}
      <div className="dashboard-header w-full flex gap-6 mb-6 mt-20">
        <div className="total-clientes bg-base-200 p-4 rounded-box">
          <p>Total de Clientes</p>
          <p className="numero text-xl font-bold">{stats.totalClientes}</p>
        </div>

        <div className="clientes-ativos bg-base-200 p-4 rounded-box">
          <p>Clientes Ativos</p>
          <p className="numero text-xl font-bold">{stats.clientesAtivos}</p>
        </div>

        <div className="total-servicos bg-base-200 p-4 rounded-box">
          <p>Total de Serviços</p>
          <p className="numero text-xl font-bold">{stats.totalServicos}</p>
        </div>
      </div>

      {/* TABELA DE CLIENTES */}
      <div className="dashboard-table mb-6">
        <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-200 p-4">
          <h3 className="ultimas-ordens text-lg font-bold mb-4 flex items-center justify-between">
            <span>Clientes</span>
            <button 
              onClick={() => {
                setCriarNovo(true);
                setFormNovo({
                  nome: "",
                  telefone: "",
                  email: "",
                  cidade: "",
                  status: "Ativo"
                });
              }}
              className="btn btn-sm bg-blue-500 text-white px-6">
              + Novo Cliente
            </button>
          </h3>

          {carregando ? (
            <Skeleton />
          ) : (
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Telefone</th>
                  <th>Cidade</th>
                  <th className="pr-6">Serviços</th>
                  <th className="pl-6">Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>{cliente.nome}</td>
                    <td>{cliente.email || "-"}</td>
                    <td>{formatPhone(cliente.telefone)}</td>
                    <td>{cliente.cidade || "-"}</td>
                    <td className="pr-6">{cliente.total_servicos || 0}</td>
                    <td className="pl-6">
                      <span
                        className={`${cliente.status === "Ativo" ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'} w-24 inline-block px-3 py-1 rounded text-center`}
                      >
                        {cliente.status === "Ativo" ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2 min-w-max items-center">
                        <button
                          className="btn btn-sm transition-all duration-150 min-w-[96px] gap-2 text-gray-700 hover:text-green-600 hover:bg-green-50"
                          onClick={() => {
                            setEditar(cliente);
                            setFormEditar({ ...cliente });
                          }}
                        >
                          <Edit2 size={15} /> Editar
                        </button>

                        <button
                          className="btn btn-sm"
                          onClick={() => setConfirmDelete({ open: true, id: cliente.id, name: cliente.nome })}
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

      {/* MODAL EDITAR/CRIAR - DESIGN MODERNO */}
      {(editar || criarNovo) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-blue-900/80 to-slate-900/80 backdrop-blur-md" onClick={() => { setEditar(null); setCriarNovo(false); }} />
          <div className="relative w-full max-w-xl bg-gradient-to-br from-white via-blue-50/30 to-white rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col border border-blue-200/50">
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <MdPerson size={24} className="text-white" />
                  </div>
                  {editar ? `Editar Cliente #${formEditar.id}` : "Novo Cliente"}
                </h2>
                <button onClick={() => { setEditar(null); setCriarNovo(false); }} className="text-white/80 hover:text-white hover:bg-white/20 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:rotate-90">
                  <X size={22} />
                </button>
              </div>
            </div>
            <form onSubmit={editar ? salvarEdicao : salvarNovoCliente} className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 py-6 overflow-y-auto flex-1 bg-white/50">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 block flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Nome Completo *
                    </label>
                    <input type="text" className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none" placeholder="Digite o nome completo"
                      value={editar ? formEditar.nome || "" : formNovo?.nome || ""} required
                      onChange={(e) => editar ? setFormEditar({ ...formEditar, nome: e.target.value }) : setFormNovo({ ...formNovo, nome: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 block flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Telefone
                      </label>
                      <input type="text" className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none" placeholder="(00) 00000-0000"
                        value={editar ? formEditar.telefone || "" : formNovo?.telefone || ""}
                        onChange={(e) => editar ? setFormEditar({ ...formEditar, telefone: e.target.value }) : setFormNovo({ ...formNovo, telefone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 block flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Email
                      </label>
                      <input type="email" className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none" placeholder="cliente@email.com"
                        value={editar ? formEditar.email || "" : formNovo?.email || ""}
                        onChange={(e) => editar ? setFormEditar({ ...formEditar, email: e.target.value }) : setFormNovo({ ...formNovo, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 block flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Estado e Cidade
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <select
                        className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                        value={ufSelecionada}
                        onChange={async (e) => {
                          const ufId = e.target.value;
                          setUfSelecionada(ufId);
                          await carregarCidadesPorUF(ufId);
                          // ao trocar UF, limpa cidade selecionada
                          if (editar) setFormEditar({ ...formEditar, cidade: "" });
                          else setFormNovo({ ...formNovo, cidade: "" });
                        }}
                      >
                        <option value="">Selecione o estado (UF)</option>
                        {estados.map((uf) => (
                          <option key={uf.id} value={uf.id}>{uf.nome} ({uf.sigla})</option>
                        ))}
                      </select>

                      <select
                        className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                        value={editar ? (formEditar.cidade || "") : (formNovo?.cidade || "")}
                        onChange={(e) => editar ? setFormEditar({ ...formEditar, cidade: e.target.value }) : setFormNovo({ ...formNovo, cidade: e.target.value })}
                        disabled={!ufSelecionada || cidades.length === 0}
                      >
                        <option value="">{!ufSelecionada ? "Selecione o estado primeiro" : (cidades.length === 0 ? "Carregando cidades..." : "Selecione a cidade")}</option>
                        {cidades.map((nome) => (
                          <option key={nome} value={nome}>{nome}</option>
                        ))}
                      </select>
                    </div>
                    <p className="text-xs text-slate-500">Dica: usamos dados oficiais do IBGE. Se preferir, escolha o estado e a cidade acima. Você ainda pode digitar manualmente.</p>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                      placeholder="Ou digite a cidade manualmente"
                      value={editar ? formEditar.cidade || "" : formNovo?.cidade || ""}
                      onChange={(e) => editar ? setFormEditar({ ...formEditar, cidade: e.target.value }) : setFormNovo({ ...formNovo, cidade: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 block flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Status
                    </label>
                    <select className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
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
        title="Excluir Cliente"
        message={`Deseja realmente excluir o cliente \"${confirmDelete.name || ''}\"?`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={() => { const id = confirmDelete.id; setConfirmDelete({ open: false, id: null, name: null }); excluirCliente(id); }}
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

export default Clientes;