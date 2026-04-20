import pandas as pd
import json
import os
from datetime import datetime

ARCHIVO_ENTRADA = 'data_processed/ppto_reftab_apuc_norm.csv'
CARPETA_SALIDA = 'public/data/insumos' 
FECHA_HOY = datetime.now().strftime("%Y-%m-%d")

def transformar_a_apuc():
    print(f"--- Iniciando proceso ---")
    
    if not os.path.exists(ARCHIVO_ENTRADA):
        print(f"❌ ERROR: No se encuentra el archivo en: {os.path.abspath(ARCHIVO_ENTRADA)}")
        return

    try:
        df = pd.read_csv(ARCHIVO_ENTRADA)
        print(f"✅ Archivo leído. Filas encontradas: {len(df)}")
        
        if not os.path.exists(CARPETA_SALIDA):
            os.makedirs(CARPETA_SALIDA, exist_ok=True)

        for index, row in df.iterrows():
            codigo_original = str(row.get('codigo', f"GEN-{index}")).strip()
            
            # ⬇️ ESTA ES LA CORRECCIÓN: Reemplaza / por - para que Windows no crea que es una carpeta
            codigo_seguro = codigo_original.replace('/', '-').replace('\\', '-')
            
            formato_apuc = {
                "codigo": codigo_original, # Mantenemos el código original dentro del JSON
                "descripcion": str(row.get('descripcion', '')).upper(),
                "unidad": str(row.get('unidad', 'pza')).lower(),
                "precio_unitario": float(row.get('precio_unitario', 0.0)),
                "categoria": str(row.get('categoria', 'Acabados')),
                "subcategoria": str(row.get('subcategoria', 'NO ELÉCTRICO')),
                "fuente": "Insumos_APUCMX",
                "fecha_fuente": FECHA_HOY,
                "unidad_inferida": True,
                "tipo_registro": "material"
            }

            # Guardamos usando el nombre de archivo seguro
            ruta_final = os.path.join(CARPETA_SALIDA, f"{codigo_seguro}.json")
            with open(ruta_final, 'w', encoding='utf-8') as f:
                json.dump(formato_apuc, f, ensure_ascii=False, indent=2)

        print(f"✅ FINALIZADO: Se crearon {len(df)} archivos en {CARPETA_SALIDA}")

    except Exception as e:
        print(f"❌ ERROR CRÍTICO: {e}")

if __name__ == "__main__":
    transformar_a_apuc()