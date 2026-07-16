import { Injectable } from '@nestjs/common';

export interface OrderItem {
  type: 'course' | 'subscription' | 'bundle';
  itemId: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  createdAt: Date;
  completedAt: Date | null;
  stripeSessionId: string | null;
}

@Injectable()
export class OrderService {
  private orders: Order[] = [];

  async createOrder(userId: string, items: OrderItem[]): Promise<Order> {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = 0; // Apply discount logic here
    const total = subtotal - discount;

    const order: Order = {
      id: this.generateId(),
      userId,
      items,
      subtotal,
      discount,
      total,
      status: 'PENDING',
      createdAt: new Date(),
      completedAt: null,
      stripeSessionId: null,
    };

    this.orders.push(order);
    return order;
  }

  async completeOrder(orderId: string): Promise<Order> {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Process enrollment for courses
    for (const item of order.items) {
      if (item.type === 'course') {
        await this.enrollUser(order.userId, item.itemId);
      } else if (item.type === 'subscription') {
        await this.activateSubscription(order.userId, item.itemId);
      }
    }

    order.status = 'COMPLETED';
    order.completedAt = new Date();

    await this.sendConfirmationEmail(order);
    return order;
  }

  async cancelOrder(orderId: string): Promise<Order> {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'PENDING') {
      throw new Error('Cannot cancel non-pending order');
    }

    order.status = 'CANCELLED';
    return order;
  }

  async getOrder(orderId: string): Promise<Order> {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    return order;
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return this.orders.filter(o => o.userId === userId);
  }

  private async enrollUser(userId: string, courseId: string) {
    console.log(`Enrolling user ${userId} in course ${courseId}`);
    // Implementation for enrollment
  }

  private async activateSubscription(userId: string, planId: string) {
    console.log(`Activating subscription for user ${userId}, plan ${planId}`);
    // Implementation for subscription activation
  }

  private async sendConfirmationEmail(order: Order) {
    console.log(`Sending confirmation email for order ${order.id}`);
    // Implementation for email sending
  }

  private generateId(): string {
    return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
