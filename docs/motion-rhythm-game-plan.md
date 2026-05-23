# 모션 리듬 게임 개발 계획

## 목표

MacBook 브라우저에서 로컬로 실행되는 완성도 높은 웹캠 기반 모션 리듬 게임을 만든다.

이 게임은 키보드 리듬게임 데모가 아니라, 실제로 몸을 움직이며 플레이하는 리듬게임을 목표로 한다.

- 플레이어는 키보드 대신 팔 동작을 사용한다.
- 로컬 음악 파일의 리듬에 맞춰 노트가 내려온다.
- 히트, 미스, 콤보, 점수에 대한 즉각적인 시각 피드백을 제공한다.
- 시작, 캘리브레이션, 곡 플레이, 결과 확인, 다시 플레이까지 전체 루프가 로컬에서 동작한다.

공개 배포는 목표가 아니다. 저작권이 있는 음악은 사용자가 로컬 환경에서 개인적으로 사용하는 전제로 다룬다.

## 게임 컨셉

작업명: **Motion Pulse**

핵심 상호작용:

- 웹캠이 플레이어의 포즈를 추적한다.
- 게임은 왼쪽 손목과 오른쪽 손목 위치를 읽는다.
- 화면에는 4개의 타겟 존이 표시된다.
  - 왼손 위
  - 왼손 아래
  - 오른손 위
  - 오른손 아래
- 리듬 노트가 판정선으로 내려온다.
- 노트가 판정 구간에 도착했을 때, 해당 손이 알맞은 존 안에 있으면 성공으로 판정한다.

확장 가능한 입력:

- 양손 위
- 양손 아래
- 팔 교차 동작
- 홀드 노트
- 좌우 번갈아 치는 콤보 패턴

## 목표 플레이 경험

첫 번째 완성 버전에서 우선해야 할 경험:

- 안정적인 웹캠 시작과 권한 처리
- 플레이어의 카메라 위치에 맞는 명확한 캘리브레이션
- 손 위치에 대한 실시간 피드백
- 노트를 맞췄을 때 만족스러운 시각 효과
- 리듬과 판정의 납득 가능한 싱크
- 읽기 쉬운 결과 화면
- 로컬 음악 파일 로딩

단순한 차트만 있어도 재미가 느껴져야 한다. 따라서 기술 데모처럼 보이지 않도록 시각 효과와 모션 피드백을 중요하게 본다.

## 제안 기술 스택

### 앱 프레임워크

추천:

- Vite
- React
- TypeScript

선정 이유:

- 로컬 개발 속도가 빠르다.
- 설정 화면, 게임 화면, 결과 화면, 상태 관리 구조를 만들기 좋다.
- TypeScript를 쓰면 차트 데이터와 포즈 데이터를 안정적으로 다룰 수 있다.

대안:

- Vanilla TypeScript + Canvas

트레이드오프:

- 런타임 구조는 더 단순하다.
- 대신 UI와 상태 관리를 직접 더 많이 처리해야 한다.

### 렌더링

추천:

- 게임 필드는 HTML Canvas 사용
- 메뉴, 설정, 결과 화면은 일반 DOM/React 컴포넌트 사용

선정 이유:

- Canvas는 노트 낙하, 잔상, 히트 이펙트, 프레임 단위 애니메이션에 적합하다.
- DOM은 버튼, 파일 업로드, 설정, 결과 UI에 적합하다.

### 웹캠 입력

추천:

- 브라우저 `getUserMedia()`

선정 이유:

- 표준 브라우저 카메라 API다.
- `localhost`에서 동작한다.
- MacBook 웹캠을 브라우저에서 사용하기 위해 필요하다.

### 포즈 인식

추천:

- MediaPipe Pose Landmarker for Web

선정 이유:

- 손목, 팔꿈치, 어깨 등 몸의 주요 랜드마크를 추적할 수 있다.
- 손만 보는 방식보다 팔 동작 게임에 적합하다.
- 브라우저 안에서 실행할 수 있다.

대안:

- TensorFlow.js MoveNet

트레이드오프:

- MoveNet도 포즈 추적 성능이 좋다.
- 다만 패키지 크기, 런타임 구성, 튜닝 부담을 비교해야 한다.

### 오디오

첫 버전 추천:

