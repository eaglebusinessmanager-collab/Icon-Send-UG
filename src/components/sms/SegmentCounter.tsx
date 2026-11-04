import React, { useMemo } from 'react';

// Standard GSM 7-bit alphabet check
const GSM_7_REGEX = /^[A-Za-z0-9 @£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\^{}\\[~\]|€ÆæßÉ!"#$%&'()*+,\-./:;<=>?]*$/;

interface SegmentCounterProps {
  message: string;
  recipientCount?: number;
}

export const SegmentCounter: React.FC<SegmentCounterProps> = ({ message, recipientCount = 1 }) => {
  const calculation = useMemo(() => {
    const text = message || '';
    const length = text.length;
    const isGsm7 = GSM_7_REGEX.test(text);
    const encoding: 'GSM-7' | 'Unicode' = isGsm7 ? 'GSM-7' : 'Unicode';

    if (length === 0) {
      return {
        characterCount: 0,
        encoding: 'GSM-7',
        segmentCount: 1,
        maxPerPart: 160,
        charsRemaining: 160,
        creditsPerRecipient: 1,
        totalCredits: recipientCount * 1,
      };
    }

    if (isGsm7) {
      if (length <= 160) {
        return {
          characterCount: length,
          encoding,
          segmentCount: 1,
          maxPerPart: 160,
          charsRemaining: 160 - length,
          creditsPerRecipient: 1,
          totalCredits: recipientCount * 1,
        };
      } else {
        const parts = Math.ceil(length / 153);
        const charsRemaining = parts * 153 - length;
        return {
          characterCount: length,
          encoding,
          segmentCount: parts,
          maxPerPart: 153,
          charsRemaining,
          creditsPerRecipient: parts,
          totalCredits: recipientCount * parts,
        };
      }
    } else {
      // Unicode
      if (length <= 70) {
        return {
          characterCount: length,
          encoding,
          segmentCount: 1,
          maxPerPart: 70,
          charsRemaining: 70 - length,
          creditsPerRecipient: 1,
          totalCredits: recipientCount * 1,
        };
      } else {
        const parts = Math.ceil(length / 67);
        const charsRemaining = parts * 67 - length;
        return {
          characterCount: length,
          encoding,
          segmentCount: parts,
          maxPerPart: 67,
          charsRemaining,
          creditsPerRecipient: parts,
          totalCredits: recipientCount * parts,
        };
      }
    }
  }, [message, recipientCount]);

  return (
    <div className="pt-2 border-t border-neutral-200 text-xs text-neutral-600 flex flex-wrap items-center justify-between gap-2 font-mono">
      <div className="flex items-center space-x-3">
        <span>
          Chars: <strong className="text-neutral-950 font-bold">{calculation.characterCount}</strong>
        </span>
        <span className="text-neutral-300">|</span>
        <span>
          Parts: <strong className="text-neutral-950 font-bold">{calculation.segmentCount}</strong>
          <span className="text-neutral-400 text-[10px] ml-1">
            ({calculation.charsRemaining} left in part)
          </span>
        </span>
        <span className="text-neutral-300">|</span>
        <span
          className={`px-1.5 py-0.5 text-[10px] border ${
            calculation.encoding === 'Unicode'
              ? 'border-neutral-900 bg-neutral-900 text-white font-bold'
              : 'border-neutral-300 text-neutral-800'
          }`}
          title={
            calculation.encoding === 'Unicode'
              ? 'Non-standard characters or emojis detected. Segment limit reduced to 70 chars per part.'
              : 'Standard GSM 7-bit encoding (160 characters per part).'
          }
        >
          {calculation.encoding}
        </span>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-neutral-500">Required Credits:</span>
        <span className="px-2 py-0.5 bg-neutral-100 border border-neutral-300 text-neutral-950 font-bold">
          {calculation.totalCredits} {calculation.totalCredits === 1 ? 'Credit' : 'Credits'}
        </span>
      </div>
    </div>
  );
};
