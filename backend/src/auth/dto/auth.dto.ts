import {
    IsEmail,
    IsString,
    MinLength,
    MaxLength,
    IsEnum,
    IsOptional,
    Matches,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email: string;

    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @MaxLength(128)
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        {
            message:
                'Password must contain uppercase, lowercase, number and special character',
        },
    )
    password: string;

    @IsString()
    @MinLength(2)
    @MaxLength(50)
    firstName: string;

    @IsString()
    @MinLength(2)
    @MaxLength(50)
    lastName: string;

    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole = UserRole.STUDENT;
}

export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    password: string;
}

export class RefreshTokenDto {
    @IsString()
    refreshToken: string;
}

export class ForgotPasswordDto {
    @IsEmail()
    email: string;
}

export class ResetPasswordDto {
    @IsString()
    token: string;

    @IsString()
    @MinLength(8)
    @MaxLength(128)
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        {
            message:
                'Password must contain uppercase, lowercase, number and special character',
        },
    )
    newPassword: string;
}

export class VerifyEmailDto {
    @IsString()
    token: string;
}

export class ChangePasswordDto {
    @IsString()
    @MinLength(8)
    currentPassword: string;

    @IsString()
    @MinLength(8)
    @MaxLength(128)
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        {
            message:
                'Password must contain uppercase, lowercase, number and special character',
        },
    )
    newPassword: string;
}

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    firstName?: string;

    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    lastName?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    bio?: string;

    @IsOptional()
    @IsString()
    avatarUrl?: string;

    @IsOptional()
    @IsString()
    timezone?: string;

    @IsOptional()
    @IsString()
    language?: string;
}
