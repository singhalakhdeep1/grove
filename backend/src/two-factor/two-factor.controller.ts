import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TwoFactorService } from './two-factor.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('two-factor')
@UseGuards(JwtAuthGuard)
export class TwoFactorController {
  constructor(private readonly twoFactorService: TwoFactorService) {}

  /**
   * Generate 2FA secret
   */
  @Post('generate')
  async generateSecret(@Request() req) {
    return await this.twoFactorService.generateTwoFactorSecret(req.user.id);
  }

  /**
   * Enable 2FA
   */
  @Post('enable')
  async enableTwoFactor(
    @Request() req,
    @Body() body: { token: string },
  ) {
    return await this.twoFactorService.enableTwoFactor(req.user.id, body.token);
  }

  /**
   * Disable 2FA
   */
  @Post('disable')
  async disableTwoFactor(
    @Request() req,
    @Body() body: { token: string },
  ) {
    return await this.twoFactorService.disableTwoFactor(req.user.id, body.token);
  }

  /**
   * Verify 2FA token
   */
  @Post('verify')
  async verifyToken(
    @Request() req,
    @Body() body: { token: string },
  ) {
    const isValid = await this.twoFactorService.verifyTwoFactorToken(
      req.user.id,
      body.token,
    );
    return { valid: isValid };
  }

  /**
   * Regenerate backup codes
   */
  @Post('backup-codes/regenerate')
  async regenerateBackupCodes(
    @Request() req,
    @Body() body: { token: string },
  ) {
    return await this.twoFactorService.regenerateBackupCodes(
      req.user.id,
      body.token,
    );
  }

  /**
   * Get 2FA status
   */
  @Get('status')
  async getStatus(@Request() req) {
    return await this.twoFactorService.getTwoFactorStatus(req.user.id);
  }
}