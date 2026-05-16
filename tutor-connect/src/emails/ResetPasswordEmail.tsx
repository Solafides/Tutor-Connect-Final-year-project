import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface ResetPasswordEmailProps {
  otpCode: string;
}

export const ResetPasswordEmail = ({ otpCode }: ResetPasswordEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Reset your Tutor Connect password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            🎓 Tutor Connect
          </Heading>
          <Text style={text}>
            Someone recently requested a password change for your Tutor Connect account. If this was you, please use the 6-digit code below to set a new password:
          </Text>
          <Section style={codeBox}>
            <Text style={codeText}>{otpCode}</Text>
          </Section>
          <Text style={text}>
            If you don't want to change your password or didn't request this, just ignore and delete this message.
          </Text>
          <Text style={text}>
            To keep your account secure, please don't forward this email to anyone. This code will expire in 1 hour.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default ResetPasswordEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '40px auto',
  padding: '20px 40px 48px',
  borderRadius: '8px',
  border: '1px solid #eaeaea',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  maxWidth: '480px',
};

const h1 = {
  color: '#059669', // Emerald Green
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '40px',
  margin: '0 0 20px',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'center' as const,
};

const codeBox = {
  background: '#ecfdf5', // Emerald-50
  borderRadius: '8px',
  margin: '24px auto 24px',
  verticalAlign: 'middle',
  padding: '16px 0',
};

const codeText = {
  color: '#059669',
  fontSize: '36px',
  fontWeight: '700',
  letterSpacing: '8px',
  margin: '0 auto',
  width: '100%',
  textAlign: 'center' as const,
};
