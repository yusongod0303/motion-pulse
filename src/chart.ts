import type { BuiltInTrack, MotionInput, RhythmChart } from './types';

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

function makeChart(title: string, artist: string, bpm: number, length: number, interval: number, shift = 0): RhythmChart {
  return {
    title,
    artist,
    bpm,
    offset: 0,
    notes: Array.from({ length }, (_, index) => ({
      id: `${title.toLowerCase().replaceAll(' ', '-')}-${index}`,
      time: 2 + index * interval,
      type: pattern[(index + shift + Math.floor(index / 8)) % pattern.length],
    })),
  };
}

export const builtInTracks: BuiltInTrack[] = [
  {
    id: 'pulse-training',
    title: 'Pulse Training',
    artist: 'Motion Pulse',
    bpm: 124,
    difficulty: 3,
    duration: 42,
    chart: makeChart('Pulse Training', 'Motion Pulse', 124, 84, 0.48, 0),
  },
  {
    id: 'seoul-neon',
    title: 'Seoul Neon',
    artist: 'Local Synth',
    bpm: 138,
    difficulty: 5,
    duration: 38,
    chart: makeChart('Seoul Neon', 'Local Synth', 138, 96, 0.38, 2),
  },
  {
    id: 'Arcade Sprint',
    title: 'Arcade Sprint',
    artist: 'Motion Pulse',
    bpm: 152,
    difficulty: 7,
    duration: 34,
    chart: makeChart('Arcade Sprint', 'Motion Pulse', 152, 110, 0.3, 4),
  },
];

export const demoChart: RhythmChart = builtInTracks[0].chart;

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