- `HTMLAudioElement`
- 오디오 엘리먼트의 현재 재생 시간을 게임 시계의 기준으로 사용

선정 이유:

- 구현이 빠르다.
- 타이밍을 신중하게 처리하면 로컬 리듬게임 첫 버전에는 충분하다.

추후 업그레이드 후보:

- Web Audio API

도입 시점:

- 더 정밀한 오디오 스케줄링이 필요할 때
- 파형 표시를 추가할 때
- 비트 분석이나 오디오 이펙트를 추가할 때

### 차트 포맷

추천:

- JSON 차트 파일

예시:

```json
{
  "schemaVersion": 1,
  "title": "Example Song",
  "artist": "Local",
  "audioFileName": "example.mp3",
  "offsetMs": 0,
  "notes": [
    { "timeMs": 1250, "action": "left-up" },
    { "timeMs": 1750, "action": "right-up" },
    { "timeMs": 2250, "action": "left-down" },
    { "timeMs": 2750, "action": "right-down" }
  ]
}
```

선정 이유:

- 손으로 편집하기 쉽다.
- 나중에 자동 생성하기도 쉽다.
- 음악 파일과 게임 차트를 분리해서 관리할 수 있다.

## 활용 스킬과 도구

### Game Studio

현재 상태:

- `Game Studio` 플러그인은 설치 및 인식된 상태다.
- 게임 구조와 입력 경계를 잡을 때 `web-game-foundations` 관점을 적용한다.

활용 목적:

- 게임 컨셉 정리
- 핵심 플레이 루프 검토
- 재미 요소 평가
- 기능 우선순위 결정

대응 방식:

- 시뮬레이션, 렌더링, 입력 매핑, 자산 로딩, 디버그 경계를 분리한다.
- 게임 디자인과 구현 결정 사항은 이 문서에 계속 기록한다.

### Browser 플러그인

사용 목적:

- 로컬 게임을 Codex 내장 브라우저에서 열기
- 웹캠 권한 흐름 확인
- 데스크톱 및 모바일 크기에서 레이아웃 확인
- 시각 QA용 스크린샷 확인
- Canvas 렌더링이 비어 있지 않고 반응하는지 검증

### 셸과 로컬 개발 도구

사용 목적:

- 프로젝트 생성
- 의존성 설치
- 개발 서버 실행
- 테스트 또는 타입 체크 실행

예상 명령:

```bash
npm create vite@latest
npm install
npm run dev
npm run build
```

### 코드 편집

사용 도구:

- 수동 파일 수정은 `apply_patch` 사용

선정 이유:

- 변경 사항이 명확하고 검토하기 쉽다.

## 구현 계획

### 1단계: 프로젝트 기반 구축

- Vite React TypeScript 앱을 생성한다.
- 기본 레이아웃을 만든다.
- 설정 화면, 게임 화면, 결과 화면 상태를 만든다.
- Canvas 렌더러를 추가한다.

### 2단계: 웹캠과 포즈 인식

- 웹캠 권한을 요청한다.
- 카메라 미리보기를 표시한다.
- MediaPipe Pose Landmarker를 로드한다.
- 손목과 어깨 좌표를 추적한다.
- 게임 화면 위에 손목 위치 표시를 그린다.
- 추적 신뢰도 상태를 화면에 표시한다.

### 3단계: 캘리브레이션

- 플레이어가 카메라 프레임 안에 들어오도록 안내한다.
- 어깨와 손목 기준 위치를 감지한다.
- 플레이어 몸과 카메라 프레임 기준으로 4개 모션 존을 정의한다.
- 캘리브레이션 확인 화면을 제공한다.

### 4단계: 리듬 엔진

- 로컬 오디오 파일을 로드한다.
- 기본 차트를 로드하거나 생성한다.
- 오디오와 게임 타이머를 함께 시작한다.
- 차트 시간에 맞춰 노트를 생성한다.
- 노트를 판정선 방향으로 이동시킨다.
- 판정 시간과 현재 손 위치를 기준으로 히트 여부를 계산한다.

### 5단계: 게임감 개선

- 히트 플래시를 추가한다.
- 콤보 애니메이션을 추가한다.
- 미스 피드백을 추가한다.
- 레인과 타겟 존의 펄스 효과를 추가한다.
- 콤보에 따라 배경 강도를 변화시킨다.

### 6단계: 결과와 리플레이

