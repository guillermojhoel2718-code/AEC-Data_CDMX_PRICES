# APUCMX — Configuración Supabase

> Guía de puesta en marcha para las tablas del catálogo de precios unitarios (APUCMX).  
> Cubre: creación de schema, configuración de variables de entorno y carga inicial del CSV.

---

## Prerrequisitos

| Requisito | Versión mínima |
|---|---|
| Python | 3.10+ |
| pip packages | `supabase`, `python-dotenv` |
| Cuenta Supabase | Free tier o superior |
| Proyecto activo | "Centro de datos de Precios" (o uno nuevo) |

Instala las dependencias de Python:

```bash
pip install supabase python-dotenv
```

---

## 1 — Crear las tablas en Supabase

1. Ingresa a [app.supabase.com](https://app.supabase.com) y abre tu proyecto.
2. En el menú lateral ve a **SQL Editor → New query**.
3. Copia **todo el contenido** del archivo `docs/schema_supabase_apuc.sql`.
4. Pégalo en el editor y haz clic en **Run** (▶).
5. Verifica que el mensaje final sea `Success. No rows returned`.

> **Nota:** El script es idempotente (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `CREATE POLICY`). Si alguna tabla ya existe no arroja error, pero si las políticas RLS ya existen puede aparecer un aviso; en ese caso elimínalas manualmente desde **Authentication → Policies** y vuelve a ejecutar.

### Tablas creadas

| Tabla | Descripción |
|---|---|
| `apuc_insumos` | Catálogo maestro (~12 200 insumos). Lectura pública. |
| `profiles` | Datos de usuario vinculados a Supabase Auth. |
| `concepts` | Análisis de Precios Unitarios por usuario. |
| `concept_lines` | Líneas de detalle de cada APU (materiales, MO, equipo, subcontrato). |
| `concept_overcost` | Sobrecostos/indirectos de cada APU (relación 1:1 con concepts). |

---

## 2 — Configurar `.env.local`

Crea el archivo `.env.local` en la **raíz del proyecto** (está incluido en `.gitignore`):

```env
# URL pública del proyecto Supabase
SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co

# Clave service_role (SOLO para scripts backend/locales — nunca la expongas en el frontend)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Clave anon (para el frontend React)
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Dónde encontrar las claves

1. Abre tu proyecto en [app.supabase.com](https://app.supabase.com).
2. Ve a **Project Settings → API**.
3. Copia:
   - **Project URL** → `SUPABASE_URL` (y `VITE_SUPABASE_URL`)
   - **anon / public** → `VITE_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ (solo backend)

> **Seguridad:** La `service_role` key bypassa RLS. Úsala ÚNICAMENTE en scripts locales o en Edge Functions del servidor. NUNCA la incluyas en el código del frontend.

---

## 3 — Ejecutar `load_supabase.py`

Desde la raíz del proyecto:

```bash
# Opción A: con .env.local en la raíz (recomendado)
python scripts/load_supabase.py

# Opción B: exportando variables manualmente en la terminal
export SUPABASE_URL="https://xxxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJ..."
python scripts/load_supabase.py
```

### Salida esperada

```
============================================================
  APUCMX — Carga a Supabase (apuc_insumos)
  CSV: .../data/processed/catalogo_apuc_mvp.csv
  Inicio: 2026-04-13 00:05:00
============================================================

[1/3] Leyendo catálogo CSV...
      Total registros leídos: 12,200

[2/3] Cargando en lotes de 500 filas...
      Lote 1/25  (500 filas)... ✓
      Lote 2/25  (500 filas)... ✓
      ...
      Lote 25/25 (200 filas)... ✓

============================================================
  RESUMEN DE CARGA
============================================================
  Registros procesados OK : 12,200
  Fallidos                : 0

  Fin: 2026-04-13 00:06:30
============================================================
```

Si hay errores, se genera un log en `data/processed/load_errors.log`.

---

## 4 — Verificar los datos en Supabase

### Opción A — Table Editor (UI)

1. Ve a **Table Editor** en el menú lateral.
2. Selecciona `apuc_insumos`.
3. Confirma que aparecen ~12 200 filas.

### Opción B — SQL Editor

```sql
-- Conteo total y distribución por tipo
SELECT tipo_registro, COUNT(*) AS total
FROM apuc_insumos
GROUP BY tipo_registro
ORDER BY total DESC;

-- Prueba de búsqueda FTS en español
SELECT codigo, descripcion, precio_unitario
FROM apuc_insumos
WHERE to_tsvector('spanish', descripcion) @@ plainto_tsquery('spanish', 'concreto hidráulico')
LIMIT 10;
```

### Opción C — API REST (anon key)

```bash
curl "https://TU_PROYECTO.supabase.co/rest/v1/apuc_insumos?limit=5" \
  -H "apikey: TU_ANON_KEY" \
  -H "Authorization: Bearer TU_ANON_KEY"
```

---

## Notas de seguridad

- Las políticas RLS garantizan que `concepts`, `concept_lines` y `concept_overcost` solo sean accesibles por su propietario (`user_id = auth.uid()`).
- `apuc_insumos` es de **solo lectura** desde el cliente (anon / usuario autenticado). La escritura ocurre únicamente desde el script con `service_role`.
- Nunca subas `.env.local` al repositorio (ya está en `.gitignore`).

---

## Próximos pasos (P3+)

- Conectar el frontend React a las tablas `concepts` / `concept_lines` / `concept_overcost`.
- Implementar autenticación con Supabase Auth y el trigger de creación de `profiles`.
- Agregar Edge Function para calcular el precio total de un APU.
