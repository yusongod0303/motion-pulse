import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { builtInTracks, demoChart, normalizeChart } from './chart';
import {
  accuracy,
  activeInputsFromPose,
  applyJudgment,
  createDefaultCalibration,
  grade,
  initialScore,
  inputColors,
  inputLabels,
  judgeInput,
  judgeNote,
} from './gameLogic';
import type { Calibration, GamePhase, Judgment, MotionInput, PoseFrame, RhythmChart, ScoreState } from './types';

type Toast = {
  id: number;
  judgment: Judgment;
  input: MotionInput;
};

const keys: Record<string, MotionInput> = {
  q: 'left-up',
  a: 'left-down',
  o: 'right-up',
  l: 'right-down',
};

const inputOrder: MotionInput[] = ['left-up', 'left-down', 'right-up', 'right-down'];

export default function App() {
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [audioName, setAudioName] = useState('');
  const [chart, setChart] = useState<RhythmChart>(demoChart);
  const [chartName, setChartName] = useState('Pulse Training');
  const [selectedTrackId, setSelectedTrackId] = useState(builtInTracks[0].id);
  const [score, setScore] = useState<ScoreState>(initialScore);
  const [pose, setPose] = useState<PoseFrame>({ tracking: false, source: 'none' });
  const [calibration, setCalibration] = useState<Calibration>(() => createDefaultCalibration(960, 620));
  const [pressed, setPressed] = useState<Set<MotionInput>>(new Set());
  const [judgedIds, setJudgedIds] = useState<Set<string>>(new Set());
  const [songTime, setSongTime] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [toast, setToast] = useState<Toast | null>(null);
  const [useDemoBeat, setUseDemoBeat] = useState(true);
  const [keyboardTestMode, setKeyboardTestMode] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const motionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const demoTimerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const startTimeRef = useRef(0);
  const songTimeRef = useRef(0);
  const lastFrameRef = useRef<ImageData | null>(null);
  const previousActiveRef = useRef<Set<MotionInput>>(new Set());
  const toastIdRef = useRef(0);

  const activeInputs = useMemo(() => {
    const active = activeInputsFromPose(pose, calibration);
    pressed.forEach((input) => active.add(input));
    return active;
  }, [calibration, pose, pressed]);

  const selectedTrack = useMemo(
    () => builtInTracks.find((track) => track.id === selectedTrackId) || builtInTracks[0],
    [selectedTrackId],
  );

  const progress = useMemo(() => {
    const lastNote = chart.notes.at(-1);
    const duration = audioRef.current?.duration && Number.isFinite(audioRef.current.duration)
      ? audioRef.current.duration
      : Math.max(selectedTrack.duration, (lastNote?.time || 30) + 3);
    return Math.min(100, Math.max(0, (songTime / duration) * 100));
  }, [chart.notes, selectedTrack.duration, songTime]);

  const attachCameraStream = useCallback(async () => {
    if (!videoRef.current || !streamRef.current) return;
    if (videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
    try {
      await videoRef.current.play();
      setCameraError('');
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : '카메라 스트림을 video에 연결하지 못했습니다.');
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setCameraError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      setCameraReady(true);
      await attachCameraStream();
      setPhase('calibration');
    } catch (error) {
      setCameraReady(false);
      setCameraError(error instanceof Error ? error.message : '카메라 권한을 가져오지 못했습니다.');
    }
  }, [attachCameraStream]);

  useEffect(() => {
    if (cameraReady) {
      void attachCameraStream();
    }
  }, [attachCameraStream, cameraReady, phase]);

  const resizeCalibration = useCallback(() => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (rect) {
      setCalibration(createDefaultCalibration(rect.width, rect.height));
    }
  }, []);

  useEffect(() => {
    resizeCalibration();
    window.addEventListener('resize', resizeCalibration);
    return () => window.removeEventListener('resize', resizeCalibration);
  }, [resizeCalibration]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const input = keys[event.key.toLowerCase()];
      if (!input) return;
      if (!event.repeat) {
        handleInput(input, 'keyboard');
      }
      setPressed((current) => new Set(current).add(input));
    };
    const onKeyUp = (event: KeyboardEvent) => {
      const input = keys[event.key.toLowerCase()];
      if (!input) return;
      setPressed((current) => {
        const next = new Set(current);
        next.delete(input);
        return next;
      });
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [phase, judgedIds, chart, score]);

  useEffect(() => {
    let frameId = 0;

    const detectMotion = () => {
      const video = videoRef.current;
      const canvas = motionCanvasRef.current;
      const stage = stageRef.current;
      const context = canvas?.getContext('2d', { willReadFrequently: true });

      if (!video || !canvas || !context || !stage || video.readyState < 2) {
        frameId = requestAnimationFrame(detectMotion);
        return;
      }

      const sampleWidth = 160;
      const sampleHeight = 90;
      canvas.width = sampleWidth;
      canvas.height = sampleHeight;
      context.save();
      context.scale(-1, 1);
      context.drawImage(video, -sampleWidth, 0, sampleWidth, sampleHeight);
      context.restore();

      const current = context.getImageData(0, 0, sampleWidth, sampleHeight);
      const previous = lastFrameRef.current;
      lastFrameRef.current = current;

      if (!previous) {
        frameId = requestAnimationFrame(detectMotion);
        return;
      }

      const zones = calibration.zones;
      const stageRect = stage.getBoundingClientRect();
      const strengths: Partial<Record<MotionInput, { value: number; x: number; y: number }>> = {};

      inputOrder.forEach((input) => {
        const zone = zones[input];
        const x0 = Math.max(0, Math.floor((zone.x / stageRect.width) * sampleWidth));
        const x1 = Math.min(sampleWidth, Math.ceil(((zone.x + zone.width) / stageRect.width) * sampleWidth));
        const y0 = Math.max(0, Math.floor((zone.y / stageRect.height) * sampleHeight));
        const y1 = Math.min(sampleHeight, Math.ceil(((zone.y + zone.height) / stageRect.height) * sampleHeight));
        let changed = 0;
        let count = 0;

        for (let y = y0; y < y1; y += 2) {
          for (let x = x0; x < x1; x += 2) {
            const index = (y * sampleWidth + x) * 4;
            const diff =
              Math.abs(current.data[index] - previous.data[index]) +
              Math.abs(current.data[index + 1] - previous.data[index + 1]) +
              Math.abs(current.data[index + 2] - previous.data[index + 2]);
            if (diff > 54) changed += 1;
            count += 1;
          }
        }

        strengths[input] = {
          value: count ? changed / count : 0,
          x: zone.x + zone.width / 2,
          y: zone.y + zone.height / 2,
        };
      });

      const threshold = phase === 'playing' ? 0.055 : 0.035;
      const leftUp = strengths['left-up'];
      const leftDown = strengths['left-down'];
      const rightUp = strengths['right-up'];
      const rightDown = strengths['right-down'];
      const left = [leftUp, leftDown].filter(Boolean).sort((a, b) => b!.value - a!.value)[0];
      const right = [rightUp, rightDown].filter(Boolean).sort((a, b) => b!.value - a!.value)[0];

      setPose({
        tracking: Boolean((left && left.value > threshold) || (right && right.value > threshold)),
        source: 'camera-motion',
        leftWrist: left && left.value > threshold ? { x: left.x, y: left.y, confidence: Math.min(1, left.value * 8) } : undefined,
        rightWrist: right && right.value > threshold ? { x: right.x, y: right.y, confidence: Math.min(1, right.value * 8) } : undefined,
      });

      frameId = requestAnimationFrame(detectMotion);
    };

    frameId = requestAnimationFrame(detectMotion);
    return () => cancelAnimationFrame(frameId);
  }, [calibration.zones, phase]);

  function handleAudioFile(file?: File) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.load();
    }
    setAudioName(file.name);
    setUseDemoBeat(false);
    setSelectedTrackId('custom');
  }

  async function handleChartFile(file?: File) {
    if (!file) return;
    const text = await file.text();
    setChart(normalizeChart(JSON.parse(text)));
    setChartName(file.name);
    setSelectedTrackId('custom');
  }

  function selectTrack(trackId: string) {
    const track = builtInTracks.find((item) => item.id === trackId);
    if (!track) return;
    resetRun();
    setSelectedTrackId(track.id);
    setChart(track.chart);
    setChartName(track.title);
    setAudioName('');
    setUseDemoBeat(true);
  }

  function resetRun() {
    setScore(initialScore);
    setJudgedIds(new Set());
    setSongTime(0);
    songTimeRef.current = 0;
    setToast(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (demoTimerRef.current) window.clearInterval(demoTimerRef.current);
    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }

  function prepareAudioContext() {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new AudioContext();
    }
    if (audioContextRef.current.state === 'suspended') {
      void audioContextRef.current.resume();
    }
  }

  function startCountdown() {
    resetRun();
    if (useDemoBeat) {
      prepareAudioContext();
    }
    setCountdown(3);
    setPhase('countdown');
    let value = 3;
    const interval = window.setInterval(() => {
      value -= 1;
      setCountdown(value);
      if (value <= 0) {
        window.clearInterval(interval);
        startGame();
      }
    }, 800);
  }

  function startGame() {
    setPhase('playing');
    if (!useDemoBeat && audioRef.current?.src) {
      void audioRef.current.play();
      return;
    }

    const start = performance.now();
    startTimeRef.current = start;
    scheduleSynthTrack(chart);
    demoTimerRef.current = window.setInterval(() => {
      const currentTime = (performance.now() - start) / 1000;
      songTimeRef.current = currentTime;
      setSongTime(currentTime);
    }, 16);
  }

  function finishGame() {
    if (demoTimerRef.current) window.clearInterval(demoTimerRef.current);
    audioRef.current?.pause();
    setPhase('results');
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const update = () => {
      songTimeRef.current = audio.currentTime;
      setSongTime(audio.currentTime);
    };
    const end = () => finishGame();
    audio.addEventListener('timeupdate', update);
    audio.addEventListener('ended', end);
    return () => {
      audio.removeEventListener('timeupdate', update);
      audio.removeEventListener('ended', end);
    };
  }, []);

  function handleInput(input: MotionInput, source: 'keyboard' | 'camera') {
    if (phase !== 'playing') return;

    const currentSongTime = !useDemoBeat && audioRef.current?.src ? audioRef.current.currentTime : songTimeRef.current;
    songTimeRef.current = currentSongTime;
    const inputTime = currentSongTime - chart.offset;
    const candidate = chart.notes
      .filter((note) => !judgedIds.has(note.id) && note.type === input)
      .map((note) => ({ note, delta: Math.abs(note.time - inputTime) }))
      .filter((item) => item.delta <= 0.24)
      .sort((a, b) => a.delta - b.delta)[0];

    if (!candidate) {
      setToast({ id: toastIdRef.current++, judgment: 'Miss', input });
      return;
    }

    const judgment = judgeInput(candidate.note, inputTime, input);
    if (!judgment) return;

    setJudgedIds((current) => new Set(current).add(candidate.note.id));
    setScore((current) => applyJudgment(current, judgment));
    setToast({ id: toastIdRef.current++, judgment, input });
    if (source === 'camera') {
      setPose((current) => ({ ...current, tracking: true }));
    }
  }

  function scheduleSynthTrack(currentChart: RhythmChart) {
    const context = audioContextRef.current && audioContextRef.current.state !== 'closed' ? audioContextRef.current : new AudioContext();
    audioContextRef.current = context;
    const master = context.createGain();
    master.gain.value = 0.12;
    master.connect(context.destination);

    const startAt = context.currentTime + 0.08;
    const frequencies: Record<MotionInput, number> = {
      'left-up': 523.25,
      'left-down': 392.0,
      'right-up': 659.25,
      'right-down': 493.88,
    };

    currentChart.notes.forEach((note, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = index % 4 === 0 ? 'sawtooth' : 'triangle';
      oscillator.frequency.value = frequencies[note.type];
      gain.gain.setValueAtTime(0.0001, startAt + note.time);
      gain.gain.exponentialRampToValueAtTime(0.55, startAt + note.time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + note.time + 0.11);
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(startAt + note.time);
      oscillator.stop(startAt + note.time + 0.12);
    });
  }

  useEffect(() => {
    if (phase !== 'playing') return;
    const nextJudged = new Set(judgedIds);
    let nextScore = score;
    let hitToast: Toast | null = null;

    chart.notes.forEach((note) => {
      if (nextJudged.has(note.id)) return;
      if (songTime - chart.offset <= note.time + 0.24) return;
      const judgment = judgeNote(note, songTime - chart.offset, new Set()) || 'Miss';
      nextJudged.add(note.id);
      nextScore = applyJudgment(nextScore, judgment);
      hitToast = { id: toastIdRef.current++, judgment, input: note.type };
    });

    if (nextJudged.size !== judgedIds.size) {
      setJudgedIds(nextJudged);
      setScore(nextScore);
      setToast(hitToast);
    }

    const lastNote = chart.notes.at(-1);
    if (lastNote && songTime > lastNote.time + 2.4) {
      finishGame();
    }
  }, [chart, judgedIds, phase, score, songTime]);

  useEffect(() => {
    if (phase !== 'playing') {
      previousActiveRef.current = new Set(activeInputs);
      return;
    }

    activeInputs.forEach((input) => {
      if (!previousActiveRef.current.has(input) && !pressed.has(input)) {
        handleInput(input, 'camera');
      }
    });
    previousActiveRef.current = new Set(activeInputs);
  }, [activeInputs, phase, pressed]);

  const visibleNotes = chart.notes.filter((note) => note.time > songTime - 0.5 && note.time < songTime + 2.7);
  const canStart = (cameraReady || keyboardTestMode) && (useDemoBeat || audioName);
  const cameraStatus = cameraReady
    ? streamRef.current?.active
      ? '스트림 연결됨'
      : '권한은 있으나 스트림 없음'
    : cameraError
      ? '카메라 오류'
      : '대기 중';

  return (
    <main className="motion-pulse-shell">
      <audio ref={audioRef} preload="metadata" />
      <canvas ref={motionCanvasRef} className="hidden-canvas" />

      <section className="hero-bar">
        <div>
          <p className="eyebrow">Motion Pulse</p>
          <h1>웹캠 팔 동작 리듬게임</h1>
        </div>
        <div className="status-row">
          <span className={cameraReady ? 'chip ok' : 'chip'}>{cameraReady ? 'Camera Ready' : 'Camera Needed'}</span>
          <span className="chip">{useDemoBeat ? 'Demo Beat' : audioName || 'No Audio'}</span>
          <span className="chip">{chartName}</span>
        </div>
      </section>

      {phase === 'setup' && (
        <section className="setup-grid">
          <CameraPanel
            videoRef={videoRef}
            stageRef={stageRef}
            pose={pose}
            calibration={calibration}
            activeInputs={activeInputs}
            visibleNotes={[]}
            songTime={songTime}
          />

          <aside className="mp-panel setup-panel">
            <h2>곡 선택</h2>
            <div className="song-list">
              {builtInTracks.map((track) => (
                <button
                  key={track.id}
                  className={`song-card ${selectedTrackId === track.id ? 'selected' : ''}`}
                  onClick={() => selectTrack(track.id)}
                >
                  <span>
                    <strong>{track.title}</strong>
                    <small>{track.artist}</small>
                  </span>
                  <em>Lv.{track.difficulty}</em>
                </button>
              ))}
            </div>
            <div className="control-stack">
              <button className="primary-button" onClick={startCamera}>
                카메라 시작
              </button>
              {cameraError && <p className="error-text">{cameraError}</p>}
              <div className="camera-diagnostics">
                <span>카메라</span>
                <strong>{cameraStatus}</strong>
                <small>권한 허용 후 화면이 비면 브라우저 주소창의 카메라 권한과 macOS 개인정보 보호 설정을 확인하세요.</small>
              </div>
              <label className="file-button">
                로컬 mp3 선택
                <input type="file" accept="audio/*" onChange={(event) => handleAudioFile(event.target.files?.[0])} />
              </label>
              <label className="file-button">
                차트 JSON 선택
                <input type="file" accept="application/json,.json" onChange={(event) => void handleChartFile(event.target.files?.[0])} />
              </label>
              <label className="toggle-line">
                <input type="checkbox" checked={useDemoBeat} onChange={(event) => setUseDemoBeat(event.target.checked)} />
                내장 데모 비트로 플레이
              </label>
              <label className="toggle-line">
                <input type="checkbox" checked={keyboardTestMode} onChange={(event) => setKeyboardTestMode(event.target.checked)} />
                카메라 없이 키보드 테스트
              </label>
              <button className="primary-button" disabled={!canStart} onClick={() => setPhase('calibration')}>
                캘리브레이션으로 이동
              </button>
            </div>
            <div className="keymap">
              {inputOrder.map((input) => (
                <span key={input} style={{ borderColor: inputColors[input] }}>
                  {inputLabels[input]}
                </span>
              ))}
            </div>
          </aside>
        </section>
      )}

      {phase === 'calibration' && (
        <section className="play-layout">
          <CameraPanel
            videoRef={videoRef}
            stageRef={stageRef}
            pose={pose}
            calibration={calibration}
            activeInputs={activeInputs}
            visibleNotes={[]}
            songTime={songTime}
          />
          <aside className="mp-panel side-hud">
            <h2>캘리브레이션</h2>
            <p>각 존에 팔을 한 번씩 크게 움직여 반응을 확인하세요.</p>
            <InputGrid activeInputs={activeInputs} />
            <button className="primary-button" disabled={!canStart} onClick={startCountdown}>
              Start Pulse
            </button>
            <button className="ghost-button" onClick={() => setPhase('setup')}>
              설정으로 돌아가기
            </button>
          </aside>
        </section>
      )}

      {(phase === 'countdown' || phase === 'playing' || phase === 'paused') && (
        <section className="play-layout">
          <div className="game-wrap">
            <div className="hud top-hud">
              <Stat label="Score" value={score.score.toLocaleString()} />
              <div className="progress"><span style={{ width: `${progress}%` }} /></div>
              <Stat label="Accuracy" value={`${accuracy(score).toFixed(1)}%`} />
            </div>
            <CameraPanel
              videoRef={videoRef}
              stageRef={stageRef}
              pose={pose}
              calibration={calibration}
              activeInputs={activeInputs}
              visibleNotes={visibleNotes}
              songTime={songTime}
            />
            <div className="hud bottom-hud">
              <Stat label="Combo" value={`${score.combo}`} />
              <InputGrid activeInputs={activeInputs} />
              <Stat label="Tracking" value={pose.tracking || pressed.size ? 'OK' : 'LOW'} />
            </div>
            {phase === 'countdown' && <div className="countdown">{countdown || 'GO'}</div>}
            {toast && <div className={`judgment-toast ${toast.judgment.toLowerCase()}`}>{toast.judgment}</div>}
          </div>
          <aside className="mp-panel side-hud">
            <h2>{chart.title}</h2>
            <p>{chart.artist}</p>
            <button className="ghost-button" onClick={() => setPhase(phase === 'paused' ? 'playing' : 'paused')}>
              {phase === 'paused' ? '계속하기' : '일시정지'}
            </button>
            <button className="ghost-button" onClick={startCountdown}>다시 시작</button>
            <button className="ghost-button" onClick={() => { resetRun(); setPhase('setup'); }}>곡 변경</button>
          </aside>
        </section>
      )}

      {phase === 'results' && (
        <section className="results mp-panel">
          <p className="eyebrow">Result</p>
          <div className={`grade grade-${grade(score).toLowerCase()}`}>{grade(score)}</div>
          <h2>{chart.title}</h2>
          <div className="result-grid">
            <Stat label="Score" value={score.score.toLocaleString()} />
            <Stat label="Max Combo" value={`${score.maxCombo}`} />
            <Stat label="Accuracy" value={`${accuracy(score).toFixed(1)}%`} />
          </div>
          <div className="breakdown">
            <span>Perfect {score.perfect}</span>
            <span>Great {score.great}</span>
            <span>Good {score.good}</span>
            <span>Miss {score.miss}</span>
          </div>
          <div className="result-actions">
            <button className="primary-button" onClick={startCountdown}>Replay</button>
            <button className="ghost-button" onClick={() => setPhase('calibration')}>Recalibrate</button>
            <button className="ghost-button" onClick={() => setPhase('setup')}>Change Song</button>
          </div>
        </section>
      )}
    </main>
  );
}

