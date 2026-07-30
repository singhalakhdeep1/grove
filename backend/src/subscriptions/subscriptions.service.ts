import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  SubscriptionStatus, 
  PaymentStatus, 
  PaymentMethod, 
  DiscountType,
  InvoiceStatus 
} from '@prisma/client';
import Stripe from 'stripe';

@Injectable()
export class SubscriptionsService {
  private stripe: Stripe;

  constructor(private prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16',
    });
  }

  // ============================================
  // SUBSCRIPTION PLANS
  // ============================================

  /**
   * Create a subscription plan
   */
  async createPlan(data: {
    name: string;
    description: string;
    price: number;
    currency?: string;
    interval: 'MONTHLY' | 'YEARLY';
    features: string[];
    maxCourses?: number;
    maxMentorshipHours?: number;
  }) {
    // Create Stripe product and price
    const product = await this.stripe.products.create({
      name: data.name,
      description: data.description,
    });

    const price = await this.stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(data.price * 100), // Convert to cents
      currency: data.currency || 'usd',
      recurring: {
        interval: data.interval.toLowerCase() as 'month' | 'year',
      },
    });

    // Create plan in database
    return await this.prisma.subscriptionPlan.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        currency: data.currency || 'USD',
        interval: data.interval,
        features: data.features,
        maxCourses: data.maxCourses,
        maxMentorshipHours: data.maxMentorshipHours,
        stripePriceId: price.id,
      },
    });
  }

  /**
   * Get all active plans
   */
  async getPlans() {
    return await this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  /**
   * Get plan by ID
   */
  async getPlan(planId: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return plan;
  }

  // ============================================
  // USER SUBSCRIPTIONS
  // ============================================

  /**
   * Subscribe user to a plan
   */
  async subscribe(userId: string, planId: string, paymentMethodId?: string, promoCode?: string) {
    const plan = await this.getPlan(planId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user already has active subscription
    const existingSubscription = await this.prisma.userSubscription.findUnique({
      where: { userId },
    });

    if (existingSubscription && existingSubscription.status === SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('User already has an active subscription');
    }

    // Calculate discount if promo code provided
    let finalPrice = plan.price;
    let discountAmount = 0;

    if (promoCode) {
      const promo = await this.validatePromoCode(promoCode, planId);
      if (promo) {
        if (promo.discountType === DiscountType.PERCENTAGE) {
          discountAmount = (plan.price * promo.discountValue) / 100;
        } else {
          discountAmount = promo.discountValue;
        }
        finalPrice = Math.max(0, plan.price - discountAmount);

        // Record promo usage
        await this.prisma.promotionalCodeUsage.create({
          data: {
            codeId: promo.id,
            userId,
            discountAmount,
          },
        });

        // Update usage count
        await this.prisma.promotionalCode.update({
          where: { id: promo.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    // Create Stripe customer if not exists
    let stripeCustomerId = (await this.prisma.userSubscription.findUnique({
      where: { userId },
      select: { stripeCustomerId: true },
    }))?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.name,
      });
      stripeCustomerId = customer.id;
    }

    // Create Stripe subscription
    let stripeSubscription;
    try {
      if (paymentMethodId) {
        // Attach payment method to customer
        await this.stripe.paymentMethods.attach(paymentMethodId, {
          customer: stripeCustomerId,
        });

        // Set as default payment method
        await this.stripe.customers.update(stripeCustomerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
      }

      stripeSubscription = await this.stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [
          {
            price: plan.stripePriceId!,
            quantity: 1,
          },
        ],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
      });

      // Create subscription in database
      const subscription = await this.prisma.userSubscription.create({
        data: {
          userId,
          planId,
          status: SubscriptionStatus.ACTIVE,
          stripeSubscriptionId: stripeSubscription.id,
          stripeCustomerId,
          startDate: new Date(),
          endDate: new Date(stripeSubscription.current_period_end * 1000),
        },
      });

      // Create payment record
      if (stripeSubscription.latest_invoice) {
        const invoice = stripeSubscription.latest_invoice as Stripe.Invoice;
        await this.createPaymentRecord(userId, subscription.id, invoice, finalPrice);
      }

      return {
        subscription,
        clientSecret: (stripeSubscription.latest_invoice as Stripe.Invoice)
          ?.payment_intent as Stripe.PaymentIntent?.client_secret,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to create subscription: ${error.message}`);
    }
  }

  /**
   * Cancel user subscription
   */
  async cancelSubscription(userId: string) {
    const subscription = await this.prisma.userSubscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('Subscription is not active');
    }

    // Cancel in Stripe
    if (subscription.stripeSubscriptionId) {
      await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }

    // Update in database
    const updated = await this.prisma.userSubscription.update({
      where: { userId },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelAt: subscription.endDate,
        autoRenew: false,
      },
    });

    return updated;
  }

  /**
   * Get user's subscription
   */
  async getUserSubscription(userId: string) {
    const subscription = await this.prisma.userSubscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (!subscription) {
      return null;
    }

    // Check if subscription has expired
    if (subscription.endDate && subscription.endDate < new Date()) {
      await this.prisma.userSubscription.update({
        where: { userId },
        data: { status: SubscriptionStatus.EXPIRED },
      });
      subscription.status = SubscriptionStatus.EXPIRED;
    }

    return subscription;
  }

  // ============================================
  // PROMOTIONAL CODES
  // ============================================

  /**
   * Create promotional code
   */
  async createPromoCode(data: {
    code: string;
    description?: string;
    discountType: DiscountType;
    discountValue: number;
    maxUses?: number;
    validFrom: Date;
    validUntil: Date;
    applicablePlans?: string[];
  }) {
    return await this.prisma.promotionalCode.create({
      data,
    });
  }

  /**
   * Validate promotional code
   */
  async validatePromoCode(code: string, planId?: string) {
    const promo = await this.prisma.promotionalCode.findUnique({
      where: { code },
    });

    if (!promo) {
      throw new NotFoundException('Promotional code not found');
    }

    if (!promo.isActive) {
      throw new BadRequestException('Promotional code is not active');
    }

    const now = new Date();
    if (now < promo.validFrom || now > promo.validUntil) {
      throw new BadRequestException('Promotional code is not valid at this time');
    }

    if (promo.maxUses && promo.usedCount >= promo.maxUses) {
      throw new BadRequestException('Promotional code has reached maximum uses');
    }

    if (promo.applicablePlans.length > 0 && planId) {
      if (!promo.applicablePlans.includes(planId)) {
        throw new BadRequestException('Promotional code is not applicable to this plan');
      }
    }

    return promo;
  }

  /**
   * Get all promotional codes
   */
  async getPromoCodes() {
    return await this.prisma.promotionalCode.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================
  // PAYMENTS
  // ============================================

  /**
   * Create payment record from Stripe invoice
   */
  private async createPaymentRecord(
    userId: string,
    subscriptionId: string,
    invoice: Stripe.Invoice,
    amount: number,
  ) {
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

    await this.prisma.payment.create({
      data: {
        userId,
        subscriptionId,
        amount,
        currency: invoice.currency.toUpperCase(),
        status: this.mapStripeStatus(paymentIntent?.status),
        paymentMethod: PaymentMethod.CREDIT_CARD,
        stripePaymentIntentId: paymentIntent?.id,
        metadata: JSON.stringify({
          invoiceId: invoice.id,
          invoiceNumber: invoice.number,
        }),
      },
    });
  }

  /**
   * Get user's payment history
   */
  async getPaymentHistory(userId: string) {
    return await this.prisma.payment.findMany({
      where: { userId },
      include: { subscription: { include: { plan: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Map Stripe status to our status
   */
  private mapStripeStatus(stripeStatus?: string): PaymentStatus {
    switch (stripeStatus) {
      case 'succeeded':
        return PaymentStatus.COMPLETED;
      case 'processing':
        return PaymentStatus.PENDING;
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
        return PaymentStatus.PENDING;
      case 'canceled':
        return PaymentStatus.FAILED;
      default:
        return PaymentStatus.PENDING;
    }
  }

  // ============================================
  // INVOICES
  // ============================================

  /**
   * Create invoice
   */
  async createInvoice(userId: string, data: {
    subscriptionId?: string;
    amount: number;
    currency?: string;
    dueDate: Date;
    items: any[];
  }) {
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return await this.prisma.invoice.create({
      data: {
        userId,
        subscriptionId: data.subscriptionId,
        amount: data.amount,
        currency: data.currency || 'USD',
        dueDate: data.dueDate,
        items: JSON.stringify(data.items),
        invoiceNumber,
        status: InvoiceStatus.DRAFT,
      },
    });
  }

  /**
   * Get user's invoices
   */
  async getUserInvoices(userId: string) {
    return await this.prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { user: true },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }
}