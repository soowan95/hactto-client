# hactto-client

hactto 분석 시스템의 대시보드 및 IP 기반 접근 통제를 제어하는 React + Vite 기반의 프리미엄 프론트엔드 웹 애플리케이션입니다.

## 🛠 Tech Stack
- **Core Library**: React (TypeScript)
- **Build Tool**: Vite
- **Styling**: Vanilla CSS (Premium Glassmorphism & Neon Space Dark 테마)
- **HTTP Client**: Native Fetch API (Credentials include)

## 🔑 Core Features
1. **IP 접근 권한 탐색 및 분기**:
   - 페이지 진입 시 자동으로 현재 IP 권한 유무를 `/check-ip`로 판별하여 스크린을 동적으로 렌더링합니다.
2. **관리자 자동 등록 요청**:
   - 대한민국 IP 사용자일 경우 원클릭 요청으로 화이트리스트 등록 및 세션 발급을 자동으로 수행합니다.
3. **Master Key 수동 인증**:
   - 마스터 키 입력 시 백엔드 인증 절차를 거쳐 수동으로 자신의 IP를 화이트리스트에 추가할 수 있습니다.

## 🚀 Getting Started

### 1. 의존성 패키지 설치
```bash
npm install
```

### 2. 로컬 개발 서버 실행
Vite 기반의 로컬 데브 서버를 기동합니다. (기본 포트: `http://localhost:5173`)
```bash
npm run dev
```

### 3. 프로덕션 빌드
배포용 에셋 컴파일 및 타입 검증을 진행합니다.
```bash
npm run build
```

## 🎨 Design Theme
- **Theme**: Deep Space Dark Theme (`#08090e`)
- **Key Concepts**:
  - `float` 키프레임 애니메이션으로 떠다니는 몽환적인 앰비언트 글로우 오브 배경
  - `backdrop-filter: blur(24px)`를 이용한 frosted glass 텍스처 카드 레이아웃
  - 네온 스타일 포인터 및 트랜지션 효과를 극대화한 사용자 인터랙션 버튼
