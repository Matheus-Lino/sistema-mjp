import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem("auth-user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.name) {
          setUser(parsed);
        }
      } catch (err) {
      }
    }
    setLoading(false);
  }, []);

  const login = (name, departamento, email, oficina_nome, oficina_id) => {
    const payload = { name, departamento, email, oficina_nome, oficina_id };
    localStorage.setItem("auth-user", JSON.stringify(payload));
    setUser(payload);
  };

  const logout = () => {
    localStorage.removeItem("auth-user");
    setUser(null);
    navigate("/login", { replace: true });
  };

  // Função para verificar permissões
  const hasPermission = (resource) => {
    if (!user?.departamento) return false;
    
    // Administração tem acesso a tudo
    if (user.departamento === "Administração") return true;
    
    // Outros departamentos têm acesso restrito
    const permissions = {
      "Oficina": ["ordem_servico", "veiculos", "servicos", "pecas"],
      "Recepção": ["ordem_servico", "clientes", "veiculos"]
    };
    
    return permissions[user.departamento]?.includes(resource) || false;
  };

  const canAccessFinanceiro = () => user?.departamento === "Administração";
  const canAccessUsuarios = () => user?.departamento === "Administração";
  const isAdmin = () => user?.departamento === "Administração";

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermission, canAccessFinanceiro, canAccessUsuarios, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
