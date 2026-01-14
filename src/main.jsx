import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './responsive.css'
import App from './App.jsx'
import { BrowserRouter } from "react-router-dom";
import { DataProvider } from './context/DataContext';
import { AuthProvider } from './context/AuthContext';

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <App />
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
)
