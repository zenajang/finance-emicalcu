# EMI 대출 계산기

비자 기간에 맞는 최적의 대출 조건을 찾을 수 있는 대출 계산기입니다.

## 기능

- 📅 비자 만료일 기반 최대 대출 가능 기간 자동 계산
- 💰 대출 금액별, 기간별 월 상환액(EMI) 계산
- 🎯 최적의 추천 대출 금액 자동 계산
- 📊 상세 대출 조건표 (비밀번호 보호)
- 📱 반응형 디자인 (모바일/태블릿/데스크탑)

## 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Deployment**: Vercel

## 로컬 개발

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 브라우저에서 http://localhost:3000 열기
```

## Vercel 배포

### 방법 1: Vercel CLI

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel
```

### 방법 2: GitHub 연동

1. GitHub 저장소에 코드 푸시
2. [Vercel](https://vercel.com)에 접속
3. "Import Project" 클릭
4. GitHub 저장소 선택
5. 자동 배포

### 방법 3: Vercel 대시보드

1. 프로젝트 빌드
```bash
npm run build
```

2. [Vercel](https://vercel.com)에서 수동 업로드

## 주요 설정

- **이자율**: 연 20% (월 1.67%)
- **상환 능력 기준**: 월 550,000원
- **대출 금액 범위**: 2백만 ~ 4천만원
- **대출 기간 범위**: 3개월 ~ 180개월

## 프로젝트 구조

```
finance-loan-calc/
├── app/
│   ├── layout.tsx          # 레이아웃
│   ├── page.tsx            # 메인 페이지
│   └── globals.css         # 전역 스타일
├── components/
│   ├── ui/                 # shadcn/ui 컴포넌트
│   └── loan-calculator.tsx # 대출 계산기 컴포넌트
├── lib/
│   └── utils.ts            # 유틸리티 함수
└── public/                 # 정적 파일
```

## 라이선스

MIT
