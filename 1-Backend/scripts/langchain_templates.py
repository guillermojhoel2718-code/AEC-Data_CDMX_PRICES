"""
langchain_templates.py
=======================
APUCMX — Templates de LangChain para normalización, generación y auditoría de matrices APU.
Modelo: Gemini Flash (bajo costo, alta velocidad, suficiente para AEC)

Templates disponibles:
  1. NORMALIZE_INSUMO       — normaliza descripción y unidad de insumos
  2. GENERATE_MATRIX        — genera APU completa desde descripción de concepto
  3. AUDIT_BUDGET           — audita un presupuesto contra precios de referencia
  4. PRICE_RESEARCH         — investiga precios de mercado (AGENTE SHERLOCK)
  5. CONCEPT_DESCRIPTION    — genera descripción AEC formal desde texto libre

Uso:
  from langchain_templates import chain_normalizar, chain_generar_matriz

Requiere:
  pip install langchain langchain-google-genai pydantic python-dotenv
"""

import os
import logging
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from pydantic import BaseModel, Field

REPO_ROOT = Path(__file__).resolve().parents[2]
ENV_FILE  = REPO_ROOT / "5-Variables" / ".env.local"
load_dotenv(ENV_FILE)

log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Modelo LLM — Gemini Flash
# ---------------------------------------------------------------------------
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

LLM_FLASH = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    google_api_key=GOOGLE_API_KEY,
    temperature=0.1,          # baja temperatura para respuestas técnicas consistentes
    max_output_tokens=2048,
)

# ===========================================================================
# SCHEMAS Pydantic — para parsear respuestas estructuradas
# ===========================================================================

class InsumoNormalizado(BaseModel):
    descripcion: str    = Field(description="Descripción en MAYÚSCULAS, formato AEC")
    unidad: str         = Field(description="Unidad en minúsculas (pza, m2, ml, kg, lt, m3, etc.)")
    categoria: str      = Field(description="Categoría del insumo")
    subcategoria: str   = Field(description="Subcategoría específica")
    confianza: float    = Field(description="Nivel de confianza 0.0 a 1.0", ge=0, le=1)
    nota: Optional[str] = Field(default=None, description="Observación si el insumo es ambiguo")


class LineaAPU(BaseModel):
    tipo: str            = Field(description="'material', 'mano_obra' o 'equipo'")
    descripcion: str     = Field(description="Descripción del insumo en MAYÚSCULAS")
    unidad: str          = Field(description="Unidad en minúsculas")
    cantidad: float      = Field(description="Cantidad por unidad del concepto")
    precio_unitario: float = Field(description="Precio unitario estimado en MXN")
    importe: float       = Field(description="cantidad * precio_unitario")


class MatrizAPU(BaseModel):
    descripcion: str     = Field(description="Descripción del concepto en MAYÚSCULAS")
    unidad: str          = Field(description="Unidad del concepto en minúsculas")
    region: str          = Field(default="CDMX")
    tipo_obra: str       = Field(description="Tipo de obra o disciplina")
    precio_total: float  = Field(description="Precio total estimado del concepto")
    materiales: list[LineaAPU]
    mano_obra: list[LineaAPU]
    equipo: list[LineaAPU]
    nota_ia: str         = Field(description="Advertencia: estos precios son estimaciones IA para CDMX, verificar con proveedores")


class ObservacionAuditoria(BaseModel):
    concepto: str        = Field(description="Nombre del concepto analizado")
    tipo_error: str      = Field(description="'precio', 'rendimiento', 'unidad' o 'descripcion'")
    descripcion: str     = Field(description="Descripción del problema detectado")
    severidad: str       = Field(description="'alta', 'media' o 'baja'")
    recomendacion: str   = Field(description="Acción recomendada")


class ResultadoAuditoria(BaseModel):
    score: int           = Field(description="Score de calidad del presupuesto, 0-100")
    observaciones: list[ObservacionAuditoria]
    alertas: list[str]   = Field(description="Alertas críticas que requieren atención inmediata")
    recomendaciones: list[str] = Field(description="Sugerencias generales de mejora")
    resumen: str         = Field(description="Resumen ejecutivo de la auditoría")


