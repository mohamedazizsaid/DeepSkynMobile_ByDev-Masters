/**
 * Product Scan Types
 * Définitions TypeScript pour la fonctionnalité Scan de Produit
 */

export interface Product {
  id: string;
  name: string;
  brand: string;
  image: string;
  category: string;
  ingredients: string[];
  benefits: ProductBenefit[];
  concerns: ProductConcern[];
  skinTypeCompatibility: SkinTypeCompatibility[];
  recommendation: string;
  price?: number;
  productUrl?: string;
}

export interface ProductBenefit {
  title: string;
  description: string;
  matchPercentage: number;
  icon?: string;
  relatedIngredients?: string[];
}

export interface ProductConcern {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  recommendation?: string;
  affectedIngredients?: string[];
}

export interface SkinTypeCompatibility {
  skinType: 'dry' | 'oily' | 'combination' | 'sensitive' | 'normal';
  compatibility: number; // 0-100
  notes?: string;
}

export interface ProductAnalysisRequest {
  imageUri: string;
  base64?: string;
  imageType: 'base64' | 'file';
  userId: string;
}

export interface ProductAnalysisResponse {
  success: boolean;
  message: string;
  data: Product;
  timestamp: string;
}

export interface ProductScanRecord {
  id: string;
  userId: string;
  productName: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  rating?: number;
  review?: string;
  createdAt: Date;
  updatedAt: Date;
  analysisResult?: Product;
  qrCode?: string;
  barcode?: string;
}

export interface ProductScanHistory {
  data: ProductScanRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface UserProduct {
  id: string;
  userId: string;
  productName: string;
  brand?: string;
  category: 'used' | 'wishlist' | 'rejected';
  ingredients?: string[];
  imageUrl?: string;
  quantity?: number;
  unit?: string;
  purchaseDate?: Date;
  expiryDate?: Date;
  rating?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductComparison {
  productIds: string[];
  products: Product[];
  bestMatch?: {
    productId: string;
    score: number;
  };
  suggestions?: string[];
}

export interface QRScanData {
  qrData: string;
  userId: string;
}

export interface ProductSearchRequest {
  code: string;
  type: 'barcode' | 'ean' | 'qr';
}

export interface ProductRatingRequest {
  productId: string;
  rating: number;
  review?: string;
  userId: string;
}

export interface ProductAddToListRequest {
  productId: string;
  category: 'used' | 'wishlist' | 'rejected';
  product: Partial<Product>;
  quantity?: number;
  unit?: string;
}

export interface SkinProfileAnalysisResult {
  skinType: string;
  concerns: string[];
  sensitivities?: string[];
  conditions?: string[];
}

export interface EnrichedProductAnalysis extends Product {
  userSkinMatch: number; // 0-100
  personalizedBenefits: ProductBenefit[];
  personalizedConcerns: ProductConcern[];
  alternativeProducts?: Product[];
  relatedRoutineSteps?: string[];
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Event Types
export interface ProductScannedEvent {
  productId: string;
  userId: string;
  timestamp: Date;
  scanMode: 'camera' | 'gallery' | 'qr';
}

export interface ProductAddedToListEvent {
  productId: string;
  userId: string;
  category: string;
  timestamp: Date;
}

export interface ProductRatedEvent {
  productId: string;
  userId: string;
  rating: number;
  timestamp: Date;
}

// Filter & Sort Types
export interface ProductScanFilter {
  userId?: string;
  category?: string;
  brand?: string;
  startDate?: Date;
  endDate?: Date;
  minRating?: number;
}

export interface ProductScanSort {
  by: 'date' | 'rating' | 'name' | 'compatibility';
  order: 'asc' | 'desc';
}

// Cache Types
export interface CachedProduct {
  product: Product;
  expiresAt: number;
  lastUpdated: Date;
}

export interface ProductCache {
  [key: string]: CachedProduct;
}

// Analytics Types
export interface ProductScanAnalytics {
  totalScans: number;
  scansToday: number;
  scansThisWeek: number;
  favoriteCategories: Record<string, number>;
  averageRating: number;
  topScannedBrands: string[];
  scanSuccessRate: number;
}

// Recommendation Types
export interface ProductRecommendation {
  productId: string;
  product: Product;
  reasonScore: number;
  reasons: string[];
}

export interface RecommendationResult {
  recommendations: ProductRecommendation[];
  basedOn: string;
  generatedAt: Date;
}

// External API Integration Types
export interface GoogleVisionAPIResponse {
  responses: Array<{
    labelAnnotations: Array<{
      description: string;
      score: number;
    }>;
    textAnnotations?: Array<{
      description: string;
      boundingPoly: any;
    }>;
  }>;
}

export interface GeminiAPIResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export interface OpenFoodFactsAPIResponse {
  product?: {
    product_name: string;
    brands?: string;
    categories?: string;
    image_url?: string;
    ingredients_text?: string;
    code: string;
  };
}
