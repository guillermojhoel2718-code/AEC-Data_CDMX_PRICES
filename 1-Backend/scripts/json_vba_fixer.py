"""
json_vba_fixer.py
=================
Repara los JSONs con comillas no escapadas en las descripciones.
El problema típico: "Barrote de Pino de 3era de 1 1/2" x 3 1/2" x 8'"
Las comillas de pulgadas dentro del string rompen el JSON.

Uso:
    python 1-Backend/scripts/json_vba_fixer.py

Genera versiones corregidas en la misma carpeta (sobreescribe con backup).
"""

import re
import json
import shutil
from pathlib import Path
import logging, sys

REPO_ROOT = Path(__file__).resolve().parents[2]
JSON_DIR  = REPO_ROOT / "1-Backend" / "docs" / "insumos" / "Procesados manuales" / "JSON_VBA"
BACKUP_DIR = JSON_DIR / "_backup_originals"

logging.basicConfig(level=logging.INFO, format="%(levelname)-8s  %(message)s",
                    handlers=[logging.StreamHandler(sys.stdout)])
log = logging.getLogger("fixer")

ENCODINGS = ["utf-8", "utf-8-sig", "latin-1", "cp1252"]

def reparar_comillas_en_valores(texto: str) -> str:
    """
    Reemplaza comillas " usadas como símbolo de pulgadas (") dentro de valores JSON.
    Estrategia: busca patrones como: ": "texto con "pulgadas" texto"
    y escapa las comillas internas.
    """
    # Patrón: ": "...con "algo" dentro..."
    # Reemplazar comillas que NO son delimitadores de campo JSON
    # Aproximación: reemplazar " seguida de dígito o espacio + dígito (pulgadas) por \"
    # Ej: 1 1/2" x → 1 1/2\" x
    texto = re.sub(r'(\d)\s*"', r'\1\\"', texto)   # 3 1/2" → 3 1/2\"
    texto = re.sub(r'"\s*x\s*', r'\\" x ', texto)  # " x → \" x  (pulgadas seguidas de x)
    return texto


def intentar_parse(texto: str) -> bool:
    try:
        json.loads(texto)
        return True
    except json.JSONDecodeError:
        return False


def procesar_archivo(path: Path) -> bool:
    """Intenta reparar un JSON mal formado. Retorna True si tuvo éxito."""
    raw = path.read_bytes()

    for enc in ENCODINGS:
        try:
            texto = raw.decode(enc)
            if intentar_parse(texto):
                return True  # Ya es válido con este encoding
            # Intentar reparar
            reparado = reparar_comillas_en_valores(texto)
            if intentar_parse(reparado):
                # Hacer backup del original
                BACKUP_DIR.mkdir(parents=True, exist_ok=True)
                shutil.copy2(path, BACKUP_DIR / path.name)
                # Guardar versión reparada
                path.write_text(reparado, encoding="utf-8")
                log.info(f"  ✓ Reparado: {path.name}")
                return True
        except UnicodeDecodeError:
            continue

    log.warning(f"  ✗ No se pudo reparar: {path.name}")
    return False


def main():
    archivos = sorted(JSON_DIR.glob("*.json"))
    total = len(archivos)
    ok = 0
    errores = []

    log.info(f"Escaneando {total} archivos JSON...")

    for path in archivos:
        raw = path.read_bytes()
        decodificable = False
        valido = False

        for enc in ENCODINGS:
            try:
                texto = raw.decode(enc)
                decodificable = True
                json.loads(texto)
                valido = True
                break
            except UnicodeDecodeError:
                continue
            except json.JSONDecodeError:
                break  # Decodificó pero JSON malformado — intentar reparar

        if valido:
            ok += 1
            continue

        if procesar_archivo(path):
            ok += 1
        else:
            errores.append(path.name)

    log.info(f"\nRESUMEN: {ok}/{total} válidos. {len(errores)} irreparables.")
    if errores:
        log.warning("Archivos irreparables (revisar manualmente):")
        for e in errores:
            log.warning(f"  - {e}")


if __name__ == "__main__":
    main()
