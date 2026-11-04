import { SMSProviderConfig } from '../types.js';
import {
  SMSProviderAdapter,
  ProviderSendResult,
  ProviderDeliveryStatusResult,
  ProviderBalanceResult,
  ProviderDiagnosticResult,
} from './providers/SMSProviderAdapter.js';
import { BulkSmsUgandaProvider } from './providers/BulkSmsUgandaProvider.js';
import { AfricasTalkingProvider } from './providers/AfricasTalkingProvider.js';
import { GenericHttpProvider } from './providers/GenericHttpProvider.js';

import { db } from '../db.js';

export class SMSGatewayManager {
  private static instance: SMSGatewayManager;
  private adapters: Map<string, SMSProviderAdapter> = new Map();
  private activeSlug: string = 'bulksmsuganda';

  private constructor() {
    // Default fallback configurations
    const defaultBulkSmsUgandaConfig: SMSProviderConfig = {
      id: 'prov_bulksmsuganda',
      name: 'Bulk SMS Uganda',
      slug: 'bulksmsuganda',
      is_active: true,
      api_key: process.env.BULKSMSUG_API_KEY || '',
      api_url: 'https://app.bulksmsug.com',
      sender_id: 'ICONSEND',
      balance_cached: 2500,
      test_mode: false,
    };

    const defaultAfricasTalkingConfig: SMSProviderConfig = {
      id: 'prov_africastalking',
      name: "Africa's Talking",
      slug: 'africastalking',
      is_active: false,
      api_key: '',
      api_url: 'https://api.africastalking.com/version1/messaging',
      api_secret: '',
      sender_id: 'ICONSEND',
      balance_cached: 1800,
      test_mode: true,
    };

    const defaultGenericConfig: SMSProviderConfig = {
      id: 'prov_generic',
      name: 'Custom HTTP Gateway',
      slug: 'generic_http',
      is_active: false,
      api_key: '',
      api_url: '',
      sender_id: 'ICONSEND',
      balance_cached: 5000,
      test_mode: true,
    };

    this.registerAdapter(new BulkSmsUgandaProvider(defaultBulkSmsUgandaConfig));
    this.registerAdapter(new AfricasTalkingProvider(defaultAfricasTalkingConfig));
    this.registerAdapter(new GenericHttpProvider(defaultGenericConfig));

    this.syncFromDatabase();
  }

  public syncFromDatabase(): void {
    try {
      const persisted = db.getProviderSettings();
      for (const p of persisted) {
        const adapter = this.adapters.get(p.slug);
        if (adapter) {
          adapter.updateConfig(p);
        }
      }
      const active = db.getSystemSettings().active_provider_slug;
      if (active && this.adapters.has(active)) {
        this.activeSlug = active;
      }
    } catch {
      // Ignore if db not ready yet
    }
  }

  public static getInstance(): SMSGatewayManager {
    if (!SMSGatewayManager.instance) {
      SMSGatewayManager.instance = new SMSGatewayManager();
    }
    return SMSGatewayManager.instance;
  }

  public registerAdapter(adapter: SMSProviderAdapter): void {
    this.adapters.set(adapter.slug, adapter);
  }

  public getActiveSlug(): string {
    return this.activeSlug;
  }

  public setActiveProvider(slug: string): boolean {
    if (this.adapters.has(slug)) {
      this.activeSlug = slug;
      // Mark active flags
      for (const [key, adapter] of this.adapters.entries()) {
        adapter.updateConfig({ is_active: key === slug });
      }
      return true;
    }
    return false;
  }

  public getActiveAdapter(): SMSProviderAdapter {
    const adapter = this.adapters.get(this.activeSlug);
    if (!adapter) {
      // Fallback to Bulk SMS Uganda
      return this.adapters.get('bulksmsuganda')!;
    }
    return adapter;
  }

  public getAdapter(slug: string): SMSProviderAdapter | undefined {
    return this.adapters.get(slug);
  }

  public getAllProviders(): Array<{
    slug: string;
    name: string;
    isActive: boolean;
    config: SMSProviderConfig;
  }> {
    const list: Array<{
      slug: string;
      name: string;
      isActive: boolean;
      config: SMSProviderConfig;
    }> = [];

    for (const [slug, adapter] of this.adapters.entries()) {
      list.push({
        slug,
        name: adapter.name,
        isActive: slug === this.activeSlug,
        config: adapter.config,
      });
    }

    return list;
  }

  public updateProviderConfig(slug: string, newConfig: Partial<SMSProviderConfig>): boolean {
    const adapter = this.adapters.get(slug);
    if (!adapter) return false;
    adapter.updateConfig(newConfig);
    return true;
  }

  // Gateway operations routed to active adapter
  public async sendSMS(recipient: string, message: string, senderId?: string): Promise<ProviderSendResult> {
    return this.getActiveAdapter().sendSMS(recipient, message, senderId);
  }

  public async sendBulkSMS(recipients: string[], message: string, senderId?: string): Promise<ProviderSendResult[]> {
    return this.getActiveAdapter().sendBulkSMS(recipients, message, senderId);
  }

  public async checkDeliveryStatus(providerMessageId: string, providerSlug?: string): Promise<ProviderDeliveryStatusResult> {
    const adapter = providerSlug ? (this.adapters.get(providerSlug) || this.getActiveAdapter()) : this.getActiveAdapter();
    return adapter.checkDeliveryStatus(providerMessageId);
  }

  public async getBalance(slug?: string): Promise<ProviderBalanceResult> {
    const adapter = slug ? (this.adapters.get(slug) || this.getActiveAdapter()) : this.getActiveAdapter();
    return adapter.retrieveAccountBalance();
  }

  public async getProviderBalance(slug: string): Promise<ProviderBalanceResult> {
    const adapter = this.adapters.get(slug);
    if (!adapter) {
      return {
        supported: false,
        rawDetails: `Provider adapter "${slug}" not found`,
      };
    }
    return adapter.retrieveAccountBalance();
  }

  public updateCachedBalance(slug: string, balance: number): boolean {
    const adapter = this.adapters.get(slug);
    if (!adapter) return false;
    adapter.updateConfig({ balance_cached: balance });
    return true;
  }

  public async testProvider(slug: string): Promise<{ success: boolean; message: string; balance?: number; endpoint?: string }> {
    const adapter = this.adapters.get(slug);
    if (!adapter) {
      return { success: false, message: `Provider adapter ${slug} not found` };
    }
    return adapter.testConnection();
  }

  public async testSendSMS(slug: string, recipient: string, message: string, senderId?: string): Promise<ProviderDiagnosticResult> {
    const adapter = this.adapters.get(slug) || this.getActiveAdapter();
    if (adapter.testSend) {
      return adapter.testSend(recipient, message, senderId);
    }

    // Fallback for providers without dedicated testSend
    const start = Date.now();
    const res = await adapter.sendSMS(recipient, message, senderId);
    return {
      success: res.success,
      latencyMs: Date.now() - start,
      requestUrl: adapter.config.api_url || 'Gateway',
      requestPayload: { recipient, message, senderId },
      responseStatus: res.success ? 200 : 400,
      responseBody: res.rawResponse || {},
      providerMessageId: res.providerMessageId,
      status: res.status,
      calculatedCredits: res.calculatedCredits,
      errorMessage: res.errorMessage,
      timestamp: new Date().toISOString(),
    };
  }
}

export const smsGateway = SMSGatewayManager.getInstance();
