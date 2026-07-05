/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ingredient, MealPlan, MealCard, CookingIdea, ShoppingItem, StorageLocation, MealTime } from './types';
import {
  getInitialIngredients,
  getInitialMealPlans,
  getInitialIdeas,
  getInitialShopping,
  analyzeIngredientName,
  formatDate,
} from './utils';
import UrgentAlerts from './components/UrgentAlerts';
import KanbanBoard from './components/KanbanBoard';
import MealPlanSection from './components/MealPlanSection';
import ShoppingAndRecipe from './components/ShoppingAndRecipe';
import { CalendarDays, ShoppingBag, LayoutDashboard, UtensilsCrossed } from 'lucide-react';

function migrateMealPlans(plans: any): MealPlan {
  const migrated: MealPlan = {};
  for (const dateStr of Object.keys(plans)) {
    const day = plans[dateStr];
    if (!day) continue;
    
    const getMigratedMeals = (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
      const val = day[mealType];
      
      // 이미 배열 구조(MealCard[])이면 그대로 활용하되 기본값 보완
      if (Array.isArray(val)) {
        return val.map((m: any) => ({
          id: m.id || `card-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          title: m.title || m.text || '',
          ingredients: m.ingredients || [],
          memo: m.memo || '',
          recipeUrl: m.recipeUrl || '',
        }));
      }
      
      // 구형 string 값이면 마이그레이션 실행
      if (typeof val === 'string' && val.trim() !== '') {
        const ingsKey = `${mealType}Ingredients`;
        const ings = Array.isArray(day[ingsKey]) ? day[ingsKey] : [];
        return [{
          id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          title: val,
          ingredients: ings,
          memo: '',
          recipeUrl: '',
        }];
      }
      
      return [];
    };

    migrated[dateStr] = {
      breakfast: getMigratedMeals('breakfast'),
      lunch: getMigratedMeals('lunch'),
      dinner: getMigratedMeals('dinner'),
      snack: getMigratedMeals('snack'),
    };
  }
  return migrated;
}

export default function App() {
  // --- 상태 관리 ---
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan>({});
  const [cookingIdeas, setCookingIdeas] = useState<CookingIdea[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);

  // 통합 탭 상태 관리 ('home' | 'fridge' | 'mealplan' | 'shopping')
  const [currentTab, setCurrentTab] = useState<'home' | 'fridge' | 'mealplan' | 'shopping'>('home');

  // --- Undo / Redo 역사 관리용 ---
  interface AppStateSnapshot {
    ingredients: Ingredient[];
    mealPlans: MealPlan;
    cookingIdeas: CookingIdea[];
    shoppingList: ShoppingItem[];
  }

  const historyRef = React.useRef<AppStateSnapshot[]>([]);
  const historyIndexRef = React.useRef<number>(-1);
  const isUndoRedoingRef = React.useRef<boolean>(false);

  const stateRef = React.useRef<AppStateSnapshot>({
    ingredients: [],
    mealPlans: {},
    cookingIdeas: [],
    shoppingList: [],
  });

  useEffect(() => {
    stateRef.current = { ingredients, mealPlans, cookingIdeas, shoppingList };
  }, [ingredients, mealPlans, cookingIdeas, shoppingList]);

  // --- 로컬 스토리지 연동 ---
  useEffect(() => {
    // 1. 식재료
    let initIngredients: Ingredient[] = [];
    const storedIngs = localStorage.getItem('freshlog_ingredients');
    if (storedIngs) {
      try {
        initIngredients = JSON.parse(storedIngs);
      } catch (e) {
        initIngredients = getInitialIngredients();
      }
    } else {
      initIngredients = getInitialIngredients();
    }
    setIngredients(initIngredients);

    // 2. 밀 플랜
    let initMealPlans: MealPlan = {};
    const storedPlans = localStorage.getItem('freshlog_mealplan');
    if (storedPlans) {
      try {
        const parsed = JSON.parse(storedPlans);
        initMealPlans = migrateMealPlans(parsed);
      } catch (e) {
        initMealPlans = getInitialMealPlans();
      }
    } else {
      initMealPlans = getInitialMealPlans();
    }
    setMealPlans(initMealPlans);

    // 3. 아이디어
    let initIdeas: CookingIdea[] = [];
    const storedIdeas = localStorage.getItem('freshlog_ideas');
    if (storedIdeas) {
      try {
        initIdeas = JSON.parse(storedIdeas);
      } catch (e) {
        initIdeas = getInitialIdeas();
      }
    } else {
      initIdeas = getInitialIdeas();
    }
    setCookingIdeas(initIdeas);

    // 4. 장보기
    let initShopping: ShoppingItem[] = [];
    const storedShopping = localStorage.getItem('freshlog_shopping');
    if (storedShopping) {
      try {
        initShopping = JSON.parse(storedShopping);
      } catch (e) {
        initShopping = getInitialShopping();
      }
    } else {
      initShopping = getInitialShopping();
    }
    setShoppingList(initShopping);

    // 역사 초기화
    const initialSnapshot: AppStateSnapshot = {
      ingredients: initIngredients,
      mealPlans: initMealPlans,
      cookingIdeas: initIdeas,
      shoppingList: initShopping,
    };
    stateRef.current = initialSnapshot;
    historyRef.current = [initialSnapshot];
    historyIndexRef.current = 0;
  }, []);

  // 상태 변화 시 로컬 스토리지 업데이트 및 역사 기록
  const commitState = (
    nextIngredients: Ingredient[],
    nextMealPlans: MealPlan,
    nextIdeas: CookingIdea[],
    nextShopping: ShoppingItem[]
  ) => {
    // 동기식 레프 업데이트로 즉각적인 동시적 상태 조작 시 stale state 오버라이트 방지
    stateRef.current = {
      ingredients: nextIngredients,
      mealPlans: nextMealPlans,
      cookingIdeas: nextIdeas,
      shoppingList: nextShopping,
    };

    setIngredients(nextIngredients);
    setMealPlans(nextMealPlans);
    setCookingIdeas(nextIdeas);
    setShoppingList(nextShopping);

    localStorage.setItem('freshlog_ingredients', JSON.stringify(nextIngredients));
    localStorage.setItem('freshlog_mealplan', JSON.stringify(nextMealPlans));
    localStorage.setItem('freshlog_ideas', JSON.stringify(nextIdeas));
    localStorage.setItem('freshlog_shopping', JSON.stringify(nextShopping));

    if (!isUndoRedoingRef.current) {
      const snapshot: AppStateSnapshot = {
        ingredients: nextIngredients,
        mealPlans: nextMealPlans,
        cookingIdeas: nextIdeas,
        shoppingList: nextShopping,
      };
      
      const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
      newHistory.push(snapshot);
      
      if (newHistory.length > 100) {
        newHistory.shift();
      }
      
      historyRef.current = newHistory;
      historyIndexRef.current = newHistory.length - 1;
    }
  };

  const saveIngredients = (data: Ingredient[]) => {
    commitState(data, stateRef.current.mealPlans, stateRef.current.cookingIdeas, stateRef.current.shoppingList);
  };

  const saveMealPlans = (data: MealPlan) => {
    commitState(stateRef.current.ingredients, data, stateRef.current.cookingIdeas, stateRef.current.shoppingList);
  };

  const saveIdeas = (data: CookingIdea[]) => {
    commitState(stateRef.current.ingredients, stateRef.current.mealPlans, data, stateRef.current.shoppingList);
  };

  const saveShopping = (data: ShoppingItem[]) => {
    commitState(stateRef.current.ingredients, stateRef.current.mealPlans, stateRef.current.cookingIdeas, data);
  };

  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      isUndoRedoingRef.current = true;
      const prevIndex = historyIndexRef.current - 1;
      const prevSnapshot = historyRef.current[prevIndex];
      
      setIngredients(prevSnapshot.ingredients);
      setMealPlans(prevSnapshot.mealPlans);
      setCookingIdeas(prevSnapshot.cookingIdeas);
      setShoppingList(prevSnapshot.shoppingList);

      localStorage.setItem('freshlog_ingredients', JSON.stringify(prevSnapshot.ingredients));
      localStorage.setItem('freshlog_mealplan', JSON.stringify(prevSnapshot.mealPlans));
      localStorage.setItem('freshlog_ideas', JSON.stringify(prevSnapshot.cookingIdeas));
      localStorage.setItem('freshlog_shopping', JSON.stringify(prevSnapshot.shoppingList));

      historyIndexRef.current = prevIndex;
      isUndoRedoingRef.current = false;
    }
  };

  const handleRedo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      isUndoRedoingRef.current = true;
      const nextIndex = historyIndexRef.current + 1;
      const nextSnapshot = historyRef.current[nextIndex];
      
      setIngredients(nextSnapshot.ingredients);
      setMealPlans(nextSnapshot.mealPlans);
      setCookingIdeas(nextSnapshot.cookingIdeas);
      setShoppingList(nextSnapshot.shoppingList);

      localStorage.setItem('freshlog_ingredients', JSON.stringify(nextSnapshot.ingredients));
      localStorage.setItem('freshlog_mealplan', JSON.stringify(nextSnapshot.mealPlans));
      localStorage.setItem('freshlog_ideas', JSON.stringify(nextSnapshot.cookingIdeas));
      localStorage.setItem('freshlog_shopping', JSON.stringify(nextSnapshot.shoppingList));

      historyIndexRef.current = nextIndex;
      isUndoRedoingRef.current = false;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (isCmdOrCtrl && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // --- 1. 식재료 액션 ---
  const handleAddIngredient = (newItem: Omit<Ingredient, 'id'>) => {
    const id = `ing-${Date.now()}`;
    const updated = [...stateRef.current.ingredients, { ...newItem, id }];
    saveIngredients(updated);
  };

  const handleUpdateIngredient = (id: string, updated: Partial<Ingredient>) => {
    const updatedList = stateRef.current.ingredients.map(item =>
      item.id === id ? { ...item, ...updated } : item
    );
    saveIngredients(updatedList);
  };

  const handleDeleteIngredient = (id: string) => {
    const filtered = stateRef.current.ingredients.filter(item => item.id !== id);
    saveIngredients(filtered);
  };

  // --- 2. 밀 플랜 액션 ---
  const handleUpdateMealPlan = (
    dateStr: string,
    mealTime: MealTime,
    cards: MealCard[]
  ) => {
    const currentDayPlan = stateRef.current.mealPlans[dateStr] || {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };

    const updatedDayPlan = {
      ...currentDayPlan,
      [mealTime]: cards,
    };

    const updatedPlans = {
      ...stateRef.current.mealPlans,
      [dateStr]: updatedDayPlan,
    };

    saveMealPlans(updatedPlans);
  };

  const handleMoveMealCard = (
    sourceDate: string,
    sourceTime: MealTime,
    targetDate: string,
    targetTime: MealTime,
    card: MealCard
  ) => {
    const updatedPlans = { ...stateRef.current.mealPlans };

    // 1. Remove from source
    if (updatedPlans[sourceDate] && updatedPlans[sourceDate][sourceTime]) {
      updatedPlans[sourceDate] = {
        ...updatedPlans[sourceDate],
        [sourceTime]: updatedPlans[sourceDate][sourceTime].filter(c => c.id !== card.id),
      };
    }

    // 2. Add to target
    const targetDay = updatedPlans[targetDate] || {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };
    updatedPlans[targetDate] = {
      ...targetDay,
      [targetTime]: [...(targetDay[targetTime] || []).filter(c => c.id !== card.id), card],
    };

    saveMealPlans(updatedPlans);
  };

  const handleAddCookingIdea = (text: string, ingredientsList: string[] = []) => {
    const newIdea: CookingIdea = {
      id: `idea-${Date.now()}`,
      text,
      ingredients: ingredientsList,
    };
    saveIdeas([...stateRef.current.cookingIdeas, newIdea]);
  };

  const handleDeleteCookingIdea = (id: string) => {
    saveIdeas(stateRef.current.cookingIdeas.filter(idea => idea.id !== id));
  };

  const handleDropIdeaToMealPlan = (
    ideaId: string,
    text: string,
    ideaIngs: string[],
    targetDate: string,
    targetTime: MealTime
  ) => {
    const newCard: MealCard = {
      id: `meal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: text,
      ingredients: ideaIngs,
      memo: '',
      recipeUrl: '',
    };

    const currentDayPlan = stateRef.current.mealPlans[targetDate] || {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };

    const updatedDayPlan = {
      ...currentDayPlan,
      [targetTime]: [...(currentDayPlan[targetTime] || []).filter(c => c.id !== newCard.id), newCard],
    };

    const updatedPlans = {
      ...stateRef.current.mealPlans,
      [targetDate]: updatedDayPlan,
    };

    const updatedIdeas = stateRef.current.cookingIdeas.filter(idea => idea.id !== ideaId);

    commitState(
      stateRef.current.ingredients,
      updatedPlans,
      updatedIdeas,
      stateRef.current.shoppingList
    );
  };

  const handleMoveMealCardToIdeas = (
    sourceDate: string,
    sourceTime: MealTime,
    cardId: string,
    cardTitle: string,
    cardIngredients: string[]
  ) => {
    const updatedPlans = { ...stateRef.current.mealPlans };
    if (updatedPlans[sourceDate] && updatedPlans[sourceDate][sourceTime]) {
      updatedPlans[sourceDate] = {
        ...updatedPlans[sourceDate],
        [sourceTime]: updatedPlans[sourceDate][sourceTime].filter(c => c.id !== cardId),
      };
    }

    const newIdea: CookingIdea = {
      id: `idea-${Date.now()}`,
      text: cardTitle,
      ingredients: cardIngredients,
    };
    const updatedIdeas = [...stateRef.current.cookingIdeas, newIdea];

    commitState(
      stateRef.current.ingredients,
      updatedPlans,
      updatedIdeas,
      stateRef.current.shoppingList
    );
  };

  // --- 3. 장보기 액션 ---
  const handleAddShoppingItem = (name: string, fromMealPlan = false) => {
    // 중복 제거 가드
    if (shoppingList.some(item => item.name.toLowerCase() === name.toLowerCase())) {
      return;
    }

    const newItem: ShoppingItem = {
      id: `shop-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name,
      completed: false,
      addedFromMealPlan: fromMealPlan,
    };
    saveShopping([...shoppingList, newItem]);
  };

  const handleToggleShoppingItem = (id: string) => {
    const updated = shoppingList.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    saveShopping(updated);
  };

  const handleUpdateShoppingItemNote = (id: string, note: string) => {
    const updated = shoppingList.map(item =>
      item.id === id ? { ...item, note } : item
    );
    saveShopping(updated);
  };

  const handleDeleteShoppingItem = (id: string) => {
    saveShopping(shoppingList.filter(item => item.id !== id));
  };

  const handleClearCompletedShopping = () => {
    saveShopping(shoppingList.filter(item => !item.completed));
  };

  // --- 4. 연동 액션 ---
  // 장보기 완료 -> 냉장고 추가 제안 수락 시 연동
  const handleAddFromShoppingToFridge = (name: string) => {
    const { category, emoji } = analyzeIngredientName(name);
    const todayStr = formatDate(new Date());
    
    // 유통기한 비워둠
    const expiryDate = '';

    handleAddIngredient({
      name,
      location: 'fridge',
      expiryDate,
      quantity: 1,
      category,
      emoji,
      purchaseDate: todayStr,
      opened: false,
      memo: '장보기에서 연동됨 🛒',
      isExpanded: false,
    });
  };

  // 밀플랜에서 냉장고에 없는 재료들을 스캔해와서 대량으로 장보기에 푸시하는 시스템
  const handleAutoAddShoppingItems = (missingItemNames: string[]) => {
    let currentShopping = [...shoppingList];
    let changed = false;

    missingItemNames.forEach(name => {
      // 이미 장보기 리스트에 똑같은 이름(소문자 공백 제거 기준 비교)이 없는지 최종 체크
      const lowerClean = name.toLowerCase().replace(/\s+/g, '');
      const alreadyHas = currentShopping.some(item =>
        item.name.toLowerCase().replace(/\s+/g, '') === lowerClean
      );

      if (!alreadyHas) {
        currentShopping.push({
          id: `shop-auto-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name,
          completed: false,
          addedFromMealPlan: true,
        });
        changed = true;
      }
    });

    if (changed) {
      saveShopping(currentShopping);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F7F2] text-[#4A4A4A] pb-32 sm:pb-48 flex flex-col font-sans">
      {/* 🌸 내추럴 톤 헤더 (고정형 sticky 제거하여 스크롤 시 넘어가도록 함) */}
      <header className="bg-white/50 border-b border-[#E0DBCF] py-3 px-4 sm:px-6 shadow-xs backdrop-blur-md">
        <div className="max-w-full px-2 lg:px-6 mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center cursor-pointer" onClick={() => setCurrentTab('home')}>
            <h1 className="text-lg md:text-2xl font-serif font-bold tracking-tight text-[#5D6D54]">
              my virtual kitchen
            </h1>
          </div>
 
          {/* 우측 배너 탑 네비게이션 버튼 4개 (모바일에서는 하단 탭이 있으므로 숨김) */}
          <div className="hidden sm:flex items-center gap-1 bg-[#F9F7F2] border border-[#E0DBCF]/80 p-1 rounded-xl">
            {[
              { key: 'home', label: '홈' },
              { key: 'fridge', label: '식재료' },
              { key: 'mealplan', label: '식단' },
              { key: 'shopping', label: '장보기' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setCurrentTab(tab.key as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  currentTab === tab.key
                    ? 'bg-[#829379] text-white shadow-xs'
                    : 'text-gray-500 hover:text-[#5D6D54] hover:bg-white/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 🏡 메인 레이아웃 본문 */}
      <main className="flex-1 w-full max-w-full px-4 sm:px-6 lg:px-8 mx-auto py-4 sm:py-6">
        {/* 공통: 유통기한 최우선 긴급 배너 */}
        <UrgentAlerts
          ingredients={ingredients}
          onUpdateIngredient={handleUpdateIngredient}
          onDeleteIngredient={handleDeleteIngredient}
        />

        <AnimatePresence mode="wait">
          {/* 1. 홈 대시보드 뷰 (올인원 통합 요약판) */}
          {currentTab === 'home' && (
            <motion.div
              key="home-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {/* 데스크탑 12열 그리드 구조 */}
              <div className="hidden lg:grid grid-cols-12 gap-6">
                {/* 좌측: 식재료 목록 (7 / 12) */}
                <section className="col-span-7 space-y-6">
                  <KanbanBoard
                    ingredients={ingredients}
                    onAddIngredient={handleAddIngredient}
                    onUpdateIngredient={handleUpdateIngredient}
                    onDeleteIngredient={handleDeleteIngredient}
                  />
                </section>

                {/* 우측: 식단 계획 & 장보기 리스트 (5 / 12) */}
                <section className="col-span-5 space-y-6">
                  <MealPlanSection
                    ingredients={ingredients}
                    mealPlans={mealPlans}
                    cookingIdeas={cookingIdeas}
                    onUpdateMealPlan={handleUpdateMealPlan}
                    onMoveMealCard={handleMoveMealCard}
                    onAddCookingIdea={handleAddCookingIdea}
                    onDeleteCookingIdea={handleDeleteCookingIdea}
                    onAutoAddShoppingItems={handleAutoAddShoppingItems}
                    onAddIdeaToMealPlan={handleDropIdeaToMealPlan}
                    onMoveMealCardToIdeas={handleMoveMealCardToIdeas}
                  />

                  <div className="pt-2">
                    <ShoppingAndRecipe
                      ingredients={ingredients}
                      shoppingList={shoppingList}
                      onAddShoppingItem={handleAddShoppingItem}
                      onToggleShoppingItem={handleToggleShoppingItem}
                      onDeleteShoppingItem={handleDeleteShoppingItem}
                      onClearCompletedShopping={handleClearCompletedShopping}
                      onAddFromShoppingToFridge={handleAddFromShoppingToFridge}
                      onUpdateShoppingItemNote={handleUpdateShoppingItemNote}
                    />
                  </div>
                </section>
              </div>

              {/* 모바일 화면에서는 스크롤하며 전 섹션을 한눈에 보임 */}
              <div className="block lg:hidden space-y-8">
                <section className="space-y-4">
                  <KanbanBoard
                    ingredients={ingredients}
                    onAddIngredient={handleAddIngredient}
                    onUpdateIngredient={handleUpdateIngredient}
                    onDeleteIngredient={handleDeleteIngredient}
                  />
                </section>

                <section className="space-y-4">
                  <MealPlanSection
                    ingredients={ingredients}
                    mealPlans={mealPlans}
                    cookingIdeas={cookingIdeas}
                    onUpdateMealPlan={handleUpdateMealPlan}
                    onMoveMealCard={handleMoveMealCard}
                    onAddCookingIdea={handleAddCookingIdea}
                    onDeleteCookingIdea={handleDeleteCookingIdea}
                    onAutoAddShoppingItems={handleAutoAddShoppingItems}
                    onAddIdeaToMealPlan={handleDropIdeaToMealPlan}
                    onMoveMealCardToIdeas={handleMoveMealCardToIdeas}
                  />
                </section>

                <section className="space-y-4">
                  <ShoppingAndRecipe
                    ingredients={ingredients}
                    shoppingList={shoppingList}
                    onAddShoppingItem={handleAddShoppingItem}
                    onToggleShoppingItem={handleToggleShoppingItem}
                    onDeleteShoppingItem={handleDeleteShoppingItem}
                    onClearCompletedShopping={handleClearCompletedShopping}
                    onAddFromShoppingToFridge={handleAddFromShoppingToFridge}
                    onUpdateShoppingItemNote={handleUpdateShoppingItemNote}
                  />
                </section>
              </div>
            </motion.div>
          )}

          {/* 2. 식재료 상세 전면 뷰 */}
          {currentTab === 'fridge' && (
            <motion.div
              key="fridge-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="max-w-full space-y-4"
            >
              <KanbanBoard
                ingredients={ingredients}
                onAddIngredient={handleAddIngredient}
                onUpdateIngredient={handleUpdateIngredient}
                onDeleteIngredient={handleDeleteIngredient}
              />
            </motion.div>
          )}

          {/* 3. 식단 계획 상세 전면 뷰 */}
          {currentTab === 'mealplan' && (
            <motion.div
              key="mealplan-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="max-w-full space-y-4"
            >
              <MealPlanSection
                ingredients={ingredients}
                mealPlans={mealPlans}
                cookingIdeas={cookingIdeas}
                onUpdateMealPlan={handleUpdateMealPlan}
                onMoveMealCard={handleMoveMealCard}
                onAddCookingIdea={handleAddCookingIdea}
                onDeleteCookingIdea={handleDeleteCookingIdea}
                onAutoAddShoppingItems={handleAutoAddShoppingItems}
                onAddIdeaToMealPlan={handleDropIdeaToMealPlan}
                onMoveMealCardToIdeas={handleMoveMealCardToIdeas}
                isWeekView={true}
              />
            </motion.div>
          )}

          {/* 4. 장보기 리스트 상세 전면 뷰 */}
          {currentTab === 'shopping' && (
            <motion.div
              key="shopping-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="max-w-full space-y-4"
            >
              <h2 className="font-serif font-bold text-lg text-[#5D6D54] flex items-center gap-1.5">
                <span>🛒</span> 장보기 목록
              </h2>
              <ShoppingAndRecipe
                ingredients={ingredients}
                shoppingList={shoppingList}
                onAddShoppingItem={handleAddShoppingItem}
                onToggleShoppingItem={handleToggleShoppingItem}
                onDeleteShoppingItem={handleDeleteShoppingItem}
                onClearCompletedShopping={handleClearCompletedShopping}
                onAddFromShoppingToFridge={handleAddFromShoppingToFridge}
                onUpdateShoppingItemNote={handleUpdateShoppingItemNote}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 📱 모바일 하단 탭 바 - 4개 탭 동기화 (Home 포함) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 border-t border-[#E0DBCF] py-2 px-2 flex justify-around items-center z-40 shadow-md backdrop-blur-md">
        <button
          id="tab-home"
          onClick={() => setCurrentTab('home')}
          className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-xl transition-all ${
            currentTab === 'home'
              ? 'bg-[#E0DBCF]/60 text-[#5D6D54] font-bold shadow-xs'
              : 'text-[#8A7A78] hover:text-[#5D6D54]'
          }`}
        >
          <LayoutDashboard size={17} />
          <span className="text-[9px]">홈</span>
        </button>

        <button
          id="tab-fridge"
          onClick={() => setCurrentTab('fridge')}
          className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-xl transition-all ${
            currentTab === 'fridge'
              ? 'bg-[#DDE5D7] text-[#5D6D54] font-bold shadow-xs'
              : 'text-[#8A7A78] hover:text-[#5D6D54]'
          }`}
        >
          <span>🍱</span>
          <span className="text-[9px]">식재료</span>
        </button>

        <button
          id="tab-mealplan"
          onClick={() => setCurrentTab('mealplan')}
          className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-xl transition-all ${
            currentTab === 'mealplan'
              ? 'bg-[#F2E1E1] text-[#9E7676] font-bold shadow-xs'
              : 'text-[#8A7A78] hover:text-[#5D6D54]'
          }`}
        >
          <CalendarDays size={17} />
          <span className="text-[9px]">식단</span>
        </button>

        <button
          id="tab-shopping"
          onClick={() => setCurrentTab('shopping')}
          className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-xl transition-all ${
            currentTab === 'shopping'
              ? 'bg-[#E3F2FD]/80 text-blue-700 font-bold shadow-xs'
              : 'text-[#8A7A78] hover:text-[#5D6D54]'
          }`}
        >
          <ShoppingBag size={17} />
          <span className="text-[9px]">장보기</span>
        </button>
      </nav>

      {/* 🪵 차분한 푸터 크레딧 */}
      <footer className="w-full text-center py-6 text-[10px] text-gray-400 font-sans mt-auto border-t border-dashed border-[#E0DBCF]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>my virtual kitchen © 2026.</p>
          <p>Local Storage 구동</p>
        </div>
      </footer>
    </div>
  );
}

