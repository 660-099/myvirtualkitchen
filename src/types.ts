/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type StorageLocation = 'fridge' | 'freezer' | 'pantry' | 'etc';

export interface Ingredient {
  id: string;
  name: string;
  location: StorageLocation;
  expiryDate: string; // YYYY-MM-DD
  quantity: number;
  unit?: string; // 식재료 단위 (개, g, kg, ml, L, 팩, 봉지, 병 등)
  category: string;
  emoji: string;
  purchaseDate: string; // YYYY-MM-DD
  openedDate?: string;  // YYYY-MM-DD
  frozenDate?: string;  // YYYY-MM-DD (냉동한 날짜)
  opened: boolean;
  memo?: string;
  isExpanded?: boolean;
}

export type MealTime = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealCard {
  id: string;
  title: string;
  ingredients: string[]; // 식단에 필요한 재료들 (자동 스캔용)
  memo?: string;         // 메모 칸
  recipeUrl?: string;    // 레시피 링크
}

export interface MealPlanDay {
  breakfast: MealCard[];
  lunch: MealCard[];
  dinner: MealCard[];
  snack: MealCard[];
}

export interface MealPlan {
  [dateStr: string]: MealPlanDay; // "YYYY-MM-DD" -> 하루 식단
}

export interface CookingIdea {
  id: string;
  text: string;
  ingredients?: string[];
}

export interface ShoppingItem {
  id: string;
  name: string;
  completed: boolean;
  addedFromMealPlan?: boolean;
  note?: string;
}
