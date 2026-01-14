import { useEffect, useState } from "react";
import { Edit2, Trash2, X, Save } from "lucide-react";
import { MdAdminPanelSettings } from "react-icons/md";
import Skeleton from "./Skeleton";
import { useDataCache } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "./ConfirmModal";

function Usuarios() {
  const { user, isAdmin } = useAuth();
  const { fetchData, invalidateCache } = useDataCache();
  const [usuarios, setUsuarios] = useState([]);
  const [oficina, setOficina] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [editar, setEditar] = useState(null);
  const [formEditar, setFormEditar] = useState(null);
  const [criarNovo, setCriarNovo] = useState(false);
  const [formNovo, setFormNovo] = useState(null);
  const [formOficina, setFormOficina] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, name: null });
  const [sucessoMsg, setSucessoMsg] = useState("");

  const carregarDados = async (useFresh = false) => {
    try {
      setCarregando(true);
      // Sempre usar fresh data (não usar cache) para evitar inconsistências
      const data = await (await fetch(`http://localhost:5000/usuarios?oficina_id=${user.oficina_id}`)).json();
      setUsuarios(data || []);
    } catch (error) {    } finally {
      setCarregando(false);
    }
  };

  const carregarOficina = async () => {
    try {
      const response = await fetch(`http://localhost:5000/oficinas/${user.oficina_id}`);
      if (response.ok) {
        const data = await response.json();
        setOficina(data);
        setFormOficina({
          nome: data.nome || "",
          cnpj: data.cnpj || "",
          telefone: data.telefone || "",
          email: data.email || "",
          endereco: data.endereco || ""
        });
      }
    } catch (error) {}
  };

  useEffect(() => {
    if (!user?.oficina_id) return;
    // Limpar cache da oficina anterior
    invalidateCache('usuarios');
    setUsuarios([]);
    carregarDados();
    if (isAdmin && isAdmin()) {
      carregarOficina();
    }
  }, [user?.oficina_id, invalidateCache]);

  const salvarNovoUsuario = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formNovo, oficina_id: user.oficina_id }),
      });
      if (!response.ok) { alert("Erro ao criar usuário"); return; }
      invalidateCache('usuarios');
      await carregarDados(true);
      setCriarNovo(false);
      setFormNovo(null);
    } catch (error) { }
  };

  const salvarEdicao = async (e) => {
    e.preventDefault();
    try {
      // Salvar dados do usuário
      const response = await fetch(`http://localhost:5000/usuarios/${formEditar.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formEditar, oficina_id: user.oficina_id }),
      });
      if (!response.ok) { alert("Erro ao editar usuário"); return; }
      
      // Se for admin e tiver campos de oficina, salvar também
      if (isAdmin && isAdmin() && formOficina) {
        await fetch(`http://localhost:5000/oficinas/${user.oficina_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formOficina),
        });
      }
      
      // Otimista: atualiza imediatamente a linha
      setUsuarios(prev => prev.map(u => u.id === formEditar.id ? { ...u, ...formEditar } : u));

      invalidateCache('usuarios');
      await carregarDados(true);
      setEditar(null);
      setFormEditar(null);
      setSucessoMsg("Dados salvos com sucesso!");
      setTimeout(() => setSucessoMsg(""), 2000);
    } catch (error) { alert("Erro ao salvar"); }
  };

  const salvarOfficina = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/oficinas/${user.oficina_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formOficina),
      });
      if (!response.ok) { alert("Erro ao editar oficina"); return; }
      setOficina(formOficina);
      setEditarOficina(false);
      setSucessoMsg("Dados da oficina atualizados com sucesso");
      setTimeout(() => setSucessoMsg(""), 2000);
    } catch (error) { alert("Erro ao salvar oficina"); }
  };

  const excluirUsuario = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/usuarios/${id}?oficina_id=${user.oficina_id}`, { method: "DELETE" });
      if (!response.ok) { alert("Erro ao excluir"); return; }
      // Otimista: remove da lista imediatamente
      setUsuarios(prev => prev.filter(u => u.id !== id));

      invalidateCache('usuarios');
      await carregarDados(true);
      setSucessoMsg("Usuário excluído com sucesso");
      setTimeout(() => setSucessoMsg(""), 2000);
    } catch (error) { }
  };

  const safe = (value) => (value === null || value === undefined || value === "" ? "-" : value);
  const departamentosUnicos = new Set((usuarios || []).map(u => u.departamento).filter(d => d));

  return (
    <div className="usuarios-page">
      {/* CARD */}
      <div className="dashboard-header w-full flex gap-6 mb-6 mt-20">
        <div className="total-usuarios bg-base-200 p-4 rounded-box">
          <p>Total de Usuários</p>
          <p className="numero text-xl font-bold">{usuarios.length}</p>
        </div>
        <div className="usuarios-ativos bg-base-200 p-4 rounded-box">
          <p>Usuários Ativos</p>
          <p className="numero text-xl font-bold">{(usuarios || []).filter(u => u.status === "Ativo").length}</p>
        </div>
        <div className="departamentos bg-base-200 p-4 rounded-box">
          <p>Departamentos</p>
          <p className="numero text-xl font-bold">{departamentosUnicos.size}</p>
        </div>
      </div>

      {/* TABELA */}
      <div className="dashboard-table mb-6">
        <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-200 p-4">
          <h3 className="ultimas-ordens text-lg font-bold mb-4">
            <span>Usuários</span>
          </h3>

          {carregando ? (
            <Skeleton />
          ) : (
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Cargo</th>
                  <th className="pr-6">Departamento</th>
                  <th className="pl-6">Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {(usuarios || []).map((usuario) => (
                  <tr key={usuario.id}>
                    <td>{safe(usuario.nome)}</td>
                    <td>{safe(usuario.email)}</td>
                    <td>{safe(usuario.cargo)}</td>
                    <td className="pr-6">{safe(usuario.departamento)}</td>
                    <td className="pl-6">
                      <span className={`${usuario.status === "Ativo" ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'} w-20 inline-block px-3 py-1 rounded text-center text-xs`}>
                        {usuario.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2 min-w-max items-center">
                        <button
                          className="btn btn-sm transition-all duration-150 min-w-[96px] gap-2 text-gray-700 hover:text-green-600 hover:bg-green-50"
                          onClick={() => { setEditar(usuario); setFormEditar({ ...usuario }); }}
                        >
                          <Edit2 size={15} /> Editar
                        </button>
                        <button className="btn btn-sm" onClick={() => setConfirmDelete({ open: true, id: usuario.id, name: usuario.nome })}>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-blue-900/80 to-slate-900/80 backdrop-blur-md" onClick={() => { setEditar(null); setCriarNovo(false); }} />
          <div className="relative w-full max-w-xl bg-gradient-to-br from-white via-blue-50/30 to-white rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden max-h-[85vh] flex flex-col border border-blue-200/50 animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 px-6 py-5 flex-shrink-0 shadow-lg">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-xl border border-white/20">
                    <MdAdminPanelSettings size={28} className="text-white" />
                  </div>
                  <span className="text-shadow-lg">{editar ? `Editar Usuário #${formEditar.id}` : "Novo Usuário"}</span>
                </h2>
                <button onClick={() => { setEditar(null); setCriarNovo(false); }} className="text-white/80 hover:text-white hover:bg-white/20 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:rotate-90 hover:bg-white/30 hover:shadow-lg">
                  <X size={24} />
                </button>
              </div>
            </div>
            <form onSubmit={editar ? salvarEdicao : salvarNovoUsuario} className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 py-6 overflow-y-auto flex-1 bg-white/60">
                <div className="space-y-5">
                  <div className="space-y-2 group">
                    <label className="text-sm font-bold text-slate-700 block flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 group-focus-within:bg-blue-600 transition-all"></span>
                      Nome *
                    </label>
                    <input type="text" className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none hover:border-slate-300 shadow-sm hover:shadow-md" placeholder="Nome completo"
                      value={editar ? formEditar.nome || "" : formNovo?.nome || ""} required
                      onChange={(e) => editar ? setFormEditar({ ...formEditar, nome: e.target.value }) : setFormNovo({ ...formNovo, nome: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 group">
                    <label className="text-sm font-bold text-slate-700 block flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 group-focus-within:bg-blue-600 transition-all"></span>
                      Email *
                    </label>
                    <input type="email" className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none hover:border-slate-300 shadow-sm hover:shadow-md" placeholder="email@example.com"
                      value={editar ? formEditar.email || "" : formNovo?.email || ""} required
                      onChange={(e) => editar ? setFormEditar({ ...formEditar, email: e.target.value }) : setFormNovo({ ...formNovo, email: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 group">
                      <label className="text-sm font-bold text-slate-700 block flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 group-focus-within:bg-blue-600 transition-all"></span>
                        Cargo
                      </label>
                      <input type="text" className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none hover:border-slate-300 shadow-sm hover:shadow-md" placeholder="Mecânico"
                        value={editar ? formEditar.cargo || "" : formNovo?.cargo || ""}
                        onChange={(e) => editar ? setFormEditar({ ...formEditar, cargo: e.target.value }) : setFormNovo({ ...formNovo, cargo: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 group">
                      <label className="text-sm font-bold text-slate-700 block flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 group-focus-within:bg-blue-600 transition-all"></span>
                        Departamento
                      </label>
                      <input type="text" className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none hover:border-slate-300 shadow-sm hover:shadow-md" placeholder="Manutenção"
                        value={editar ? formEditar.departamento || "" : formNovo?.departamento || ""}
                        onChange={(e) => editar ? setFormEditar({ ...formEditar, departamento: e.target.value }) : setFormNovo({ ...formNovo, departamento: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 group">
                    <label className="text-sm font-bold text-slate-700 block flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 group-focus-within:bg-blue-600 transition-all"></span>
                      Senha {editar ? "(deixe em branco para não alterar)" : "*"}
                    </label>
                    <input type="password" className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none hover:border-slate-300 shadow-sm hover:shadow-md" placeholder="••••••••"
                      value={editar ? formEditar.senha || "" : formNovo?.senha || ""} required={!editar}
                      onChange={(e) => editar ? setFormEditar({ ...formEditar, senha: e.target.value }) : setFormNovo({ ...formNovo, senha: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 group">
                    <label className="text-sm font-bold text-slate-700 block flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 group-focus-within:bg-blue-600 transition-all"></span>
                      Status
                    </label>
                    <select className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none hover:border-slate-300 shadow-sm hover:shadow-md"
                      value={editar ? formEditar.status : formNovo?.status}
                      onChange={(e) => editar ? setFormEditar({ ...formEditar, status: e.target.value }) : setFormNovo({ ...formNovo, status: e.target.value })}
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  </div>

                  {/* SEÇÃO DE DADOS DA OFICINA - APENAS PARA ADMINISTRADOR EM EDIÇÃO */}
                  {editar && isAdmin && isAdmin() && (
                    <>
                      <hr className="my-6 border-slate-200" />
                      <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Dados da Oficina (Administrador)
                      </h3>

                      <div className="space-y-2 group">
                        <label className="text-sm font-bold text-slate-700 block flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500 group-focus-within:bg-green-600 transition-all"></span>
                          Nome da Oficina *
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all outline-none hover:border-slate-300 shadow-sm hover:shadow-md"
                          value={formOficina?.nome || ""}
                          onChange={(e) => setFormOficina({ ...formOficina, nome: e.target.value })}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 group">
                          <label className="text-sm font-bold text-slate-700 block flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 group-focus-within:bg-green-600 transition-all"></span>
                            CNPJ
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all outline-none hover:border-slate-300 shadow-sm hover:shadow-md"
                            value={formOficina?.cnpj || ""}
                            onChange={(e) => setFormOficina({ ...formOficina, cnpj: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2 group">
                          <label className="text-sm font-bold text-slate-700 block flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 group-focus-within:bg-green-600 transition-all"></span>
                            Telefone
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all outline-none hover:border-slate-300 shadow-sm hover:shadow-md"
                            value={formOficina?.telefone || ""}
                            onChange={(e) => setFormOficina({ ...formOficina, telefone: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2 group">
                        <label className="text-sm font-bold text-slate-700 block flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500 group-focus-within:bg-green-600 transition-all"></span>
                          Email
                        </label>
                        <input
                          type="email"
                          className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all outline-none hover:border-slate-300 shadow-sm hover:shadow-md"
                          value={formOficina?.email || ""}
                          onChange={(e) => setFormOficina({ ...formOficina, email: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2 group">
                        <label className="text-sm font-bold text-slate-700 block flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500 group-focus-within:bg-green-600 transition-all"></span>
                          Endereço
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all outline-none hover:border-slate-300 shadow-sm hover:shadow-md"
                          value={formOficina?.endereco || ""}
                          onChange={(e) => setFormOficina({ ...formOficina, endereco: e.target.value })}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="bg-gradient-to-r from-slate-50 via-blue-50/50 to-slate-50 border-t-2 border-slate-200 px-6 py-4 flex-shrink-0 shadow-inner">
                <div className="flex items-center justify-end gap-3">
                  <button type="button" className="px-6 py-3 text-slate-700 font-bold border-2 border-slate-300 rounded-xl hover:bg-slate-100 hover:border-slate-400 transition-all duration-300 text-sm hover:shadow-md active:scale-95"
                    onClick={() => { setEditar(null); setCriarNovo(false); }}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 flex items-center justify-center gap-2 min-w-[140px] text-sm active:scale-95"
                  >
                    <div className="transition-all">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"/><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd"/></svg>
                    </div>
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
        title="Excluir Usuário"
        message={`Deseja realmente excluir o usuário \"${confirmDelete.name || ''}\"?`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={() => { const id = confirmDelete.id; setConfirmDelete({ open: false, id: null, name: null }); excluirUsuario(id); }}
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

export default Usuarios;
