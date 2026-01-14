import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../components/Login";
import Dashboards from "../components/Dashboards";
import Ordem_Servico from "../components/Ordem_Servico";
import Clientes from "../components/Clientes";
import Veiculos from "../components/Veiculos";
import Servicos from "../components/Servicos";
import Pecas from "../components/Pecas";
import Financeiro from "../components/Financeiro";
import Usuarios from "../components/Usuarios";
import RequireAuth from "./RequireAuth";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RequireAuth><Dashboards /></RequireAuth>} />
      <Route path="/ordem_servico" element={<RequireAuth><Ordem_Servico /></RequireAuth>} />
      <Route path="/clientes" element={<RequireAuth><Clientes /></RequireAuth>} />
      <Route path="/veiculos" element={<RequireAuth><Veiculos /></RequireAuth>} />
      <Route path="/servicos" element={<RequireAuth><Servicos /></RequireAuth>} />
      <Route path="/pecas" element={<RequireAuth><Pecas /></RequireAuth>} />
      <Route path="/financeiro" element={<RequireAuth><Financeiro /></RequireAuth>} />
      <Route path="/usuarios" element={<RequireAuth><Usuarios /></RequireAuth>} />
    </Routes>
  );
}

export default AppRoutes;