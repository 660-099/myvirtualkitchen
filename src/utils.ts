/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Ingredient, MealPlan, CookingIdea, ShoppingItem } from './types';

export const CATEGORY_MAP: {
  [key: string]: { category: string; emoji: string; keywords: string[] };
} = {
  bakery: {
    category: '곡류',
    emoji: '🍞',
    keywords: ['빵', 'bread', '밥', 'rice', '떡', 'rice cake', '면', 'noodle', '파스타', 'pasta', '곡물', '밀가루', '시리얼', 'cereal', '곡류'],
  },
  vegetable: {
    category: '채소·버섯',
    emoji: '🥕',
    keywords: ['상추', 'lettuce', '양파', 'onion', '마늘', 'garlic', '당근', 'carrot', '대파', 'scallion', '파', 'green onion', '고추', 'pepper', '브로콜리', 'broccoli', '감자', 'potato', '고구마', 'sweet potato', '오이', 'cucumber', '버섯', 'mushroom', '토마토', 'tomato', '배추', 'cabbage', '시금치', 'spinach', '호박', 'pumpkin', 'zucchini', '가지', 'eggplant', '야채', '채소', '버섯', 'vegetable'],
  },
  fruit: {
    category: '과일',
    emoji: '🍎',
    keywords: ['사과', 'apple', '바나나', 'banana', '딸기', 'strawberry', '포도', 'grape', '오렌지', 'orange', '귤', 'tangerine', '레몬', 'lemon', '수박', 'watermelon', '멜론', 'melon', '복숭아', 'peach', '체리', 'cherry', '망고', 'mango', '블루베리', 'blueberry', '과일', 'fruit'],
  },
  meat: {
    category: '육류',
    emoji: '🥩',
    keywords: ['소고기', 'beef', '돼지', 'pork', '닭', 'chicken', '오리', 'duck', '양고기', 'lamb', '베이컨', 'bacon', '소시지', 'sausage', '햄', 'ham', '고기', '삼겹살', '목살', '갈비', '육류'],
  },
  seafood: {
    category: '수산물',
    emoji: '🐟',
    keywords: ['생선', 'fish', '고등어', 'mackerel', '연어', 'salmon', '새우', 'shrimp', '게', 'crab', '오징어', 'squid', '조개', 'clam', '굴', 'oyster', '갈치', '참치', 'tuna', '해물', 'seafood', '수산물'],
  },
  dairy: {
    category: '유제품',
    emoji: '🥛',
    keywords: ['우유', 'milk', '치즈', 'cheese', '버터', 'butter', '요거트', 'yogurt', '생크림', 'cream', '요구르트', '마가린', '유제품'],
  },
  sauce: {
    category: '소스',
    emoji: '🥫',
    keywords: ['소스', 'sauce', '소금', 'salt', '설탕', 'sugar', '간장', 'soy', '식초', 'vinegar', '고추장', '된장', '쌈장', '마요네즈', 'mayo', '케찹', 'ketchup', '오일', '기름', 'oil', '참기름', '후추', 'pepper', '카레', 'curry'],
  },
  egg: {
    category: '미분류',
    emoji: '🥚',
    keywords: ['달걀', '계란', 'egg', '메추리알'],
  },
  drink: {
    category: '미분류',
    emoji: '🍹',
    keywords: ['커피', 'coffee', '주스', 'juice', '차', 'tea', '콜라', 'cola', '사이다', 'soda', '물', 'water', '맥주', 'beer', '와인', 'wine', '탄산', '음료', 'drink'],
  },
  snack: {
    category: '미분류',
    emoji: '🍪',
    keywords: ['과자', 'snack', '초콜릿', 'chocolate', '젤리', 'jelly', '사탕', 'candy', '쿠키', 'cookie', '아이스크림', 'ice cream', '푸딩', 'pudding', '칩'],
  },
};

// 사용 가능한 전체 이모지 목록 (수동 변경 시 선택지용)
export const ALL_EMOJIS = [
  '🥛', '🥩', '🐟', '🍎', '🥕', '🥚', '🍞', '🥫', '🍹', '🍪',
  '📦', '🥬', '🍋', '🍇', '🍉', '🍍', '🍒', '🍑', '🥑', '🍗',
  '🍤', '🍜', '🍝', '🍣', '🍰', '🍦', '🍩', '🧀', '🧅', '🥔',
  '🌽', '🌶️', '🧄', '🍯', '🧂', '☕', '🧉', '🧃', '🥤', '🍽️'
];

/**
 * 재료 이름으로부터 카테고리와 이모지를 자동으로 추출합니다.
 */
export function analyzeIngredientName(name: string): { category: string; emoji: string } {
  const lowerName = name.toLowerCase().trim();
  
  for (const key of Object.keys(CATEGORY_MAP)) {
    const info = CATEGORY_MAP[key];
    // 키워드 중 하나가 입력한 이름에 포함되어 있는지 검사
    const hasKeyword = info.keywords.some(keyword => lowerName.includes(keyword));
    if (hasKeyword) {
      return { category: info.category, emoji: info.emoji };
    }
  }
  
  // 매칭되는 게 없으면 기본값 리턴
  return { category: '미분류', emoji: '📦' };
}

