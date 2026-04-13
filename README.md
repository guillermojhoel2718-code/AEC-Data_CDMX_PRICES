# 🏗️ APUCMX — `APUC-CORE`

> **La infraestructura de confianza para precios unitarios en la industria AEC mexicana.**  
> Red de consenso P2P regional que convierte datos reales de obra en precios verificados, inmutables y regionalizados.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square&logo=github-actions)](https://github.com/apucmx/apuc-core/actions)
[![License](https://img.shields.io/badge/license-Proprietary-red?style=flat-square)](./LICENSE)
[![Version](https://img.shields.io/badge/version-0.9.0--beta-orange?style=flat-square)](https://github.com/apucmx/apuc-core/releases)
[![Stack](https://img.shields.io/badge/stack-React%20%7C%20Supabase%20%7C%20Polygon-blue?style=flat-square)](./docs/TECH_STACK.md)
[![Workflow](https://img.shields.io/badge/dev--workflow-Agential%20%7C%20Claude%20Code%20MCP-purple?style=flat-square)](./docs/WORKFLOW.md)

---

## El Problema

La industria AEC en México opera sobre una **arquitectura invisible de ineficiencias**:

| Problema | Impacto Directo |
|---|---|
| 📍 **Precios no regionalizados** | Un APU elaborado para CDMX es técnicamente inútil en Tijuana o el Bajío |
| 📉 **Volatilidad sin respuesta** | El "Efecto Trump" (aranceles sobre acero, aluminio, petroquímicos) generó variaciones de hasta **+18%** en 6 meses sin mecanismos de actualización regional |
| 🔒 **Asimetría de información** | Clientes y contratistas negocian con datos de calidad radicalmente diferente, generando ineficiencia estructural de entre el **15–30%** en costo final vs. presupuesto |
| 🧠 **Retraso de talento digital** | Ingenieros arquitectos con formación avanzada atrapados en captura manual de datos, sin mercado explícito para sus activos técnicos |

APUCMX resuelve estos cuatro problemas con una sola arquitectura: **consenso distribuido + verificación técnica + inteligencia regional**.

---

## ✨ Key Features

### 📥 Regional Inbox Search
Experiencia de búsqueda de precios con arquitectura de **bandeja de entrada** (Inbox-style). Una lista lineal de conceptos de obra, escaneable y ordenada por relevancia, con:
- Precio regional de consenso por zona geográfica
- Indicador de variación mensual en tiempo real
- Estado de verificación técnica visible por fila
- Filtro regional activo: `CDMX` · `Norte` · `Bajío` · `Occidente` · `Sur`

Sin menús anidados. Sin navegación de múltiples pantallas. Del concepto al precio verificado en dos clics.

### 📊 Matrix Side-Panel
Al seleccionar cualquier concepto, un **panel lateral deslizante** expone la descomposición completa del APU sin cambiar de pantalla:
- Materiales con origen geográfico verificado y proveedor identificable
- Rendimientos de mano de obra por categoría y región
- Costos de equipo y herramienta desagregados
- Indirectos aplicables por tipo de obra
- Marca de tiempo inmutable registrada en blockchain
- Exportación directa a `.xlsx`, Revit-compatible o PDF sellado

### ⛓️ CEDIA Trust Framework
Protocolo propietario de validación técnica integrado en el núcleo de la arquitectura de APUCMX. No es un servicio externo, una API de terceros ni una entidad independiente. Es el subsistema interno que determina la integridad técnica de cada dato antes de registrarlo como referencia verificada en la red.

Cada contribución pasa por cuatro capas de validación antes de recibir el **Sello de Auditoría Técnica** y registrarse en blockchain:

```
[ Contribución ] → [ Trazabilidad de Fuente ] → [ Coherencia de Rendimientos ]
      → [ Completitud del APU ] → [ Coherencia Geográfica ] → [ 🔏 Sello + Registro Blockchain ]
```

Las contribuciones que no superan el protocolo reciben retroalimentación técnica específica. El Sello de Auditoría Técnica no es decorativo: es la prueba matemáticamente verificable de integridad, registrada en un hash inmutable en la cadena.

### 🪙 Access & Contribution Credits — `$APUC`
Sistema de **vouchers de acceso y participación** que registra la contribución técnica verificada al ecosistema.

> **Definición técnica:** `$APUC` es un crédito de utilidad. No es un instrumento financiero, valor mobiliario ni activo de inversión. Su única función es habilitar acceso a recursos del ecosistema y registrar participación técnica verificada. No existe expectativa de beneficio económico derivado de su tenencia.

| Acción del usuario | Resultado en el sistema |
|---|---|
| Contribuir una matriz APU que supera el protocolo de auditoría | Acumulación de créditos de utilidad `$APUC` por participación técnica |
| Publicar un activo digital con Sello de Auditoría Técnica | Créditos de acceso por cada adopción verificada en el marketplace |
| Consultar matrices de especialización avanzada | Consumo de créditos de acceso proporcional al recurso |
| Adquirir activos en el Trade Marketplace | Transferencia de créditos de utilidad entre participantes del ecosistema |

**Principio de alineación técnica:** el volumen de créditos de utilidad acumulables es proporcional a la calidad técnica de la contribución y a su tasa de adopción. Un profesionista con datos reales de obra verificados acumula más créditos de acceso que uno con datos de menor fidelidad. El sistema no recompensa la especulación: recompensa el conocimiento técnico demostrable.

---

## 🎨 UI Engineering — Industrial Organic

La interfaz de APUCMX es una decisión de ingeniería antes que de estética. El sistema **Industrial Organic** define tokens que minimizan la carga cognitiva en interfaces de alta densidad técnica — el contexto de uso real de cualquier profesionista AEC bajo presión de obra.

```css
/* Design Tokens — APUCMX Engineering Standard */
--color-concrete:   #6E6E6E;   /* Gris Concreto  — base neutral, cero ruido visual */
--color-orange:     #F05A28;   /* Naranja Seguridad — estado activo, alerta, validación */
--color-dark:       #1C1C1C;   /* Negro técnico  — jerarquía máxima, títulos */
--color-cream:      #F5F0E8;   /* Crema industrial — fondo de contexto informativo */

--base-rem:         10px;      /* Estándar: 1rem = 10px — escala modular técnica */
```

| Token | Valor | Función de ingeniería |
|---|---|---|
| `--color-concrete` | `#6E6E6E` | Base neutral de máximo contraste funcional. Elimina ruido visual sin reducir legibilidad en pantallas con luz directa de obra. |
| `--color-orange` | `#F05A28` | Estado activo y señal de atención. Garantiza discriminación visual inmediata en grids de datos densos, sin necesidad de iconografía adicional. |
| `--base-rem` | `10px = 1rem` | **Estándar de cálculo de layout.** `1.6rem = 16px`, `2.4rem = 24px`, `4.8rem = 48px`. Elimina conversiones implícitas del browser (default `16px`), reduce errores de espaciado y garantiza consistencia pixel-exacta entre componentes en cualquier resolución de pantalla técnica. |

> **Nota de implementación:** `10px = 1rem` no es una elección de estilo. Es un estándar de ingeniería de interfaces técnicas que elimina la matemática de conversión de unidades del flujo de desarrollo, reduce bugs de layout y mantiene coherencia entre el sistema de diseño y la implementación en código.

---

## 🛠️ Tech Stack

### Frontend
| Tecnología | Versión | Rol |
|---|---|---|
| React | `18.x` | UI framework principal |
| TypeScript | `5.x` | Tipado estático para lógica de APU y tokenomics |
| Tailwind CSS | `3.x` | Sistema de utilidades — tokens Industrial Organic |
| React Query | `5.x` | Estado del servidor, caché de matrices regionales |
| Zustand | `4.x` | Estado global (filtros regionales, sesión de usuario) |

### Backend & Data
| Tecnología | Versión | Rol |
|---|---|---|
| Supabase | `2.x` | Auth, PostgreSQL, Storage, Realtime |
| PostgreSQL | `15.x` | Base de datos relacional de matrices APU y activos |
| Supabase Edge Functions | — | Lógica serverless de auditoría CEDIA |
| Row Level Security (RLS) | — | Aislamiento de datos por región y membresía |

### ⛓️ Blockchain Layer — Invisible Trust

> **Principio de fricción cero:** el arquitecto, estimador o supervisor que usa APUCMX para consultar precios **no necesita wallet de criptomonedas, no necesita comprender blockchain y no interactúa con ninguna interfaz de cadena de bloques.** La tecnología opera completamente en la capa de servicio backend. Para el usuario, el resultado es simplemente: "este precio no puede haber sido manipulado."
>
> La analogía correcta es HTTPS: el usuario no configura certificados TLS para navegar de forma segura. El protocolo garantiza la propiedad; la experiencia es transparente.

| Tecnología | Rol |
|---|---|
| Polygon / Base | L2 de bajo costo para registro de matrices auditadas y créditos de utilidad `$APUC` |
| Solidity Smart Contracts | Lógica de emisión de créditos de acceso, Sello de Auditoría Técnica y Trade Marketplace |
| IPFS / Arweave | Almacenamiento descentralizado de matrices y activos digitales |
| Ethers.js | Integración interna backend con la capa blockchain — no expuesta al cliente |

**Encapsulamiento técnico:** toda la lógica de firma, emisión de créditos y registro en cadena se ejecuta en Supabase Edge Functions. El frontend nunca tiene acceso directo a claves privadas ni a contratos. El usuario accede a los efectos de la blockchain; nunca a su complejidad.

### 🤖 Development Workflow — Agential
| Herramienta | Rol |
|---|---|
| **Antigravity** | Framework de orquestación de agentes de software |
| **Claude Code MCP** | Motor de razonamiento técnico sobre la base de código (Model Context Protocol) |
| GitHub Actions | CI/CD: tests, linting, validación de esquema de APU |
| Vitest | Unit testing de lógica de auditoría y tokenomics |

El workflow agential permite iteraciones técnicas de alta precisión sin sacrificar velocidad de desarrollo. Las reglas del protocolo CEDIA están codificadas como contexto permanente en el sistema, garantizando coherencia entre versiones.

### 💳 Payments
| Tecnología | Rol |
|---|---|
| PCI-DSS Level 1 Gateway | Procesamiento de membresías y adquisiciones del marketplace |
| Tokenización de medios de pago | Cero almacenamiento de datos de tarjeta en servidores propios |
| TLS 1.3 | Cifrado en tránsito para todas las transacciones financieras |

---

## 🚀 Getting Started

### Prerequisites

- Node.js `>=18.x`
- npm `>=9.x` o pnpm `>=8.x`
- Código de acceso al proyecto

### Installation

```bash
# 1. Clonar el repositorio
git clone https://github.com/apucmx/apuc-core.git
cd apuc-core

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# El sistema funcionará con datos de ejemplo (Mock Data) por defecto.

# 4. Iniciar el servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

### 🔌 Cambio Rápido de Datos Mock a Supabase Real

Para la fase de demostración inicial, el frontend carga por defecto los **3 Conceptos Seed** desde el archivo local `src/lib/mockData.ts`. 

Cuando `Computer` o el equipo backend haya cargado los datos reales en Supabase, realizar el cambio es inmediato:
1. Abre el archivo `src/context/ConceptContext.tsx`.
2. Busca la función `fetchConcepts` (aprox. línea 157).
3. **Comenta** el bloque de código de **MOCK DATA**.
4. **Descomenta** el bloque marcado como **SUPABASE REAL**.

Guardas el archivo y la aplicación comenzará a extraer la información, líneas y sobrecostos directamente desde el backend de Supabase.

```env
# MODO DEMO (Sin Base de Datos)
VITE_USE_MOCK_DATA=true
```

> ⚠️ **Nota:** El sistema está operando actualmente con una base de datos de ejemplo local (Mock Data) para facilitar la visualización del despliegue sin dependencias externas.

### Available Scripts

```bash
npm run dev          # Servidor de desarrollo con HMR
npm run build        # Build de producción optimizado
npm run preview      # Preview del build de producción
npm run test         # Tests unitarios con Vitest
npm run test:ui      # Tests con interfaz visual
npm run lint         # ESLint + TypeScript check
npm run type-check   # TypeScript strict mode check
```

---

## 📁 Project Structure

```
apuc-core/
├── src/
│   ├── components/
│   │   ├── inbox/          # Componentes de la vista Inbox de precios
│   │   ├── matrix/         # Panel lateral de desglose APU
│   │   ├── marketplace/    # Trade Marketplace de activos digitales
│   │   └── ui/             # Design system (Industrial Organic tokens)
│   ├── lib/
│   │   ├── cedia/          # Protocolo de auditoría técnica (CEDIA Trust Framework)
│   │   ├── blockchain/     # Integración Ethers.js + contratos $APUC
│   │   ├── supabase/       # Cliente Supabase + tipos generados
│   │   └── regional/       # Lógica de filtros y consenso regional
│   ├── hooks/              # React hooks de dominio AEC
│   ├── stores/             # Estado global Zustand
│   ├── types/              # TypeScript interfaces (APU, Region, Asset, Token)
│   └── pages/              # Rutas principales de la aplicación
├── supabase/
│   ├── functions/          # Edge Functions (auditoría, pagos, tokenomics)
│   ├── migrations/         # Migraciones de esquema PostgreSQL
│   └── seed/               # Datos semilla de matrices regionales
├── contracts/
│   ├── APUCToken.sol       # Contrato ERC-20 de créditos $APUC
│   └── Marketplace.sol     # Contrato del Trade Marketplace
├── docs/
│   ├── TECH_STACK.md
│   ├── WORKFLOW.md
│   └── CEDIA_PROTOCOL.md   # Especificación técnica del protocolo de auditoría
└── .env.example
```

---

## 🗺️ Roadmap

| Fase | Hito | Estado |
|---|---|---|
| **v0.9 Beta** | Inbox de precios CDMX + Panel lateral APU | 🔄 En desarrollo |
| **v1.0** | Filtros regionales completos + Protocolo CEDIA v1 | 📋 Planificado |
| **v1.1** | Trade Marketplace + Créditos `$APUC` (testnet) | 📋 Planificado |
| **v1.2** | Membresía Creador + Upload de familias Revit | 📋 Planificado |
| **v2.0** | Mainnet Polygon/Base + API pública de precios | 🔭 Visión |

---

## 🤝 Contribution Guidelines

APUCMX es un proyecto de **código propietario con contribución selectiva**. Si deseas contribuir, sigue este proceso:

1. **Abre un Issue** describiendo el problema o la mejora propuesta antes de escribir código.
2. **Espera aprobación** del equipo core. No se aceptan Pull Requests sin Issue aprobado previamente.
3. **Sigue los estándares de código:** TypeScript strict, ESLint configurado, tests requeridos para lógica de dominio AEC.
4. **Documenta los cambios** en el dominio de auditoría CEDIA o tokenomics con el nivel de detalle equivalente al que se exige en las matrices APU.

### Áreas de contribución prioritarias
- Validadores de esquema APU por especialidad (instalaciones, estructura, acabados)
- Conectores de datos regionales verificados (CMIC, INEGI, proveedores)
- Familias Revit de alta calidad para seed del marketplace
- Traducciones técnicas (inglés para documentación de contratos Solidity)

---

## 🔐 Intellectual Property

```
Copyright (c) 2025 Guillermo Jhoel Hernández Gómez — APUCMX

Todos los derechos reservados. Este repositorio, su código fuente, arquitectura,
protocolos de validación, modelo de créditos de utilidad y sistema de diseño son
propiedad intelectual exclusiva de sus autores.

Queda prohibida la reproducción, distribución o uso comercial de cualquier
componente de este proyecto sin autorización escrita expresa del titular.

AVISO ESPECÍFICO — CEDIA TRUST FRAMEWORK:
El protocolo CEDIA Trust Framework es un desarrollo técnico propietario integrado
en el núcleo de la arquitectura de APUCMX. No constituye un servicio de terceros,
una API pública ni una entidad jurídica independiente. Su nombre, lógica de
validación, esquema de puntuación técnica y flujo de auditoría son componentes
originales protegidos bajo las leyes de propiedad intelectual aplicables en México
y los tratados internacionales en la materia.

AVISO ESPECÍFICO — CRÉDITOS DE UTILIDAD $APUC:
El sistema de créditos de utilidad $APUC es un mecanismo de acceso interno al
ecosistema APUCMX. No constituye un instrumento financiero, valor mobiliario,
criptomoneda de inversión ni producto regulado por autoridades financieras.
Su diseño, implementación en contratos Solidity y lógica de emisión son
desarrollos originales protegidos bajo esta misma declaración.
```

Para licenciamiento, partnerships o integraciones enterprise: **[contacto@apucmx.mx](mailto:contacto@apucmx.mx)**

---

## 📄 License

Proprietary — All Rights Reserved. Ver [LICENSE](./LICENSE) para términos completos.

---

<div align="center">

**APUCMX** · La Infraestructura de Confianza para la Industria AEC en la Era de la Volatilidad

[apucmx.mx](https://apucmx.mx) · [Documentación](./docs) · [Reportar un Issue](https://github.com/apucmx/apuc-core/issues)

*Construido con precisión de ingeniería. Validado con datos reales. Blindado por consenso.*

</div>
