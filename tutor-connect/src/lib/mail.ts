import nodemailer from 'nodemailer';
import { render } from '@react-email/components';
import VerificationEmail from '@/emails/VerificationEmail';
import ResetPasswordEmail from '@/emails/ResetPasswordEmail';
import TransactionNotificationEmail from '@/emails/TransactionNotificationEmail';

// Create a Nodemailer transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER, // e.g. your-email@gmail.com
        pass: process.env.GMAIL_APP_PASSWORD, // your 16-character app password
    },
});

const fromEmail = `"Tutor Connect" <${process.env.GMAIL_USER}>`;

export const sendVerificationEmail = async (email: string, token: string) => {
    try {
        const html = await render(VerificationEmail({ otpCode: token }));

        const info = await transporter.sendMail({
            from: fromEmail,
            to: email,
            subject: 'Your Tutor Connect Verification Code',
            html: html,
        });
        
        console.log('Verification Email sent successfully:', info.messageId);
    } catch (error) {
        console.error('Failed to send verification email exception:', error);
    }
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
    try {
        const html = await render(ResetPasswordEmail({ otpCode: token }));

        const info = await transporter.sendMail({
            from: fromEmail,
            to: email,
            subject: 'Reset your Tutor Connect password',
            html: html,
        });

        console.log('Password Reset Email sent successfully:', info.messageId);
    } catch (error) {
        console.error('Failed to send password reset email:', error);
    }
};

export const sendTransactionEmail = async (
    email: string,
    userName: string,
    type: 'DEBIT' | 'WITHDRAWAL',
    amount: number,
    balanceAfter: number
) => {
    const subject = type === 'DEBIT' ? 'Payment Receipt - Tutor Connect' : 'Withdrawal Request Initiated - Tutor Connect';

    try {
        const html = await render(TransactionNotificationEmail({ userName, type, amount, balanceAfter }));

        const info = await transporter.sendMail({
            from: fromEmail,
            to: email,
            subject: subject,
            html: html,
        });

        console.log('Transaction Email sent successfully:', info.messageId);
    } catch (error) {
        console.error('Failed to send transaction email:', error);
    }
};
