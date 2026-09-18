import type { PracticeSheetConfig } from './PracticeSheetComposer';

// Web authoring format v1. Do not reinterpret legacy Godot exercise configs.
export function parsePracticeSheet(raw?: string): PracticeSheetConfig | null {
  try {
    const value = JSON.parse(raw ?? 'null');
    if (!value || value.version !== 1 || !Array.isArray(value.staffLines)) return null;
    if (value.timeSignature && (!Number.isInteger(value.timeSignature.numerator) || value.timeSignature.numerator < 1 || ![2, 4, 8, 16].includes(value.timeSignature.denominator))) return null;
    for (const line of value.staffLines) {
      if (!Number.isInteger(line.order) || !Array.isArray(line.events) || line.events.length > 10) return null;
      for (const event of line.events) {
        if (!Array.isArray(event.notes) || !event.notes.length || !event.notes.every((n: unknown) => typeof n === 'string' && n.trim())) return null;
        if (!['whole', 'half', 'quarter', 'eighth', 'sixteenth'].includes(event.duration)) return null;
        if (!Array.isArray(event.fingering) || !event.fingering.every((n: unknown) => typeof n === 'string')) return null;
        if (!['none', 'rung', 'nhan', 've', 'a'].includes(event.technique)) return null;
      }
    }
    return value;
  } catch { return null; }
}

export const hasPracticeNotes = (sheet: PracticeSheetConfig) => sheet.staffLines.some(line => line.events.length > 0);
