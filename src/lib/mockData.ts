import { Concept } from '../context/ConceptContext';

export const MOCK_CONCEPTS: Concept[] = [
  {
    id: 'CON-001',
    name: 'Concreto f\'c=250 kg/cm2 en cimentación',
    price: '$2,450.00',
    unit: 'm3',
    region: 'CDMX',
    status: 'verified',
    type: 'Cimentación',
    overhead: '1.24',
    materials: [
      { id: 'm1', code: 'MAT-001', description: 'Cemento Gris Portland', unit: 'ton', costLab: 3200, fletes: 150, maniobra: 50, almacenaje: 20, fcActual: 1.05 },
      { id: 'm2', code: 'MAT-002', description: 'Arena de Mina', unit: 'm3', costLab: 450, fletes: 100, maniobra: 0, almacenaje: 0, fcActual: 1.02 },
      { id: 'm3', code: 'MAT-003', description: 'Grava 3/4"', unit: 'm3', costLab: 520, fletes: 120, maniobra: 0, almacenaje: 0, fcActual: 1.02 },
    ],
    labor: [
      { id: 'l1', description: 'Cuadrilla de albañilería (1 Cabo + 5 Albañiles)', baseSalary: 1200, fsi: 1.25, fasar: 1.65, quantity: 0.15 },
    ],
    equipment: [
      { id: 'e1', description: 'Revolvedora de concreto 1 saco', costLab: 450, fletes: 50, maniobra: 0, almacenaje: 0, fcActual: 1.0 },
    ],
    overcostFactors: {
      indirectoHonorarios: 5.0,
      indirectoDepreciacion: 1.5,
      indirectoServicios: 2.0,
      indirectoGastosOficina: 3.5,
      indirectoFletes: 0.5,
      indirectoCapacitacion: 0.2,
      indirectoSeguridad: 0.8,
      indirectoAuxiliares: 1.0,
      financiamiento: 1.5,
      utilidad: 8.0,
      cargosAdicionales: 0.5,
      imss: 0.0,
      seguros: 0.0
    }
  },
  {
    id: 'CON-002',
    name: 'Muro de block de concreto 15x20x40 cm',
    price: '$385.00',
    unit: 'm2',
    region: 'Edomex',
    status: 'verified',
    type: 'Albañilería',
    overhead: '1.22',
    materials: [
      { id: 'm4', code: 'MAT-045', description: 'Block de concreto 15x20x40', unit: 'pza', costLab: 12.5, fletes: 1.5, maniobra: 0.5, almacenaje: 0, fcActual: 1.0 },
    ],
    labor: [
      { id: 'l2', description: 'Albañil + Peón', baseSalary: 950, fsi: 1.25, fasar: 1.65, quantity: 0.25 },
    ],
    overcostFactors: {
      indirectoHonorarios: 4.0,
      indirectoDepreciacion: 1.0,
      indirectoServicios: 1.5,
      indirectoGastosOficina: 2.5,
      indirectoFletes: 0.5,
      indirectoCapacitacion: 0.2,
      indirectoSeguridad: 1.0,
      indirectoAuxiliares: 0.5,
      financiamiento: 1.0,
      utilidad: 10.0,
      cargosAdicionales: 0.5,
      imss: 0.0,
      seguros: 0.0
    }
  }
];
