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

interface TransactionEmailProps {
  userName: string;
  type: 'DEBIT' | 'WITHDRAWAL';
  amount: number;
  balanceAfter: number;
}

export const TransactionNotificationEmail = ({
  userName,
  type,
  amount,
  balanceAfter,
}: TransactionEmailProps) => {
  const isDebit = type === 'DEBIT';
  const title = isDebit ? 'Payment Successful' : 'Withdrawal Initiated';
  const amountColor = isDebit ? '#ef4444' : '#059669'; // Red for debit (spending), Green for withdrawal (earning to bank)

  return (
    <Html>
      <Head />
      <Preview>{title} - Tutor Connect</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            🎓 Tutor Connect
          </Heading>
          
          <Text style={text}>
            Dear {userName},
          </Text>
          
          <Text style={text}>
            {isDebit 
              ? 'We have successfully processed your payment for a tutoring session.'
              : 'Your withdrawal request has been successfully initiated and is now being processed.'}
          </Text>
          
          <Section style={amountBox}>
            <Text style={amountLabel}>{isDebit ? 'Amount Paid' : 'Amount Withdrawn'}</Text>
            <Text style={{ ...amountValue, color: amountColor }}>
              {isDebit ? '-' : ''}{amount.toFixed(2)} ETB
            </Text>
          </Section>
          
          <Section style={detailsBox}>
            <Text style={detailsRow}>
              <strong>Current Wallet Balance:</strong> {balanceAfter.toFixed(2)} ETB
            </Text>
            <Text style={detailsRow}>
              <strong>Date:</strong> {new Date().toLocaleString()}
            </Text>
          </Section>
          
          <Text style={footer}>
            If you have any questions about this transaction, please contact our support team.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default TransactionNotificationEmail;

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
};

const amountBox = {
  background: '#f8fafc',
  borderRadius: '8px',
  margin: '24px 0',
  padding: '24px',
  textAlign: 'center' as const,
  border: '1px solid #e2e8f0',
};

const amountLabel = {
  color: '#64748b',
  fontSize: '14px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px',
};

const amountValue = {
  fontSize: '32px',
  fontWeight: '700',
  margin: '0',
};

const detailsBox = {
  margin: '24px 0',
  padding: '16px 0',
  borderTop: '1px solid #e2e8f0',
  borderBottom: '1px solid #e2e8f0',
};

const detailsRow = {
  color: '#475569',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
};

const footer = {
  color: '#64748b',
  fontSize: '12px',
  lineHeight: '16px',
  marginTop: '24px',
  textAlign: 'center' as const,
};
