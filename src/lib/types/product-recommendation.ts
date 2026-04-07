// Product Recommendation Types for DeepSkyn Mobile
// Based on backend implementation at /routines/recommend-product
// Note: ProductRecommendation interface is already defined in routine.ts

import type { ProductRecommendation } from './routine';

// Re-export from routine for convenience
export type { ProductRecommendation } from './routine';

export interface RecommendProductDto {
  stepName: string;
  stepCategory: ProductCategory;
  stepDescription?: string;
  skinType?: string;
  concerns?: string;
}

export type ProductCategory = 
  | 'cleanser'
  | 'toner'
  | 'serum'
  | 'moisturizer'
  | 'sunscreen'
  | 'exfoliant'
  | 'mask'
  | 'eye_cream'
  | 'spot_treatment'
  | 'oil';

export interface ProductSimulation {
  id: string;
  userId: string;
  productName: string;
  productCategory: string;
  productIngredients: string[];
  simulationPeriod: number;
  startState: SkinState;
  predictedState: SkinState;
  expectedChanges: ExpectedChanges;
  riskFactors: string[];
  successProbability: number;
  status: ProductSimulationStatus;
  actualResults?: any;
  feedback?: string;
  createdAt: string;
  validUntil: string;
}

export interface SkinState {
  healthScore: number;
  hydration: number;
  texture: number;
  oiliness: number;
  sensitivity: number;
  pigmentation: number;
  acne: number;
  wrinkles: number;
}

export interface ExpectedChanges {
  hydration?: { change: number; description: string };
  texture?: { change: number; description: string };
  oiliness?: { change: number; description: string };
  sensitivity?: { change: number; description: string };
  pigmentation?: { change: number; description: string };
  acne?: { change: number; description: string };
  wrinkles?: { change: number; description: string };
  overall?: { change: number; description: string };
}

export type ProductSimulationStatus = 
  | 'SIMULATED' 
  | 'TESTING' 
  | 'CONFIRMED' 
  | 'REJECTED' 
  | 'EXPIRED';

export interface SimulateProductDto {
  productName: string;
  productCategory: string;
  productIngredients: string[];
  simulationPeriod?: number;
  notes?: string;
}

export interface SkinPrediction {
  id: string;
  userId: string;
  predictionDate: string;
  predictedState: SkinState;
  confidence: number;
  basedOnDays: number;
  factors: PredictionFactors;
  preventiveTips: string[];
  warnings: string[];
  createdAt: string;
}

export interface PredictionFactors {
  weather?: { temperature: number; humidity: number; uvIndex: number };
  season?: string;
  routineAdherence?: number;
  lifestyle?: { sleep: number; stress: number; hydration: number };
}

// Category metadata for UI display
export const PRODUCT_CATEGORIES: Record<ProductCategory, { 
  label: string; 
  icon: string; 
  color: string;
  description: string;
}> = {
  cleanser: { 
    label: 'Nettoyant', 
    icon: 'water-outline', 
    color: '#06B6D4',
    description: 'Nettoie en douceur sans agresser' 
  },
  toner: { 
    label: 'Tonique', 
    icon: 'flask-outline', 
    color: '#8B5CF6',
    description: 'Équilibre le pH de la peau' 
  },
  serum: { 
    label: 'Sérum', 
    icon: 'color-fill-outline', 
    color: '#EC4899',
    description: 'Concentration active ciblée' 
  },
  moisturizer: { 
    label: 'Hydratant', 
    icon: 'water', 
    color: '#10B981',
    description: 'Hydrate et nourrit la peau' 
  },
  sunscreen: { 
    label: 'Protection solaire', 
    icon: 'sunny-outline', 
    color: '#F59E0B',
    description: 'Protège des UV nocifs' 
  },
  exfoliant: { 
    label: 'Exfoliant', 
    icon: 'sparkles-outline', 
    color: '#EF4444',
    description: 'Élimine les cellules mortes' 
  },
  mask: { 
    label: 'Masque', 
    icon: 'happy-outline', 
    color: '#6366F1',
    description: 'Soin intensif hebdomadaire' 
  },
  eye_cream: { 
    label: 'Contour des yeux', 
    icon: 'eye-outline', 
    color: '#14B8A6',
    description: 'Traite le contour des yeux' 
  },
  spot_treatment: { 
    label: 'Traitement ciblé', 
    icon: 'locate-outline', 
    color: '#F97316',
    description: 'Cible les imperfections' 
  },
  oil: { 
    label: 'Huile', 
    icon: 'leaf-outline', 
    color: '#84CC16',
    description: 'Nourrit en profondeur' 
  },
};

// Rating display configuration
export const RATING_CONFIG: Record<ProductRecommendation['rating'], {
  label: string;
  color: string;
  icon: string;
}> = {
  excellent: { label: 'Excellent choix', color: '#10B981', icon: 'star' },
  good: { label: 'Bon choix', color: '#F59E0B', icon: 'star-half' },
  alternative: { label: 'Alternative', color: '#6B7280', icon: 'star-outline' },
};
