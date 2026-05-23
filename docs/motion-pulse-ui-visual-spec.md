# Motion Pulse UI / 비주얼 설계

## 비주얼 방향

Motion Pulse는 피트니스 대시보드가 아니라 로컬 네온 아케이드 게임처럼 느껴져야 한다.

- 장르: 웹캠 기반 리듬 액션
- 화면: 카메라 프리뷰 위에 리듬 레인과 모션 존을 겹친 구성
- 플레이 동작: 왼팔 위, 왼팔 아래, 오른팔 위, 오른팔 아래
- 재질감: 어두운 아크릴 패널, 선명한 네온 레일, 카메라 스캔라인, 펄스 링, compact HUD
- 모션 톤: 히트는 빠른 보상 이펙트, 미스는 짧은 붉은 피드백, 대기 상태는 차분한 스캔 느낌
- 숫자: 점수, 콤보, 정확도는 tabular number 느낌으로 읽기 쉽게 표시

## 색상 팔레트

앱은 CSS 변수를 사용해 테마를 한 곳에서 관리한다.

```css
:root {
  --mp-bg: #070915;
  --mp-panel: rgba(12, 18, 34, 0.78);
  --mp-panel-solid: #101629;
  --mp-border: rgba(137, 232, 255, 0.28);
  --mp-text: #eff8ff;
  --mp-muted: #93a8bd;
  --mp-cyan: #25e4ff;
  --mp-pink: #ff3df2;
  --mp-lime: #a8ff3e;
  --mp-amber: #ffcc38;
  --mp-red: #ff4f6d;
  --mp-blue: #6f7dff;
}
```

입력별 색상:

- 왼손 위: cyan
- 왼손 아래: blue
- 오른손 위: pink
- 오른손 아래: amber
- 성공 판정: lime
- 미스 또는 추적 실패: red

## 화면 흐름

### 1. 설정 화면

목적:

- 펌프/스텝매니아처럼 먼저 곡을 고르고, 그 다음 카메라와 입력 상태를 확인한다.

구성:

- 왼쪽: 카메라 프리뷰와 4개 모션 존, 판정선 미리보기
- 오른쪽: Song Select 패널, 로컬 mp3 선택, 차트 JSON 선택, 데모 비트, 키보드 테스트 모드
- 상단: 카메라, 오디오, 차트 상태 chip

현재 구현:

- 카메라 시작 버튼
- 로컬 오디오 파일 선택
- JSON 차트 선택
- 내장 데모 비트 모드
- 카메라 없이 키보드 테스트 모드
- `Q`, `A`, `O`, `L` 키보드 fallback
- `src/styles.css`에서 설정 패널을 Song Select 캐비닛처럼 보이도록 조정
  - 파일 선택 버튼을 곡/차트 슬롯으로 시각화
  - 데모 비트와 키보드 테스트를 옵션 토글로 정리
  - 키맵 영역을 난이도/레인 칩 느낌으로 강화

다음 구현 제안:

```text
SongSelectPanel
  SongList
    SongListItem(title, artist, bpm, source, selected)
  DifficultyChips
    Easy / Normal / Hard / Motion
  LocalImportActions
    Audio File / Chart JSON
```

초기 곡 리스트는 내장 데모 차트와 최근 불러온 로컬 곡만 있어도 충분하다. 곡 아이템에는 제목, 아티스트, BPM, 노트 수, 입력 타입 4개를 한 줄로 보여준다. 업로드는 리스트 바깥의 보조 액션으로 내려서, 첫 화면이 파일 업로드 폼처럼 보이지 않게 한다.

### 2. 캘리브레이션 화면

목적:

- 플레이어가 4개 존에 팔을 넣었을 때 반응이 잘 보이는지 확인한다.

구성:

- 중앙 카메라 패널
- 왼손 위, 왼손 아래, 오른손 위, 오른손 아래 존
- 활성화된 존은 색상과 glow로 강조
- Start Pulse 버튼으로 게임 시작

현재 구현:

- 화면 크기에 맞춘 기본 4존 생성
- 카메라 기반 모션 감지 또는 키보드 입력으로 활성 존 표시
- MediaPipe 기반 어깨/손목 캘리브레이션은 후속 고도화 항목

### 3. 게임 화면

목적:

- 음악 시간에 맞춰 노트가 판정선으로 내려오고, 모션 입력으로 판정한다.

구성:

- 중앙: 카메라 프리뷰 + 모션 존 + 노트
- 상단: 점수, 진행률, 정확도
- 하단: 콤보, 입력 상태, 트래킹 상태
- 오른쪽: 곡 정보와 일시정지/재시작/곡 변경 액션

현재 구현:

