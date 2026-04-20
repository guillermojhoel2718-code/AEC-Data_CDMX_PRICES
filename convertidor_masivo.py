import pandas as pd
import json
import os
from datetime import datetime

# Rutas actualizadas para procesar todo el repositorio local
CARPETA_ENTRADA = 'data_processed'
CARPETA_SALIDA = 'public/data/insumos' 
FECHA_HOY = datetime.now().strftime("%Y-%m-%d")

def procesar_todo():
    print(f"--- Iniciando Procesamiento Masivo ---")
    
    if not os.path.exists(CARPETA_ENTRADA):
        print(f"❌ ERROR: No existe la carpeta {CARPETA_ENTRADA}")
        return

    if not os.path.exists(CARPETA_SALIDA):
        os.makedirs(CARPETA_SALIDA, exist_ok=True)

    # Listar todos los archivos CSV en la carpeta
    archivos_csv = [f for f in os.listdir(CARPETA_ENTRADA) if f.endswith('.csv')]
    
    if not archivos_csv:
        print("⚠️ No se encontraron archivos CSV para procesar.")
        return

    for archivo in archivos_csv:
        ruta_csv = os.path.join(CARPETA_ENTRADA, archivo)
        print(f"📄 Procesando: {archivo}...")
        
        try:
            df = pd.read_csv(ruta_csv)
            conteo_archivo = 0
            
            for index, row in df.iterrows():
                codigo_original = str(row.get('codigo', f"GEN-{index}")).strip()
                # Limpieza de seguridad para nombres de archivos en Windows
                codigo_seguro = codigo_original.replace('/', '-').replace('\\', '-').replace(':', '-')
                
                formato_apuc = {
                    "codigo": codigo_original,
                    "descripcion": str(row.get('descripcion', '')).upper(),
                    "unidad": str(row.get('unidad', 'pza')).lower(),
                    "precio_unitario": float(row.get('precio_unitario', 0.0)),
                    "categoria": str(row.get('categoria', 'General')),
                    "subcategoria": str(row.get('subcategoria', 'S/C')),
                    "fuente": "Insumos_APUCMX",
                    "fecha_fuente": FECHA_HOY,
                    "unidad_inferida": True,
                    "tipo_registro": "material"
                }

                ruta_final = os.path.join(CARPETA_SALIDA, f"{codigo_seguro}.json")
                with open(ruta_final, 'w', encoding='utf-8') as f:
                    json.dump(formato_apuc, f, ensure_ascii=False, indent=2)
                conteo_archivo += 1
            
            print(f"   ✅ {archivo} terminado ({conteo_archivo} registros).")

        except Exception as e:
            print(f"   ❌ ERROR en {archivo}: {e}")

    print(f"\n--- ✨ PROCESO FINALIZADO ✨ ---")
    print(f"Todos los archivos JSON están en: {os.path.abspath(CARPETA_SALIDA)}")

if __name__ == "__main__":
    procesar_todo()