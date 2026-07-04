/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MealPlan, MealCard, CookingIdea, Ingredient, MealTime } from '../types';
import { formatDate, checkIngredientInFridge } from '../utils';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Plus,
  Trash2,
  CalendarDays,
  Check,
  Search,
  X,
  ExternalLink,
  Edit3,
  Calendar,
  Save,
  Undo
} from 'lucide-react';

interface MealPlanSectionProps {
  ingredients: Ingredient[];
  mealPlans: MealPlan;
  cookingIdeas: CookingIdea[];
  onUpdateMealPlan: (dateStr: string, mealTime: MealTime, cards: MealCard[]) => void;
  onAddCookingIdea: (text: string, ingredients: string[]) => void;
  onDeleteCookingIdea: (id: string) => void;
  onAutoAddShoppingItems: (items: string[]) => void;
  isWeekView?: boolean;
}

const MEAL_TIMES: MealTime[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_LABELS: { [key in MealTime]: string } = {
  breakfast: '아침 🍳',
  lunch: '점심 🍱',
  dinner: '저녁 🥩',
  snack: '간식 🍪',
};

export default function MealPlanSection({
  ingredients,
  mealPlans,
  cookingIdeas,
  onUpdateMealPlan,
  onAddCookingIdea,
  onDeleteCookingIdea,
  onAutoAddShoppingItems,
  isWeekView = false,
}: MealPlanSectionProps) {
  // 기준 날짜 상태 (주간 이동용)
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());

  // 현재 편집 대상 카드 ID 상태 (카드 하나하나 개별로 인라인 편집)
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  // 카드 편집용 임시 값들
  const [editCardTitle, setEditCardTitle] = useState('');
  const [editCardIngredients, setEditCardIngredients] = useState<string[]>([]);
  const [editCardMemo, setEditCardMemo] = useState('');
  const [editCardRecipeUrl, setEditCardRecipeUrl] = useState('');
  const [customIngInput, setCustomIngInput] = useState('');

  // 요일 내의 특정 끼니에 새 카드 추가를 위한 활성 폼 타겟
  const [addingCardTarget, setAddingCardTarget] = useState<{ dateStr: string; mealTime: MealTime } | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');

  // 아이디어 추가용 입력 상태
  const [newIdeaText, setNewIdeaText] = useState('');
  const [newIdeaIngredients, setNewIdeaIngredients] = useState<string[]>([]);
  const [newIdeaCustomIng, setNewIdeaCustomIng] = useState('');
  const [showAddIdeaForm, setShowAddIdeaForm] = useState(false);

  // 레시피 다중 검색 칩스 상태 (식단 탭 내 상시 우측 컬럼 연동)
  const [selectedRecipeTags, setSelectedRecipeTags] = useState<string[]>([]);
  const [recipeSearchQuery, setRecipeSearchQuery] = useState('');
  const [isRecipeDropdownOpen, setIsRecipeDropdownOpen] = useState(false);

  // 커스텀 달력 팝오버 상태
  const [showCalendarPopover, setShowCalendarPopover] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(new Date());

  // 드래그 상태 관리
  const [draggedCardData, setDraggedCardData] = useState<{
    sourceDate: string;
    sourceTime: MealTime;
    card: MealCard;
  } | null>(null);

  const [draggedIdeaData, setDraggedIdeaData] = useState<{
    id: string;
    text: string;
    ingredients: string[];
  } | null>(null);

  const [dragOverTarget, setDragOverTarget] = useState<{ dateStr: string; mealTime: MealTime } | null>(null);

  // 화면에 표시될 일자 목록 생성
  const displayedDates: Date[] = [];
  if (isWeekView) {
    // 일요일부터 토요일까지 7일 생성
    const current = new Date(referenceDate);
    const day = current.getDay(); // 0(일) ~ 6(토)
    const sunday = new Date(current);
    sunday.setDate(current.getDate() - day);
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      displayedDates.push(d);
    }
  } else {
    // 기준일 포함 3일간 생성
    for (let i = 0; i < 3; i++) {
      const d = new Date(referenceDate);
      d.setDate(referenceDate.getDate() + i);
      displayedDates.push(d);
    }
  }

  // 클릭 바깥 감지
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // 레시피 검색창 바깥 클릭 시 닫기
      if (!target.closest('.recipe-search-container')) {
        setIsRecipeDropdownOpen(false);
      }

      // 달력 팝오버 바깥 클릭 시 닫기
      if (!target.closest('.calendar-popover-container')) {
        setShowCalendarPopover(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // 날짜 제어 핸들러
  const handlePrevDay = () => {
    const nextDate = new Date(referenceDate);
    nextDate.setDate(referenceDate.getDate() - (isWeekView ? 7 : 1));
    setReferenceDate(nextDate);
  };

  const handleNextDay = () => {
    const nextDate = new Date(referenceDate);
    nextDate.setDate(referenceDate.getDate() + (isWeekView ? 7 : 1));
    setReferenceDate(nextDate);
  };

  const handleToday = () => {
    setReferenceDate(new Date());
  };

  // --- 식단 카드 직접 추가 폼 ---
  const startAddingCard = (dateStr: string, mealTime: MealTime) => {
    setAddingCardTarget({ dateStr, mealTime });
    setNewCardTitle('');
  };

  const handleAddCardSubmit = (dateStr: string, mealTime: MealTime) => {
    if (!newCardTitle.trim()) {
      setAddingCardTarget(null);
      return;
    }

    const currentCards = mealPlans[dateStr]?.[mealTime] || [];
    const newCard: MealCard = {
      id: `meal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: newCardTitle.trim(),
      ingredients: [],
      memo: '',
      recipeUrl: '',
    };

    onUpdateMealPlan(dateStr, mealTime, [...currentCards, newCard]);
    setAddingCardTarget(null);
    setNewCardTitle('');

    // 생성 직후 편집모드 진입으로 빠른 메모/레시피 등록 유도
    startEditingCard(newCard);
  };

  // --- 식단 카드 편집 시스템 ---
  const startEditingCard = (card: MealCard) => {
    setEditingCardId(card.id);
    setEditCardTitle(card.title);
    setEditCardIngredients(card.ingredients || []);
    setEditCardMemo(card.memo || '');
    setEditCardRecipeUrl(card.recipeUrl || '');
    setCustomIngInput('');
  };

  const saveCardEdit = (dateStr: string, mealTime: MealTime, cardId: string) => {
    const currentCards = mealPlans[dateStr]?.[mealTime] || [];
    const updatedCards = currentCards.map(c => {
      if (c.id === cardId) {
        return {
          ...c,
          title: editCardTitle.trim(),
          ingredients: editCardIngredients,
          memo: editCardMemo.trim(),
          recipeUrl: editCardRecipeUrl.trim(),
        };
      }
      return c;
    });

    onUpdateMealPlan(dateStr, mealTime, updatedCards);

    // 냉장고에 없는 재료 자동 장보기 추가 리포트
    const missingItems = editCardIngredients.filter(ing => !checkIngredientInFridge(ing, ingredients));
    if (missingItems.length > 0) {
      onAutoAddShoppingItems(missingItems);
    }

    setEditingCardId(null);
  };

  const deleteCard = (dateStr: string, mealTime: MealTime, cardId: string) => {
    if (confirm('이 요리 카드를 식단표에서 삭제할까요?')) {
      const currentCards = mealPlans[dateStr]?.[mealTime] || [];
      const filtered = currentCards.filter(c => c.id !== cardId);
      onUpdateMealPlan(dateStr, mealTime, filtered);
      if (editingCardId === cardId) {
        setEditingCardId(null);
      }
    }
  };

  // 재료 칩 헬퍼
  const addIngredientChip = (name: string) => {
    const cleaned = name.trim();
    if (!cleaned) return;
    if (editCardIngredients.includes(cleaned)) return;
    setEditCardIngredients(prev => [...prev, cleaned]);
    setCustomIngInput('');
  };

  const removeIngredientChip = (index: number) => {
    setEditCardIngredients(prev => prev.filter((_, i) => i !== index));
  };

  // --- 드래그 앤 드롭 구현 ---
  const handleCardDragStart = (e: React.DragEvent, dateStr: string, mealTime: MealTime, card: MealCard) => {
    setDraggedCardData({ sourceDate: dateStr, sourceTime: mealTime, card });
    e.dataTransfer.setData('text/plain', card.title);
  };

  const handleIdeaDragStart = (e: React.DragEvent, idea: CookingIdea) => {
    setDraggedIdeaData({ id: idea.id, text: idea.text, ingredients: idea.ingredients || [] });
    e.dataTransfer.setData('text/plain', idea.text);
  };

  const handleDragOverZone = (e: React.DragEvent, dateStr: string, mealTime: MealTime) => {
    e.preventDefault();
    if (dragOverTarget?.dateStr !== dateStr || dragOverTarget?.mealTime !== mealTime) {
      setDragOverTarget({ dateStr, mealTime });
    }
  };

  const handleDragLeaveZone = () => {
    setDragOverTarget(null);
  };

  const handleDropOnZone = (e: React.DragEvent, dateStr: string, mealTime: MealTime) => {
    e.preventDefault();
    setDragOverTarget(null);

    // 1. 달력 카드 이동
    if (draggedCardData) {
      const { sourceDate, sourceTime, card } = draggedCardData;
      
      // 같은 슬롯에 제자리 드롭한 경우 무시
      if (sourceDate === dateStr && sourceTime === mealTime) {
        setDraggedCardData(null);
        return;
      }

      // 원래 슬롯에서 제거
      const sourceList = mealPlans[sourceDate]?.[sourceTime] || [];
      const filteredSource = sourceList.filter(c => c.id !== card.id);
      onUpdateMealPlan(sourceDate, sourceTime, filteredSource);

      // 대상 슬롯에 추가
      const targetList = mealPlans[dateStr]?.[mealTime] || [];
      onUpdateMealPlan(dateStr, mealTime, [...targetList, card]);

      setDraggedCardData(null);
      return;
    }

    // 2. 요리 아이디어를 드롭해서 새 식단 카드로 장착
    if (draggedIdeaData) {
      const { id, text, ingredients: ideaIngs } = draggedIdeaData;
      const targetList = mealPlans[dateStr]?.[mealTime] || [];
      
      const newCard: MealCard = {
        id: `meal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: text,
        ingredients: ideaIngs,
        memo: '',
        recipeUrl: '',
      };

      onUpdateMealPlan(dateStr, mealTime, [...targetList, newCard]);
      onDeleteCookingIdea(id); // 보관소에서 식단으로 배치했으므로 기존 아이디어는 소진 처리

      // 스캔 재료 자동 장보기 매칭 연동
      const missing = ideaIngs.filter(ing => !checkIngredientInFridge(ing, ingredients));
      if (missing.length > 0) {
        onAutoAddShoppingItems(missing);
      }

      setDraggedIdeaData(null);
      return;
    }

    // 3. 임의 텍스트 드롭 폴백
    const plainText = e.dataTransfer.getData('text/plain');
    if (plainText) {
      const targetList = mealPlans[dateStr]?.[mealTime] || [];
      const newCard: MealCard = {
        id: `meal-${Date.now()}`,
        title: plainText,
        ingredients: [],
        memo: '',
        recipeUrl: '',
      };
      onUpdateMealPlan(dateStr, mealTime, [...targetList, newCard]);
    }
  };

  // --- 레시피 검색 태그 제어 ---
  const handleToggleRecipeTag = (materialName: string) => {
    if (selectedRecipeTags.includes(materialName)) {
      setSelectedRecipeTags(prev => prev.filter(tag => tag !== materialName));
    } else {
      setSelectedRecipeTags(prev => [...prev, materialName]);
    }
  };

  const handleGoogleRecipeSearch = () => {
    if (selectedRecipeTags.length === 0) {
      alert('최소 1개 이상의 재료 태그를 선택해 주세요!');
      return;
    }
    const query = selectedRecipeTags.join('+') + '+레시피';
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.open(searchUrl, '_blank');
  };

  const uniqueFridgeMaterials = ingredients.map(ing => ing.name.trim());
  const filteredMaterials = uniqueFridgeMaterials
    .filter((value, index, self) => self.indexOf(value) === index)
    .filter(name => name.toLowerCase().includes(recipeSearchQuery.toLowerCase()));

  // --- 커스텀 범위 하이라이트 달력 렌더링 로직 ---
  const generateCalendarDays = () => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    
    const firstDayIndex = new Date(year, month, 1).getDay(); // 해당 월 1일의 요일
    const totalDays = new Date(year, month + 1, 0).getDate(); // 해당 월의 전체 일 수
    
    const days: (Date | null)[] = [];
    
    // 1일 이전 빈 칸 채우기
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    
    // 일자들 채우기
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(year, month, d));
    }
    
    return days;
  };

  const handleCalendarNavigate = (direction: 'prev' | 'next') => {
    const d = new Date(calendarViewDate);
    d.setMonth(d.getMonth() + (direction === 'prev' ? -1 : 1));
    setCalendarViewDate(d);
  };

  const isDateHighlighted = (date: Date) => {
    return displayedDates.some(d => formatDate(d) === formatDate(date));
  };

  return (
    <div className="space-y-6">
      {/* 📅 주간 및 대시보드 캘린더 메인 보드 */}
      <div className="bg-white/40 border border-[#E0DBCF] rounded-2xl p-5 shadow-sm text-[#4A4A4A]">
        
        {/* 상단 캘린더 조작 바 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dashed border-[#E0DBCF] pb-4 mb-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="text-[#829379]" size={20} />
            <h3 className="font-serif font-bold text-base md:text-lg text-[#5D6D54]">
              식단 계획표
            </h3>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto relative calendar-popover-container">
            {/* 🌟 커스텀 하이라이트 달력 토글 버튼 */}
            <button
              onClick={() => {
                setCalendarViewDate(new Date(referenceDate));
                setShowCalendarPopover(!showCalendarPopover);
              }}
              className="p-2 hover:bg-[#F9F7F2] rounded-xl border border-[#E0DBCF] text-[#4A4A4A] transition-colors flex items-center justify-center gap-1.5 bg-white text-xs font-bold"
              title="캘린더 전체 날짜 범위 탐색"
            >
              <Calendar size={14} className="text-[#829379]" />
              <span>날짜 이동</span>
            </button>

            {/* 📍 커스텀 범위 하이라이트 달력 팝오버 */}
            {showCalendarPopover && (
              <div className="absolute right-0 top-10 z-50 bg-white border border-[#E0DBCF] rounded-2xl p-4 shadow-2xl w-64 text-left space-y-3">
                <div className="flex items-center justify-between border-b border-[#E0DBCF]/60 pb-2">
                  <span className="font-serif font-bold text-xs text-[#5D6D54]">
                    {calendarViewDate.getFullYear()}년 {calendarViewDate.getMonth() + 1}월
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleCalendarNavigate('prev')}
                      className="p-1 hover:bg-[#F9F7F2] rounded-md border border-[#E0DBCF]/60 text-[#4A4A4A]"
                    >
                      <ChevronLeft size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCalendarNavigate('next')}
                      className="p-1 hover:bg-[#F9F7F2] rounded-md border border-[#E0DBCF]/60 text-[#4A4A4A]"
                    >
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center">
                  {['일', '월', '화', '수', '목', '금', '토'].map((w, idx) => (
                    <span
                      key={idx}
                      className={`text-[9px] font-bold ${
                        idx === 0 ? 'text-[#C26D6D]' : idx === 6 ? 'text-[#6C8EBF]' : 'text-gray-400'
                      }`}
                    >
                      {w}
                    </span>
                  ))}

                  {generateCalendarDays().map((dayObj, dIdx) => {
                    if (!dayObj) return <span key={`empty-${dIdx}`} />;
                    
                    const isToday = formatDate(dayObj) === formatDate(new Date());
                    const isRefDate = formatDate(dayObj) === formatDate(referenceDate);
                    const isRangeHighlighted = isDateHighlighted(dayObj);

                    let dayStyle = 'hover:bg-[#829379]/10 rounded-lg text-gray-700 text-[10px] font-bold p-1 transition-all ';
                    
                    if (isRangeHighlighted) {
                      dayStyle += 'bg-[#829379]/15 border border-[#829379]/20 ';
                    }
                    if (isRefDate) {
                      dayStyle += 'bg-[#829379]! text-white! shadow-md ';
                    } else if (isToday) {
                      dayStyle += 'text-[#829379] underline font-extrabold ';
                    }

                    return (
                      <button
                        key={dIdx}
                        type="button"
                        onClick={() => {
                          setReferenceDate(dayObj);
                          setShowCalendarPopover(false);
                        }}
                        className={dayStyle}
                        title={isRangeHighlighted ? '현재 페이지에 노출된 범위' : ''}
                      >
                        {dayObj.getDate()}
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-[#E0DBCF]/40 pt-2 flex items-center justify-between text-[8px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#829379]/15 border border-[#829379]/30" />
                    현재 노출 범위 ({isWeekView ? '7일' : '3일'})
                  </span>
                  <button
                    onClick={() => {
                      setReferenceDate(new Date());
                      setShowCalendarPopover(false);
                    }}
                    className="text-[#829379] font-bold hover:underline"
                  >
                    오늘로 가기
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handlePrevDay}
              className="p-2 hover:bg-[#F9F7F2] rounded-xl border border-[#E0DBCF] text-[#4A4A4A] transition-colors bg-white"
              title="이전 날짜 이동"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 hover:bg-[#F9F7F2] rounded-xl border border-[#E0DBCF] text-xs font-bold text-[#4A4A4A] transition-colors bg-white"
            >
              Today
            </button>
            <button
              onClick={handleNextDay}
              className="p-2 hover:bg-[#F9F7F2] rounded-xl border border-[#E0DBCF] text-[#4A4A4A] transition-colors bg-white"
              title="다음 날짜 이동"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* 캘린더 격자 구조 */}
        <div className={`grid grid-cols-1 gap-4 pb-1 ${isWeekView ? 'sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7' : 'md:grid-cols-3'}`}>
          {displayedDates.map((dateObj) => {
            const dateStr = formatDate(dateObj);
            const isToday = dateStr === formatDate(new Date());

            const dayOfWeekEng = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][dateObj.getDay()];
            const compactDateStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()} ${dayOfWeekEng}`;

            const getDayColorClass = (dIndex: number) => {
              if (dIndex === 0) return 'text-[#C26D6D]'; // 일요일
              if (dIndex === 6) return 'text-[#6C8EBF]';  // 토요일
              return 'text-[#4A4A4A]/70';
            };
            const dayColorClass = getDayColorClass(dateObj.getDay());

            const dayPlan = mealPlans[dateStr] || {
              breakfast: [],
              lunch: [],
              dinner: [],
              snack: [],
            };

            return (
              <div
                key={dateStr}
                className={`rounded-xl border p-4 flex flex-col min-h-[350px] transition-all ${
                  isToday
                    ? 'border-[#829379] bg-white/90 ring-4 ring-[#829379]/10 shadow-md'
                    : 'border-[#E0DBCF] bg-white/40'
                }`}
              >
                {/* 요일 헤더 */}
                <div className="text-center pb-2 border-b border-[#E0DBCF]/80 mb-3 pt-1">
                  <span className={`text-xs font-mono font-extrabold flex items-center justify-center gap-1 ${isToday ? 'text-[#829379]' : dayColorClass}`}>
                    {compactDateStr}
                  </span>
                </div>

                {/* 4대 끼니 리스트 */}
                <div className="flex-1 flex flex-col gap-3.5">
                  {MEAL_TIMES.map(mealTime => {
                    const cards: MealCard[] = dayPlan[mealTime] || [];
                    const isDragOver = dragOverTarget?.dateStr === dateStr && dragOverTarget?.mealTime === mealTime;

                    return (
                      <div
                        key={mealTime}
                        onDragOver={e => handleDragOverZone(e, dateStr, mealTime)}
                        onDragLeave={handleDragLeaveZone}
                        onDrop={e => handleDropOnZone(e, dateStr, mealTime)}
                        className={`rounded-xl p-2 border border-dashed transition-all relative ${
                          isDragOver 
                            ? 'border-[#829379] bg-[#829379]/10' 
                            : 'border-[#E0DBCF]/50 bg-white/10 hover:bg-white/35'
                        }`}
                      >
                        {/* 끼니 타이틀 헤더 */}
                        <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold mb-1.5 uppercase tracking-wide border-b border-[#E0DBCF]/20 pb-0.5">
                          <span className="text-[#5D6D54]/80">{MEAL_LABELS[mealTime]} ({cards.length})</span>
                          <button
                            type="button"
                            onClick={() => startAddingCard(dateStr, mealTime)}
                            className="text-[#829379] hover:text-[#5D6D54] hover:bg-[#829379]/10 p-0.5 rounded transition-all"
                            title="새 식단 추가"
                          >
                            <Plus size={11} />
                          </button>
                        </div>

                        {/* 끼니 내 새 식단 추가 입력 상자 */}
                        {addingCardTarget?.dateStr === dateStr && addingCardTarget?.mealTime === mealTime && (
                          <div className="mb-2 bg-white border border-[#E0DBCF] rounded-lg p-1.5 space-y-1.5 shadow-xs">
                            <input
                              type="text"
                              value={newCardTitle}
                              onChange={e => setNewCardTitle(e.target.value)}
                              placeholder="요리 명칭 입력..."
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddCardSubmit(dateStr, mealTime);
                                }
                              }}
                              className="w-full bg-transparent border-none text-[11px] p-0.5 focus:outline-hidden font-bold"
                              autoFocus
                            />
                            <div className="flex justify-end gap-1 text-[9px] font-bold">
                              <button
                                type="button"
                                onClick={() => setAddingCardTarget(null)}
                                className="text-gray-400 px-1.5 py-0.5 rounded hover:bg-gray-50"
                              >
                                취소
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAddCardSubmit(dateStr, mealTime)}
                                className="text-white bg-[#829379] px-2 py-0.5 rounded hover:bg-[#6D7D65]"
                              >
                                등록
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 배치된 요리 카드들 */}
                        <div className="space-y-1.5 min-h-[40px]">
                          {cards.length === 0 ? (
                            <div className="text-[10px] text-gray-300 italic py-3 text-center">
                              식단 비어있음
                            </div>
                          ) : (
                            cards.map(card => {
                              const isEditing = editingCardId === card.id;

                              return (
                                <div
                                  key={card.id}
                                  draggable={!isEditing}
                                  onDragStart={e => handleCardDragStart(e, dateStr, mealTime, card)}
                                  className={`group relative rounded-lg border p-2 text-left bg-white transition-all shadow-2xs ${
                                    isEditing 
                                      ? 'border-[#829379] ring-2 ring-[#829379]/10 shadow-md' 
                                      : 'border-[#E0DBCF]/80 cursor-grab active:cursor-grabbing hover:shadow-xs hover:border-[#829379]/40'
                                  }`}
                                >
                                  {isEditing ? (
                                    /* ✏️ 인라인 정밀 카드 편집 양식 */
                                    <div className="space-y-2.5 text-[11px]" onClick={e => e.stopPropagation()}>
                                      <div>
                                        <label className="text-[8px] text-gray-400 font-bold block">요리 이름</label>
                                        <input
                                          type="text"
                                          value={editCardTitle}
                                          onChange={e => setEditCardTitle(e.target.value)}
                                          className="w-full bg-[#F9F7F2] border border-[#E0DBCF] rounded px-1.5 py-0.5 focus:outline-hidden font-bold text-xs"
                                        />
                                      </div>

                                      {/* 재료 목록 관리 */}
                                      <div className="space-y-1">
                                        <label className="text-[8px] text-gray-400 font-bold block">재료 매칭 ({editCardIngredients.length})</label>
                                        <div className="flex flex-wrap gap-0.5 max-h-16 overflow-y-auto mb-1">
                                          {editCardIngredients.map((ing, ingIdx) => {
                                            const inFridge = checkIngredientInFridge(ing, ingredients);
                                            return (
                                              <span
                                                key={ingIdx}
                                                className={`text-[8px] font-bold px-1.5 py-0.2 rounded-md flex items-center gap-0.5 ${
                                                  inFridge ? 'bg-[#DDE5D7] text-[#5D6D54]' : 'bg-[#F2E1E1] text-[#9E7676] border border-[#E9C7C7]/50'
                                                }`}
                                              >
                                                <span>{ing}</span>
                                                <button
                                                  type="button"
                                                  onClick={() => removeIngredientChip(ingIdx)}
                                                  className="hover:text-red-500 text-[10px] font-extralight"
                                                >
                                                  ×
                                                </button>
                                              </span>
                                            );
                                          })}
                                        </div>

                                        <input
                                          type="text"
                                          value={customIngInput}
                                          onChange={e => setCustomIngInput(e.target.value)}
                                          placeholder="재료 적고 엔터"
                                          onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              addIngredientChip(customIngInput);
                                            }
                                          }}
                                          className="w-full bg-[#F9F7F2] border border-[#E0DBCF] rounded px-1.5 py-0.5 focus:outline-hidden text-[9px]"
                                        />

                                        {/* 냉장고 재료 퀵 추가창 */}
                                        {ingredients.length > 0 && (
                                          <div className="max-h-20 overflow-y-auto bg-white border border-[#E0DBCF] rounded p-1 space-y-0.5 text-[8px]">
                                            <p className="text-gray-400 font-bold px-1 mb-0.5">냉장고 재료 매칭:</p>
                                            {ingredients.map(ing => {
                                              const selected = editCardIngredients.includes(ing.name);
                                              return (
                                                <button
                                                  key={ing.id}
                                                  type="button"
                                                  onClick={() => addIngredientChip(ing.name)}
                                                  className={`w-full text-left p-0.5 rounded flex items-center justify-between ${
                                                    selected ? 'bg-[#DDE5D7]/40 text-[#5D6D54]' : 'hover:bg-gray-50 text-gray-500'
                                                  }`}
                                                >
                                                  <span>{ing.emoji} {ing.name}</span>
                                                  {selected && <Check size={8} />}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>

                                      {/* 메모 칸 */}
                                      <div>
                                        <label className="text-[8px] text-gray-400 font-bold block">조리 메모</label>
                                        <input
                                          type="text"
                                          value={editCardMemo}
                                          onChange={e => setEditCardMemo(e.target.value)}
                                          placeholder="맵기 조절, 불조절 등 기록"
                                          className="w-full bg-[#F9F7F2] border border-[#E0DBCF] rounded px-1.5 py-0.5 focus:outline-hidden text-[9px]"
                                        />
                                      </div>

                                      {/* 레시피 링크 칸 */}
                                      <div>
                                        <label className="text-[8px] text-gray-400 font-bold block">레시피 웹주소(URL)</label>
                                        <input
                                          type="text"
                                          value={editCardRecipeUrl}
                                          onChange={e => setEditCardRecipeUrl(e.target.value)}
                                          placeholder="https://..."
                                          className="w-full bg-[#F9F7F2] border border-[#E0DBCF] rounded px-1.5 py-0.5 focus:outline-hidden text-[9px] font-mono text-blue-600"
                                        />
                                      </div>

                                      {/* 제어 버튼 */}
                                      <div className="flex justify-between items-center pt-1 border-t border-[#E0DBCF]/50 text-[9px] font-bold">
                                        <button
                                          type="button"
                                          onClick={() => deleteCard(dateStr, mealTime, card.id)}
                                          className="text-[#9E7676] hover:underline"
                                        >
                                          삭제
                                        </button>
                                        <div className="flex gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => setEditingCardId(null)}
                                            className="text-gray-400 px-1.5 py-0.5 rounded hover:bg-[#F9F7F2]"
                                          >
                                            취소
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => saveCardEdit(dateStr, mealTime, card.id)}
                                            className="bg-[#829379] text-white px-2 py-0.5 rounded hover:bg-[#6D7D65]"
                                          >
                                            저장
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    /* 🍽️ 기본 카드 렌더링 화면 */
                                    <div className="space-y-1">
                                      <div className="flex items-start justify-between gap-1.5">
                                        <span className="font-bold text-[#4A4A4A] text-xs leading-tight block break-words">
                                          {card.title}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => startEditingCard(card)}
                                          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-[#829379] p-0.5 rounded whitespace-nowrap"
                                          title="상세 수정"
                                        >
                                          <Edit3 size={10} />
                                        </button>
                                      </div>

                                      {/* 조리 메모 */}
                                      {card.memo && (
                                        <p className="text-[10px] text-[#7A6A53] bg-[#F4EFEB]/50 border border-[#E0DBCF]/30 px-1.5 py-0.5 rounded italic">
                                          📝 {card.memo}
                                        </p>
                                      )}

                                      {/* 레시피 외부 링크 */}
                                      {card.recipeUrl && (
                                        <a
                                          href={card.recipeUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-0.5 text-[9px] font-bold text-blue-600 hover:underline"
                                        >
                                          <ExternalLink size={8} />
                                          <span>참고 레시피 열기</span>
                                        </a>
                                      )}

                                      {/* 재료 리스트 가로 배치 */}
                                      {card.ingredients && card.ingredients.length > 0 && (
                                        <div className="flex flex-wrap gap-0.5 mt-1.5">
                                          {card.ingredients.map((ing, ingIdx) => {
                                            const inFridge = checkIngredientInFridge(ing, ingredients);
                                            return (
                                              <span
                                                key={ingIdx}
                                                className={`text-[8px] font-bold px-1 py-0.1 rounded-md ${
                                                  inFridge 
                                                    ? 'bg-[#DDE5D7] text-[#5D6D54]' 
                                                    : 'bg-[#F2E1E1] text-[#9E7676] border border-[#E9C7C7]/40'
                                                }`}
                                                title={inFridge ? '냉장고에 있음 🧊' : '냉장고에 없어 장보기에 자동 연동됨 🛒'}
                                              >
                                                {ing}
                                              </span>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 💡 요리 영감 & 검색 4-column bento block (탭 대신 동시 배치) */}
      <div className="bg-white/40 border border-[#E0DBCF] rounded-2xl p-5 shadow-sm text-[#4A4A4A] space-y-4">
        <h3 className="font-serif font-bold text-sm md:text-base text-[#5D6D54] border-b border-[#E0DBCF]/60 pb-2 flex items-center gap-2">
          <Sparkles size={16} className="text-[#9E7676]" />
          <span>식단 짜기 도우미 & 영감 상자</span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 👈 좌측 3컬럼: 요리 아이디어 리스트 */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#5D6D54] flex items-center gap-1.5">
                <span>💡</span> 요리 아이디어 보관소 ({cookingIdeas.length})
              </span>
              
              {!showAddIdeaForm ? (
                <button
                  onClick={() => setShowAddIdeaForm(true)}
                  className="bg-white border border-[#E0DBCF] hover:bg-[#829379]/5 rounded-xl py-1.5 px-3 text-[11px] font-bold text-[#829379] flex items-center gap-1 transition-all shadow-2xs"
                >
                  <Plus size={11} />
                  <span>새 아이디어 등록</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowAddIdeaForm(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 font-bold"
                >
                  등록 닫기 ×
                </button>
              )}
            </div>

            {/* 새 요리 아이디어 등록 창 */}
            {showAddIdeaForm && (
              <div className="bg-white/80 border border-[#829379]/30 rounded-2xl p-4 space-y-3 text-xs relative">
                <p className="font-bold text-xs text-[#5D6D54] flex items-center gap-1">✨ 새로운 요리 아이디어 추가</p>
                
                <input
                  type="text"
                  value={newIdeaText}
                  onChange={e => setNewIdeaText(e.target.value)}
                  placeholder="요리 아이디어 명칭 (예: 백종원 김치찌개 요리하기)"
                  className="w-full bg-[#F9F7F2] border border-[#E0DBCF] rounded-lg px-2.5 py-1.5 text-xs text-[#4A4A4A] focus:outline-hidden focus:ring-1 focus:ring-[#829379]"
                />

                {/* 임시 등록 재료 칩 */}
                {newIdeaIngredients.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {newIdeaIngredients.map((ing, idx) => (
                      <span
                        key={idx}
                        className="bg-[#DDE5D7] text-[#5D6D54] border border-[#C9D5C3] text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1"
                      >
                        <span>{ing}</span>
                        <button
                          type="button"
                          onClick={() => setNewIdeaIngredients(prev => prev.filter((_, i) => i !== idx))}
                          className="hover:text-red-500 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* 재료 칩 등록 */}
                <div className="space-y-1">
                  <input
                    type="text"
                    value={newIdeaCustomIng}
                    onChange={e => setNewIdeaCustomIng(e.target.value)}
                    placeholder="식재료 이름을 치고 엔터"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = newIdeaCustomIng.trim();
                        if (val && !newIdeaIngredients.includes(val)) {
                          setNewIdeaIngredients(prev => [...prev, val]);
                          setNewIdeaCustomIng('');
                        }
                      }
                    }}
                    className="w-full bg-[#F9F7F2] border border-[#E0DBCF] rounded-lg px-2.5 py-1 text-[11px] focus:outline-hidden focus:ring-1 focus:ring-[#829379]"
                  />

                  {ingredients.length > 0 && (
                    <div className="max-h-24 overflow-y-auto bg-white border border-[#E0DBCF] rounded-lg p-1.5 space-y-0.5 text-[10px]">
                      <p className="text-[9px] text-gray-400 font-bold px-1 mb-1">냉장고 보관 식재료 퀵 추가:</p>
                      {ingredients.map(ing => {
                        const active = newIdeaIngredients.includes(ing.name);
                        return (
                          <button
                            key={ing.id}
                            type="button"
                            onClick={() => {
                              if (active) {
                                setNewIdeaIngredients(prev => prev.filter(name => name !== ing.name));
                              } else {
                                setNewIdeaIngredients(prev => [...prev, ing.name]);
                              }
                            }}
                            className={`w-full text-left p-1 rounded flex items-center justify-between ${
                              active ? 'bg-[#DDE5D7]/50 text-[#5D6D54] font-bold' : 'hover:bg-gray-50 text-gray-600'
                            }`}
                          >
                            <span>{ing.emoji} {ing.name}</span>
                            {active && <Check size={8} />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex gap-1.5 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setNewIdeaText('');
                      setNewIdeaIngredients([]);
                      setNewIdeaCustomIng('');
                    }}
                    className="text-[10px] font-bold text-gray-400 bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded-lg"
                  >
                    초기화
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newIdeaText.trim()) return;
                      onAddCookingIdea(newIdeaText.trim(), newIdeaIngredients);
                      setNewIdeaText('');
                      setNewIdeaIngredients([]);
                      setNewIdeaCustomIng('');
                      setShowAddIdeaForm(false);
                    }}
                    className="text-[10px] font-bold text-white bg-[#829379] hover:bg-[#6D7D65] px-4 py-1 rounded-lg shadow-sm"
                  >
                    아이디어 등록
                  </button>
                </div>
              </div>
            )}

            {/* 아이디어 목록 카드 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {cookingIdeas.length === 0 ? (
                <div className="col-span-full text-center py-10 text-gray-400 text-xs border border-dashed border-[#E0DBCF] rounded-2xl bg-white/30">
                  아직 등록된 요리 아이디어가 없습니다. 위 버튼을 눌러 새 레시피 구상을 등록해 보세요!
                </div>
              ) : (
                cookingIdeas.map(idea => (
                  <div
                    key={idea.id}
                    draggable
                    onDragStart={e => handleIdeaDragStart(e, idea)}
                    className="bg-white/90 border border-[#E0DBCF] rounded-xl p-3.5 shadow-2xs hover:shadow-sm cursor-grab active:cursor-grabbing transition-all relative flex flex-col justify-between min-h-[105px] gap-2.5"
                    title="식단 요일/끼니 격자로 드래그해서 배치하세요 🚀"
                  >
                    <div className="flex justify-between items-start gap-1.5">
                      <p className="text-xs font-bold text-[#4A4A4A] leading-relaxed break-words flex-1">
                        💡 {idea.text}
                      </p>
                      <button
                        type="button"
                        onClick={() => onDeleteCookingIdea(idea.id)}
                        className="text-[#9E7676] hover:bg-[#F2E1E1] p-1 rounded-lg transition-colors shrink-0"
                        title="아이디어 폐기"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-0.5 items-center mt-auto">
                      {idea.ingredients && idea.ingredients.length > 0 ? (
                        idea.ingredients.map((ing, ingIdx) => {
                          const inFridge = checkIngredientInFridge(ing, ingredients);
                          return (
                            <span
                              key={ingIdx}
                              className={`text-[8px] font-bold px-1.5 py-0.2 rounded-md ${
                                inFridge ? 'bg-[#DDE5D7] text-[#5D6D54]' : 'bg-[#F2E1E1] text-[#9E7676] border border-[#E9C7C7]/40'
                              }`}
                            >
                              {ing}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-[9px] text-gray-300 italic">재료 미등록</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 👉 우측 1컬럼: 레시피 검색 창 */}
          <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-dashed border-[#E0DBCF] lg:pl-6 pt-4 lg:pt-0 space-y-3.5 recipe-search-container">
            <span className="text-xs font-bold text-[#5D6D54] flex items-center gap-1.5">
              <span>🔍</span> 퀵 레시피 구글 검색
            </span>

            <div className="space-y-3 text-xs">
              <div className="relative">
                <div
                  className="min-h-[42px] w-full bg-white border border-[#E0DBCF] rounded-xl p-1.5 flex flex-wrap gap-1 items-center cursor-text focus-within:ring-1 focus-within:ring-[#829379] transition-all"
                  onClick={() => setIsRecipeDropdownOpen(true)}
                >
                  {/* 선택 태그들 */}
                  {selectedRecipeTags.map(tag => (
                    <span
                      key={tag}
                      className="bg-[#DDE5D7] text-[#5D6D54] border border-[#C9D5C3]/60 font-bold text-[10px] pl-2 pr-1 py-0.5 rounded-lg flex items-center gap-0.5"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleRecipeTag(tag);
                        }}
                        className="hover:bg-[#C9D5C3]/80 rounded p-0.5 text-[9px]"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}

                  {/* 검색어 인풋 */}
                  <input
                    type="text"
                    value={recipeSearchQuery}
                    onChange={e => {
                      setRecipeSearchQuery(e.target.value);
                      setIsRecipeDropdownOpen(true);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (recipeSearchQuery.trim()) {
                          const q = recipeSearchQuery.trim();
                          if (!selectedRecipeTags.includes(q)) {
                            handleToggleRecipeTag(q);
                          }
                          setRecipeSearchQuery('');
                        }
                      }
                    }}
                    placeholder={selectedRecipeTags.length === 0 ? "재료 명칭 입력..." : ""}
                    className="flex-1 bg-transparent border-none text-xs text-[#4A4A4A] px-1 focus:outline-hidden min-w-[70px]"
                  />
                  <Search size={13} className="text-gray-400 mr-1" />
                </div>

                {/* 자동매칭 드롭다운 */}
                {isRecipeDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1 z-30 max-h-48 overflow-y-auto bg-white border border-[#E0DBCF] rounded-xl shadow-xl p-2 space-y-1">
                    <div className="flex justify-between items-center px-1 pb-1 border-b border-[#E0DBCF]/60 mb-1">
                      <span className="text-[9px] text-gray-400 font-bold">냉장고 보관 재료</span>
                      <button
                        type="button"
                        onClick={() => setIsRecipeDropdownOpen(false)}
                        className="text-[9px] text-gray-400 hover:text-gray-600 font-bold"
                      >
                        닫기
                      </button>
                    </div>

                    {filteredMaterials.length === 0 ? (
                      <p className="text-[10px] text-gray-400 py-3 text-center">
                        {recipeSearchQuery ? "매칭되는 재료 없음" : "냉장고에 재료가 없어요!"}
                      </p>
                    ) : (
                      filteredMaterials.map(mat => {
                        const isSelected = selectedRecipeTags.includes(mat);
                        return (
                          <button
                            key={mat}
                            type="button"
                            onClick={() => handleToggleRecipeTag(mat)}
                            className="w-full text-left text-xs px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between hover:bg-[#F9F7F2] text-gray-600"
                          >
                            <span>{mat}</span>
                            {isSelected && <span className="text-[10px] text-[#5D6D54] font-bold">✓</span>}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* 검색 실행 버튼 */}
              <button
                type="button"
                onClick={handleGoogleRecipeSearch}
                className="w-full bg-[#9E7676] hover:bg-[#835A5A] text-white font-bold py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>🔍 구글 레시피 검색 ({selectedRecipeTags.length})</span>
              </button>
              
              <p className="text-[9px] text-gray-400 leading-normal text-center italic">
                냉장고 속 재료 칩들을 조합해서 바로 구글 레시피 창을 띄울 수 있는 간편 검색창입니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
