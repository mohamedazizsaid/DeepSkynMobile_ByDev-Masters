import apiClient from './api-client';
import type { 
  ProductRecommendation, 
  RecommendProductDto, 
  ProductSimulation,
  SimulateProductDto,
  SkinPrediction,
} from '../lib/types';

/**
 * Product Recommendation Service
 * Handles AI-powered product recommendations and simulations
 */
class ProductRecommendationService {
  /**
   * Get AI-powered product recommendation for a specific routine step
   * @param dto - Product recommendation request
   * @returns ProductRecommendation with QR code
   */
  async recommendProduct(dto: RecommendProductDto): Promise<ProductRecommendation> {
    const res = await apiClient.post<ProductRecommendation>(
      '/routines/recommend-product',
      dto
    );
    return res.data;
  }

  /**
   * Get multiple product recommendations based on skin analysis
   * Useful for showing predicted products after an analysis
   * @param skinType - User's skin type
   * @param concerns - Array of skin concerns
   * @param categories - Categories to get recommendations for
   */
  async getRecommendationsForAnalysis(
    skinType: string,
    concerns: string[],
    categories: Array<'cleanser' | 'serum' | 'moisturizer' | 'sunscreen'> = ['cleanser', 'serum', 'moisturizer', 'sunscreen']
  ): Promise<ProductRecommendation[]> {
    const recommendations: ProductRecommendation[] = [];
    const concernsStr = concerns.join(', ');

    // Fetch recommendations in parallel for faster loading
    const promises = categories.map(async (category) => {
      try {
        const stepNames: Record<string, string> = {
          cleanser: 'Nettoyant visage',
          serum: 'Sérum traitant',
          moisturizer: 'Crème hydratante',
          sunscreen: 'Protection solaire SPF50+',
        };

        const recommendation = await this.recommendProduct({
          stepName: stepNames[category] || category,
          stepCategory: category,
          skinType,
          concerns: concernsStr,
        });

        return { ...recommendation, category };
      } catch (error) {
        console.error(`Failed to get recommendation for ${category}:`, error);
        return null;
      }
    });

    const results = await Promise.allSettled(promises);
    
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        recommendations.push(result.value);
      }
    });

    return recommendations;
  }

  /**
   * Simulate product effects on user's skin (Digital Twin feature)
   * @param dto - Product simulation request
   * @returns ProductSimulation with predicted outcomes
   */
  async simulateProduct(dto: SimulateProductDto): Promise<ProductSimulation> {
    const res = await apiClient.post<ProductSimulation>(
      '/digital-twin/simulate-product',
      dto
    );
    return res.data;
  }

  /**
   * Get user's product simulations
   * @param status - Optional filter by status
   */
  async getSimulations(status?: string): Promise<ProductSimulation[]> {
    const params = status ? { status } : {};
    const res = await apiClient.get<ProductSimulation[]>(
      '/digital-twin/simulations',
      { params }
    );
    return res.data;
  }

  /**
   * Update simulation with actual results
   * @param simulationId - Simulation ID
   * @param actualResults - Actual observed results
   * @param feedback - User feedback
   */
  async updateSimulationResults(
    simulationId: string,
    actualResults: any,
    feedback?: string
  ): Promise<ProductSimulation> {
    const res = await apiClient.patch<ProductSimulation>(
      `/digital-twin/simulations/${simulationId}`,
      { actualResults, feedback, status: 'CONFIRMED' }
    );
    return res.data;
  }

  /**
   * Get skin prediction for future date
   * @param daysAhead - Number of days to predict ahead (7-90)
   */
  async getSkinPrediction(daysAhead: number = 7): Promise<SkinPrediction> {
    const res = await apiClient.get<SkinPrediction>(
      '/digital-twin/predict',
      { params: { daysAhead } }
    );
    return res.data;
  }

  /**
   * Get quick product recommendations based on detected conditions
   * Maps conditions to appropriate product categories
   * @param conditions - Array of detected skin conditions
   * @param skinType - User's skin type
   */
  async getQuickRecommendations(
    conditions: string[],
    skinType: string
  ): Promise<ProductRecommendation[]> {
    // Map conditions to relevant categories
    const categoryMap: Record<string, string[]> = {
      acne: ['cleanser', 'serum', 'spot_treatment'],
      dryness: ['moisturizer', 'serum', 'oil'],
      oiliness: ['cleanser', 'toner', 'serum'],
      wrinkles: ['serum', 'eye_cream', 'moisturizer'],
      hyperpigmentation: ['serum', 'sunscreen'],
      redness: ['serum', 'moisturizer'],
      pores: ['cleanser', 'toner', 'serum'],
      dark_circles: ['eye_cream'],
      dehydration: ['serum', 'moisturizer'],
      sun_damage: ['serum', 'sunscreen'],
    };

    // Collect unique categories based on conditions
    const categoriesToFetch = new Set<string>();
    conditions.forEach((condition) => {
      const normalizedCondition = condition.toLowerCase().replace(/\s+/g, '_');
      const categories = categoryMap[normalizedCondition] || ['serum'];
      categories.forEach((cat) => categoriesToFetch.add(cat));
    });

    // Limit to 4 categories max
    const limitedCategories = Array.from(categoriesToFetch).slice(0, 4) as Array<'cleanser' | 'serum' | 'moisturizer' | 'sunscreen'>;

    return this.getRecommendationsForAnalysis(skinType, conditions, limitedCategories);
  }
}

export const productRecommendationService = new ProductRecommendationService();