- 점수를 표시한다.
- 정확도를 표시한다.
- 최대 콤보를 표시한다.
- Perfect, Good, Miss 개수를 표시한다.
- 다시 플레이와 곡 변경 액션을 제공한다.

### 7단계: 폴리싱과 QA

- 로컬 브라우저에서 카메라 동작을 검증한다.
- 차트 싱크를 검증한다.
- 주요 화면 크기에서 텍스트 겹침이 없는지 확인한다.
- 성능이 매끄러운지 확인한다.
- 판정 범위와 노트 속도를 튜닝한다.

## 함께 결정할 항목

### 1. 비주얼 스타일

추천:

- 고대비 네온 아케이드 스타일

대안:

- K-pop 무대 스타일
- 미니멀 피트니스 게임 스타일
- 미래적인 리듬 그리드 스타일

결정:

- 첫 버전은 고대비 네온 아케이드 스타일로 확정한다.
- 손목 마커, 타겟 존, 판정선, 노트의 색 대비를 명확히 해서 카메라 미리보기 위에서도 읽히게 한다.
- K-pop 무대 스타일과 피트니스 스타일은 후속 스킨 후보로 둔다.

### 2. 입력 개수

추천:

- 4개 입력으로 시작: 왼손 위, 왼손 아래, 오른손 위, 오른손 아래

대안:

- 중앙 포즈를 포함한 5개 입력
- 팔 교차 동작을 포함한 6개 입력

결정:

- 첫 버전은 4개 입력으로 확정한다.
- 입력 ID는 코드와 차트에서 아래 문자열을 그대로 사용한다.
  - `left-up`
  - `left-down`
  - `right-up`
  - `right-down`
- 양손, 교차, 홀드 노트는 차트 포맷 확장 여지만 남기고 첫 버전 판정에는 포함하지 않는다.

### 3. 음악 사용 흐름

추천:

- 사용자가 로컬 mp3를 업로드한다.
- 사용자가 차트 JSON을 선택한다.
- 저작권 음악을 번들하지 않고도 실행 가능한 기본 데모 차트를 둔다.

대안:

- 로컬 곡 파일을 `public/music`에 직접 넣는다.
- BPM 기반으로 단순 차트를 자동 생성한다.

결정:

- 첫 버전은 사용자가 로컬 mp3와 JSON 차트를 각각 업로드하는 흐름으로 확정한다.
- 음악 파일은 브라우저 메모리의 `Object URL`로만 재생하고 프로젝트에 저장하지 않는다.
- mp3 파일과 차트 파일의 이름이 달라도 실행 가능해야 한다.
- 차트에는 곡 메타데이터와 오프셋을 포함해, 음악 파일 교체 없이 싱크를 조정할 수 있게 한다.

### 4. 차트 제작 방식

첫 버전 추천:

- 손으로 작성한 JSON 차트

다음 단계:

- 게임 안에 차트 에디터 추가

대안:

- BPM 기반으로 단순 차트를 자동 생성한다.
- 오디오 분석 기반 비트 감지

결정:

- 첫 버전은 손으로 작성한 JSON 차트로 확정한다.
- 차트 에디터, BPM 자동 생성, 오디오 분석은 후속 기능으로 둔다.
- 구현 초기에는 개발용 샘플 차트를 코드나 `public/charts`에 둘 수 있지만, 최종 플레이 루프는 파일 업로드를 기준으로 한다.

### 5. 포즈 인식 라이브러리

추천:

- MediaPipe Pose Landmarker

대안:

- TensorFlow.js MoveNet

결정:

- 첫 버전은 MediaPipe Pose Landmarker for Web으로 확정한다.
- 판정에는 양쪽 손목, 양쪽 어깨를 필수 랜드마크로 사용한다.
- 팔꿈치는 첫 버전 판정에는 필수로 쓰지 않지만, 손목 추적이 흔들릴 때 디버그 오버레이에 표시할 수 있다.

## 확정 게임 규칙

### 입력 액션

첫 버전의 입력 액션은 4개다.

```ts
type MotionAction = 'left-up' | 'left-down' | 'right-up' | 'right-down';
type HandSide = 'left' | 'right';
type VerticalZone = 'up' | 'down';
```

입력은 키를 누르는 이벤트가 아니라, 현재 프레임의 손목 위치가 특정 존 안에 있는지로 판정한다.

