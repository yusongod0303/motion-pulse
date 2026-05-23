import type { MotionInput, RhythmChart } from './types';

const pattern: MotionInput[] = [
  'left-up',
  'right-up',
  'left-down',
  'right-down',
  'left-up',
  'right-down',
  'right-up',
  'left-down',
];

export const demoChart: RhythmChart = {
  title: 'Pulse Training',
  artist: 'Motion Pulse',
  bpm: 124,
  offset: 0,
  notes: Array.from({ length: 84 }, (_, index) => ({
    id: `demo-${index}`,
    time: 2 + index * 0.48 + (index > 32 ? Math.floor((index - 32) / 8) * 0.08 : 0),
    type: pattern[index % pattern.length],
  })),
};

export function normalizeChart(raw: unknown): RhythmChart {
  if (!raw || typeof raw !== 'object') {
    throw new Error('차트 파일 형식이 올바르지 않습니다.');
  }

  const chart = raw as Partial<RhythmChart>;
  if (!Array.isArray(chart.notes)) {
    throw new Error('차트에 notes 배열이 필요합니다.');
  }

  return {
    title: String(chart.title || 'Local Song'),
    artist: String(chart.artist || 'Unknown'),
    bpm: Number(chart.bpm || 120),
    offset: typeof chart.offset === 'number' ? chart.offset : Number((chart as { offsetMs?: number }).offsetMs || 0) / 1000,
    notes: chart.notes.map((note, index) => {
      const item = note as {
        id?: string;
        time?: number;
        timeMs?: number;
        type?: MotionInput;
        action?: MotionInput;
        duration?: number;
      };
      const noteTime = typeof item.time === 'number' ? item.time : Number(item.timeMs) / 1000;
      const noteType = item.type || item.action;
      if (
        !Number.isFinite(noteTime) ||
        !['left-up', 'left-down', 'right-up', 'right-down'].includes(String(noteType))
      ) {
        throw new Error(`${index + 1}번째 노트 형식이 올바르지 않습니다.`);
      }

      return {
        id: item.id || `note-${index}`,
        time: noteTime,
        type: noteType as MotionInput,
        duration: item.duration,
      };
    }),
  };
}
