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
    bpm: 96,
    difficulty: 1,
    duration: 52,
    chart: makeChart('Pulse Training', 'Motion Pulse', 96, 58, 0.72, 0),
  },
  {
    id: 'seoul-neon',
    title: 'Seoul Neon',
    artist: 'Local Synth',
    bpm: 118,
    difficulty: 3,
    duration: 50,
    chart: makeChart('Seoul Neon', 'Local Synth', 118, 72, 0.56, 2),
  },
  {
    id: 'arcade-sprint',
    title: 'Arcade Sprint',
    artist: 'Motion Pulse',
    bpm: 136,
    difficulty: 5,
    duration: 46,
    chart: makeChart('Arcade Sprint', 'Motion Pulse', 136, 86, 0.44, 4),
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