- `left-up`: 왼쪽 손목이 왼쪽 위 존 안에 있음
- `left-down`: 왼쪽 손목이 왼쪽 아래 존 안에 있음
- `right-up`: 오른쪽 손목이 오른쪽 위 존 안에 있음
- `right-down`: 오른쪽 손목이 오른쪽 아래 존 안에 있음

모션 입력은 매 프레임 아래 형태로 정규화한다.

```ts
type MotionInputState = {
  timestampMs: number;
  activeActions: Set<MotionAction>;
  wrists: {
    left: TrackedPoint;
    right: TrackedPoint;
  };
  confidence: 'ok' | 'low' | 'lost';
};

type TrackedPoint = {
  x: number;
  y: number;
  score: number;
};
```

`x`, `y`는 비디오 또는 캔버스 좌표가 아니라 0에서 1 사이의 정규화 좌표를 사용한다. 렌더러에서만 화면 픽셀로 변환한다.

### 모션 존

캘리브레이션 결과는 플레이어 몸 기준의 4개 사각 존으로 저장한다.

```ts
type MotionZone = {
  action: MotionAction;
  hand: HandSide;
  vertical: VerticalZone;
  rect: NormalizedRect;
};

type NormalizedRect = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

type CalibrationProfile = {
  shoulderCenter: { x: number; y: number };
  shoulderWidth: number;
  zones: Record<MotionAction, MotionZone>;
  inputLatencyMs: number;
  chartOffsetMs: number;
};
```

존 생성 기본값:

- 왼손 존의 중심 x는 왼쪽 어깨보다 바깥쪽에 둔다.
- 오른손 존의 중심 x는 오른쪽 어깨보다 바깥쪽에 둔다.
- 위 존은 어깨선보다 위쪽, 아래 존은 가슴 아래쪽에 둔다.
- `shoulderWidth`를 기준 단위로 사용해 플레이어가 카메라에 가깝거나 멀어져도 존 크기가 비슷하게 느껴지게 한다.
- 각 존에는 약간의 여유 영역을 둔다. 팔 동작 게임이므로 첫 버전에서는 정밀한 손 위치보다 리듬에 맞춘 큰 동작을 우선한다.

권장 초기 수치:

```ts
const zoneConfig = {
  horizontalOffsetShoulders: 0.75,
  halfWidthShoulders: 0.45,
  upCenterYOffsetShoulders: -0.65,
  downCenterYOffsetShoulders: 0.85,
  halfHeightShoulders: 0.38,
};
```

### 캘리브레이션 흐름

캘리브레이션은 시작 전에 15초 이내로 끝나는 짧은 루프로 설계한다.

1. 카메라 프레임 안에 상체와 양손이 보이는지 확인한다.
2. 기본 자세를 1초 이상 유지한다. 양손은 어깨 근처 또는 몸 옆에 둔다.
3. 양쪽 어깨 좌표와 어깨 너비의 안정 평균을 계산한다.
4. 4개 존을 화면에 표시한다.
5. 플레이어가 각 존에 손을 한 번씩 넣어 확인한다.
6. 모든 존이 감지되면 프로필을 확정한다.

캘리브레이션 실패 조건:

- 어깨 또는 손목 신뢰도가 0.5 미만인 상태가 500ms 이상 지속된다.
- 어깨 너비가 너무 작아 상체가 멀리 있거나 프레임 밖으로 판단된다.
- 좌우 어깨가 뒤집혀 인식되거나 플레이어가 너무 비스듬히 선다.

실패 시에는 게임을 시작하지 않고 카메라 거리와 조명을 조정하도록 안내한다.

### 차트 포맷

첫 버전 JSON 차트 스키마는 아래 형태를 기준으로 한다.

```ts
type ChartFile = {
  schemaVersion: 1;
  title: string;
  artist?: string;
  audioFileName?: string;
  bpm?: number;
  offsetMs: number;
  previewStartMs?: number;
  notes: ChartNote[];
};

type ChartNote = {
  id?: string;
  timeMs: number;
  action: MotionAction;
  intensity?: 1 | 2 | 3;
};
```

차트 규칙:

