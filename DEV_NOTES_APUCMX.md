# 📝 DEV NOTES - APUCMX

## Estado Actual del Repositorio
- El repositorio ha sido reestructurado en una **arquitectura mínima viable**.
- Se han segregado las capas lógicas en: `scripts/`, `docs/`, `config/`, `data_raw/`, `data_processed/` y `src/` (frontend).
- Los scripts extractores base (`cmic_extractor.py` y `apu_processor.py`) se encuentran centralizados y operativos bajo un estándar `python`.
- La carpeta `Documentos_Precios` que contiene PDFs pesados ha sido movida a `data_raw/Documentos_Precios` para mantener el alcance claro limitando su interacción sólo con los scripts de ingesta.

## Riesgos Técnicos Iniciales
- **Peso del repositorio:** Contiene muchos `.pdf` y `.rar` locales (ej. *CATALOGOS DE COSTOS 2022.rar*, *LIBRO-COSTOS...VARELA.pdf*). Mantener control del tamaño para evitar bloqueos por límites en GitHub / Git LFS.
- **Acoplamiento Frontend:** El front-end en `src/` parece no depender directamente de los pipelines de python para desarrollo iterativo, lo cual es bueno. Sin embargo, Supabase.env expone que hay dependencias con la nube, cuidado con las credenciales locales.
- **Memoria RAM & Costos LLM:** Extraer datos exhaustivos de PDFs enormes con LLMs generará un altísimo costo de tokens y RAM. Se requiere extracción guiada o particionada.

## Backlog Recomendado (Próximos Pasos)
1. Analizar el contenido estructurado de los PDFs utilizando un pipeline OCR o conversor a json/markdown.
2. Definir una estructura Mínima de Metadatos (Concepto, Unidad, Categoría, Zona) para todas las bases.
3. Generar la "Base Semilla" consolidada en `data_processed/`.
4. Importar base semilla localmente a un entorno Postgres/Supabase de desarrollo para testear reglas (CEDIA Protocol).

## 🚀 Tareas Ideales para Perplexity Computer (Heavy Duty)
Estas tareas requieren acceso extenso a descargas, búsqueda en internet de referencias externas o revisión visual pasiva e intensiva de enormes paquetes de documentos PDF:
- Convertir de PDF a CSV/Markdown las tablas puras de insumos CMIC y VARELA.
- Generar scripts auxiliares con OCR avanzado si los PDF son imágenes y no texto seleccionable.
- Realizar fact-checking transversal en internet (ej. ¿cuál fue el último tabulador oficial publicado por la STPS para mano de obra vigente en 2024?) para usarlo en la validación CEDIA.

## 🛠 Tareas que Deben Quedarse en Antigravity (Local Environment / Architecture)
Estas tareas son sensibles, de orquestación local y control de refactorización donde la precisión técnica importa más que el volumen de datos o lecturas externas:
- Ejecutar los scripts python y corregir lógica (`cmic_extractor.py`, `apu_processor.py`).
- Implementar integraciones con Supabase Edge Functions usando scripts locales.
- Refactorizar componentes Frontend en `src/` e integrar estado.
- Manejar la base de datos de los precios unitarios depurados localmente.
- Gestionar ramas de Git y revisiones de código de infraestructura base (CEDIA Trust Framework).

## 🚀 Próxima Tarea: Pipeline NO PDF (Perplexity Computer)
Este pipeline se enfoca en la estructuración de datos que ya han sido extraídos o que provienen de fuentes tabulares (XLS/CSV) en `data_processed/` o `data_raw/seed/`.
- **Objetivo:** Tomar los JSON/CSV generados por los extractores y realizar el mapping final hacia las tablas de Supabase.
- **Acción Perplexity:** Refinar la lógica de `apu_processor.py` para manejar casos de inconsistencia en nombres de columnas sin necesidad de re-leer el PDF original.
- **Prioridad:** Alta (Integridad de datos post-extracción).
