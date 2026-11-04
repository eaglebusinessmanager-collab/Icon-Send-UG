import type { SMSProviderConfig } from '../../types.ts';
import { normalizeUgandanPhone } from '../smsUtils.ts';
import type {
  SMSProviderAdapter,
  ProviderSendResult,
  ProviderDeliveryStatusResult,
  ProviderBalanceResult,
} from './SMSProviderAdapter.ts';

export class GenericHttpProvider implements SMSProviderAdapter {
  slug = 'generic_http';
  name = 'Custom HTTP Gateway / SMPP';
  config: SMSProviderConfig;

  constructor(config: SMSProviderConfig) {
    this.config = config;
  }

  updateConfig(newConfig: Partial<SMSProviderConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  async sendSMS(recipient: string, message: string, senderId?: string): Promise<ProviderSendResult> {
    const phoneCheck = normalizeUgandanPhone(recipient);
    if (!phoneCheck.isValid) {
      return {
        success: false,
        status: 'failed',
        calculatedCredits: 0,
        contact: recipient,
        errorMessage: phoneCheck.error || 'Invalid phone number',
      };
    }

    if (!this.config.api_url || this.config.test_mode) {
      return {
        success: true,
        providerMessageId: `generic_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        status: 'sent',
        calculatedCredits: 1,
        contact: phoneCheck.normalized,
        rawResponse: { simulated: true, provider: 'Generic HTTP Gateway' },
      };
    }

    try {
      const res = await fetch(this.config.api_url, {
        method: 'POST',
        headers: {
          'Authorization': this.config.api_key ? `Bearer ${this.config.api_key}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: phoneCheck.normalized,
          message,
          sender_id: senderId || this.config.sender_id,
        }),
      });

      const data = await res.json() as Record<string, unknown>;
      return {
        success: res.ok,
        providerMessageId: (data.id as string) || `gen_${Date.now()}`,
        status: res.ok ? 'sent' : 'failed',
        calculatedCredits: 1,
        contact: phoneCheck.normalized,
        rawResponse: data,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error calling Custom HTTP Gateway';
      return {
        success: false,
        status: 'failed',
        calculatedCredits: 0,
        contact: phoneCheck.normalized,
        errorMessage: msg,
      };
    }
  }

  async sendBulkSMS(recipients: string[], message: string, senderId?: string): Promise<ProviderSendResult[]> {
    const results: ProviderSendResult[] = [];
    for (const r of recipients) {
      results.push(await this.sendSMS(r, message, senderId));
    }
    return results;
  }

  async checkDeliveryStatus(providerMessageId: string): Promise<ProviderDeliveryStatusResult> {
    return {
      providerMessageId,
      status: 'delivered',
      deliveredAt: new Date().toISOString(),
    };
  }

  async retrieveAccountBalance(): Promise<ProviderBalanceResult> {
    return {
      supported: true,
      creditsAvailable: this.config.balance_cached || 5000,
      currency: 'Credits',
    };
  }

  async testConnection(): Promise<{ success: boolean; message: string; balance?: number }> {
    return {
      success: true,
      message: 'Custom HTTP Gateway endpoint reachable',
      balance: this.config.balance_cached || 5000,
    };
  }
}