/**
 * 두 날짜 사이의 차이를 구하여 D-Day 문자열을 반환합니다.
 */
export function calculateDDay(expiryDateStr: string): { days: number; text: string; alertType: 'danger' | 'warning' | 'safe' } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expiry = new Date(expiryDateStr);
  expiry.setHours(0, 0, 0, 0);
  
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (isNaN(diffDays)) {
    return { days: 999, text: '기한 없음', alertType: 'safe' };
  }
  
  if (diffDays < 0) {
    return { days: diffDays, text: `만료 D+${Math.abs(diffDays)}`, alertType: 'danger' };
  } else if (diffDays === 0) {
    return { days: diffDays, text: '오늘 만료!', alertType: 'danger' };
  } else if (diffDays <= 3) {
    return { days: diffDays, text: `D-${diffDays}`, alertType: 'warning' };
  } else {
    return { days: diffDays, text: `D-${diffDays}`, alertType: 'safe' };
  }
}

/**
 * 특정 요일의 주간 날짜 배열을 반환합니다. (일요일 ~ 토요일)
 * @param referenceDate 기준 날짜
 */
export function getWeekDates(referenceDate: Date): Date[] {
  const currentDay = referenceDate.getDay(); // 0(일) ~ 6(토)
  // 일요일을 주의 첫날로 정렬 (일요일: 0)
  const distance = -currentDay;
  
  const sunday = new Date(referenceDate);
  sunday.setDate(referenceDate.getDate() + distance);
  sunday.setHours(0, 0, 0, 0);
  
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + i);
    dates.push(date);
  }
  return dates;
}

/**
 * Date 객체를 YYYY-MM-DD 스트링으로 포맷합니다.
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 날짜 문자열(YYYY-MM-DD)을 'M/D' 또는 'YYYY/M/D' 형식으로 가독성 좋게 포맷팅합니다.
 * 올해인 경우 연도는 생략합니다.
 */
export function formatDisplayDate(dateStr: string | undefined): string {
  if (!dateStr) return '기한 없음';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    const currentYear = new Date().getFullYear().toString();
    if (year === currentYear) {
      return `${month}/${day}`;
    } else {
      return `${year}/${month}/${day}`;
    }
  } else if (parts.length === 2) {
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    return `${month}/${day}`;
  }
  return dateStr;
}

/**
 * 한국어-영어 동의어 사전 매칭 테이블
 */
export const SYNONYM_DICTIONARY: { [key: string]: string[] } = {
  우유: ['우유', 'milk', '🥛'],
  치즈: ['치즈', 'cheese', '🧀'],
  버터: ['버터', 'butter'],
  요거트: ['요거트', 'yogurt', '요플레'],
  소고기: ['소고기', '소', 'beef', '한우', '스테이크', '🥩'],
  돼지고기: ['돼지', '돼지고기', 'pork', '삼겹살', '목살', '베이컨', 'bacon'],
  닭고기: ['닭', '닭고기', 'chicken', '🍗'],
  계란: ['계란', '달걀', 'egg', 'eggs', '🥚'],
  대파: ['대파', '파', 'green onion', 'scallion'],
  감자: ['감자', 'potato', '🥔'],
  고구마: ['고구마', 'sweet potato'],
  양파: ['양파', 'onion', '🧅'],
  당근: ['당근', 'carrot', '🥕'],
  마늘: ['마늘', 'garlic', '🧄'],
  사과: ['사과', 'apple', '🍎'],
  바나나: ['바나나', 'banana', '🍌'],
  토마토: ['토마토', 'tomato', '🍅'],
  시리얼: ['시리얼', 'cereal'],
  밥: ['밥', '쌀', 'rice'],
};

/**
 * 두 단어가 한글/영어 동의어 사전 범위 내에 매칭되는지 판단합니다.
 */
export function areSynonyms(nameA: string, nameB: string): boolean {
  const normA = nameA.toLowerCase().replace(/\s+/g, '').trim();
  const normB = nameB.toLowerCase().replace(/\s+/g, '').trim();
  
  if (normA === normB || normA.includes(normB) || normB.includes(normA)) {
    return true;
  }
  
  for (const key of Object.keys(SYNONYM_DICTIONARY)) {
    const list = SYNONYM_DICTIONARY[key];
    const matchA = list.some(item => normA.includes(item) || item.includes(normA));
    const matchB = list.some(item => normB.includes(item) || item.includes(normB));
    if (matchA && matchB) {
      return true;
    }
  }
  
  return false;
}

/**
 * 냉장고에 입력된 한/영 재료 명칭 매칭용 노멀라이저
 */
export function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '').trim();
}

/**
 * 밀 플랜 재료가 현재 냉장고에 있는지 여부를 체크합니다. (한/영 동의어 매칭 반영)
 * @param planIngredientName 검사할 밀플랜 재료명
 * @param fridgeIngredients 현재 냉장고 내 재료 전체 리스트
 */
