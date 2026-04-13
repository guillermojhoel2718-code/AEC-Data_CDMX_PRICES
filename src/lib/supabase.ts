/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'dummy-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Canonical regions (Source of Truth: Artículo Estratégico v3 + README)
export const REGIONS = ['CDMX', 'Norte', 'Bajio', 'Occidente', 'Sur'] as const;
export type Region = typeof REGIONS[number];

export const REGION_LABELS: Record<Region, string> = {
  'CDMX': 'CDMX',
  'Norte': 'Norte',
  'Bajio': 'Bajío',
  'Occidente': 'Occidente',
  'Sur': 'Sur',
};

// Membership tiers (Source of Truth: Artículo Estratégico v3)
export type MembershipTier = 'gratis' | 'mensual' | 'anual' | 'creador';

// Types matching DB schema
export interface ProfileRow {
  id: string;
  full_name: string | null;
  occupation: string | null;
  region: string;
  account_type: string;
  membership: MembershipTier;
  node_hash: string | null;
  apuc_credits: number;
  cedia_reputation: number;
  blockchain_address: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConceptRow {
  id: string;
  name: string;
  price: string;
  unit: string;
  region: Region;
  status: 'verified' | 'pending' | 'rejected';
  type: string;
  overhead: string;
  user_id: string | null;
  cedia_score: number;
  adoption_count: number;
  apuc_credits_earned: number;
  blockchain_hash: string | null;
  blockchain_tx: string | null;
  blockchain_timestamp: string | null;
  cedia_feedback: string | null;
  created_at: string;
}

export interface MaterialRow {
  id: string;
  concept_id: string;
  code: string;
  description: string;
  unit: string;
  cost_lab: number;
  fletes: number;
  maniobra: number;
  almacenaje: number;
  fc_actual: number;
  sort_order: number;
}

export interface LaborRow {
  id: string;
  concept_id: string;
  description: string;
  base_salary: number;
  fsi: number;
  fasar: number;
  quantity: number;
  sort_order: number;
}

export interface EquipmentRow {
  id: string;
  concept_id: string;
  description: string;
  cost_lab: number;
  fletes: number;
  maniobra: number;
  almacenaje: number;
  fc_actual: number;
  sort_order: number;
}

export interface SubcontractRow {
  id: string;
  concept_id: string;
  description: string;
  unit: string;
  cost_lab: number;
  fletes: number;
  maniobra: number;
  sort_order: number;
}

export interface OvercostRow {
  id: string;
  concept_id: string;
  indirecto_honorarios: number;
  indirecto_depreciacion: number;
  indirecto_servicios: number;
  indirecto_gastos_oficina: number;
  indirecto_fletes: number;
  indirecto_capacitacion: number;
  indirecto_seguridad: number;
  indirecto_auxiliares: number;
  financiamiento: number;
  utilidad: number;
  cargos_adicionales: number;
  imss: number;
  seguros: number;
}

// New tables from Artículo Estratégico v3
export interface MarketplaceAsset {
  id: string;
  user_id: string | null;
  title: string;
  description: string | null;
  asset_type: 'familia_bim' | 'template' | 'rutina' | 'matriz_apu';
  file_url: string | null;
  price_apuc: number;
  price_mxn: number;
  adoption_count: number;
  cedia_verified: boolean;
  cedia_score: number;
  blockchain_hash: string | null;
  region: string;
  status: 'active' | 'pending_review' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface ApucCreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: 'earn_contribution' | 'earn_adoption' | 'spend_query' | 'spend_purchase' | 'transfer';
  concept_id: string | null;
  asset_id: string | null;
  description: string | null;
  blockchain_tx: string | null;
  created_at: string;
}
