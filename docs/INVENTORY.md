# 🗃️ Inventario del Repositorio APUCMX

A continuación se detalla el esquema consolidado de los elementos más importantes del repositorio tras la auditoría inicial de Fase 1.

| Ruta / Archivo | Tipo de Archivo | Utilidad Probable | Prioridad |
| --- | --- | --- | --- |
| `data_raw/Documentos_Precios/` | Directorio (PDFs, RARs, XLS) | Contiene la materia prima de datos crudos (Bimsa, Varela, CMIC, Tabuladores, Insumos). Es la **fuente de la verdad** inicial. | Alta |
| `data_processed/` | Directorio | Carpeta destino para alojar CSVs estructurados limpios o JSON de Base Semilla. | Alta |
| `data_raw/` y `data_processed/` (antiguos) | Directorio | Antiguos contenedores, unificados y reservados para salida de pipelines. | Media |
| `scripts/cmic_extractor.py` | Python Script | Pipeline especializado: Extrae, Normaliza, Deduplica, Valida usando la estrategia CEDIA y prepara datos CMIC para Supabase. | Alta |
| `scripts/apu_processor.py` | Python Script | Pipeline especializado: Extrae de ZIPs anidados de Construbase, genera jerarquía APU, promueve Promedios Ponderados (Nacional) y prepara CSV Semilla. | Alta |
| `docs/APUCMX_Articulo_Final_v3.docx` | Documento Word | Especificación fundamental arquitectónica y estratégica de APUCMX. | Alta |
| `docs/agente.md` | Markdown | Posible nota de reglas o contexto base para orquestación de Agentes. | Media |
| `src/` | Directorio (TSX/CSS) | Carpeta de la interfaz Frontend React, implementando el diseño Industrial Organic. | Baja (por ahora) |
| `config/apucmx_config.json` | JSON | Metadatos mínimos globales para contexto central del repositorio en tareas automatizadas. | Media |
| `DEV_NOTES_APUCMX.md` | Markdown | Resumen de estado actual, riesgos y división de tareas operativas entre Antigravity y Perplexity. | Alta |
| `package.json`, `vite.config.ts`, `tsconfig.json` | Configuración Node | Dependencias FrontEnd y scripts de ejecución web. | Media |
| `.env`, `.env.example`, `Supabase.env` | Configuración | Variables de entorno para Frontend y conexión con Supabase/APIs. | Crítica (Seguridad) |

## Rutas Críticas
- **Pipeline de Ingesta:** Todo el flujo desde `data_raw/Documentos_Precios/` -> procesado en `scripts/*.py` -> insertado en Supabase a través de archivos extraídos a `data_processed/`.
- **Protocolo de Validación Base:** Lógicas expuestas en los scripts `.py` (ej. _validación CEDIA_ en `fuel_price_check`).
