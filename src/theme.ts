/**
 * 🎨 식재료 및 식단 관리 서비스 - 통합 디자인 사전 (Design Dictionary)
 * 일관된 UI/UX 디자인을 유지하기 위해 색상, 폰트, 여백, 아이콘 규격, 버튼/인풋 컴포넌트 스타일을 사전형식으로 제공합니다.
 */

export const DESIGN_THEME = {
  // 1. 색상 팔레트 (Tailwind 클래스 및 원본 헥스코드 대응)
  colors: {
    // 자연주의 올리브/세이지 그린 (주요 포인트, 강조, 브랜드 컬러)
    primary: {
      text: 'text-[#5D6D54]',
      bg: 'bg-[#5D6D54]',
      bgLight: 'bg-[#829379]/10',
      border: 'border-[#5D6D54]',
      hoverBg: 'hover:bg-[#5D6D54]/90',
      accent: 'text-[#829379]',
      accentBg: 'bg-[#829379]',
      accentHoverBg: 'hover:bg-[#829379]/90',
    },
    // 베이지/웜그레이 (기본 배경 및 테두리 구조용)
    neutral: {
      bgPage: 'bg-[#F9F7F2]',          // 전반 웹사이트 배경색
      bgCard: 'bg-white',              // 카드, 보드 배경색
      bgAlt: 'bg-[#F9F7F2]/60',        // 보조 인풋, 강조구역 배경색
      textMain: 'text-[#4A4A4A]',      // 기본 텍스트
      textMuted: 'text-[#4A4A4A]/60',  // 보조 텍스트, 설명글
      textLight: 'text-gray-400',      // 연한 메타 정보
      border: 'border-[#E0DBCF]',      // 기본 웜 테두리
      borderLight: 'border-[#E0DBCF]/40', // 미세한 보조선
    },
    // 경고/삭제/임박 오렌지-레드 톤
    danger: {
      text: 'text-[#9E7676]',
      bg: 'bg-[#9E7676]',
      bgLight: 'bg-[#F2E1E1]/50',
      border: 'border-[#E9C7C7]/40',
      hoverBg: 'hover:bg-[#9E7676]/90',
      hoverBgLight: 'hover:bg-[#F2E1E1]',
    },
    // 디메리트/경고/알림/하이라이트 옐로우 톤
    warning: {
      text: 'text-[#C49B76]',
      bg: 'bg-[#C49B76]',
      bgLight: 'bg-[#F9F3EB]',
      border: 'border-[#E9D9C7]',
    }
  },

  // 2. 타이포그래피 (폰트 페어링 및 사이즈)
  fonts: {
    sans: 'font-sans', // 나눔스퀘어네오 (기본 인터페이스)
    mono: 'font-mono', // JetBrains Mono (숫자, 디테일, 코드)
  },

  fontSizes: {
    titleLarge: 'text-xl md:text-2xl font-bold tracking-tight', // 대단원 타이틀
    titleMedium: 'text-base md:text-lg font-bold tracking-tight', // 섹션/그룹 타이틀
    titleSmall: 'text-xs md:text-sm font-bold tracking-tight',   // 아코디언/카드 소제목
    bodyLarge: 'text-sm font-medium',                            // 중요 본문
    bodyNormal: 'text-xs md:text-sm text-[#4A4A4A]',             // 기본 본문
    caption: 'text-[11px] font-medium text-[#4A4A4A]/70',         // 폼 라벨, 설명글
    meta: 'text-[10px] text-gray-400',                           // 시간기록, 부가정보
  },

  // 3. 레이아웃 여백 및 반경 (Spacing & Border Radius)
  layout: {
    paddingSection: 'p-4 md:p-6',
    paddingCard: 'p-4',
    gapLarge: 'gap-6',
    gapMedium: 'gap-4',
    gapSmall: 'gap-2',
    roundedLarge: 'rounded-2xl',
    roundedMedium: 'rounded-xl',
    roundedSmall: 'rounded-lg',
  },

  // 4. 아이콘 규격 (Lucide-react와 조합하여 사용)
  icons: {
    sizes: {
      xl: 24,       // 메인 헤더급 아이콘
      lg: 20,       // 서브 챕터/기능 타이틀 아이콘
      md: 16,       // 기본 버튼, 리스트 아이템용 아이콘
      sm: 12,       // 초소형 알약 뱃지, 미세 버튼용 아이콘
    },
    colors: {
      primary: 'text-[#5D6D54]',
      accent: 'text-[#829379]',
      danger: 'text-[#9E7676]',
      muted: 'text-[#4A4A4A]/40',
    }
  },

  // 5. 공통 버튼 형식별 디자인 프리셋
  buttons: {
    // 주요 행동 버튼 (저장, 등록 등 대표 그린)
    primary: 'px-4 py-2 bg-[#5D6D54] hover:bg-[#5D6D54]/90 text-white text-xs font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer',
    // 서브 행동 버튼 (취소, 더보기, 보조 기능)
    secondary: 'px-4 py-2 bg-white hover:bg-[#F9F7F2] text-[#4A4A4A] border border-[#E0DBCF] text-xs font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer',
    // 삭제/제거 행동 버튼
    danger: 'px-3 py-1.5 bg-[#F2E1E1]/40 hover:bg-[#F2E1E1] text-[#9E7676] border border-[#E9C7C7]/40 hover:border-[#E9C7C7]/60 text-xs font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer',
    dangerConfirm: 'px-3 py-1.5 bg-[#9E7676] text-white text-xs font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 animate-pulse shadow-sm cursor-pointer',
    // 아이콘 위주의 아주 미니멀한 버튼
    minimal: 'p-1.5 text-[#4A4A4A]/60 hover:text-[#5D6D54] hover:bg-[#829379]/5 rounded-md transition-all duration-200 flex items-center justify-center cursor-pointer',
    // 얇은 아웃라인형 뱃지 스타일 버튼
    badgeBtn: 'px-2 py-0.5 bg-[#829379]/5 border border-[#829379]/20 hover:bg-[#829379]/10 text-[#5D6D54] text-[10px] font-bold rounded-full transition-all duration-200 cursor-pointer',
  },

  // 6. 공통 폼 입력란 (Inputs, Selects, Checkboxes)
  inputs: {
    text: 'w-full bg-white border border-[#E0DBCF] placeholder-gray-400 focus:outline-hidden focus:ring-1 focus:ring-[#829379] focus:border-[#829379] rounded-md px-3 py-1.5 text-xs text-[#4A4A4A] transition-all duration-200',
    checkbox: 'rounded-sm border-[#E0DBCF] text-[#829379] focus:ring-[#829379] h-3.5 w-3.5 cursor-pointer',
    select: 'bg-white border border-[#E0DBCF] focus:outline-hidden focus:ring-1 focus:ring-[#829379] focus:border-[#829379] rounded-md px-2 py-1 text-xs text-[#4A4A4A] transition-all duration-200',
  },

  // 7. 카드 및 컨테이너 스타일 프리셋
  containers: {
    card: 'bg-white border border-[#E0DBCF]/80 rounded-2xl p-4 md:p-5 shadow-2xs transition-all duration-200 hover:shadow-xs',
    emptyZone: 'text-center py-6 text-gray-400 text-xs font-sans',
  }
} as const;