- 내장 데모 차트
- 로컬 오디오 파일 재생
- JSON 차트 로딩
- 노트 낙하
- `Perfect`, `Great`, `Good`, `Miss` 판정
- 콤보, 최대 콤보, 점수, 정확도 계산
- 판정 toast
- 데모 비트 타이머
- CSS 레벨에서 4개 레인 레일, 판정 밴드, 강화된 hit-line, 고대비 HUD 패널을 추가
- 하단 입력 그리드는 현재 활성 입력과 카메라/키보드 입력 상태를 즉시 읽을 수 있게 glow와 대비를 강화

게임플레이 HUD 우선순위:

1. 판정선과 낙하 노트
2. 콤보와 현재 입력 상태
3. 점수, 정확도, 곡 진행률
4. 곡 정보와 재시작/곡 변경 액션

판정선은 화면 하단 20% 근처에 유지한다. 상단 HUD는 얇은 점수/진행 정보만 갖고, 하단 HUD는 입력 상태와 트래킹 상태만 갖는다. 중앙부에는 긴 문장이나 카드형 도움말을 올리지 않는다.

### 카메라 진단 상태

현재 구현:

- `Tracking` stat이 `OK` 또는 `LOW`로 표시된다.
- 활성 입력은 `InputGrid`에서 색상과 glow로 표시된다.
- 손목 추정점은 왼손 cyan, 오른손 pink 점으로 표시된다.

스타일 기준:

- `OK`: 현재 HUD 대비로 충분히 읽히게 유지한다.
- `LOW`: 후속 TSX 수정 시 `stat warn` 또는 `tracking-low` 클래스를 붙여 red/amber 테두리로 승격한다.
- 키보드 테스트 중에는 입력 grid가 실제 카메라 입력과 같은 시각 피드백을 사용한다.
- 카메라 프리뷰는 너무 어둡지 않게 유지하되, 레인과 판정선이 카메라보다 우선 읽히도록 overlay z-index를 둔다.

후속 구현 제안:

```text
CameraDiagnostics
  status: ready | tracking | low | blocked
  source: camera-motion | keyboard | none
  leftConfidence
  rightConfidence
  latencyMs
```

이 진단 정보는 사이드 HUD보다 게임 스테이지 하단에 가까운 작은 상태 strip으로 두는 것이 좋다. 플레이 중 문제를 즉시 알아야 하지만, 노트와 판정선을 가리면 안 된다.

### 4. 결과 화면

목적:

- 플레이 결과를 짧고 명확하게 보여주고 재도전을 유도한다.

구성:

- 등급 배지
- 점수
- 최대 콤보
- 정확도
- 판정 breakdown
- Replay, Recalibrate, Change Song 액션

## 컴포넌트 구조

현재 구현은 단일 `App.tsx`에 통합되어 있으며, 다음 단계에서 아래처럼 분리할 수 있다.

```text
AppShell
  SetupScreen
  CalibrationScreen
  GameplayScreen
    CameraPanel
    MotionZoneOverlay
    NoteLaneOverlay
    ScoreCluster
    SongProgress
    JudgmentToast
    TrackingStatus
  ResultsScreen
```

분리 기준:

- 게임 타이밍과 판정 로직은 `gameLogic.ts`에 둔다.
- 차트 파싱은 `chart.ts`에 둔다.
- 화면 컴포넌트는 상태를 props로 받고, 판정 로직을 소유하지 않는다.

## 반응형 기준

데스크톱:

- 게임 화면은 오른쪽 사이드 HUD를 포함한 2열 구성이다.
- 카메라/게임 스테이지가 화면의 대부분을 차지한다.

태블릿 이하:

- 설정과 게임 화면은 1열로 접힌다.
- HUD는 상단/하단으로 이동한다.

모바일:

- 카메라와 모션 존을 우선한다.
- 버튼 높이는 터치 가능한 크기로 유지한다.
- 판정선과 노트를 가리는 고정 UI를 피한다.

## 남은 UI 고도화

- 실제 `SongListItem` 컴포넌트 추가
- 난이도 chip 선택 상태와 chart metadata 연결
- `Tracking OK/LOW`에 상태별 클래스 추가
- 히트 순간 zone pulse ring 추가
- 미스 시 해당 레인 짧은 흔들림
- 콤보 milestone 이펙트
- 결과 화면 점수 count-up 애니메이션
- 실제 MediaPipe 손목 좌표 trail 표시

## 이번 스타일 변경 범위

- `src/styles.css`만으로 적용 가능한 변경을 우선했다.
- `App.tsx`와 `gameLogic.ts`는 수정하지 않았다.
- 실제 곡 리스트 데이터 구조, 난이도 선택 상태, 카메라 진단 상태 enum은 후속 TSX 작업이 필요하다.
