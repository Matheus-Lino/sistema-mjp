import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [step, setStep] = useState("departamento"); // departamento, selecionar_oficina, cadastrar_oficina, login, cadastro, reset
  const [departamento, setDepartamento] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [oficinas, setOficinas] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [oficina, setOficina] = useState("");
  const [oficinaId, setOficinaId] = useState(null);
  const [error, setError] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [formCadastro, setFormCadastro] = useState({ nome: "", email: "", cargo: "", senha: "", confirmSenha: "" });
  const [formReset, setFormReset] = useState({ email: "", novaSenha: "", confirmSenha: "" });
  const [formOficina, setFormOficina] = useState({ nome: "", cnpj: "", telefone: "", email: "", endereco: "" });
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    carregarUsuarios();
    carregarOficinas();
  }, []);

  const carregarUsuarios = async () => {
    try {
      const response = await fetch('http://localhost:5000/usuarios');
      
      if (!response.ok) {
        setUsuarios([]);
        return;
      }
      
      const data = await response.json();
      
      // Garantir que é um array
      if (Array.isArray(data)) {
        setUsuarios(data);
      } else {
        setUsuarios([]);
      }
    } catch (error) {
      setUsuarios([]);
    }
  };

  const carregarOficinas = async () => {
    try {
      const response = await fetch('http://localhost:5000/oficinas');
      
      if (!response.ok) {
        setOficinas([]);
        return;
      }
      
      const data = await response.json();
      
      // Garantir que é um array
      if (Array.isArray(data)) {
        setOficinas(data);
      } else {
        setOficinas([]);
      }
    } catch (error) {
      setOficinas([]);
    }
  };

  const departamentos = ["Administração", "Oficina", "Recepção"];

  const usuariosDepartamento = usuarios.filter(u => u.departamento === departamento && u.status === "Ativo");

  const handleSelecionarDepartamento = (dept) => {
    setDepartamento(dept);
    setStep("login");
    setError("");
    setEmail("");
    setPassword("");
    setOficina("");
    carregarUsuarios(); // Recarrega lista de usuários quando seleciona departamento
  };

  const handleVoltarDepartamento = () => {
    setStep("departamento");
    setDepartamento("");
    setError("");
    setFormReset({ email: "", novaSenha: "", confirmSenha: "" });
    setOficina("");
  };

  const handleIrCadastro = () => {
    // Se for Administração, ir direto para cadastro de oficina
    if (departamento === "Administração") {
      setStep("cadastrar_oficina");
      setError("");
      setFormOficina({ nome: "", cnpj: "", telefone: "", email: "", endereco: "" });
    } else {
      // Se for Oficina ou Recepção, mostrar seleção de oficina existente ou criar nova
      setStep("selecionar_oficina");
      setError("");
    }
  };

  const handleVoltarDepartamentoCadastro = () => {
    setStep("departamento");
    setDepartamento("");
    setError("");
    setFormCadastro({ nome: "", email: "", cargo: "", senha: "", confirmSenha: "" });
    setOficina("");
    setOficinaId(null);
  };

  const handleVoltarSelecaoOficina = () => {
    setStep("login");
    setError("");
    setOficinaId(null);
    setOficina("");
  };

  const handleSelecionarOficina = (oficina_id, oficina_nome) => {
    setOficinaId(oficina_id);
    setOficina(oficina_nome);
    setStep("cadastro");
    setError("");
    setFormCadastro({ nome: "", email: "", cargo: "", senha: "", confirmSenha: "" });
  };

  const handleCriarNovaOficina = () => {
    setStep("cadastrar_oficina");
    setError("");
    setFormOficina({ nome: "", cnpj: "", telefone: "", email: "", endereco: "" });
  };

  const handleIrAlterarSenha = () => {
    setStep("reset");
    setError("");
    setFormReset({ email: email || "", novaSenha: "", confirmSenha: "" });
  };

  const handleVoltarLogin = () => {
    setStep("login");
    setError("");
    setFormReset({ email: "", novaSenha: "", confirmSenha: "" });
  };

  const handleSelecionarEmail = (emailSelecionado) => {
    setEmail(emailSelecionado);
  };

  const handleSubmitOficina = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!formOficina.nome) {
      setError("Nome da oficina é obrigatório");
      return;
    }
    
    setCarregando(true);
    try {
      const response = await fetch("http://localhost:5000/oficinas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formOficina)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.erro || "Erro ao criar oficina");
        return;
      }
      
      // Salvar oficina_id e ir para cadastro
      setOficinaId(data.oficina_id);
      setOficina(formOficina.nome);
      setStep("cadastro");
      setFormCadastro({ nome: "", email: "", cargo: "", senha: "", confirmSenha: "" });
    } catch (err) {
      setError("Erro ao criar oficina: " + err.message);
    } finally {
      setCarregando(false);
    }
  };

  const handleSubmitReset = async (e) => {
    e.preventDefault();
    setError("");

    if (!formReset.email || !formReset.novaSenha || !formReset.confirmSenha) {
      setError("Preencha todos os campos");
      return;
    }

    if (formReset.novaSenha !== formReset.confirmSenha) {
      setError("As senhas não conferem");
      return;
    }

    if (formReset.novaSenha.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    const usuario = usuarios.find(u => u.email === formReset.email && u.departamento === departamento && u.status === "Ativo");
    if (!usuario) {
      setError("Usuário não encontrado neste departamento");
      return;
    }

    setCarregando(true);
    try {
      const response = await fetch(`http://localhost:5000/usuarios/${usuario.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...usuario, senha: formReset.novaSenha }),
      });

      if (!response.ok) {
        setError("Erro ao atualizar senha");
        return;
      }

      alert("Senha atualizada! Faça login com a nova senha.");
      setStep("login");
      setPassword("");
      setFormReset({ email: "", novaSenha: "", confirmSenha: "" });
    } catch (err) {
      setError("Erro ao alterar senha: " + err.message);
    } finally {
      setCarregando(false);
    }
  };

  const handleSubmitCadastro = async (e) => {
    e.preventDefault();
    setError("");

    if (!formCadastro.nome || !formCadastro.email || !formCadastro.cargo || !formCadastro.senha) {
      setError("Preencha todos os campos");
      return;
    }

    if (formCadastro.senha !== formCadastro.confirmSenha) {
      setError("As senhas não conferem");
      return;
    }

    if (formCadastro.senha.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    // Validar se email já existe
    if (usuarios.some(u => u.email === formCadastro.email)) {
      setError("Este email já está cadastrado");
      return;
    }

    setCarregando(true);
    try {
      const response = await fetch("http://localhost:5000/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: formCadastro.nome,
          email: formCadastro.email,
          cargo: formCadastro.cargo,
          departamento: departamento,
          senha: formCadastro.senha,
          status: "Ativo",
          oficina_id: oficinaId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.erro || "Erro ao cadastrar usuário");
        return;
      }

      // Faz login automático após cadastro
      login(formCadastro.nome, departamento, formCadastro.email, oficina, oficinaId);
      navigate("/");
    } catch (err) {
      setError("Erro ao cadastrar: " + err.message);
    } finally {
      setCarregando(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Por favor, preencha email e senha");
      return;
    }

    setCarregando(true);
    try {
      // Fazer login via API - deixar a API validar email/senha/departamento
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.erro || "Erro ao fazer login");
        setCarregando(false);
        return;
      }

      // Validar se o departamento retornado pela API é igual ao selecionado
      if (data.usuario.departamento !== departamento) {
        setError("Usuário não pertence a este departamento");
        setCarregando(false);
        return;
      }

      // Login bem-sucedido - usar oficina_nome do backend
      const oficinaName = data.usuario.oficina_nome || oficina || "Minha Oficina";
      login(data.usuario.nome, data.usuario.departamento, data.usuario.email, oficinaName, data.usuario.oficina_id);
      navigate("/");
    } catch (err) {
      setError("Erro ao fazer login: " + err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 overflow-hidden">
      {/* Background blur elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-5xl flex flex-col items-center justify-center">
        {step === "departamento" ? (
          // Seleção de Departamento
          <div className="w-full flex flex-col items-center justify-center">
            <div className="text-center mb-10">
              <h1 className="text-5xl font-black text-white mb-3 tracking-tight">Sistema de Oficina</h1>
              <p className="text-xl text-blue-200">Selecione seu departamento para continuar</p>
            </div>

            <div className="grid  grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 w-full max-w-5xl">
              {departamentos.map((dept) => {
                const usuariosCount = usuarios.filter(u => u.departamento === dept && u.status === "Ativo").length;
                return (
                  <button
                    key={dept}
                    onClick={() => handleSelecionarDepartamento(dept)}
                    className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 hover:border-blue-500/50 rounded-2xl p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-105 cursor-pointer overflow-hidden mx-auto w-full max-w-xs"
                  >
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 to-purple-600/0 group-hover:from-blue-600/10 group-hover:to-purple-600/10 transition-all duration-300"></div>
                    
                    <div className="relative z-10 flex flex-col items-center text-center">
                      <div className="text-7xl mb-4 group-hover:scale-110 transition-transform duration-300">
                        {dept === "Administração" && "🏢"}
                        {dept === "Oficina" && "👨🏻‍🔧"}
                        {dept === "Recepção" && "📞"}
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">{dept}</h2>
                      <p className="text-slate-400 text-sm group-hover:text-blue-200 transition-colors">
                        {usuariosCount} usuário{usuariosCount !== 1 ? "s" : ""} ativo{usuariosCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : step === "login" ? (
          // Formulário de Login
          <div className="w-full max-w-md mx-auto">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
              <div className="mb-8">
                <h2 className="text-4xl font-black text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{departamento}</h2>
                <p className="text-slate-400">Entre com suas credenciais</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Selecionar Usuário</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  >
                    <option value="">Selecione um usuário</option>
                    {usuariosDepartamento.map((u) => (
                      <option key={u.id} value={u.email} className="bg-slate-900">
                        {u.nome} ({u.cargo})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Senha</label>
                  <input 
                    type="password" 
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200 text-sm">
                    {error}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={carregando}
                  className="w-full mt-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-blue-500/50 disabled:cursor-not-allowed"
                >
                  {carregando ? "Entrando..." : "Entrar"}
                </button>

                <button
                  type="button"
                  onClick={handleIrAlterarSenha}
                  className="w-full py-3 border-2 border-slate-600 hover:border-blue-500 text-slate-300 hover:text-blue-300 font-semibold rounded-xl transition-all duration-300"
                >
                  Alterar senha
                </button>

                <button
                  type="button"
                  onClick={handleIrCadastro}
                  className="w-full py-3 border-2 border-slate-600 hover:border-blue-500 text-slate-300 hover:text-blue-300 font-semibold rounded-xl transition-all duration-300"
                >
                  Criar novo usuário
                </button>

                <button
                  type="button"
                  onClick={handleVoltarDepartamento}
                  className="w-full py-2 text-slate-400 hover:text-slate-200 font-medium transition-colors"
                >
                  ← Voltar para Departamentos
                </button>
              </form>
            </div>
          </div>
        ) : step === "reset" ? (
          // Alterar Senha (login)
          <div className="w-full max-w-md mx-auto">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
              <div className="mb-8">
                <h2 className="text-4xl font-black text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Alterar senha</h2>
                <p className="text-slate-400">Selecione o usuário e defina a nova senha</p>
              </div>

              <form onSubmit={handleSubmitReset} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Selecionar Usuário</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={formReset.email}
                    onChange={(e) => setFormReset({...formReset, email: e.target.value})}
                  >
                    <option value="">Selecione um usuário</option>
                    {usuariosDepartamento.map((u) => (
                      <option key={u.id} value={u.email} className="bg-slate-900">
                        {u.nome} ({u.cargo})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Nova Senha</label>
                  <input 
                    type="password" 
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Mínimo 6 caracteres"
                    value={formReset.novaSenha}
                    onChange={(e) => setFormReset({...formReset, novaSenha: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Confirmar Nova Senha</label>
                  <input 
                    type="password" 
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Confirme a nova senha"
                    value={formReset.confirmSenha}
                    onChange={(e) => setFormReset({...formReset, confirmSenha: e.target.value})}
                  />
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200 text-sm">
                    {error}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={carregando}
                  className="w-full mt-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-blue-500/50 disabled:cursor-not-allowed"
                >
                  {carregando ? "Salvando..." : "Salvar nova senha"}
                </button>

                <button
                  type="button"
                  onClick={handleVoltarLogin}
                  className="w-full py-2 text-slate-400 hover:text-slate-200 font-medium transition-colors"
                >
                  ← Voltar para Login
                </button>
              </form>
            </div>
          </div>
        ) : step === "cadastrar_oficina" ? (
          // Formulário de Cadastro de Oficina
          <div className="w-full max-w-md mx-auto">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
              <div className="mb-8">
                <h2 className="text-4xl font-black text-white mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Nova Oficina</h2>
                <p className="text-slate-400">Primeiro, cadastre sua oficina</p>
              </div>

              <form onSubmit={handleSubmitOficina} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Nome da Oficina *</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Ex: Oficina do João"
                    value={formOficina.nome}
                    onChange={(e) => setFormOficina({...formOficina, nome: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">CNPJ</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="00.000.000/0000-00"
                    value={formOficina.cnpj}
                    onChange={(e) => setFormOficina({...formOficina, cnpj: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Telefone</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="(00) 00000-0000"
                    value={formOficina.telefone}
                    onChange={(e) => setFormOficina({...formOficina, telefone: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Email</label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="contato@oficina.com"
                    value={formOficina.email}
                    onChange={(e) => setFormOficina({...formOficina, email: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Endereço</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Rua, número, bairro, cidade"
                    value={formOficina.endereco}
                    onChange={(e) => setFormOficina({...formOficina, endereco: e.target.value})}
                  />
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200 text-sm">
                    {error}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={carregando}
                  className="w-full mt-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-purple-500/50 disabled:cursor-not-allowed"
                >
                  {carregando ? "Cadastrando..." : "Próximo: Cadastrar Usuário"}
                </button>

                <button
                  type="button"
                  onClick={handleVoltarDepartamento}
                  className="w-full py-2 text-slate-400 hover:text-slate-200 font-medium transition-colors"
                >
                  ← Voltar para Departamentos
                </button>
              </form>
            </div>
          </div>
        ) : step === "selecionar_oficina" ? (
          // Seleção de Oficina Existente
          <div className="w-full max-w-md mx-auto">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
              <div className="mb-8">
                <h2 className="text-4xl font-black text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Selecionar Oficina</h2>
                <p className="text-slate-400">Escolha uma oficina existente ou crie uma nova</p>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200 text-sm mb-6">
                  {error}
                </div>
              )}

              <div className="space-y-3 mb-6">
                {oficinas && oficinas.length > 0 ? (
                  oficinas.map((oficina_item) => (
                    <button
                      key={oficina_item.id}
                      onClick={() => handleSelecionarOficina(oficina_item.id, oficina_item.nome)}
                      className="w-full px-4 py-4 text-left bg-slate-900/50 border border-slate-600/50 hover:border-blue-500/50 hover:bg-slate-800/50 rounded-xl text-white transition-all duration-300 group"
                    >
                      <div className="font-semibold group-hover:text-blue-300">{oficina_item.nome}</div>
                      <div className="text-sm text-slate-400 group-hover:text-slate-300">{oficina_item.cnpj || "Sem CNPJ"}</div>
                    </button>
                  ))
                ) : (
                  <div className="text-slate-400 text-center py-6">Nenhuma oficina cadastrada</div>
                )}
              </div>

              <button
                type="button"
                onClick={handleCriarNovaOficina}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-green-500/50 mb-4"
              >
                + Criar Nova Oficina
              </button>

              <button
                type="button"
                onClick={handleVoltarSelecaoOficina}
                className="w-full py-2 text-slate-400 hover:text-slate-200 font-medium transition-colors"
              >
                ← Voltar
              </button>
            </div>
          </div>
        ) : step === "cadastro" ? (
          // Formulário de Cadastro de Usuário
          <div className="w-full max-w-md mx-auto">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
              <div className="mb-8">
                <h2 className="text-4xl font-black text-white mb-1 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">Novo Usuário</h2>
                <p className="text-slate-400">Oficina: <span className="text-purple-300 font-semibold">{oficina}</span></p>
                <p className="text-slate-400">Departamento: <span className="text-blue-300 font-semibold">{departamento}</span></p>
              </div>

              <form onSubmit={handleSubmitCadastro} className="space-y-5">

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Nome *</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Seu nome completo"
                    value={formCadastro.nome}
                    onChange={(e) => setFormCadastro({...formCadastro, nome: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Email *</label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="seu@email.com"
                    value={formCadastro.email}
                    onChange={(e) => setFormCadastro({...formCadastro, email: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Cargo *</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Seu cargo"
                    value={formCadastro.cargo}
                    onChange={(e) => setFormCadastro({...formCadastro, cargo: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Senha *</label>
                  <input 
                    type="password" 
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Mínimo 6 caracteres"
                    value={formCadastro.senha}
                    onChange={(e) => setFormCadastro({...formCadastro, senha: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Confirmar Senha *</label>
                  <input 
                    type="password" 
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Confirme sua senha"
                    value={formCadastro.confirmSenha}
                    onChange={(e) => setFormCadastro({...formCadastro, confirmSenha: e.target.value})}
                  />
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200 text-sm">
                    {error}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={carregando}
                  className="w-full mt-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-green-500/50 disabled:cursor-not-allowed"
                >
                  {carregando ? "Cadastrando..." : "Cadastrar"}
                </button>

                <button
                  type="button"
                  onClick={() => setStep("cadastrar_oficina")}
                  className="w-full py-2 text-slate-400 hover:text-slate-200 font-medium transition-colors"
                >
                  ← Voltar para Cadastro de Oficina
                </button>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default Login;
