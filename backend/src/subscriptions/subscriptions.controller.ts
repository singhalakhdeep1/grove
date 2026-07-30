import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DiscountType, UserRole } from '@prisma/client';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  // ============================================
  // PLANS
  // ============================================

  /**
   * Get all subscription plans
   */
  @Get('plans')
  async getPlans() {
    return await this.subscriptionsService.getPlans();
  }

  /**
   * Get plan by ID
   */
  @Get('plans/:planId')
  async getPlan(@Param('planId') planId: string) {
    return await this.subscriptionsService.getPlan(planId);
  }

  /**
   * Create a plan (admin only)
   */
  @Post('plans')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async createPlan(@Body() body: {
    name: string;
    description: string;
    price: number;
    currency?: string;
    interval: 'MONTHLY' | 'YEARLY';
    features: string[];
    maxCourses?: number;
    maxMentorshipHours?: number;
  }) {
    return await this.subscriptionsService.createPlan(body);
  }

  // ============================================
  // USER SUBSCRIPTIONS
  // ============================================

  /**
   * Subscribe to a plan
   */
  @Post('subscribe')
  async subscribe(
    @Request() req,
    @Body() body: {
      planId: string;
      paymentMethodId?: string;
      promoCode?: string;
    },
  ) {
    return await this.subscriptionsService.subscribe(
      req.user.id,
      body.planId,
      body.paymentMethodId,
      body.promoCode,
    );
  }

  /**
   * Get user's subscription
   */
  @Get('my-subscription')
  async getMySubscription(@Request() req) {
    return await this.subscriptionsService.getUserSubscription(req.user.id);
  }

  /**
   * Cancel subscription
   */
  @Post('cancel')
  async cancelSubscription(@Request() req) {
    return await this.subscriptionsService.cancelSubscription(req.user.id);
  }

  // ============================================
  // PROMOTIONAL CODES
  // ============================================

  /**
   * Validate a promotional code
   */
  @Post('promo-codes/validate')
  async validatePromoCode(@Body() body: { code: string; planId?: string }) {
    return await this.subscriptionsService.validatePromoCode(
      body.code,
      body.planId,
    );
  }

  /**
   * Get all promotional codes (admin only)
   */
  @Get('promo-codes')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getPromoCodes() {
    return await this.subscriptionsService.getPromoCodes();
  }

  /**
   * Create promotional code (admin only)
   */
  @Post('promo-codes')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async createPromoCode(@Body() body: {
    code: string;
    description?: string;
    discountType: DiscountType;
    discountValue: number;
    maxUses?: number;
    validFrom: Date;
    validUntil: Date;
    applicablePlans?: string[];
  }) {
    return await this.subscriptionsService.createPromoCode(body);
  }

  // ============================================
  // PAYMENTS
  // ============================================

  /**
   * Get payment history
   */
  @Get('payments')
  async getPaymentHistory(@Request() req) {
    return await this.subscriptionsService.getPaymentHistory(req.user.id);
  }

  // ============================================
  // INVOICES
  // ============================================

  /**
   * Get user's invoices
   */
  @Get('invoices')
  async getUserInvoices(@Request() req) {
    return await this.subscriptionsService.getUserInvoices(req.user.id);
  }

  /**
   * Get invoice by ID
   */
  @Get('invoices/:invoiceId')
  async getInvoice(@Param('invoiceId') invoiceId: string) {
    return await this.subscriptionsService.getInvoice(invoiceId);
  }

  /**
   * Create invoice (admin only)
   */
  @Post('invoices')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async createInvoice(@Request() req, @Body() body: {
    subscriptionId?: string;
    amount: number;
    currency?: string;
    dueDate: Date;
    items: any[];
  }) {
    return await this.subscriptionsService.createInvoice(req.user.id, body);
  }
}