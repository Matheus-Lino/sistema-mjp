import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Wrench, Building2, UserCircle, Menu, X } from "lucide-react";
import { useState } from "react";

function Navbar({ onToggleSidebar }) {
    const auth = useAuth();
    const { user, logout } = auth || {};
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    if (!auth || !user) {
        return <div className="navbar shadow-sm">Carregando...</div>;
    }

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <>
            <div className="navbar shadow-sm">
                <div className="titulo-sistema flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
                        <Wrench size={18} className="text-white" />
                    </div>
                    <h1 className="titulo-oficina hidden sm:block">Sistema de Oficina</h1>
                    <h1 className="titulo-oficina sm:hidden text-sm">Oficina</h1>
                </div>

                <div className="select-oficina hide-mobile">
                    <select className="select select-sm" disabled={true}>
                        <option>{user?.oficina_nome || "Sua Oficina"}</option>
                    </select>
                </div>

                <div className="login-itens flex-1 justify-end flex items-center gap-4">
                    <div className="flex flex-col items-end hide-mobile">
                        <p className="mensagem-ola">Olá, {user?.name || "Usuário"}!</p>
                        <span className="text-xs text-gray-400">{user?.departamento}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="btn btn-ghost btn-circle avatar hide-mobile">
                            <img className="perfil-login rounded-full" src="homem.png" alt="" width={56} height={56}/>
                        </div>
                        <div className="btn btn-ghost btn-circle avatar show-mobile-only">
                            <img className="perfil-login rounded-full" src="homem.png" alt="" width={40} height={40}/>
                        </div>
                        <button onClick={handleLogout} className="btn-sair btn-sm btn-error text-white font-semibold px-4 hide-mobile">
                             Sair
                        </button>
                        <button onClick={handleLogout} className="btn-sair btn-sm btn-error text-white font-semibold px-2 show-mobile-only text-xs">
                             Sair
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
export default Navbar;