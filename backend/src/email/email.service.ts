import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
    constructor(private mailerService: MailerService) { }

    async sendVerificationEmail(email: string, name: string, token: string) {
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/verify-email?token=${token}`;

        await this.mailerService.sendMail({
            to: email,
            subject: 'Verify your email address',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Learning Platform, ${name}!</h2>
          <p>Thank you for registering. Please verify your email address to activate your account.</p>
          <div style="margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Or copy and paste this link into your browser:<br/>
            <a href="${verificationUrl}">${verificationUrl}</a>
          </p>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 24 hours.
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            If you didn't create an account, please ignore this email.
          </p>
        </div>
      `,
        });
    }

    async sendPasswordResetEmail(email: string, name: string, token: string) {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password?token=${token}`;

        await this.mailerService.sendMail({
            to: email,
            subject: 'Reset your password',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hi ${name},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Or copy and paste this link into your browser:<br/>
            <a href="${resetUrl}">${resetUrl}</a>
          </p>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 1 hour.
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            If you didn't request this, please ignore this email and your password will remain unchanged.
          </p>
        </div>
      `,
        });
    }

    async sendWelcomeEmail(email: string, name: string) {
        await this.mailerService.sendMail({
            to: email,
            subject: 'Welcome to Learning Platform!',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome, ${name}!</h2>
          <p>Your email has been verified and your account is now active.</p>
          <p>Start exploring our courses and begin your learning journey today!</p>
          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/courses" 
               style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Browse Courses
            </a>
          </div>
        </div>
      `,
        });
    }

    async sendCourseEnrollmentEmail(email: string, name: string, courseTitle: string) {
        await this.mailerService.sendMail({
            to: email,
            subject: `You're enrolled in ${courseTitle}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Enrollment Successful!</h2>
          <p>Hi ${name},</p>
          <p>You have successfully enrolled in <strong>${courseTitle}</strong>.</p>
          <p>Start learning now and track your progress!</p>
          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/my-courses" 
               style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Go to My Courses
            </a>
          </div>
        </div>
      `,
        });
    }

    async sendCertificateEmail(email: string, name: string, courseTitle: string, certificateUrl: string) {
        await this.mailerService.sendMail({
            to: email,
            subject: `Congratulations! You've earned a certificate`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">🎉 Congratulations, ${name}!</h2>
          <p>You have successfully completed <strong>${courseTitle}</strong> and earned your certificate!</p>
          <div style="margin: 30px 0;">
            <a href="${certificateUrl}" 
               style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Download Certificate
            </a>
          </div>
          <p style="color: #666;">Share your achievement on social media and showcase your new skills!</p>
        </div>
      `,
        });
    }

    async sendAssignmentGradedEmail(
        email: string,
        name: string,
        courseTitle: string,
        assignmentTitle: string,
        grade: number,
    ) {
        await this.mailerService.sendMail({
            to: email,
            subject: `Your assignment has been graded`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Assignment Graded</h2>
          <p>Hi ${name},</p>
          <p>Your assignment <strong>${assignmentTitle}</strong> in <strong>${courseTitle}</strong> has been graded.</p>
          <p style="font-size: 24px; color: #4F46E5; font-weight: bold;">Grade: ${grade}%</p>
          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/my-courses" 
               style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Details
            </a>
          </div>
        </div>
      `,
        });
    }
}
