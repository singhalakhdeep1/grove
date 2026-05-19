import {
    Controller,
    Post,
    Body,
    Get,
    Put,
    UseGuards,
    Req,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
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
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
        return this.authService.refreshToken(refreshTokenDto);
    }

    @Post('verify-email')
    @HttpCode(HttpStatus.OK)
    async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
        return this.authService.verifyEmail(verifyEmailDto);
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
        return this.authService.forgotPassword(forgotPasswordDto);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
        return this.authService.resetPassword(resetPasswordDto);
    }

    @Post('change-password')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async changePassword(
        @Req() req: any,
        @Body() changePasswordDto: ChangePasswordDto,
    ) {
        return this.authService.changePassword(req.user.id, changePasswordDto);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async logout(@Req() req: any, @Body('refreshToken') refreshToken: string) {
        return this.authService.logout(req.user.id, refreshToken);
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    async getProfile(@Req() req: any) {
        return this.authService.getProfile(req.user.id);
    }

    @Put('profile')
    @UseGuards(JwtAuthGuard)
    async updateProfile(
        @Req() req: any,
        @Body() updateProfileDto: UpdateProfileDto,
    ) {
        return this.authService.updateProfile(req.user.id, updateProfileDto);
    }

    // Google OAuth routes
    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth() {
        // Initiates Google OAuth flow
    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthCallback(@Req() req: any) {
        return this.authService.googleLogin(req.user);
    }

    // Facebook OAuth routes
    @Get('facebook')
    @UseGuards(AuthGuard('facebook'))
    async facebookAuth() {
        // Initiates Facebook OAuth flow
    }

    @Get('facebook/callback')
    @UseGuards(AuthGuard('facebook'))
    async facebookAuthCallback(@Req() req: any) {
        return this.authService.facebookLogin(req.user);
    }
}