export function checkIngredientInFridge(planIngredientName: string, fridgeIngredients: Ingredient[]): boolean {
  const normPlan = normalizeName(planIngredientName);
  if (!normPlan) return true;
  
  return fridgeIngredients.some(item => {
    // 1. 동의어 기반 정밀 매칭
    if (areSynonyms(item.name, planIngredientName)) {
      return true;
    }
    
    const normItem = normalizeName(item.name);
    
    // 2. 카테고리 맵을 통한 키워드 연관성 보완 매칭
    for (const key of Object.keys(CATEGORY_MAP)) {
      const info = CATEGORY_MAP[key];
      const hasPlanKeyword = info.keywords.some(kw => normPlan.includes(kw) || kw.includes(normPlan));
      const hasItemKeyword = info.keywords.some(kw => normItem.includes(kw) || kw.includes(normItem));
      
      if (hasPlanKeyword && hasItemKeyword) {
        return true;
      }
    }
    
    return false;
  });
}

/**
 * 더미 데이터셋 생성기
 */
export function getInitialIngredients(): Ingredient[] {
  const todayStr = formatDate(new Date());
  
  const d3 = new Date();
  d3.setDate(d3.getDate() + 2);
  const d3Str = formatDate(d3);
  
  const d5 = new Date();
  d5.setDate(d5.getDate() + 5);
  const d5Str = formatDate(d5);

  const d10 = new Date();
  d10.setDate(d10.getDate() + 10);
  const d10Str = formatDate(d10);

  const expired = new Date();
  expired.setDate(expired.getDate() - 1);
  const expiredStr = formatDate(expired);

  return [
    {
      id: 'ing-1',
      name: '신선한 우유',
      location: 'fridge',
      expiryDate: d3Str,
      quantity: 1,
      unit: '개',
      category: '유제품',
      emoji: '🥛',
      purchaseDate: todayStr,
      opened: false,
      isExpanded: false,
    },
    {
      id: 'ing-2',
      name: '한우 등심',
      location: 'freezer',
      expiryDate: d10Str,
      quantity: 2,
      unit: '개',
      category: '육류',
      emoji: '🥩',
      purchaseDate: todayStr,
      opened: false,
      isExpanded: false,
    },
    {
      id: 'ing-3',
      name: '대파',
      location: 'fridge',
      expiryDate: expiredStr,
      quantity: 3,
      unit: '개',
      category: '채소·버섯',
      emoji: '🥕',
      purchaseDate: todayStr,
      opened: true,
      openedDate: todayStr,
      isExpanded: false,
    },
    {
      id: 'ing-4',
      name: '토마토 페이스트',
      location: 'pantry',
      expiryDate: d5Str,
      quantity: 1,
      unit: '개',
      category: '소스',
      emoji: '🥫',
      purchaseDate: todayStr,
      opened: false,
      isExpanded: false,
    },
    {
      id: 'ing-5',
      name: '계란',
      location: 'fridge',
      expiryDate: d3Str,
      quantity: 10,
      unit: '개',
      category: '미분류',
      emoji: '🥚',
      purchaseDate: todayStr,
      opened: false,
      isExpanded: false,
    }
  ];
}

export function getInitialMealPlans(): MealPlan {
  const dates = getWeekDates(new Date());
  const plans: MealPlan = {};
  
  dates.forEach((date, index) => {
    const dateStr = formatDate(date);
    if (index === 0) {
      // 월요일 예시
      plans[dateStr] = {
        breakfast: [
          {
            id: 'init-card-bf-1',
            title: '우유에 시리얼',
            ingredients: ['우유', '시리얼'],
            memo: '간단하고 신선하게 먹기',
            recipeUrl: '',
          }
        ],
        lunch: [
          {
            id: 'init-card-lh-1',
            title: '계란 볶음밥',
            ingredients: ['계란', '밥', '대파'],
            memo: '파기름 가득 내서 노릇하게 볶기',
            recipeUrl: '',
          }
        ],
        dinner: [
          {
            id: 'init-card-dn-1',
            title: '소고기 스테이크',
            ingredients: ['소고기', '소금', '버섯'],
            memo: '로즈마리와 버터로 아로제하기',
            recipeUrl: 'https://www.google.com/search?q=소고기+스테이크+굽는법',
          }
        ],
        snack: [
          {
            id: 'init-card-sn-1',
            title: '바나나',
            ingredients: ['바나나'],
            memo: '오후 간식',
            recipeUrl: '',
          }
        ],
      };
    } else {
      plans[dateStr] = {
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: [],
      };
    }
  });
  
  return plans;
}

export function getInitialIdeas(): CookingIdea[] {
  return [
    { id: 'idea-1', text: '얼큰한 부대찌개 요리하기' },
    { id: 'idea-2', text: '부드러운 계란찜 저녁 메뉴' },
    { id: 'idea-3', text: '구운 버섯 샐러드 다이어트식' },
    { id: 'idea-4', text: '대파 가득 해물라면' }
  ];
}

export function getInitialShopping(): ShoppingItem[] {
  return [
    { id: 'shop-1', name: '치즈', completed: false },
    { id: 'shop-2', name: '바나나', completed: false },
    { id: 'shop-3', name: '삼겹살', completed: true },
  ];
}