class PrecioReferencia(BaseModel):
    insumo: str          = Field(description="Nombre del insumo investigado")
    precio_min: float    = Field(description="Precio mínimo encontrado en MXN")
    precio_max: float    = Field(description="Precio máximo encontrado en MXN")
    precio_promedio: float = Field(description="Precio promedio estimado en MXN")
    unidad: str          = Field(description="Unidad del precio")
    region: str          = Field(default="CDMX")
    fuentes: list[str]   = Field(description="Referencias de donde provienen los precios")
    confianza: float     = Field(description="Nivel de confianza 0.0 a 1.0", ge=0, le=1)
    fecha_referencia: str = Field(description="Fecha de referencia de los precios (México 2026)")


# ===========================================================================
# TEMPLATE 1 — NORMALIZE_INSUMO
# ===========================================================================
PROMPT_NORMALIZE = ChatPromptTemplate.from_messages([
    ("system", """Eres ZETTEL, el homologador de insumos de construcción para México.
Tu tarea es normalizar la descripción y unidad de un insumo al formato estándar AEC:
- DESCRIPCIÓN: siempre en MAYÚSCULAS, técnica, sin abreviaturas ambiguas
- UNIDAD: siempre en minúsculas (pza, m2, ml, kg, lt, m3, hr, jor, %)
- CATEGORÍA: material, mano_obra, equipo, indirecto
- Responde SOLO con JSON válido, sin texto adicional."""),
    ("human", """Normaliza este insumo:
Descripción cruda: {descripcion_cruda}
Unidad cruda: {unidad_cruda}
Contexto adicional: {contexto}

Responde con este JSON exacto:
{format_instructions}"""),
])

parser_insumo = JsonOutputParser(pydantic_object=InsumoNormalizado)
chain_normalizar = PROMPT_NORMALIZE.partial(
    format_instructions=parser_insumo.get_format_instructions()
) | LLM_FLASH | parser_insumo


# ===========================================================================
# TEMPLATE 2 — GENERATE_MATRIX
# ===========================================================================
PROMPT_GENERATE = ChatPromptTemplate.from_messages([
    ("system", """Eres un ingeniero civil experto en presupuestación de obra en México.
Genera un Análisis de Precios Unitarios (APU) detallado y REALISTA para la región especificada.

REGLAS:
- Descripciones de insumos en MAYÚSCULAS
- Unidades en minúsculas (m2, m3, ml, kg, pza, hr, jor)
- Precios referenciados a México, {fecha} (pesos MXN)
- SIEMPRE incluir la nota de que son estimaciones IA
- Verificar coherencia: importe = cantidad * precio_unitario
- Responde SOLO con JSON válido."""),
    ("human", """Genera una APU para:
Concepto: {concepto_descripcion}
Región: {region}
Tipo de obra: {tipo_obra}
Unidad del concepto: {unidad}

{format_instructions}"""),
])

parser_matriz = JsonOutputParser(pydantic_object=MatrizAPU)
chain_generar_matriz = PROMPT_GENERATE.partial(
    format_instructions=parser_matriz.get_format_instructions(),
    fecha="mayo 2026",
) | LLM_FLASH | parser_matriz


# ===========================================================================
# TEMPLATE 3 — AUDIT_BUDGET
# ===========================================================================
PROMPT_AUDIT = ChatPromptTemplate.from_messages([
    ("system", """Eres HIGURAMA, el auditor de calidad de presupuestos de construcción para México.
Analiza el presupuesto proporcionado y detecta:
1. Precios fuera de rango para la región y tipo de obra
2. Rendimientos imposibles (muy rápidos o muy lentos)
3. Inconsistencias de unidades
4. Descripciones ambiguas o incorrectas

CRITERIOS DE PRECIOS CDMX 2026 (rangos aproximados):
- Mano de obra por jornal: $800-$2,500 MXN
- Concreto premezclado f'c=250: $2,800-$4,500 MXN/m3
- Acero de refuerzo: $22-$35 MXN/kg
- Block 15x20x40 cm: $10-$18 MXN/pza

Responde SOLO con JSON válido."""),
    ("human", """Audita este presupuesto:
Proyecto: {proyecto}
Región: {region}
Conceptos:
{conceptos_json}

{format_instructions}"""),
])

