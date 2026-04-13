import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HomePage } from './components/HomePage';
import { ExplorerPage } from './components/ExplorerPage';
import { DetailPage } from './components/DetailPage';
import { AddConceptPage } from './components/AddConceptPage';

import { WalletPage } from './components/WalletPage';
import { ProvidersPage } from './components/ProvidersPage';
import { NewsPage } from './components/NewsPage';
import { MarketplacePage } from './components/MarketplacePage';
import { ForumPage } from './components/ForumPage';
import { RegisterCompanyPage } from './components/RegisterCompanyPage';
import { ConceptComparator } from './components/ConceptComparator';
import { AuthProvider } from './context/AuthContext';
import { ConceptProvider } from './context/ConceptContext';

export default function App() {
  return (
    <AuthProvider>
      <ConceptProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/explorer" element={<ExplorerPage />} />
            <Route path="/detail/:id" element={<DetailPage />} />
            <Route path="/detail" element={<DetailPage />} />
            <Route path="/add-concept" element={<AddConceptPage />} />
            <Route path="/comparator" element={<ConceptComparator />} />

            {/* Vistas Próximamente */}
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/providers" element={<ProvidersPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/forum" element={<ForumPage />} />
            <Route path="/register-company" element={<RegisterCompanyPage />} />
            
            {/* Nota: Si se requiere admin, usar Auth de Supabase (no credenciales hardcodeadas) */}
          </Routes>
        </Router>
      </ConceptProvider>
    </AuthProvider>
  );
}
