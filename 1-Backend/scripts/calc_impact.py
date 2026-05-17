import pandas as pd

df = pd.read_csv('f:/Negocio Ia/APUCMX_V1/data_processed/catalogo_apuc_mvp.csv')
indirectos_1 = df[((df['tipo_registro'] == 'indirecto') | (df['tipo_registro'] == 'mano_obra'))]
print(f"Total 'm': {len(df[df['unidad'] == 'm'])}")
indirectos_solos = df[df['tipo_registro'] == 'indirecto']
print(f"Total 'indirecto': {len(indirectos_solos)}")
indirectos_uno = indirectos_solos[indirectos_solos['precio_unitario'] == 1.00]
print(f"Indirectos con precio=1.00: {len(indirectos_uno)}")
print("Ejemplo de M-130 u otros con unidad M antes vs despues:")
print("Total pza ahora: ", len(df[df['unidad']=='pza']))