- 내부 로직은 `timeMs`를 사용한다. 사람이 편집하기 쉽게 초 단위 입력을 지원하더라도 로딩 시 ms로 변환한다.
- `offsetMs`는 차트 전체를 음악 기준으로 앞뒤 이동하는 값이다.
- 같은 손의 위/아래 노트는 최소 180ms 이상 떨어뜨린다.
- 다른 손 동시 노트는 첫 버전에서는 허용하지 않는다. 후속 기능의 양손 노트로 확장한다.
- `intensity`는 렌더링 효과 강도에만 쓰고 판정 난이도를 바꾸지 않는다.

### 판정창

판정 기준은 오디오 시간을 기준으로 한다.

```ts
type Judgement = 'Perfect' | 'Good' | 'Miss';

type JudgementWindow = {
  perfectMs: number;
  goodMs: number;
  missMs: number;
};

const defaultJudgementWindow: JudgementWindow = {
  perfectMs: 90,
  goodMs: 160,
  missMs: 220,
};
```

판정 규칙:

- `effectiveTimeMs = audioCurrentTimeMs + chartOffsetMs + inputLatencyMs`로 현재 판정 시간을 계산한다.
- 아직 판정되지 않은 노트 중 `abs(effectiveTimeMs - note.timeMs)`가 `goodMs` 이하인 노트만 히트 후보가 된다.
- 후보 노트의 `action`이 현재 `activeActions`에 있으면 시간 차이에 따라 `Perfect` 또는 `Good`을 준다.
- `effectiveTimeMs - note.timeMs > missMs`가 되면 `Miss`로 확정한다.
- 한 노트는 한 번만 판정한다.
- 한 프레임에 여러 후보가 있으면 시간 차이가 가장 작은 노트부터 처리한다.
- 추적 상태가 `lost`이면 히트 판정하지 않고, 노트가 `missMs`를 넘으면 `Miss` 처리한다.

점수 권장값:

```ts
const scoreTable = {
  Perfect: 1000,
  Good: 500,
  Miss: 0,
};
```

콤보 규칙:

- `Perfect`와 `Good`은 콤보를 1 증가시킨다.
- `Miss`는 콤보를 0으로 초기화한다.
- 점수 배율은 첫 버전에서는 넣지 않는다. 대신 결과 화면에서 최대 콤보를 강조한다.

### 리듬 엔진 함수 경계

렌더링과 판정 로직을 분리하기 위해 핵심 함수는 순수 함수에 가깝게 유지한다.

```ts
type RuntimeNote = ChartNote & {
  runtimeId: string;
  judged?: JudgedNote;
};

type JudgedNote = {
  judgement: Judgement;
  deltaMs: number;
  judgedAtMs: number;
};

type JudgeInput = {
  effectiveTimeMs: number;
  notes: RuntimeNote[];
  input: MotionInputState;
  window: JudgementWindow;
};

type JudgeResult = {
  notes: RuntimeNote[];
  events: JudgementEvent[];
};

type JudgementEvent = {
  noteId: string;
  action: MotionAction;
  judgement: Judgement;
  deltaMs: number;
};

type PoseFrame = {
  timestampMs: number;
  landmarks: {
    leftShoulder: TrackedPoint;
    rightShoulder: TrackedPoint;
    leftWrist: TrackedPoint;
    rightWrist: TrackedPoint;
  };
};

type GameResult = {
  score: number;
  accuracy: number;
  maxCombo: number;
  counts: Record<Judgement, number>;
};
```

권장 함수:

```ts
function loadChart(json: unknown): ChartFile;
function normalizeChart(chart: ChartFile): RuntimeNote[];
function buildZones(profile: CalibrationProfile): Record<MotionAction, MotionZone>;
function deriveMotionInput(pose: PoseFrame, profile: CalibrationProfile): MotionInputState;
function judgeFrame(input: JudgeInput): JudgeResult;
function calculateResult(notes: RuntimeNote[]): GameResult;
```

이 경계는 단위 테스트를 쉽게 만든다. 특히 `judgeFrame`은 웹캠, Canvas, 오디오 엘리먼트 없이 테스트할 수 있어야 한다.

### 피드백 루프

재미의 핵심은 플레이어가 자신의 몸 동작과 판정 결과를 즉시 이해하는 것이다.

필수 피드백:

