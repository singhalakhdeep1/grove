import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-11-20.acacia',
    });
  }

  async createCheckoutSession(courseId: string, userId: string) {
    // In production, fetch course details from database
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Course Purchase',
          },
          unit_amount: 4900, // $49.00
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/courses/${courseId}?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/courses/${courseId}?canceled=true`,
      metadata: {
        courseId,
        userId,
      },
    });

    return session;
  }

  async createSubscriptionCheckoutSession(planId: string, userId: string) {
    // In production, fetch plan details from database
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Monthly Subscription',
          },
          unit_amount: 2900, // $29.00
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard?subscription=success`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?canceled=true`,
      metadata: {
        planId,
        userId,
      },
    });

    return session;
  }

  async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        await this.enrollUser(session.metadata.courseId, session.metadata.userId);
        break;
      case 'customer.subscription.created':
        const subscription = event.data.object as Stripe.Subscription;
        await this.activateSubscription(subscription.metadata.userId, subscription.metadata.planId);
        break;
      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        await this.renewSubscription(invoice.subscription as string);
        break;
    }
  }

  private async enrollUser(courseId: string, userId: string) {
    console.log(`Enrolling user ${userId} in course ${courseId}`);
    // Implementation for enrollment
  }

  private async activateSubscription(userId: string, planId: string) {
    console.log(`Activating subscription for user ${userId}, plan ${planId}`);
    // Implementation for subscription activation
  }

  private async renewSubscription(subscriptionId: string) {
    console.log(`Renewing subscription ${subscriptionId}`);
    // Implementation for subscription renewal
  }

  async cancelSubscription(stripeSubscriptionId: string) {
    await this.stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  }

  async createCustomer(email: string, name: string) {
    const customer = await this.stripe.customers.create({
      email,
      name,
    });

    return customer;
  }
}
