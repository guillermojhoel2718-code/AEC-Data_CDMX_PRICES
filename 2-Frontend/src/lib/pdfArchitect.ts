import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Concept } from 'src/context/ConceptContext';

export const generateBudgetPDF = (concepts: Concept[], title: string = 'Presupuesto Estimado') => {
  const doc = new jsPDF();
  
  // Colores corporativos (Premium Dark theme adaptado a impresión)
  const primaryColor: [number, number, number] = [99, 102, 241]; // Indigo-500
  const secondaryColor: [number, number, number] = [6, 182, 212]; // Cyan-500
  
  // Título y Cabecera
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('APUCMX', 14, 22);
  
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text(title, 14, 32);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const date = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`Fecha de generación: ${date}`, 14, 40);
  
  // Leyenda de seguridad y advertencia
  doc.setFontSize(8);
  doc.setTextColor(200, 50, 50); // Rojo oscuro para advertencia
  doc.text(
    'NOTA IMPORTANTE: Este presupuesto ha sido generado utilizando inteligencia artificial (Agente: PDF ARCHITECT)',
    14,
    48
  );
  doc.setTextColor(100, 100, 100);
  doc.text(
    'y la base de datos de Supabase de APUCMX (Abril 2026). Los precios son puramente estimativos y referenciales.',
    14,
    52
  );
  doc.text(
    'Deben ser verificados por un profesional antes de su uso comercial o contractual.',
    14,
    56
  );

  // Preparar datos para la tabla
  const tableData = concepts.map((concept, index) => {
    // Calculamos el costo directo si no viene en el precio
    const precio = typeof concept.price === 'number' ? concept.price : parseFloat(String(concept.price).replace(/[^0-9.-]+/g,"")) || 0;
    
    return [
      (index + 1).toString(),
      concept.id || '-',
      (concept.name || '').toUpperCase(),
      (concept.unit || 'pza').toLowerCase(),
      `$${precio.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      concept.region || 'CDMX'
    ];
  });

  // Generar tabla
  autoTable(doc, {
    startY: 65,
    head: [['#', 'CLAVE', 'DESCRIPCIÓN', 'UNIDAD', 'P.U. ESTIMADO', 'REGIÓN']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [50, 50, 50],
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 25, fontStyle: 'bold' },
      2: { cellWidth: 'auto' }, // Descripción toma el resto
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 25, halign: 'center' },
    },
    didDrawPage: (data) => {
      // Pie de página
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        'APUCMX - Base de Datos AEC 2026',
        14,
        pageHeight - 10
      );
      
      const str = 'Página ' + doc.getNumberOfPages();
      doc.text(str, pageSize.width - 25, pageHeight - 10);
    },
  });

  // Descargar el documento
  doc.save(`Presupuesto_APUCMX_${new Date().getTime()}.pdf`);
};
