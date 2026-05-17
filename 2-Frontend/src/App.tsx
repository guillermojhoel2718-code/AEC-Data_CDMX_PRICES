import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HomePage }          from 'src/components/HomePage';
import { ExplorerPage }      from 'src/components/ExplorerPage';
import { DetailPage }        from 'src/components/DetailPage';
import { ConceptComparator } from 'src/components/ConceptComparator';
import { ComingSoonPage }    from 'src/components/ComingSoonPage';
import { TokensPage }        from 'src/components/TokensPage';
import { InsumoExplorer }    from 'src/components/InsumoExplorer';
import { ProvidersPage }     from 'src/components/ProvidersPage';
import { AnalysisPage }      from 'src/components/AnalysisPage';
import { AssistantChatbot }  from 'src/components/AssistantChatbot';
import { AuthProvider }      from 'src/context/AuthContext';
import { ConceptProvider }   from 'src/context/ConceptContext';
import { TokenProvider }     from 'src/context/TokenContext';

export default function App() {
  return (
    <AuthProvider>
      <TokenProvider>
        <ConceptProvider>
          <Router>
            <Routes>
              {/* ── Rutas ACTIVAS V1 ── */}
              <Route path="/"           element={<HomePage />} />
              <Route path="/explorer"   element={<ExplorerPage />} />
              <Route path="/detail/:id" element={<DetailPage />} />
              <Route path="/detail"     element={<DetailPage />} />
              <Route path="/comparator" element={<ConceptComparator />} />
              <Route path="/insumos"    element={<InsumoExplorer />} />

              {/* ── Tokens y pagos (Stripe) ── */}
              <Route path="/Pagos"  element={<TokensPage />} />
              <Route path="/pagos"  element={<TokensPage />} />
              <Route path="/tokens" element={<TokensPage />} />

              {/* ── Próximamente: sin link en nav ── */}
              <Route path="/add-concept" element={
                <ComingSoonPage
                  title="Carga de Matrices APU"
                  description="Pronto podrás cargar tus propias matrices APU al catálogo validado de APUCMX."
                  eta="Q3 2026"
                />
              } />
              <Route path="/wallet" element={
                <ComingSoonPage title="Wallet" description="Gestión de saldo y transacciones." />
              } />
              <Route path="/providers" element={<ProvidersPage />} />
              <Route path="/analysis"  element={<AnalysisPage />} />
              <Route path="/news" element={
                <ComingSoonPage title="Noticias" description="Tendencias del sector construcción México." />
              } />
              <Route path="/marketplace" element={
                <ComingSoonPage title="Marketplace" description="Intercambio de matrices y servicios AEC." />
              } />
              <Route path="/forum" element={
                <ComingSoonPage title="Foro" description="Comunidad de profesionales AEC." />
              } />
              <Route path="/register-company" element={
                <ComingSoonPage title="Registro de Empresa" description="Perfil profesional para proveedores y contratistas." />
              } />
            </Routes>
            <AssistantChatbot />
          </Router>
        </ConceptProvider>
      </TokenProvider>
    </AuthProvider>
  );
}
