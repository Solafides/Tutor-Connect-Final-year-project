import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface VerificationEmailProps {
  otpCode: string;
}

export const VerificationEmail = ({ otpCode }: VerificationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your Tutor Connect Verification Code</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            🎓 Tutor Connect
          </Heading>
          <Text style={text}>
            Please use the verification code below to confirm your email address. This code will expire in 15 minutes.
          </Text>
          <Section style={codeBox}>
            <Text style={codeText}>{otpCode}</Text>
          </Section>
          <Text style={text}>
            If you didn't request this email, you can safely ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default VerificationEmail;

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