parser_auditoria = JsonOutputParser(pydantic_object=ResultadoAuditoria)
chain_auditar = PROMPT_AUDIT.partial(
    format_instructions=parser_auditoria.get_format_instructions()
) | LLM_FLASH | parser_auditoria


# ===========================================================================
# TEMPLATE 4 — PRICE_RESEARCH (AGENTE SHERLOCK)
# ===========================================================================
PROMPT_PRICE = ChatPromptTemplate.from_messages([
    ("system", """Eres SHERLOCK, el investigador de precios de materiales de construcción para México.
Basándote en tu conocimiento del mercado mexicano (especialmente CDMX) en 2026, proporciona
rangos de precios reales y fuentes de referencia.

FUENTES TÍPICAS DE REFERENCIA:
- CMIC (Cámara Mexicana de la Industria de la Construcción)
- Neodata Construbase
- Precios de proveedores locales (Grupo IDESA, Cemex, Deacero, etc.)
- INPP (Índice Nacional de Precios al Productor)

Responde SOLO con JSON válido."""),
    ("human", """Investiga el precio de:
Insumo: {insumo_descripcion}
Unidad: {unidad}
Región: {region}
Fecha de referencia: {fecha}

{format_instructions}"""),
])

parser_precio = JsonOutputParser(pydantic_object=PrecioReferencia)
chain_investigar_precio = PROMPT_PRICE.partial(
    format_instructions=parser_precio.get_format_instructions(),
    fecha="México, mayo 2026",
) | LLM_FLASH | parser_precio


# ===========================================================================
# TEMPLATE 5 — CONCEPT_DESCRIPTION
# ===========================================================================
PROMPT_DESCRIPTION = ChatPromptTemplate.from_messages([
    ("system", """Eres un redactor técnico especialista en documentos AEC (Architecture, Engineering, Construction) para México.
Tu tarea es convertir descripciones informales de conceptos de obra en descripciones técnicas formales.

REGLAS:
- Siempre en MAYÚSCULAS
- Incluir materiales principales, proceso constructivo y alcance
- Mencionar normas o especificaciones si aplica
- Ser preciso y sin ambigüedades
- Máximo 2 líneas de texto"""),
    ("human", """Genera una descripción AEC formal para:
Concepto informal: {concepto_breve}
Tipo de obra: {tipo_obra}
Región: {region}

Responde con JSON: {{"descripcion_formal": "...", "unidad_recomendada": "...", "nota": "..."}}"""),
])

chain_describir_concepto = PROMPT_DESCRIPTION | LLM_FLASH | JsonOutputParser()


# ===========================================================================
# Función de prueba
# ===========================================================================
def test_templates():
    """Prueba básica de los templates."""
    log.info("Probando NORMALIZE_INSUMO...")
    try:
        result = chain_normalizar.invoke({
            "descripcion_cruda": "concreto premsz fc250",
            "unidad_cruda": "M3",
            "contexto": "usado en losa maciza",
        })
        log.info(f"  OK: {result}")
    except Exception as e:
        log.error(f"  ERROR: {e}")

    log.info("Probando CONCEPT_DESCRIPTION...")
    try:
        result = chain_describir_concepto.invoke({
            "concepto_breve": "losa plana con concreto 250",
            "tipo_obra": "Estructura",
            "region": "CDMX",
        })
        log.info(f"  OK: {result}")
    except Exception as e:
        log.error(f"  ERROR: {e}")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    test_templates()
