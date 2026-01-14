import './App.css'
import Navbar from './layout/Navbar.jsx'
import Sidebar from './components/Sidebar.jsx'
// import Dashboards from './components/Dashboards.jsx'
import AppRoutes from "./routes/AppRoutes.jsx";
import { useLocation } from "react-router-dom";
import { useState, useEffect } from 'react';


function App() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login';
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);
  const [sidebarOpen, setSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop) {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isAuthPage) {
    // Render only routed auth page (login) without app shell
    return (
      <div className="app-shell">
        <AppRoutes />
      </div>
    );
  }

  const handleSidebarToggle = () => {
    return;
  };

  const handleCloseSidebar = () => {
    return;
  };

  return (
    <div className="app-shell">
      <Navbar onToggleSidebar={handleSidebarToggle} />
      <div className="main-shell">
          <Sidebar isOpen={true} onClose={handleCloseSidebar} />
        <div className="content-shell">
          <AppRoutes />
        </div>
      </div>
    </div>
  )
}

export default App
