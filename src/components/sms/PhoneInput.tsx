import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Check, AlertCircle } from 'lucide-react';

interface PhoneInputProps {
  value: string;
  onChange: (value: string, normalized: string, isValid: boolean) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  label = 'Recipient Phone Number (Uganda)',
  placeholder = 'e.g. 0772123456 or +256701234567',
  required = true,
}) => {
  const [carrier, setCarrier] = useState<string>('');
  const [normalized, setNormalized] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(false);
  const [isUnsubscribed, setIsUnsubscribed] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!value || value.trim() === '') {
      setCarrier('');
      setNormalized('');
      setIsValid(false);
      setIsUnsubscribed(false);
      setError('');
      onChange('', '', false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.sms.validateNumber(value);
        setIsValid(res.isValid);
        setNormalized(res.normalized);
        setCarrier(res.carrier);
        setIsUnsubscribed(res.isUnsubscribed);
        setError(res.error || '');
        onChange(value, res.normalized, res.isValid && !res.isUnsubscribed);
      } catch {
        setIsValid(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-neutral-800">
          {label} {required && <span className="text-neutral-500">*</span>}
        </label>
        {carrier && isValid && (
          <span className="text-[11px] font-mono font-medium px-2 py-0.5 bg-neutral-100 border border-neutral-300 text-neutral-800">
            {carrier}
          </span>
        )}
      </div>

      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value, normalized, isValid)}
          placeholder={placeholder}
          className={`w-full px-3 py-2 text-sm bg-white border ${
            error
              ? 'border-neutral-900 bg-neutral-50'
              : isValid
              ? 'border-neutral-400'
              : 'border-neutral-300'
          } focus:outline-none focus:border-neutral-950 font-mono`}
        />
        {isValid && !isUnsubscribed && (
          <div className="absolute right-3 top-2.5 text-neutral-900">
            <Check className="w-4 h-4" />
          </div>
        )}
      </div>

      {isValid && !isUnsubscribed && (
        <div className="text-[11px] font-mono text-neutral-500">
          Normalized to gateway standard: <span className="font-semibold text-neutral-900">{normalized}</span>
        </div>
      )}

      {isUnsubscribed && (
        <div className="flex items-center space-x-1.5 text-xs text-neutral-900 font-medium bg-neutral-100 p-2 border border-neutral-300">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>This number has opted out (unsubscribed) and cannot receive marketing messages.</span>
        </div>
      )}

      {error && !isValid && value.length > 5 && (
        <div className="text-[11px] text-neutral-600">
          {error}
        </div>
      )}
    </div>
  );
};
