import { MdDashboard, MdDirectionsRun, MdPeople, MdDirectionsCar, MdBuild, MdStorefront, MdAttachMoney, MdAdminPanelSettings } from 'react-icons/md';
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Sidebar({ isOpen, onClose }) {
    const auth = useAuth();
    const { hasPermission, canAccessFinanceiro, canAccessUsuarios } = auth || {};

    if (!auth) {
        return <aside className="sidebar-fixed"></aside>;
    }

    return (
        <aside className={`sidebar-fixed ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
            <ul className="menu-list">
                <li className="dashs">
                    <Link to="/" onClick={onClose} className="flex items-center gap-3 text-white">
                        <MdDashboard size={23} className="text-white" />
                        Dashboard
                    </Link>
                </li>
                {hasPermission && hasPermission("ordem_servico") && (
                    <li className="dashs">
                        <Link to="/ordem_servico" onClick={onClose} className="flex items-center gap-3 text-white">
                            <MdDirectionsRun size={23} className="text-white" />
                            Ordens de Serviço
                        </Link>
                    </li>
                )}
                {hasPermission && hasPermission("clientes") && (
                    <li className="dashs">
                        <Link to="/clientes" onClick={onClose} className="flex items-center gap-3 text-white">
                            <MdPeople size={23} className="text-white" />
                            Clientes
                        </Link>
                    </li>
                )}
                {hasPermission && hasPermission("veiculos") && (
                    <li className="dashs">
                        <Link to="/veiculos" onClick={onClose} className="flex items-center gap-3 text-white">
                            <MdDirectionsCar size={23} className="text-white" />
                            Veículos
                        </Link>
                    </li>
                )}
                {hasPermission && hasPermission("servicos") && (
                    <li className="dashs">
                        <Link to="/servicos" onClick={onClose} className="flex items-center gap-3 text-white">
                            <MdBuild size={23} className="text-white" />
                            Serviços
                        </Link>
                    </li>
                )}
                {hasPermission && hasPermission("pecas") && (
                    <li className="dashs">
                        <Link to="/pecas" onClick={onClose} className="flex items-center gap-3 text-white">
                            <MdStorefront size={23} className="text-white" />
                            Peças
                        </Link>
                    </li>
                )}
                {canAccessFinanceiro && canAccessFinanceiro() && (
                    <li className="dashs">
                        <Link to="/financeiro" onClick={onClose} className="flex items-center gap-3 text-white">
                            <MdAttachMoney size={23} className="text-white" />
                            Financeiro
                        </Link>
                    </li>
                )}
                {canAccessUsuarios && canAccessUsuarios() && (
                    <li className="dashs">
                        <Link to="/usuarios" onClick={onClose} className="flex items-center gap-3 text-white">
                            <MdAdminPanelSettings size={23} className="text-white" />
                            Usuários
                        </Link>
                    </li>
                )}
            </ul>
        </aside>
    )
}
export default Sidebar;