- 손목 마커: 양손 현재 위치를 항상 표시한다.
- 존 하이라이트: 손이 존 안에 들어오면 해당 존을 즉시 밝힌다.
- 노트 히트 이펙트: `Perfect`는 짧고 강한 플래시, `Good`은 부드러운 링 확산, `Miss`는 레인 흔들림으로 구분한다.
- 콤보 펄스: 10콤보마다 배경과 판정선에 강한 펄스를 준다.
- 추적 경고: 손목 또는 어깨 추적이 불안정하면 판정선 주변이 아니라 카메라 미리보기 주변에 표시한다. 판정 피드백과 혼동하지 않게 한다.

권장 게임감 튜닝:

- 노트는 판정선 도착 1.6초 전에 화면에 등장한다.
- 팔을 크게 움직여도 다음 노트를 준비할 시간이 있도록 같은 손 연속 노트 간격을 초기 차트에서 넉넉하게 둔다.
- 초반 10초는 양손을 번갈아 쓰는 쉬운 패턴으로 시작한다.
- 플레이어가 몸을 움직였다는 느낌을 받도록 존 입력 자체에도 작은 사운드 또는 시각 반응을 준다. 단, 노트 판정음과는 구분한다.

## 주요 리스크

### 카메라 프레이밍

MacBook 카메라는 전신을 담기 어려울 수 있다. 그래서 발 동작보다 팔 동작 기반 게임이 더 안정적이다.

대응:

- 상체 중심 제스처를 사용한다.
- 어깨와 화면 위치를 기준으로 타겟 존을 잡는다.
- 캘리브레이션 단계를 둔다.

### 포즈 인식 지연

포즈 인식 과정에서 입력 지연이 생길 수 있다.

대응:

- 첫 버전에서는 판정 범위를 지나치게 빡빡하게 잡지 않는다.
- 실시간 손 위치 표시를 제공한다.
- 실제 지연에 맞춰 노트 속도와 오프셋을 조정한다.

### 리듬 싱크

작은 싱크 오차도 리듬게임에서는 불공정하게 느껴질 수 있다.

대응:

- 오디오 재생 시간을 게임 시간의 기준으로 사용한다.
- 사용자가 조정 가능한 오프셋 설정을 둔다.
- 추후 메트로놈 또는 싱크 캘리브레이션을 추가한다.

### 로컬 카메라 권한

카메라 API는 브라우저 권한과 보안 컨텍스트가 필요하다.

대응:

- `localhost`에서 실행한다.
- 명확한 권한 요청 및 설정 화면을 제공한다.

## 첫 번째 플레이 가능 버전 목표

첫 번째 로컬 플레이 가능 버전은 아래 기능을 포함한다.

- 웹캠 권한 흐름
- 손목 마커가 표시되는 포즈 추적
- 4개 모션 존
- 로컬 오디오 업로드
- 기본 데모 차트
- 낙하하는 노트
- 타이밍 판정
- 점수, 콤보, 결과 화면
- 다시 플레이 루프

이 기준은 기술 검증용 데모가 아니라, 실제로 사람이 로컬에서 플레이할 수 있는 게임의 최소 완성선이다.

## 현재 구현 상태

현재 로컬 프로젝트는 Vite, React, TypeScript 기반으로 구성되어 있다.

구현된 파일:

- `src/App.tsx`: 화면 흐름, 카메라 입력, 키보드 fallback, 게임 진행 상태
- `src/gameLogic.ts`: 입력 라벨, 기본 캘리브레이션, 활성 입력 계산, 판정, 점수, 정확도, 등급
- `src/chart.ts`: 내장 데모 차트와 JSON 차트 파서
- `src/types.ts`: 게임 상태, 차트, 포즈, 캘리브레이션 타입
- `src/styles.css`: 네온 아케이드 UI 스타일

현재 가능한 플레이 흐름:

1. `npm run dev`로 로컬 서버를 실행한다.
2. 브라우저에서 `http://127.0.0.1:5173/`을 연다.
3. 카메라를 시작하거나, 카메라 없이 키보드 테스트 모드를 켠다.
4. 내장 데모 비트 또는 로컬 mp3를 선택한다.
5. 기본 차트 또는 JSON 차트를 사용한다.
6. 캘리브레이션 화면에서 4개 입력 존 반응을 확인한다.
7. 게임을 시작하고 노트에 맞춰 팔을 움직인다.
8. 곡이 끝나면 점수, 정확도, 최대 콤보, 판정 breakdown을 확인한다.

