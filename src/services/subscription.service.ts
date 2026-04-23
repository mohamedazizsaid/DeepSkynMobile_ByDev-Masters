import apiClient from './api-client';
import type {
  CouponValidationResult,
  Subscription,
  SubscriptionInvoiceResponse,
  SubscriptionPaymentHistoryItem,
  SubscriptionPaymentHistoryResponse,
  SubscriptionPlanInfo,
  SubscriptionUsageSummary,
} from '../lib/types';

export const subscriptionService = {
  async getMySubscription(): Promise<Subscription> {
    const res = await apiClient.get<Subscription>('/subscriptions/me');
    return res.data;
  },

  async isPremium(): Promise<boolean> {
    const res = await apiClient.get<{ isPremium: boolean }>('/subscriptions/me/premium');
    return res.data.isPremium;
  },

  async getPlans(): Promise<SubscriptionPlanInfo[]> {
    const res = await apiClient.get<SubscriptionPlanInfo[]>('/subscriptions/plans');
    return res.data;
  },

  async getUsageSummary(): Promise<SubscriptionUsageSummary> {
    const res = await apiClient.get<SubscriptionUsageSummary>('/subscriptions/me/usage');
    return res.data;
  },

  async upgrade(plan: string): Promise<Subscription> {
    const res = await apiClient.post<Subscription>('/subscriptions/upgrade', { plan });
    return res.data;
  },

  async cancel(): Promise<Subscription> {
    const res = await apiClient.post<Subscription>('/subscriptions/cancel');
    return res.data;
  },

  async reactivate(): Promise<Subscription> {
    const res = await apiClient.post<Subscription>('/subscriptions/reactivate');
    return res.data;
  },

  async renew(): Promise<Subscription> {
    const res = await apiClient.post<Subscription>('/subscriptions/renew');
    return res.data;
  },

  async validateCoupon(couponCode: string, planCode: string): Promise<CouponValidationResult> {
    const res = await apiClient.post<CouponValidationResult>('/coupons/validate', {
      couponCode,
      planCode,
    });
    return res.data;
  },

  async createStripeCheckout(
    plan: string,
    couponCode?: string,
  ): Promise<{ id: string; url: string | null }> {
    const res = await apiClient.post<{ id: string; url: string | null }>('/subscriptions/stripe/checkout', {
      plan,
      planCode: plan,
      couponCode: couponCode || undefined,
    });
    return res.data;
  },

  async getPaymentHistory(): Promise<SubscriptionPaymentHistoryItem[]> {
    const res = await apiClient.get<SubscriptionPaymentHistoryResponse>('/subscriptions/payments/history');
    return Array.isArray(res.data?.payments) ? res.data.payments : [];
  },

  async getInvoice(invoiceId: string): Promise<SubscriptionInvoiceResponse> {
    const res = await apiClient.get<SubscriptionInvoiceResponse>(`/subscriptions/payments/${invoiceId}/invoice`);
    return res.data;
  },
};
