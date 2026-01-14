import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function ConfiguracaoOficina() {
  const { user } = useAuth();
  const [oficina, setOficina] = useState(null);
  const [editar, setEditar] = useState(false);
  const [formOficina, setFormOficina] = useState({
    nome: "",
    cnpj: "",
    telefone: "",
    email: "",
    endereco: ""
  });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  // Carregar dados da oficina
  useEffect(() => {
    if (!user?.oficina_id) return;
    carregarOficina();
  }, [user?.oficina_id]);

  const carregarOficina = async () => {
    try {
      setCarregando(true);
      const response = await fetch(`http://localhost:5000/oficinas/${user.oficina_id}`);
      
      if (!response.ok) {
        setErro("Erro ao carregar dados da oficina");
        return;
      }
      
      const data = await response.json();
      setOficina(data);
      setFormOficina({
        nome: data.nome || "",
        cnpj: data.cnpj || "",
        telefone: data.telefone || "",
        email: data.email || "",
        endereco: data.endereco || ""
      });
    } catch (err) {
      setErro("Erro ao buscar oficina: " + err.message);
    } finally {
      setCarregando(false);
    }
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro("");
    setSucesso("");

    try {
      const response = await fetch(`http://localhost:5000/oficinas/${user.oficina_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formOficina)
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.erro || "Erro ao salvar");
        return;
      }

      setOficina(formOficina);
      setEditar(false);
      setSucesso("Dados da oficina atualizados com sucesso!");
      setTimeout(() => setSucesso(""), 3000);
    } catch (err) {
      setErro("Erro ao salvar: " + err.message);
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="p-6 mt-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Configurações da Oficina</h1>

        {erro && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-700 mb-6">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-green-700 mb-6">
            {sucesso}
          </div>
        )}

        {!editar ? (
          <div className="bg-base-200 p-8 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nome</label>
                <p className="text-lg">{oficina?.nome || "-"}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">CNPJ</label>
                <p className="text-lg">{oficina?.cnpj || "-"}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Telefone</label>
                <p className="text-lg">{oficina?.telefone || "-"}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                <p className="text-lg">{oficina?.email || "-"}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Endereço</label>
                <p className="text-lg">{oficina?.endereco || "-"}</p>
              </div>
            </div>

            <button
              onClick={() => setEditar(true)}
              className="btn btn-primary"
            >
              Editar
            </button>
          </div>
        ) : (
          <div className="bg-base-200 p-8 rounded-lg">
            <form onSubmit={handleSalvar} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nome *</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                  value={formOficina.nome}
                  onChange={(e) => setFormOficina({ ...formOficina, nome: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">CNPJ</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                    value={formOficina.cnpj}
                    onChange={(e) => setFormOficina({ ...formOficina, cnpj: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Telefone</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                    value={formOficina.telefone}
                    onChange={(e) => setFormOficina({ ...formOficina, telefone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                  value={formOficina.email}
                  onChange={(e) => setFormOficina({ ...formOficina, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Endereço</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                  value={formOficina.endereco}
                  onChange={(e) => setFormOficina({ ...formOficina, endereco: e.target.value })}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={salvando}
                  className="btn btn-primary"
                >
                  {salvando ? "Salvando..." : "Salvar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditar(false);
                    setFormOficina({
                      nome: oficina?.nome || "",
                      cnpj: oficina?.cnpj || "",
                      telefone: oficina?.telefone || "",
                      email: oficina?.email || "",
                      endereco: oficina?.endereco || ""
                    });
                  }}
                  className="btn btn-ghost"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default ConfiguracaoOficina;