현재 입력 방식:

- 카메라 모션 입력: 카메라 화면의 4개 존에서 움직임 변화량을 감지한다.
- 키보드 테스트 입력: `Q`는 왼손 위, `A`는 왼손 아래, `O`는 오른손 위, `L`은 오른손 아래다.

현재 판정:

- `Perfect`: 노트 시간과 입력 시간이 75ms 이내
- `Great`: 140ms 이내
- `Good`: 220ms 이내
- `Miss`: 판정 가능 시간이 지났는데 알맞은 입력이 없을 때

현재 의도적인 범위 조정:

- MediaPipe Pose Landmarker는 목표 기술로 확정했지만, 첫 실행 가능한 버전에서는 네트워크와 모델 파일 로딩 리스크를 줄이기 위해 카메라 모션 감지 fallback을 먼저 구현했다.
- 이 fallback은 실제 팔 동작 플레이 루프를 검증하기 위한 임시 입력 계층이다.
- 다음 단계에서 MediaPipe 손목/어깨 랜드마크 기반 입력으로 교체하거나 병행한다.

다음 구현 우선순위:

1. MediaPipe Pose Landmarker 실제 통합
2. 어깨 기준 캘리브레이션 프로필 저장
3. 손목 trail과 hit pulse 이펙트 추가
4. JSON 차트 예시 파일 추가
5. 차트 에디터 또는 BPM 기반 간이 생성기 추가

## 사용자 피드백과 개선 결정

### 확인된 사용자 피드백

1. 카메라 접근 권한을 허용했지만 카메라 인식이 되지 않았다.
2. 키보드 입력 타이밍이 맞아도 점수와 판정이 올라가지 않았다.
3. 현재 UI/UX는 실제 리듬게임처럼 자연스럽게 플레이할 수 있는 구조가 아니다.
4. 곡은 업로드만 지원하는 방식이 아니라, 펌프 또는 일반 리듬게임처럼 리스트에서 선택하면 곡과 차트가 함께 제공되어야 한다.
5. 현재 프로젝트는 백엔드가 없는 프론트엔드 로컬 앱 구조임을 명확히 해야 한다.

### 현재 앱 구조 결정

- 현재 Motion Pulse는 Vite, React, TypeScript 기반의 프론트엔드 로컬 앱이다.
- 별도의 서버 애플리케이션, 데이터베이스, 로그인, API 백엔드는 현재 없다.
- `npm run dev`로 실행되는 개발 서버는 정적 프론트엔드 앱을 로컬에서 서빙하기 위한 도구이며, 게임 데이터를 영구 저장하거나 곡 카탈로그를 관리하는 백엔드가 아니다.
- 첫 개선 범위는 프론트엔드 내부 상태, 로컬 자산, 브라우저 API, 내장 차트 데이터를 기준으로 해결한다.
- 점수 랭킹, 사용자 계정, 곡 다운로드, 원격 차트 배포가 필요해지는 시점에 백엔드 도입 여부를 다시 판단한다.

### 개선 계획

#### 1. 카메라 진단

목표:

- 사용자가 권한을 허용했는데도 카메라가 인식되지 않는 원인을 화면에서 바로 알 수 있게 한다.

개선 항목:

- `getUserMedia()` 호출 성공, 실패, 스트림 수신, 비디오 메타데이터 로드, 프레임 수신 상태를 단계별로 표시한다.
- 권한 거부, 장치 없음, 브라우저 보안 컨텍스트 문제, 비디오 프레임 미수신을 서로 다른 오류로 구분한다.
- 카메라 미리보기, 프레임 수신 FPS, 마지막 프레임 수신 시간을 디버그 패널에 표시한다.
- 카메라가 켜졌지만 모션 또는 포즈 입력이 없는 경우를 권한 실패와 분리해서 안내한다.
- MediaPipe 통합 후에는 모델 로딩 상태, 랜드마크 신뢰도, 왼손/오른손/어깨 감지 여부도 함께 표시한다.

#### 2. 입력 이벤트 기반 판정

목표:

- 키보드 또는 모션 입력이 정확한 타이밍에 들어왔을 때 즉시 점수와 판정이 올라가도록 판정 구조를 수정한다.

개선 항목:

