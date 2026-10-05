import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { randomInt } from 'crypto';

@Injectable()
export class TwoFactorService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate TOTP secret for user
   */
  async generateTwoFactorSecret(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    // Generate secret
    const secret = authenticator.generateSecret();

    // Save to user (not enabled yet)
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    // Generate QR code
    const issuer = 'Grove Learning Platform';
    const qrCodeUrl = authenticator.keyuri(user.email, issuer, secret);
    const qrCodeDataURL = await QRCode.toDataURL(qrCodeUrl);

    return {
      secret,
      qrCode: qrCodeDataURL,
      manualEntryKey: secret,
    };
  }

  /**
   * Enable 2FA for user after verification
   */
  async enableTwoFactor(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('2FA setup not initiated');
    }

    // Verify token
    const isValid = authenticator.verify({
      token,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid token');
    }

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    // Enable 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        backupCodes,
      },
    });

    return {
      success: true,
      backupCodes,
      message: '2FA enabled successfully. Save your backup codes securely!',
    };
  }

  /**
   * Disable 2FA for user
   */
  async disableTwoFactor(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled');
    }

    // Verify token
    const isValid = authenticator.verify({
      token,
      secret: user.twoFactorSecret!,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid token');
    }

    // Disable 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: [],
      },
    });

    return { success: true };
  }

  /**
   * Verify 2FA token during login
   */
  async verifyTwoFactorToken(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorEnabled) {
      return false;
    }

    // Check if it's a backup code
    if (user.backupCodes.includes(token)) {
      // Remove used backup code
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          backupCodes: user.backupCodes.filter((code) => code !== token),
        },
      });
      return true;
    }

    // Verify TOTP token
    return authenticator.verify({
      token,
      secret: user.twoFactorSecret!,
    });
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(): string[] {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(this.generateBackupCode());
    }
    return codes;
  }

  /**
   * Generate a single backup code
   */
  private generateBackupCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(randomInt(chars.length));
      if (i === 3 || i === 5) code += '-';
    }
    return code;
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled');
    }

    // Verify current token
    const isValid = await this.verifyTwoFactorToken(userId, token);
    if (!isValid) {
      throw new UnauthorizedException('Invalid token');
    }

    // Generate new backup codes
    const newBackupCodes = this.generateBackupCodes();

    await this.prisma.user.update({
      where: { id: userId },
      data: { backupCodes: newBackupCodes },
    });

    return {
      success: true,
      backupCodes: newBackupCodes,
      message: 'New backup codes generated. Save them securely!',
    };
  }

  /**
   * Get 2FA status
   */
  async getTwoFactorStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorEnabled: true,
        email: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      enabled: user.twoFactorEnabled,
      email: user.email,
    };
  }
}