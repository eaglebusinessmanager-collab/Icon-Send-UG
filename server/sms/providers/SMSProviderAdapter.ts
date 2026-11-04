import type { SMSProviderConfig } from '../../types.ts';

export interface ProviderSendResult {
  success: boolean;
  providerMessageId?: string;
  status: 'submitted' | 'sent' | 'buffered' | 'delivered' | 'failed' | 'rejected';
  calculatedCredits: number;
  contact: string;
  errorMessage?: string;
  rawResponse?: Record<string, unknown>;
}

export interface ProviderDeliveryStatusResult {
  providerMessageId: string;
  status: 'submitted' | 'sent' | 'buffered' | 'delivered' | 'failed' | 'rejected';
  deliveredAt?: string;
  rawStatus?: string;
  details?: string;
}

export interface ProviderBalanceResult {
  supported: boolean;
  creditsAvailable?: number;
  currency?: string;
  rawDetails?: string;
  lastHttpStatus?: number;
  rawResponse?: Record<string, unknown> | string;
  syncedAt?: string;
  endpointChecked?: string;
}

export interface ProviderDiagnosticResult {
  success: boolean;
  latencyMs: number;
  requestUrl: string;
  requestPayload: Record<string, unknown>;
  responseStatus: number;
  responseBody: Record<string, unknown> | string;
  providerMessageId?: string;
  status?: string;
  calculatedCredits?: number;
  errorMessage?: string;
  timestamp: string;
}

export interface SMSProviderAdapter {
  slug: string;
  name: string;
  config: SMSProviderConfig;

  updateConfig(config: Partial<SMSProviderConfig>): void;
  sendSMS(recipient: string, message: string, senderId?: string): Promise<ProviderSendResult>;
  sendBulkSMS(recipients: string[], message: string, senderId?: string): Promise<ProviderSendResult[]>;
  checkDeliveryStatus(providerMessageId: string): Promise<ProviderDeliveryStatusResult>;
  retrieveAccountBalance(): Promise<ProviderBalanceResult>;
  testConnection(): Promise<{ success: boolean; message: string; balance?: number; endpoint?: string }>;
  testSend?(recipient: string, message: string, senderId?: string): Promise<ProviderDiagnosticResult>;
}
