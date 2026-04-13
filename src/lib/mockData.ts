import { Concept } from '../context/ConceptContext';

export const MOCK_CONCEPTS: Concept[] = [
  {
    id: 'CON-EXC-01',
    name: 'Excavación por medios mecánicos en cepas y zanjas en material B seco',
    price: '$124.50',
    unit: 'm3',
    region: 'CDMX',
    status: 'verified',
    type: 'Terracerías',
    overhead: '1.2450',
    materials: [],
    labor: [
      { id: 'l1', description: 'Cuadrilla No. 2 (1 Cabo de oficios + 2 Peones)', baseSalary: 1250, fsi: 1.25, fasar: 1.65, quantity: 0.05 },
    ],
    equipment: [
      { id: 'e1', description: 'Retroexcavadora Cat 416F2 de 87 HP, cuchara de 0.96 m3', costLab: 580.00, fletes: 20, maniobra: 0, almacenaje: 0, fcActual: 1.0 },
    ],
    subcontracts: [],
    overcostFactors: {
      indirectoHonorarios: 4.5,
      indirectoDepreciacion: 1.2,
      indirectoServicios: 1.8,
      indirectoGastosOficina: 3.0,
      indirectoFletes: 0.5,
      indirectoCapacitacion: 0.2,
      indirectoSeguridad: 0.8,
      indirectoAuxiliares: 1.0,
      financiamiento: 1.5,
      utilidad: 8.0,
      cargosAdicionales: 0.5,
      imss: 1.0,
      seguros: 0.5
    }
  },
  {
    id: 'CON-CIM-01',
    name: 'Zapata aislada Z-1 de concreto premezclado f\'c=250 kg/cm2, armada con acero fy=4200 kg/cm2',
    price: '$4,580.20',
    unit: 'pza',
    region: 'Norte',
    status: 'verified',
    type: 'Cimentación',
    overhead: '1.2820',
    materials: [
      { id: 'm1', code: 'MAT-CON-01', description: 'Concreto premezclado f\'c=250 kg/cm2 TMA 3/4" rev 14cm PCA', unit: 'm3', costLab: 2150, fletes: 0, maniobra: 0, almacenaje: 0, fcActual: 1.03 },
      { id: 'm2', code: 'MAT-ACE-01', description: 'Acero de refuerzo corrugado fy=4200 kg/cm2 de 1/2"', unit: 'ton', costLab: 18500, fletes: 350, maniobra: 150, almacenaje: 50, fcActual: 1.05 },
      { id: 'm3', code: 'MAT-MAD-01', description: 'Madera de pino de 3ra p/cimbra', unit: 'pt', costLab: 24, fletes: 1.5, maniobra: 0.5, almacenaje: 0, fcActual: 1.00 },
      { id: 'm4', code: 'MAT-CLA-01', description: 'Clavo estándar con cabeza de 2 1/2"', unit: 'kg', costLab: 38, fletes: 0, maniobra: 0, almacenaje: 0, fcActual: 1.00 }
    ],
    labor: [
      { id: 'l2', description: 'Cuadrilla de Fierreros (1 Cabo + 1 Fierrero + 1 Ayudante)', baseSalary: 1450, fsi: 1.25, fasar: 1.68, quantity: 1.20 },
      { id: 'l3', description: 'Cuadrilla de Carpinteros (1 Cabo + 1 Carpintero + 1 Ayudante)', baseSalary: 1520, fsi: 1.25, fasar: 1.68, quantity: 0.80 },
      { id: 'l4', description: 'Cuadrilla de Albañilería (1 Cabo + 5 Albañiles)', baseSalary: 2800, fsi: 1.25, fasar: 1.68, quantity: 0.40 }
    ],
    equipment: [
      { id: 'e2', description: 'Vibrador de concreto a gasolina 4 HP, chicote 4m', costLab: 45.50, fletes: 0, maniobra: 0, almacenaje: 0, fcActual: 1.0 },
      { id: 'e3', description: 'Bomba pluma para concreto', costLab: 1200, fletes: 250, maniobra: 0, almacenaje: 0, fcActual: 1.0 },
      { id: 'e4', description: 'Herramienta menor', costLab: 5.20, fletes: 0, maniobra: 0, almacenaje: 0, fcActual: 1.0 }
    ],
    subcontracts: [],
    overcostFactors: {
      indirectoHonorarios: 5.0,
      indirectoDepreciacion: 1.5,
      indirectoServicios: 2.0,
      indirectoGastosOficina: 3.5,
      indirectoFletes: 0.5,
      indirectoCapacitacion: 0.5,
      indirectoSeguridad: 1.2,
      indirectoAuxiliares: 1.0,
      financiamiento: 2.0,
      utilidad: 9.0,
      cargosAdicionales: 0.5,
      imss: 1.0,
      seguros: 0.5
    }
  },
  {
    id: 'CON-ALB-01',
    name: 'Muro de block de concreto pesado 15x20x40 cm asentado con mortero cemento-arena 1:4',
    price: '$395.40',
    unit: 'm2',
    region: 'Occidente',
    status: 'verified',
    type: 'Albañilería',
    overhead: '1.2550',
    materials: [
      { id: 'm5', code: 'MAT-BLO-01', description: 'Block hueco de concreto pesado de 15x20x40 cm', unit: 'pza', costLab: 11.50, fletes: 1.20, maniobra: 0.30, almacenaje: 0, fcActual: 1.02 },
      { id: 'm6', code: 'MAT-CEM-01', description: 'Cemento gris Portland Cruz Azul Tipo CPO 30R', unit: 'ton', costLab: 3100, fletes: 120, maniobra: 50, almacenaje: 15, fcActual: 1.01 },
      { id: 'm7', code: 'MAT-ARE-01', description: 'Arena de mina limpia, criba 3/8"', unit: 'm3', costLab: 380, fletes: 80, maniobra: 0, almacenaje: 0, fcActual: 1.00 },
      { id: 'm8', code: 'MAT-AGU-01', description: 'Agua para construcción (pipa 10,000 lts)', unit: 'm3', costLab: 85, fletes: 0, maniobra: 0, almacenaje: 0, fcActual: 1.00 }
    ],
    labor: [
      { id: 'l5', description: 'Cuadrilla No. 5 (1 Cabo + 1 Oficial Albañil + 1 Peón)', baseSalary: 1150, fsi: 1.25, fasar: 1.63, quantity: 0.18 }
    ],
    equipment: [
      { id: 'e5', description: 'Revolvedora para mortero Mpower 1 saco 8HP', costLab: 85.00, fletes: 0, maniobra: 0, almacenaje: 0, fcActual: 1.0 },
      { id: 'e6', description: 'Andamio tubular estándar (juego 2 marcos 2 crucetas)', costLab: 8.50, fletes: 0, maniobra: 0, almacenaje: 0, fcActual: 1.0 },
      { id: 'e7', description: 'Herramienta menor', costLab: 2.80, fletes: 0, maniobra: 0, almacenaje: 0, fcActual: 1.0 }
    ],
    subcontracts: [],
    overcostFactors: {
      indirectoHonorarios: 4.8,
      indirectoDepreciacion: 1.0,
      indirectoServicios: 1.5,
      indirectoGastosOficina: 2.5,
      indirectoFletes: 0.5,
      indirectoCapacitacion: 0.2,
      indirectoSeguridad: 0.5,
      indirectoAuxiliares: 1.0,
      financiamiento: 1.5,
      utilidad: 10.0,
      cargosAdicionales: 0.5,
      imss: 1.0,
      seguros: 0.5
    }
  }
];
