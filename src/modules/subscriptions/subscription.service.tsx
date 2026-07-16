import { Injectable } from '@nestjs/common';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  isPublic: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'EXPIRED';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  stripeSubscriptionId: string | null;
  cancelAtPeriodEnd: boolean;
}

@Injectable()
export class SubscriptionService {
  private subscriptions: Subscription[] = [];
  private plans: SubscriptionPlan[] = [
    {
      id: 'plan_monthly_basic',
      name: 'Basic Monthly',
      price: 29,
      interval: 'monthly',
      features: ['Access to all courses', 'Basic support', 'Certificate of completion'],
      isPublic: true,
    },
    {
      id: 'plan_yearly_premium',
      name: 'Premium Yearly',
      price: 299,
      interval: 'yearly',
      features: ['Access to all courses', 'Priority support', 'Certificate of completion', 'Offline access', 'Mentorship'],
      isPublic: true,
    },
  ];

  async createSubscription(userId: string, planId: string): Promise<Subscription> {
    const plan = this.plans.find(p => p.id === planId);
    if (!plan) {
      throw new Error('Plan not found');
    }

    const now = new Date();
    const periodEnd = new Date();
    if (plan.interval === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const subscription: Subscription = {
      id: this.generateId(),
      userId,
      planId,
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      stripeSubscriptionId: null,
      cancelAtPeriodEnd: false,
    };

    this.subscriptions.push(subscription);
    return subscription;
  }

  async cancelSubscription(subscriptionId: string): Promise<Subscription> {
    const subscription = this.subscriptions.find(s => s.id === subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    subscription.cancelAtPeriodEnd = true;
    return subscription;
  }

  async pauseSubscription(subscriptionId: string): Promise<Subscription> {
    const subscription = this.subscriptions.find(s => s.id === subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    subscription.status = 'PAUSED';
    return subscription;
  }

  async resumeSubscription(subscriptionId: string): Promise<Subscription> {
    const subscription = this.subscriptions.find(s => s.id === subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    subscription.status = 'ACTIVE';
    subscription.cancelAtPeriodEnd = false;
    return subscription;
  }

  async upgradeSubscription(subscriptionId: string, newPlanId: string): Promise<Subscription> {
    const subscription = this.subscriptions.find(s => s.id === subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const newPlan = this.plans.find(p => p.id === newPlanId);
    if (!newPlan) {
      throw new Error('Plan not found');
    }

    subscription.planId = newPlanId;
    return subscription;
  }

  async getSubscription(subscriptionId: string): Promise<Subscription> {
    const subscription = this.subscriptions.find(s => s.id === subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }
    return subscription;
  }

  async getUserSubscriptions(userId: string): Promise<Subscription[]> {
    return this.subscriptions.filter(s => s.userId === userId);
  }

  async getPublicPlans(): Promise<SubscriptionPlan[]> {
    return this.plans.filter(p => p.isPublic);
  }

  async getPlan(planId: string): Promise<SubscriptionPlan> {
    const plan = this.plans.find(p => p.id === planId);
    if (!plan) {
      throw new Error('Plan not found');
    }
    return plan;
  }

  private generateId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
