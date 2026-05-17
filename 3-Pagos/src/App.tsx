import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HomePage } from './components/HomePage';
import { ExplorerPage } from './components/ExplorerPage';
import { DetailPage } from './components/DetailPage';
import { ConceptComparator } from './components/ConceptComparator';
import { ComingSoonPage } from './components/ComingSoonPage';
import { PagosPage } from './components/PagosPage';
import { InsumoExplorer } from './components/InsumoExplorer';
import { AuthProvider } from './context/AuthContext';
import { ConceptProvider } from './context/ConceptContext';
import { TokenProvider } from './context/TokenContext';

// V2 imports — desconectados del router, conservados para futuro
// import { AddConceptPage } from './components/AddConceptPage';
// import { ForumPage } from './components/ForumPage';
// import { NewsPage } from './components/NewsPage';
// import { MarketplacePage } from './components/MarketplacePage';
// import { ProvidersPage } from './components/ProvidersPage';
// import { WalletPage } from './components/WalletPage';
// import { RegisterCompanyPage } from './components/RegisterCompanyPage';

export default function App() {
  return (
    <AuthProvider>
      <TokenProvider>
        <ConceptProvider>
          <Router>
            <Routes>
              {/* ── Rutas activas V1 ── */}
              <Route path="/" element={<HomePage />} />
              <Route path="/explorer" element={<ExplorerPage />} />
              <Route path="/detail/:id" element={<DetailPage />} />
              <Route path="/detail" element={<DetailPage />} />
              <Route path="/comparator" element={<ConceptComparator />} />
              <Route path="/insumos" element={<InsumoExplorer />} />
              <Route path="/Pagos" element={<PagosPage />} />
              <Route path="/pagos" element={<PagosPage />} />
              <Route path="/tokens" element={<PagosPage />} />

              {/* ── Rutas V2 desconectadas — NO eliminar archivos ── */}
              {/* <Route path="/add-concept" element={<AddConceptPage />} /> */}
              {/* <Route path="/wallet" element={<WalletPage />} /> */}
              {/* <Route path="/providers" element={<ProvidersPage />} /> */}
              {/* <Route path="/news" element={<NewsPage />} /> */}
              {/* <Route path="/marketplace" element={<MarketplacePage />} /> */}
              {/* <Route path="/forum" element={<ForumPage />} /> */}
              {/* <Route path="/register-company" element={<RegisterCompanyPage />} /> */}
            </Routes>
          </Router>
        </ConceptProvider>
      </TokenProvider>
    </AuthProvider>
  );
}
