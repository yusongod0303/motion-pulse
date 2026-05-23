export type MotionInput = 'left-up' | 'left-down' | 'right-up' | 'right-down';

export type Judgment = 'Perfect' | 'Great' | 'Good' | 'Miss';

export type GamePhase = 'setup' | 'calibration' | 'countdown' | 'playing' | 'paused' | 'results';

export type ChartNote = {
  id: string;
  time: number;
  type: MotionInput;
  duration?: number;
};

export type RhythmChart = {
  title: string;
  artist: string;
  bpm: number;
  offset: number;
  notes: ChartNote[];
};

export type ScoreState = {
  score: number;
  combo: number;
  maxCombo: number;
  perfect: number;
  great: number;
  good: number;
  miss: number;
  judged: number;
};

export type Point = {
  x: number;
  y: number;
  confidence: number;
};

export type PoseFrame = {
  leftWrist?: Point;
  rightWrist?: Point;
  leftShoulder?: Point;
  rightShoulder?: Point;
  tracking: boolean;
  source: 'camera-motion' | 'keyboard' | 'none';
};

export type Zone = {
  input: MotionInput;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Calibration = {
  zones: Record<MotionInput, Zone>;
  ready: boolean;
};
