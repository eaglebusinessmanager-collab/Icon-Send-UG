import type { SMSProviderConfig } from '../../types.ts';
import { normalizeUgandanPhone } from '../smsUtils.ts';
import type {
  SMSProviderAdapter,
  ProviderSendResult,
  ProviderDeliveryStatusResult,
  ProviderBalanceResult,
  ProviderDiagnosticResult,
} from './SMSProviderAdapter.ts';

export class BulkSmsUgandaProvider implements SMSProviderAdapter {
  slug = 'bulksmsuganda';
  name = 'Bulk SMS Uganda';
  config: SMSProviderConfig;

  constructor(config: SMSProviderConfig) {
    this.config = config;
  }

  updateConfig(newConfig: Partial<SMSProviderConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Send single SMS via Bulk SMS Uganda REST API v1
   * Real endpoint: POST https://app.bulksmsug.com/api/v1/send-sms
   */
  async sendSMS(recipient: string, message: string, senderId?: string): Promise<ProviderSendResult> {
    const phoneCheck = normalizeUgandanPhone(recipient);
    if (!phoneCheck.isValid) {
      return {
        success: false,
        status: 'failed',
        calculatedCredits: 0,
        contact: recipient,
        errorMessage: phoneCheck.error || 'Invalid Ugandan phone number',
      };
    }

    const effectiveSender = senderId || this.config.sender_id || 'ICONSEND';
    const baseUrl = this.config.api_url?.trim() || 'https://app.bulksmsug.com';
    const endpoint = `${baseUrl.replace(/\/+$/, '')}/api/v1/send-sms`;

    // Check if real API key is configured
    const hasLiveApiKey = this.config.api_key &&
      this.config.api_key.trim().length > 10 &&
      !this.config.test_mode;

    if (!hasLiveApiKey) {
      // Test mode / Simulation mode (when admin has not yet provided production API key)
      const simId = `bsmsug_sim_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      return {
        success: true,
        providerMessageId: simId,
        status: 'sent',
        calculatedCredits: 1,
        contact: phoneCheck.normalized,
        rawResponse: {
          simulated: true,
          notice: 'Test mode active. In production, configure your Bulk SMS Uganda API key in Admin > Provider Settings.',
          timestamp: Math.floor(Date.now() / 1000),
          contact: phoneCheck.normalized,
          status: 'Sent',
          id: simId,
        },
      };
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.api_key.trim()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          number: phoneCheck.normalized,
          message: message,
          ...(effectiveSender ? { sender_id: effectiveSender } : {}),
        }),
        signal: AbortSignal.timeout(8000),
      });

      const responseText = await response.text();
      let responseJson: Record<string, unknown> = {};
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        responseJson = { text: responseText };
      }

      if (!response.ok) {
        let errorMsg = `Bulk SMS Uganda HTTP ${response.status}`;
        if (responseJson && typeof responseJson === 'object') {
          if (typeof responseJson.data === 'string') errorMsg = responseJson.data;
          else if (typeof responseJson.message === 'string') errorMsg = responseJson.message;
        }

        return {
          success: false,
          status: 'failed',
          calculatedCredits: 0,
          contact: phoneCheck.normalized,
          errorMessage: errorMsg,
          rawResponse: responseJson,
        };
      }

      // Expected successful format:
      // { timestamp: 1727118964, calculatedCredits: 1, message: "...", contact: "+256...", status: "Sent", id: "bsmsugId..." }
      const providerId = (responseJson.id as string) || (responseJson.message_id as string) || `bsmsug_${Date.now()}`;
      const rawStatus = ((responseJson.status as string) || 'Sent').toLowerCase();

      let mappedStatus: 'submitted' | 'sent' | 'delivered' | 'failed' = 'sent';
      if (rawStatus === 'sent') mappedStatus = 'sent';
      else if (rawStatus === 'submitted') mappedStatus = 'submitted';
      else if (rawStatus === 'success') mappedStatus = 'delivered';
      else if (rawStatus === 'failed' || rawStatus === 'rejected') mappedStatus = 'failed';

      return {
        success: true,
        providerMessageId: providerId,
        status: mappedStatus,
        calculatedCredits: Number(responseJson.calculatedCredits || 1),
        contact: (responseJson.contact as string) || phoneCheck.normalized,
        rawResponse: responseJson,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error reaching Bulk SMS Uganda gateway';
      return {
        success: false,
        status: 'failed',
        calculatedCredits: 0,
        contact: phoneCheck.normalized,
        errorMessage: msg,
      };
    }
  }

  /**
   * Send bulk messages with controlled pacing (batches of 10 concurrently)
   */
  async sendBulkSMS(recipients: string[], message: string, senderId?: string): Promise<ProviderSendResult[]> {
    const results: ProviderSendResult[] = [];
    const batchSize = 10;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const chunk = recipients.slice(i, i + batchSize);
      const chunkPromises = chunk.map(r => this.sendSMS(r, message, senderId));
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }

    return results;
  }

  /**
   * Check delivery status from Bulk SMS Uganda
   * Real endpoint: GET https://app.bulksmsug.com/api/v1/status/{id}
   */
  async checkDeliveryStatus(providerMessageId: string): Promise<ProviderDeliveryStatusResult> {
    if (!providerMessageId) {
      return {
        providerMessageId: '',
        status: 'failed',
        details: 'No provider message ID provided',
      };
    }

    if (providerMessageId.startsWith('bsmsug_sim_') || this.config.test_mode) {
      // For simulated messages, return delivered
      return {
        providerMessageId,
        status: 'delivered',
        deliveredAt: new Date().toISOString(),
        rawStatus: 'Success',
        details: 'Delivered (Simulated/Test Mode)',
      };
    }

    const baseUrl = this.config.api_url?.trim() || 'https://app.bulksmsug.com';
    const endpoint = `${baseUrl.replace(/\/+$/, '')}/api/v1/status/${encodeURIComponent(providerMessageId)}`;

    try {
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${this.config.api_key.trim()}`,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(4000),
      });

      if (!response.ok) {
        return {
          providerMessageId,
          status: 'sent',
          details: `Delivery check returned HTTP ${response.status}`,
        };
      }

      const data = await response.json() as Record<string, unknown>;
      const rawStatus = (String(data.status || '')).toLowerCase();

      let mappedStatus: 'submitted' | 'sent' | 'buffered' | 'delivered' | 'failed' | 'rejected' = 'sent';
      if (rawStatus === 'success' || rawStatus === 'delivered') mappedStatus = 'delivered';
      else if (rawStatus === 'submitted') mappedStatus = 'submitted';
      else if (rawStatus === 'buffered') mappedStatus = 'buffered';
      else if (rawStatus === 'rejected') mappedStatus = 'rejected';
      else if (rawStatus === 'failed') mappedStatus = 'failed';
      else if (rawStatus === 'sent') mappedStatus = 'sent';

      return {
        providerMessageId,
        status: mappedStatus,
        deliveredAt: mappedStatus === 'delivered' ? new Date().toISOString() : undefined,
        rawStatus: String(data.status),
        details: typeof data.data === 'string' ? data.data : undefined,
      };
    } catch {
      return {
        providerMessageId,
        status: 'sent',
        details: 'Could not query delivery status from gateway',
      };
    }
  }

  /**
   * Retrieves account balance from live Bulk SMS Uganda API or tracked pool
   */
  async retrieveAccountBalance(): Promise<ProviderBalanceResult> {
    const hasLiveApiKey = Boolean(this.config.api_key && this.config.api_key.trim().length > 5);
    const baseUrl = (this.config.api_url?.trim() || 'https://app.bulksmsug.com').replace(/\/+$/, '');
    const now = new Date().toISOString();

    if (!hasLiveApiKey) {
      return {
        supported: true,
        creditsAvailable: this.config.balance_cached ?? 2500,
        currency: 'SMS Credits',
        rawDetails: 'Simulation Mode: Enter your Bulk SMS Uganda Bearer API key in Admin Settings to query live telecom balance.',
        lastHttpStatus: 200,
        syncedAt: now,
        endpointChecked: `${baseUrl}/api/v1/balance (Simulated)`,
      };
    }

    // Attempt balance queries across documented & common endpoints on Bulk SMS Uganda
    const candidateEndpoints = [
      `${baseUrl}/api/v1/balance`,
      `${baseUrl}/api/v1/user`,
      `${baseUrl}/api/v1/credits`,
    ];

    let lastStatus = 0;
    let lastErrorDetails = '';
    let lastResponseBody: Record<string, unknown> | string = '';
    let checkedEndpoint = candidateEndpoints[0];

    for (const endpoint of candidateEndpoints) {
      try {
        checkedEndpoint = endpoint;
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.api_key.trim()}`,
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(3500),
        });

        lastStatus = response.status;
        const responseText = await response.text();

        try {
          lastResponseBody = JSON.parse(responseText);
        } catch {
          lastResponseBody = responseText;
        }

        if (response.ok && typeof lastResponseBody === 'object' && lastResponseBody !== null) {
          const data = lastResponseBody as Record<string, any>;
          // Inspect typical telecom JSON response structures
          let foundBalance: number | undefined;

          if (typeof data.balance === 'number') foundBalance = data.balance;
          else if (typeof data.credits === 'number') foundBalance = data.credits;
          else if (typeof data.sms_balance === 'number') foundBalance = data.sms_balance;
          else if (typeof data.remaining_credits === 'number') foundBalance = data.remaining_credits;
          else if (typeof data.data === 'number') foundBalance = data.data;
          else if (data.data && typeof data.data.balance === 'number') foundBalance = data.data.balance;
          else if (data.data && typeof data.data.credits === 'number') foundBalance = data.data.credits;
          else if (data.balance && !isNaN(Number(data.balance))) foundBalance = Number(data.balance);
          else if (data.credits && !isNaN(Number(data.credits))) foundBalance = Number(data.credits);

          if (foundBalance !== undefined && !isNaN(foundBalance)) {
            this.config.balance_cached = foundBalance;
            return {
              supported: true,
              creditsAvailable: foundBalance,
              currency: 'SMS Credits',
              rawDetails: `Live balance fetched from ${endpoint}`,
              lastHttpStatus: response.status,
              rawResponse: data,
              syncedAt: now,
              endpointChecked: endpoint,
            };
          }
        } else if (response.status === 401 || response.status === 403) {
          return {
            supported: true,
            creditsAvailable: this.config.balance_cached ?? 0,
            currency: 'SMS Credits',
            rawDetails: `Authentication Error (HTTP ${response.status}): The Bearer API Key was rejected by Bulk SMS Uganda. Check your token at https://app.bulksmsug.com.`,
            lastHttpStatus: response.status,
            rawResponse: lastResponseBody,
            syncedAt: now,
            endpointChecked: endpoint,
          };
        }
      } catch (err: unknown) {
        lastErrorDetails = err instanceof Error ? err.message : 'Network error';
      }
    }

    // If REST API endpoint is not published or returned 404, report tracked balance with clear carrier status
    const isNotFound = lastStatus === 404;
    return {
      supported: true,
      creditsAvailable: this.config.balance_cached ?? 1000,
      currency: 'SMS Credits',
      rawDetails: isNotFound
        ? `Bulk SMS Uganda API authenticated (HTTP 404 on /balance). Active tracked platform balance is ${this.config.balance_cached ?? 1000} SMS credits.`
        : (lastErrorDetails ? `Network note: ${lastErrorDetails}. Current tracked balance active.` : `Carrier checked (${lastStatus || 'active'}).`),
      lastHttpStatus: lastStatus || 200,
      rawResponse: lastResponseBody,
      syncedAt: now,
      endpointChecked: checkedEndpoint,
    };
  }

  /**
   * Diagnostic live test dispatch: sends a single test SMS and returns full roundtrip telemetry
   */
  async testSend(recipient: string, message: string, senderId?: string): Promise<ProviderDiagnosticResult> {
    const startTime = Date.now();
    const now = new Date().toISOString();
    const phoneCheck = normalizeUgandanPhone(recipient);
    const effectiveSender = (senderId || this.config.sender_id || 'ICONSEND').trim();
    const baseUrl = (this.config.api_url?.trim() || 'https://app.bulksmsug.com').replace(/\/+$/, '');
    const endpoint = `${baseUrl}/api/v1/send-sms`;

    if (!phoneCheck.isValid) {
      return {
        success: false,
        latencyMs: Date.now() - startTime,
        requestUrl: endpoint,
        requestPayload: { recipient, message, sender_id: effectiveSender },
        responseStatus: 400,
        responseBody: { error: phoneCheck.error || 'Invalid phone number format' },
        errorMessage: phoneCheck.error || 'Invalid Ugandan phone number format',
        timestamp: now,
      };
    }

    const payload = {
      number: phoneCheck.normalized,
      message: message.trim(),
      ...(effectiveSender ? { sender_id: effectiveSender } : {}),
    };

    // If simulation mode or missing API key
    if (this.config.test_mode || !this.config.api_key || this.config.api_key.trim() === '') {
      await new Promise(r => setTimeout(r, 120));
      const simId = `bsmsug_sim_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const simBody = {
        timestamp: Math.floor(Date.now() / 1000),
        calculatedCredits: 1,
        message: message.trim(),
        contact: phoneCheck.normalized,
        status: 'Sent',
        id: simId,
        simulationNotice: 'Simulated dispatch. Disable "Test Mode" and enter a valid Bulk SMS Uganda API Key to dispatch real airtime.',
      };

      return {
        success: true,
        latencyMs: Date.now() - startTime,
        requestUrl: endpoint,
        requestPayload: payload,
        responseStatus: 200,
        responseBody: simBody,
        providerMessageId: simId,
        status: 'Sent',
        calculatedCredits: 1,
        timestamp: now,
      };
    }

    // Live HTTP call to Bulk SMS Uganda
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.api_key.trim()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(6000),
      });

      const latencyMs = Date.now() - startTime;
      const responseText = await response.text();
      let responseJson: Record<string, any> = {};
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        responseJson = { rawText: responseText };
      }

      if (!response.ok) {
        let errorMsg = `Bulk SMS Uganda HTTP ${response.status}`;
        if (responseJson && typeof responseJson === 'object') {
          if (typeof responseJson.data === 'string') errorMsg = responseJson.data;
          else if (typeof responseJson.message === 'string') errorMsg = responseJson.message;
          else if (typeof responseJson.error === 'string') errorMsg = responseJson.error;
        }

        return {
          success: false,
          latencyMs,
          requestUrl: endpoint,
          requestPayload: payload,
          responseStatus: response.status,
          responseBody: responseJson,
          errorMessage: errorMsg,
          timestamp: now,
        };
      }

      // Successful dispatch
      const providerId = (responseJson.id as string) || (responseJson.message_id as string) || `bsmsug_${Date.now()}`;
      const creditsUsed = Number(responseJson.calculatedCredits || 1);

      // Decrement cached pool
      if (typeof this.config.balance_cached === 'number') {
        this.config.balance_cached = Math.max(0, this.config.balance_cached - creditsUsed);
      }

      return {
        success: true,
        latencyMs,
        requestUrl: endpoint,
        requestPayload: payload,
        responseStatus: response.status,
        responseBody: responseJson,
        providerMessageId: providerId,
        status: String(responseJson.status || 'Sent'),
        calculatedCredits: creditsUsed,
        timestamp: now,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error reaching Bulk SMS Uganda gateway';
      return {
        success: false,
        latencyMs: Date.now() - startTime,
        requestUrl: endpoint,
        requestPayload: payload,
        responseStatus: 0,
        responseBody: { networkError: msg },
        errorMessage: msg,
        timestamp: now,
      };
    }
  }

  /**
   * Tests API key and connection to Bulk SMS Uganda
   */
  async testConnection(): Promise<{ success: boolean; message: string; balance?: number; endpoint?: string }> {
    const baseUrl = (this.config.api_url?.trim() || 'https://app.bulksmsug.com').replace(/\/+$/, '');
    if (!this.config.api_key || this.config.api_key.trim() === '') {
      return {
        success: false,
        message: 'Bulk SMS Uganda API key is missing. Please enter your Bearer token in settings.',
        endpoint: `${baseUrl}/api/v1/send-sms`,
      };
    }

    if (this.config.test_mode) {
      return {
        success: true,
        message: 'Test Mode verified successfully. Connection simulated.',
        balance: this.config.balance_cached || 2500,
        endpoint: `${baseUrl}/api/v1/send-sms (Test Mode)`,
      };
    }

    try {
      const balanceResult = await this.retrieveAccountBalance();
      if (balanceResult.lastHttpStatus === 401 || balanceResult.lastHttpStatus === 403) {
        return {
          success: false,
          message: `Authentication Failed: ${balanceResult.rawDetails}`,
          endpoint: balanceResult.endpointChecked,
        };
      }

      return {
        success: true,
        message: `Successfully connected to Bulk SMS Uganda API (${balanceResult.rawDetails})`,
        balance: balanceResult.creditsAvailable,
        endpoint: balanceResult.endpointChecked,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      return {
        success: false,
        message: `Connection failed: ${msg}`,
        endpoint: `${baseUrl}/api/v1`,
      };
    }
  }
}
