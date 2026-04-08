import apiClient from './api-client';

export interface ProductScanResult {
  id: string;
  name: string;
  brand: string;
  image: string;
  category: string;
  ingredients: string[];
  benefits: {
    title: string;
    description: string;
    matchPercentage: number;
  }[];
  concerns: {
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }[];
  skinTypeCompatibility: {
    skinType: string;
    compatibility: number;
  }[];
  recommendation: string;
  price?: number;
  productUrl?: string;
}

class ProductScanService {
  constructor() {}

  private extractDataOrThrow<T>(response: any, fallbackMessage: string): T {
    const payload = response?.data;
    if (payload?.success === false) {
      throw new Error(payload?.message || fallbackMessage);
    }

    if (!payload?.data) {
      throw new Error(payload?.message || fallbackMessage);
    }

    return payload.data as T;
  }

  /**
   * Analyze a product image from camera or gallery
   */
  async analyzeProductImage(
    imageUri: string,
    base64?: string
  ): Promise<ProductScanResult> {
    try {
      const formData = new FormData();
      
      if (base64) {
        formData.append('image', base64);
        formData.append('imageType', 'base64');
      } else {
        const uriParts = imageUri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('image', {
          uri: imageUri,
          type: `image/${fileType}`,
          name: `product-${Date.now()}.${fileType}`,
        } as any);
        formData.append('imageType', 'file');
      }

      const response = await apiClient.post('/product-scan/analyze-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return this.extractDataOrThrow<ProductScanResult>(
        response,
        'Analyse produit indisponible'
      );
    } catch (error) {
      console.error('Error analyzing product image:', error);
      throw error;
    }
  }

  /**
   * Scan a QR code to get product information
   */
  async scanQRCode(qrData: string): Promise<ProductScanResult> {
    try {
      const response = await apiClient.post('/product-scan/scan-qr', {
        qrData,
      });
      return this.extractDataOrThrow<ProductScanResult>(
        response,
        'Scan QR indisponible'
      );
    } catch (error) {
      console.error('Error scanning QR code:', error);
      throw error;
    }
  }

  /**
   * Search product by barcode or code
   */
  async searchProductByCode(code: string): Promise<ProductScanResult> {
    try {
      const response = await apiClient.get(`/product-scan/search`, {
        params: { code },
      });
      return this.extractDataOrThrow<ProductScanResult>(
        response,
        'Produit introuvable'
      );
    } catch (error) {
      console.error('Error searching product by code:', error);
      throw error;
    }
  }

  /**
   * Get scan history for current user
   */
  async getScanHistory(page: number = 1, limit: number = 10) {
    try {
      const response = await apiClient.get('/product-scan/history', {
        params: { page, limit },
      });
      return this.extractDataOrThrow(response, 'Historique indisponible');
    } catch (error) {
      console.error('Error fetching scan history:', error);
      throw error;
    }
  }

  /**
   * Add product to user's product list
   */
  async addProductToList(product: ProductScanResult, category: string = 'used') {
    try {
      const response = await apiClient.post('/product-scan/add-to-list', {
        productId: product.id,
        category,
        product,
      });
      return this.extractDataOrThrow(response, 'Ajout a la liste indisponible');
    } catch (error) {
      console.error('Error adding product to list:', error);
      throw error;
    }
  }

  /**
   * Rate a scanned product
   */
  async rateProduct(productId: string, rating: number, review?: string) {
    try {
      const response = await apiClient.post(`/product-scan/${productId}/rate`, {
        rating,
        review,
      });
      return this.extractDataOrThrow(response, 'Notation indisponible');
    } catch (error) {
      console.error('Error rating product:', error);
      throw error;
    }
  }

  /**
   * Get detailed analysis of a product relative to user's skin profile
   */
  async getDetailedAnalysis(productId: string) {
    try {
      const response = await apiClient.get(`/product-scan/${productId}/analysis`);
      return this.extractDataOrThrow(response, 'Analyse detaillee indisponible');
    } catch (error) {
      console.error('Error fetching detailed analysis:', error);
      throw error;
    }
  }

  /**
   * Get product recommendations based on skin profile
   */
  async getRecommendedProducts(category?: string) {
    try {
      const response = await apiClient.get('/product-scan/recommendations', {
        params: { category },
      });
      return this.extractDataOrThrow(response, 'Recommandations indisponibles');
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      throw error;
    }
  }

  /**
   * Compare multiple products
   */
  async compareProducts(productIds: string[]) {
    try {
      const response = await apiClient.post('/product-scan/compare', {
        productIds,
      });
      return this.extractDataOrThrow(response, 'Comparaison indisponible');
    } catch (error) {
      console.error('Error comparing products:', error);
      throw error;
    }
  }
}

export const productScanService = new ProductScanService();
