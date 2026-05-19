import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import {
    RegisterDto,
    LoginDto,
    RefreshTokenDto,
    ForgotPasswordDto,
    ResetPasswordDto,
    VerifyEmailDto,
    ChangePasswordDto,
    UpdateProfileDto,
} from './dto/auth.dto';
import { User, UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private emailService: EmailService,
    ) { }

    // Register new user
    async register(registerDto: RegisterDto) {
        const { email, password, firstName, lastName, role } = registerDto;

        // Check if user already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Generate email verification token
        const verificationToken = randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create user
        const user = await this.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                role: role || UserRole.STUDENT,
                emailVerificationToken: verificationToken,
                emailVerificationExpires: verificationExpires,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isEmailVerified: true,
                createdAt: true,
            },
        });

        // Send verification email
        await this.emailService.sendVerificationEmail(
            user.email,
            user.firstName,
            verificationToken,
        );

        // Generate tokens
        const tokens = await this.generateTokens(user.id, user.email, user.role);

        // Store refresh token
        await this.storeRefreshToken(user.id, tokens.refreshToken);

        return {
            user,
            ...tokens,
            message: 'Registration successful. Please verify your email.',
        };
    }

    // Login user
    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        // Find user
        const user = await this.prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                password: true,
                firstName: true,
                lastName: true,
                role: true,
                isEmailVerified: true,
                isActive: true,
                isSuspended: true,
                createdAt: true,
                avatarUrl: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Check if account is active
        if (!user.isActive) {
            throw new UnauthorizedException('Account is deactivated');
        }

        if (user.isSuspended) {
            throw new UnauthorizedException('Account is suspended');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Generate tokens
        const tokens = await this.generateTokens(user.id, user.email, user.role);

        // Store refresh token
        await this.storeRefreshToken(user.id, tokens.refreshToken);

        // Update last login
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            ...tokens,
        };
    }

    // Refresh access token
    async refreshToken(refreshTokenDto: RefreshTokenDto) {
        const { refreshToken } = refreshTokenDto;

        try {
            // Verify refresh token
            const payload = this.jwtService.verify(refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
            });

            // Check if refresh token exists in database
            const storedToken = await this.prisma.refreshToken.findFirst({
                where: {
                    userId: payload.sub,
                    token: refreshToken,
                    expiresAt: {
                        gt: new Date(),
                    },
                },
            });

            if (!storedToken) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            // Get user
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });

            if (!user || !user.isActive) {
                throw new UnauthorizedException('User not found or inactive');
            }

            // Generate new tokens
            const tokens = await this.generateTokens(
                user.id,
                user.email,
                user.role,
            );

            // Delete old refresh token
            await this.prisma.refreshToken.delete({
                where: { id: storedToken.id },
            });

            // Store new refresh token
            await this.storeRefreshToken(user.id, tokens.refreshToken);

            return tokens;
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }

    // Verify email
    async verifyEmail(verifyEmailDto: VerifyEmailDto) {
        const { token } = verifyEmailDto;

        const user = await this.prisma.user.findFirst({
            where: {
                emailVerificationToken: token,
                emailVerificationExpires: {
                    gt: new Date(),
                },
            },
        });

        if (!user) {
            throw new BadRequestException('Invalid or expired verification token');
        }

        // Update user
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                isEmailVerified: true,
                emailVerificationToken: null,
                emailVerificationExpires: null,
            },
        });

        return {
            message: 'Email verified successfully',
        };
    }

    // Forgot password
    async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
        const { email } = forgotPasswordDto;

        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Don't reveal if user exists
            return {
                message: 'If an account exists, a password reset email has been sent',
            };
        }

        // Generate reset token
        const resetToken = randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Store reset token
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken: resetToken,
                passwordResetExpires: resetExpires,
            },
        });

        // Send reset email
        await this.emailService.sendPasswordResetEmail(
            user.email,
            user.firstName,
            resetToken,
        );

        return {
            message: 'If an account exists, a password reset email has been sent',
        };
    }

    // Reset password
    async resetPassword(resetPasswordDto: ResetPasswordDto) {
        const { token, newPassword } = resetPasswordDto;

        const user = await this.prisma.user.findFirst({
            where: {
                passwordResetToken: token,
                passwordResetExpires: {
                    gt: new Date(),
                },
            },
        });

        if (!user) {
            throw new BadRequestException('Invalid or expired reset token');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update password
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                passwordResetToken: null,
                passwordResetExpires: null,
            },
        });

        // Invalidate all refresh tokens
        await this.prisma.refreshToken.deleteMany({
            where: { userId: user.id },
        });

        return {
            message: 'Password reset successfully',
        };
    }

    // Change password (authenticated)
    async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
        const { currentPassword, newPassword } = changePasswordDto;

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            throw new BadRequestException('Current password is incorrect');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update password
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        return {
            message: 'Password changed successfully',
        };
    }

    // Update profile
    async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: updateProfileDto,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                avatarUrl: true,
                bio: true,
                timezone: true,
                language: true,
                isEmailVerified: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return user;
    }

    // Get current user profile
    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                avatarUrl: true,
                bio: true,
                timezone: true,
                language: true,
                isEmailVerified: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
                _count: {
                    select: {
                        enrollments: true,
                        coursesCreated: true,
                        achievements: true,
                        badges: true,
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    // Logout (invalidate refresh token)
    async logout(userId: string, refreshToken: string) {
        await this.prisma.refreshToken.deleteMany({
            where: {
                userId,
                token: refreshToken,
            },
        });

        return {
            message: 'Logged out successfully',
        };
    }

    // Google OAuth callback
    async googleLogin(profile: any) {
        const { email, firstName, lastName, picture } = profile;

        // Find or create user
        let user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email,
                    firstName,
                    lastName,
                    avatarUrl: picture,
                    isEmailVerified: true,
                    role: UserRole.STUDENT,
                    password: randomBytes(32).toString('hex'), // Random password for OAuth users
                },
            });
        }

        // Create or update social login record
        await this.prisma.socialLogin.upsert({
            where: {
                provider_providerId: {
                    provider: 'GOOGLE',
                    providerId: profile.id,
                },
            },
            create: {
                provider: 'GOOGLE',
                providerId: profile.id,
                userId: user.id,
            },
            update: {},
        });

        // Generate tokens
        const tokens = await this.generateTokens(user.id, user.email, user.role);

        // Store refresh token
        await this.storeRefreshToken(user.id, tokens.refreshToken);

        return {
            user,
            ...tokens,
        };
    }

    // Facebook OAuth callback
    async facebookLogin(profile: any) {
        const { email, firstName, lastName, picture } = profile;

        if (!email) {
            throw new BadRequestException(
                'Email is required. Please grant email permission.',
            );
        }

        // Find or create user
        let user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email,
                    firstName,
                    lastName,
                    avatarUrl: picture,
                    isEmailVerified: true,
                    role: UserRole.STUDENT,
                    password: randomBytes(32).toString('hex'),
                },
            });
        }

        // Create or update social login record
        await this.prisma.socialLogin.upsert({
            where: {
                provider_providerId: {
                    provider: 'FACEBOOK',
                    providerId: profile.id,
                },
            },
            create: {
                provider: 'FACEBOOK',
                providerId: profile.id,
                userId: user.id,
            },
            update: {},
        });

        // Generate tokens
        const tokens = await this.generateTokens(user.id, user.email, user.role);

        // Store refresh token
        await this.storeRefreshToken(user.id, tokens.refreshToken);

        return {
            user,
            ...tokens,
        };
    }

    // Helper: Generate JWT tokens
    private async generateTokens(
        userId: string,
        email: string,
        role: UserRole,
    ) {
        const payload = { sub: userId, email, role };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: process.env.JWT_SECRET || 'your-secret-key',
                expiresIn: '15m',
            }),
            this.jwtService.signAsync(payload, {
                secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
                expiresIn: '7d',
            }),
        ]);

        return {
            accessToken,
            refreshToken,
        };
    }

    // Helper: Store refresh token in database
    private async storeRefreshToken(userId: string, token: string) {
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await this.prisma.refreshToken.create({
            data: {
                userId,
                token,
                expiresAt,
            },
        });
    }

    // Validate user (used by JWT strategy)
    async validateUser(userId: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { id: userId, isActive: true },
        });
    }
}
