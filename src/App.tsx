import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HomePage } from './components/HomePage';
import { ExplorerPage } from './components/ExplorerPage';
import { DetailPage } from './components/DetailPage';
import { WalletPage } from './components/WalletPage';
import { ProvidersPage } from './components/ProvidersPage';
import { NewsPage } from './components/NewsPage';
import { AddConceptPage } from './components/AddConceptPage';
import { ForumPage } from './components/ForumPage';
import { RegisterCompanyPage } from './components/RegisterCompanyPage';
import { MarketplacePage } from './components/MarketplacePage';
import { SecretAdminLogin } from './components/SecretAdminLogin';
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
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/providers" element={<ProvidersPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/add-concept" element={<AddConceptPage />} />
            <Route path="/forum" element={<ForumPage />} />
            <Route path="/register-company" element={<RegisterCompanyPage />} />
            
            {/* Secret Admin Route */}
            <Route path="/KukleStro_17" element={<SecretAdminLogin />} />
          </Routes>
        </Router>
      </ConceptProvider>
    </AuthProvider>
  );
}
