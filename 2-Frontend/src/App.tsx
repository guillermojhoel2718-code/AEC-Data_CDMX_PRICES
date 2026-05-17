import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HomePage }          from 'src/components/HomePage';
import { ExplorerPage }      from 'src/components/ExplorerPage';
import { DetailPage }        from 'src/components/DetailPage';
import { ConceptComparator } from 'src/components/ConceptComparator';
import { ComingSoonPage }    from 'src/components/ComingSoonPage';
import { PagosPage }         from 'src/components/PagosPage';
import { InsumoExplorer }    from 'src/components/InsumoExplorer';
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
              <Route path="/"           element={<HomePage />} />
              <Route path="/explorer"   element={<ExplorerPage />} />
              <Route path="/detail/:id" element={<DetailPage />} />
              <Route path="/detail"     element={<DetailPage />} />
              <Route path="/comparator" element={<ConceptComparator />} />
              <Route path="/insumos"    element={<InsumoExplorer />} />
              <Route path="/Pagos"  element={<PagosPage />} />
              <Route path="/pagos"  element={<PagosPage />} />
              <Route path="/tokens" element={<PagosPage />} />
              <Route path="/add-concept" element={
                <ComingSoonPage title="Carga de Matrices APU" description="Pronto podrás cargar tus matrices APU." eta="Q3 2026" />
              } />
              <Route path="/wallet"           element={<ComingSoonPage title="Wallet" description="Gestión de saldo." />} />
              <Route path="/providers"         element={<ComingSoonPage title="Proveedores" description="Directorio AEC." />} />
              <Route path="/news"              element={<ComingSoonPage title="Noticias" description="Tendencias del sector." />} />
              <Route path="/marketplace"       element={<ComingSoonPage title="Marketplace" description="Matrices y servicios AEC." />} />
              <Route path="/forum"             element={<ComingSoonPage title="Foro" description="Comunidad AEC." />} />
              <Route path="/register-company"  element={<ComingSoonPage title="Registro de Empresa" description="Perfil proveedor." />} />
            </Routes>
          </Router>
        </ConceptProvider>
      </TokenProvider>
    </AuthProvider>
  );
}
