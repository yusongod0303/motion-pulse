import type { Calibration, ChartNote, Judgment, MotionInput, PoseFrame, ScoreState, Zone } from './types';

export const inputLabels: Record<MotionInput, string> = {
  'left-up': '왼손 위',
  'left-down': '왼손 아래',
  'right-up': '오른손 위',
  'right-down': '오른손 아래',
};

export const inputColors: Record<MotionInput, string> = {
  'left-up': '#25e4ff',
  'left-down': '#6f7dff',
  'right-up': '#ff3df2',
  'right-down': '#ffcc38',
};

export const initialScore: ScoreState = {
  score: 0,
  combo: 0,
  maxCombo: 0,
  perfect: 0,
  great: 0,
  good: 0,
  miss: 0,
  judged: 0,
};

export function createDefaultCalibration(width: number, height: number): Calibration {
  const zoneWidth = Math.max(128, width * 0.2);
  const zoneHeight = Math.max(92, height * 0.17);
  const top = height * 0.18;
  const bottom = height * 0.62;
  const left = width * 0.11;
  const right = width - left - zoneWidth;

  const makeZone = (input: MotionInput, x: number, y: number): Zone => ({
    input,
    label: inputLabels[input],
    x,
    y,
    width: zoneWidth,
    height: zoneHeight,
  });

  return {
    ready: true,
    zones: {
      'left-up': makeZone('left-up', left, top),
      'left-down': makeZone('left-down', left, bottom),
      'right-up': makeZone('right-up', right, top),
      'right-down': makeZone('right-down', right, bottom),
    },
  };
}

export function isPointInsideZone(point: { x: number; y: number } | undefined, zone: Zone): boolean {
  if (!point) return false;
  return point.x >= zone.x && point.x <= zone.x + zone.width && point.y >= zone.y && point.y <= zone.y + zone.height;
}

export function activeInputsFromPose(pose: PoseFrame, calibration: Calibration): Set<MotionInput> {
  const active = new Set<MotionInput>();
  const left = pose.leftWrist;
  const right = pose.rightWrist;

  if (isPointInsideZone(left, calibration.zones['left-up'])) active.add('left-up');
  if (isPointInsideZone(left, calibration.zones['left-down'])) active.add('left-down');
  if (isPointInsideZone(right, calibration.zones['right-up'])) active.add('right-up');
  if (isPointInsideZone(right, calibration.zones['right-down'])) active.add('right-down');

  return active;
}

export function judgeNote(note: ChartNote, songTime: number, activeInputs: Set<MotionInput>): Judgment | null {
  const delta = Math.abs(songTime - note.time);
  if (!activeInputs.has(note.type)) {
    return delta > 0.22 ? 'Miss' : null;
  }
  if (delta <= 0.075) return 'Perfect';
  if (delta <= 0.14) return 'Great';
  if (delta <= 0.22) return 'Good';
  return delta > 0.22 ? 'Miss' : null;
}

export function judgeInput(note: ChartNote, inputTime: number, input: MotionInput): Judgment | null {
  if (note.type !== input) return null;
  const delta = Math.abs(inputTime - note.time);
  if (delta <= 0.08) return 'Perfect';
  if (delta <= 0.15) return 'Great';
  if (delta <= 0.24) return 'Good';
  return null;
}

export function applyJudgment(score: ScoreState, judgment: Judgment): ScoreState {
  const hit = judgment !== 'Miss';
  const combo = hit ? score.combo + 1 : 0;
  const gain = judgment === 'Perfect' ? 1000 : judgment === 'Great' ? 700 : judgment === 'Good' ? 350 : 0;
  const comboBonus = hit ? Math.min(combo * 8, 800) : 0;

  return {
    score: score.score + gain + comboBonus,
    combo,
    maxCombo: Math.max(score.maxCombo, combo),
    perfect: score.perfect + (judgment === 'Perfect' ? 1 : 0),
    great: score.great + (judgment === 'Great' ? 1 : 0),
    good: score.good + (judgment === 'Good' ? 1 : 0),
    miss: score.miss + (judgment === 'Miss' ? 1 : 0),
    judged: score.judged + 1,
  };
}

export function accuracy(score: ScoreState): number {
  if (score.judged === 0) return 100;
  const points = score.perfect * 1 + score.great * 0.72 + score.good * 0.38;
  return Math.round((points / score.judged) * 1000) / 10;
}

export function grade(score: ScoreState): string {
  const value = accuracy(score);
  if (value >= 96) return 'S';
  if (value >= 88) return 'A';
  if (value >= 76) return 'B';
  if (value >= 62) return 'C';
  return 'D';
}
