/**
 * Utilities for Ugandan Phone Validation, Normalization and GSM-7/Unicode Segment Counting
 */

// Standard GSM 7-bit default alphabet character set
const GSM_7_REGEX = /^[A-Za-z0-9 @£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\^{}\\[~\]|€ÆæßÉ!"#$%&'()*+,\-./:;<=>?]*$/;

export interface PhoneValidationResult {
  isValid: boolean;
  normalized: string;
  original: string;
  carrier: string;
  country: string;
  error?: string;
}

export interface SegmentCalculation {
  characterCount: number;
  encoding: 'GSM-7' | 'Unicode';
  segmentCount: number;
  maxCharsPerSegment: number;
  charsLeftInCurrentSegment: number;
  creditsRequired: number; // 1 credit per segment
}

/**
 * Normalizes and validates Ugandan phone numbers.
 * Supported inputs:
 * 07XXXXXXXX, 03XXXXXXXX, +256XXXXXXXXX, 256XXXXXXXXX, spaces, dashes.
 */
export function normalizeUgandanPhone(raw: string): PhoneValidationResult {
  const original = (raw || '').trim();
  // Strip non-numeric characters except leading '+'
  let cleaned = original.replace(/[\s\-().]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Handle local 0-prefix e.g. 0772123456 -> 256772123456
  if (cleaned.startsWith('0') && (cleaned.length === 10)) {
    cleaned = '256' + cleaned.substring(1);
  }

  // Handle 7XXXXXXXX (9 digits) -> 2567XXXXXXXX
  if ((cleaned.startsWith('7') || cleaned.startsWith('3')) && cleaned.length === 9) {
    cleaned = '256' + cleaned;
  }

  // Check if it's 256 + 9 digits (total 12 digits)
  const isValidFormat = /^256(7\d|3\d|4\d)\d{7}$/.test(cleaned);

  if (!isValidFormat) {
    return {
      isValid: false,
      normalized: original,
      original,
      carrier: 'Unknown',
      country: 'Uganda',
      error: 'Invalid Ugandan phone number. Must be 10 digits starting with 07 or 03 (e.g. 0772123456)',
    };
  }

  const prefix = cleaned.substring(3, 5); // 70, 77, 78, 75, etc.
  let carrier = 'Uganda Telecom';

  if (['77', '78', '76'].includes(prefix)) {
    carrier = 'MTN Uganda';
  } else if (['70', '75', '74'].includes(prefix)) {
    carrier = 'Airtel Uganda';
  } else if (['71', '41'].includes(prefix)) {
    carrier = 'UTL (Uganda Telecom)';
  } else if (prefix === '72') {
    carrier = 'Lyca / Smile Telecom';
  } else if (['31', '39'].includes(prefix)) {
    carrier = 'Fixed Line / Landline';
  }

  return {
    isValid: true,
    normalized: '+' + cleaned,
    original,
    carrier,
    country: 'Uganda',
  };
}

/**
 * Calculates SMS segments based on GSM-7 or Unicode encoding
 */
export function calculateSmsSegments(text: string): SegmentCalculation {
  const str = text || '';
  const length = str.length;

  if (length === 0) {
    return {
      characterCount: 0,
      encoding: 'GSM-7',
      segmentCount: 1,
      maxCharsPerSegment: 160,
      charsLeftInCurrentSegment: 160,
      creditsRequired: 1,
    };
  }

  const isGsm7 = GSM_7_REGEX.test(str);
  const encoding: 'GSM-7' | 'Unicode' = isGsm7 ? 'GSM-7' : 'Unicode';

  if (encoding === 'GSM-7') {
    if (length <= 160) {
      return {
        characterCount: length,
        encoding,
        segmentCount: 1,
        maxCharsPerSegment: 160,
        charsLeftInCurrentSegment: 160 - length,
        creditsRequired: 1,
      };
    } else {
      const segmentCount = Math.ceil(length / 153);
      const charsLeft = segmentCount * 153 - length;
      return {
        characterCount: length,
        encoding,
        segmentCount,
        maxCharsPerSegment: 153,
        charsLeftInCurrentSegment: charsLeft,
        creditsRequired: segmentCount,
      };
    }
  } else {
    // Unicode (UCS-2)
    if (length <= 70) {
      return {
        characterCount: length,
        encoding,
        segmentCount: 1,
        maxCharsPerSegment: 70,
        charsLeftInCurrentSegment: 70 - length,
        creditsRequired: 1,
      };
    } else {
      const segmentCount = Math.ceil(length / 67);
      const charsLeft = segmentCount * 67 - length;
      return {
        characterCount: length,
        encoding,
        segmentCount,
        maxCharsPerSegment: 67,
        charsLeftInCurrentSegment: charsLeft,
        creditsRequired: segmentCount,
      };
    }
  }
}