- 현재 프레임의 누적 입력 상태만 보는 방식이 아니라, 키다운 또는 모션 존 진입 순간을 `InputEvent`로 기록한다.
- 각 입력 이벤트는 `action`, `timestampMs`, `source`를 가진다.
- 판정은 오디오 기준 시간과 입력 이벤트 시간을 비교해 가장 가까운 미판정 노트에 적용한다.
- 키보드 테스트 모드는 실제 판정 엔진을 검증하는 1차 QA 경로로 유지한다.
- 같은 키를 누르고 있는 상태가 중복 히트로 처리되지 않도록 키다운 엣지와 키업 상태를 분리한다.
- 모션 입력도 존 안에 계속 머무르는 상태가 아니라, 존 밖에서 안으로 들어오는 순간을 히트 후보 이벤트로 본다.

권장 타입:

```ts
type InputSource = 'keyboard' | 'camera-motion' | 'pose';

type RhythmInputEvent = {
  action: MotionAction;
  timestampMs: number;
  source: InputSource;
};
```

#### 3. 실제 리듬게임형 UI/UX

목표:

- 앱을 기술 데모가 아니라 곡 선택, 준비, 플레이, 결과가 이어지는 리듬게임 구조로 재정리한다.

개선 항목:

- 첫 화면은 파일 업로드 중심이 아니라 곡 선택 화면으로 구성한다.
- 곡 선택 화면에는 제목, 아티스트, 난이도, 길이, BPM, 미리듣기 시작 지점을 표시한다.
- 플레이 화면은 판정선, 레인, 노트, 콤보, 점수, 남은 시간, 현재 입력 피드백을 우선 배치한다.
- 카메라 진단과 캘리브레이션은 플레이 화면을 가리지 않는 준비 단계로 분리한다.
- 결과 화면에는 점수, 정확도, 최대 콤보, 판정 breakdown, 다시 플레이, 곡 목록으로 돌아가기를 제공한다.
- 업로드 기능은 고급 또는 커스텀 곡 흐름으로 유지하되, 기본 플레이 루프의 중심에 두지 않는다.

#### 4. 내장 곡/차트 카탈로그

목표:

- 펌프나 리듬게임처럼 곡 리스트에서 선택하면 오디오와 차트가 함께 로드되는 구조를 제공한다.

개선 항목:

- `public/songs` 또는 `src/data`에 내장 곡 메타데이터와 차트를 둔다.
- 곡 엔트리는 오디오 파일 경로, 차트 파일 경로 또는 inline 차트, 제목, 아티스트, 난이도, BPM, 길이, 프리뷰 구간을 포함한다.
- 기본 제공 곡은 저작권 문제가 없는 자체 제작 또는 공개 라이선스 음원을 사용한다.
- 한 곡에 여러 난이도 차트를 연결할 수 있는 구조를 준비한다.
- 로컬 mp3 및 JSON 업로드는 카탈로그 외부의 커스텀 곡으로 분류한다.

권장 타입:

```ts
type SongCatalogEntry = {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  durationMs: number;
  previewStartMs: number;
  audioUrl: string;
  charts: {
    difficulty: 'Easy' | 'Normal' | 'Hard';
    level: number;
    chartUrl?: string;
    chart?: ChartFile;
  }[];
};
```

#### 5. 추후 백엔드 필요 여부

현재는 백엔드 없이 진행한다.

백엔드가 필요해질 수 있는 조건:

- 사용자별 점수 저장과 랭킹이 필요할 때
- 곡과 차트를 원격으로 배포하거나 업데이트해야 할 때
- 사용자가 만든 차트를 공유해야 할 때
- 계정, 세이브 데이터, 업적, 플레이 기록 동기화가 필요할 때
- 저작권 또는 라이선스 관리가 필요한 음원 배포를 다룰 때

그 전까지는 프론트엔드 로컬 앱 구조를 유지하고, 내장 카탈로그와 커스텀 업로드를 모두 브라우저 안에서 처리한다.

### 반영 우선순위

1. 키보드 입력 이벤트 기반 판정 수정
2. 카메라 진단 패널 추가
3. 내장 곡/차트 카탈로그와 곡 선택 화면 추가
4. 리듬게임형 플레이 화면 구조 재배치
5. MediaPipe Pose Landmarker 기반 손목/어깨 입력으로 확장
6. 백엔드 필요 여부 재검토
