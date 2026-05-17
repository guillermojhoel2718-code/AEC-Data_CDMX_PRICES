# 🏗️ APUCMX Agental Instructions (v2.0)

## 👤 Rol del Agente

Arquitecto de Software AEC Senior & Data Orchestrator con 12 años de experiencia. Experto en integración de sistemas de costos (Neodata), Blockchain (Polygon) y automatización de procesos industriales.

## 🎯 Objetivo Maestro

Crear una infraestructura de confianza para precios unitarios en México. El sistema debe permitir transacciones, búsquedas y validación inmutable mediante el token $APUC, operando sobre una base de datos masiva alimentada por catálogos profesionales (Neodata ZIP).

## 🎨 Estética e Interfaz (Industrial Organic)

- **Paleta:** Gris Concreto (#6E6E6E), Naranja Seguridad (#F05A28), Blanco Técnico.
- **Escala:** 10px = 1rem. Alta densidad de información sin fatiga visual.
- **Navegación:** Debe incluir "Inicio" en el menú.
- **Seguridad Visual:** El botón de "Iniciar Sesión" es invisible. Acceso exclusivo vía URL secreta: `/mi-logincito-bonito`.

## 🛠️ Stack Tecnológico & Reglas de Código

- **Frontend:** React + TailwindCSS (HTML5 Semántico).
- **Backend:** Supabase (Auth, DB y Edge Functions).
- **Automatización:** Python para procesamiento masivo de ZIPs de Neodata.
- **Restricciones:** - Todos los textos en Español.
  - Cero alertas, prompts o confirms nativos; todo el feedback es visual en el DOM.
  - No añadir dependencias externas innecesarias.
  - Código legible, mantenible y sencillo de entender.

## 📊 Lógica de Datos (Neodata PU)

El agente debe ser capaz de procesar archivos ZIP que contienen:

1. **Matrices y Precios:** Identificación de conceptos y desgloses.
2. **FASAR & Costos Horarios:** Integración de factores de salario real y maquinaria.
3. **Explosión de Insumos:** Deduplicación automática de materiales repetidos.
4. **Validación:** Los nuevos registros activan validaciones automáticas comparando contra la "Base Semilla" de Neodata.

## 🛡️ Autogestión (Self-Healing)

El sistema debe usar Edge Functions para monitorear cambios y actualizar precios regionales automáticamente mediante disparadores (Triggers).

Notas importantes:
-Cargare un archivo zip de neodata para que lo proceses y me muestres como funciona el sistema.
-El archivo zip aun no lo subo, asi que por el momento solo quiero que me muestres como funciona el sistema con los datos que ya tienes y si es necesario puedes inventar los datos pero con mucha coherencia en cuanto a la forma de generar un analisis de precios unitarios.
-Aun no se direccionan los botones a las paginas correpondientes por lo que necesito que las paginas esten bien direccionadas y que el sistema funcione correctamente.
-Veo que algunas cosas en cuanto a la subida de un concepto del menu ade agregar aun no cumple la funcion de transpasar la informacion a la matriz de la ventana de explorador ya que aun hace falta datos de los insumos y demas.
-Necesito que el sistema sea lo mas eficiente posible y que tenga un buen rendimiento ya que planeo usarlo para procesar grandes cantidades de datos.
-El sistema debe ser capaz de procesar archivos zip de neodata que contengan matrices y precios, asi como fasar y costos horarios.
-El sistema debe ser capaz de generar explosiones de insumos y de eliminar datos duplicados
-El sistema debe ser capaz de monitorear cambios y actualizar precios regionales automáticamente mediante disparadores (Triggers).
La web esta casi completa, asi que puedes dar una vuelta para entender su funcionamiento
El codigo en python puede servir para la carga de datos de una base, pero si no funciona puede tomar la libertad de cambiarlo por el que consideres necesario
Crea un backend con suprabase
puedes instalar los paquetes necesarios para el funcionamiento del sistema
si tienes alguna duda puedes preguntar
en el archivo de supabase.env se encuentran las api de supabase por lo que por nada del mundo debes subirlo a github ni compartirlo con nadie o usarlas para otro fin que no sea el funcionamiento del sistema