function CameraPanel({
  videoRef,
  stageRef,
  pose,
  calibration,
  activeInputs,
  visibleNotes,
  songTime,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stageRef: React.RefObject<HTMLDivElement | null>;
  pose: PoseFrame;
  calibration: Calibration;
  activeInputs: Set<MotionInput>;
  visibleNotes: RhythmChart['notes'];
  songTime: number;
}) {
  return (
    <div className="stage mp-panel" ref={stageRef}>
      <video ref={videoRef} className="camera-video" muted playsInline />
      <div className="scanlines" />
      <div className="hit-line" />
      {inputOrder.map((input) => {
        const zone = calibration.zones[input];
        return (
          <div
            key={input}
            className={`motion-zone ${activeInputs.has(input) ? 'active' : ''}`}
            style={{
              left: zone.x,
              top: zone.y,
              width: zone.width,
              height: zone.height,
              borderColor: inputColors[input],
              color: inputColors[input],
            }}
          >
            {zone.label}
          </div>
        );
      })}
      {visibleNotes.map((note) => {
        const laneIndex = inputOrder.indexOf(note.type);
        const secondsUntilHit = note.time - songTime;
        const y = 72 + (2.7 - secondsUntilHit) * 160;
        return (
          <div
            className="falling-note"
            key={note.id}
            style={{
              left: `calc(${15 + laneIndex * 23}% - 34px)`,
              top: y,
              borderColor: inputColors[note.type],
              boxShadow: `0 0 22px ${inputColors[note.type]}`,
            }}
          >
            {inputLabels[note.type]}
          </div>
        );
      })}
      {pose.leftWrist && <span className="wrist left" style={{ left: pose.leftWrist.x, top: pose.leftWrist.y }} />}
      {pose.rightWrist && <span className="wrist right" style={{ left: pose.rightWrist.x, top: pose.rightWrist.y }} />}
    </div>
  );
}

function InputGrid({ activeInputs }: { activeInputs: Set<MotionInput> }) {
  return (
    <div className="input-grid">
      {inputOrder.map((input) => (
        <span key={input} className={activeInputs.has(input) ? 'on' : ''} style={{ '--zone-color': inputColors[input] } as React.CSSProperties}>
          {inputLabels[input]}
        </span>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
