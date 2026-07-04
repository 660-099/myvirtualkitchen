/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Ingredient, StorageLocation } from '../types';
import { analyzeIngredientName, ALL_EMOJIS, calculateDDay, formatDate, formatDisplayDate } from '../utils';
import { Plus, Minus, ChevronDown, ChevronUp, Calendar, Trash2, Edit3, Save, PackagePlus } from 'lucide-react';

interface KanbanBoardProps {
  ingredients: Ingredient[];
  onAddIngredient: (item: Omit<Ingredient, 'id'>) => void;
  onUpdateIngredient: (id: string, updated: Partial<Ingredient>) => void;
  onDeleteIngredient: (id: string) => void;
}

export default function KanbanBoard({
  ingredients,
  onAddIngredient,
  onUpdateIngredient,
  onDeleteIngredient,
}: KanbanBoardProps) {
  // 새 재료 입력을 위한 상태
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState<StorageLocation>('fridge');
  const [newCategory, setNewCategory] = useState('미분류');
  const [newExpiry, setNewExpiry] = useState('');
  const [newQuantity, setNewQuantity] = useState(1);
  const [newUnit, setNewUnit] = useState('개');
  const [newMemo, setNewMemo] = useState('');

  const handleNameChange = (val: string) => {
    setNewName(val);
    const { category } = analyzeIngredientName(val);
    setNewCategory(category);
  };
  
  // 아코디언 확장 상태를 컴포넌트 내의 맵 상태로 관리할 수도 있고, 프롭스를 통해 업데이트할 수도 있습니다.
  // 여기서는 각 카드의 개별 expanded 상태를 prop/state로 직접 관리합니다.
  const toggleExpand = (id: string) => {
    const ing = ingredients.find(i => i.id === id);
    if (ing) {
      onUpdateIngredient(id, { isExpanded: !ing.isExpanded });
    }
  };

  // 이모지 선택기 팝오버 오픈 상태 (ingredientId -> boolean)
  const [activeEmojiPicker, setActiveEmojiPicker] = useState<string | null>(null);

  // 수량 조절용 편집 모드 상태
  const [editingQuantityId, setEditingQuantityId] = useState<string | null>(null);

  // 한글 IME 입력 중복 방지 State
  const [isComposing, setIsComposing] = useState(false);

  // 정렬 상태 (이름, 분류, 보관, 유통기한, 수량, 기본등록순)
  const [sortField, setSortField] = useState<'name' | 'category' | 'location' | 'expiryDate' | 'quantity' | 'id'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // 클릭 바깥 감지하여 모든 아코디언/팝업 자동 닫기 편의성 개선
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // 이모지 팝오버 닫기
      if (activeEmojiPicker) {
        const emojiBtn = document.getElementById(`emoji-btn-${activeEmojiPicker}`);
        const pickerBox = target.closest('.emoji-picker-popover');
        if (emojiBtn && !emojiBtn.contains(target) && !pickerBox) {
          setActiveEmojiPicker(null);
        }
      }

      // 수량 조절 닫기
      if (editingQuantityId) {
        const qtyBox = target.closest('[data-qty-editor]');
        const qtyBtn = target.closest('[data-qty-text]');
        if (!qtyBox && !qtyBtn) {
          setEditingQuantityId(null);
        }
      }

      // 확장된 식재료 카드 접기 (식재료 카드 바깥 클릭 시 접히게 함)
      const clickedCard = target.closest('[data-ingredient-card]');
      // 수량 변경 등 상세 UI 팝업 조작 중엔 카드 접히지 않도록
      const isInsidePopup = target.closest('.emoji-picker-popover') || target.closest('[data-qty-editor]') || target.closest('input') || target.closest('button');
      if (!clickedCard && !isInsidePopup) {
        ingredients.forEach(item => {
          if (item.isExpanded) {
            onUpdateIngredient(item.id, { isExpanded: false });
          }
        });
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [ingredients, activeEmojiPicker, editingQuantityId]);

  // 새 식재료 폼 초기화
  const resetForm = () => {
    setNewName('');
    setNewLocation('fridge');
    setNewCategory('미분류');
    setNewExpiry('');
    setNewQuantity(1);
    setNewUnit('개');
    setNewMemo('');
  };

  // 식재료 등록 핸들러
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const { emoji } = analyzeIngredientName(newName);
    const todayStr = formatDate(new Date());

    // 유통기한이 빈칸이면 비워둠
    const expiryDate = newExpiry;

    onAddIngredient({
      name: newName.trim(),
      location: newLocation,
      expiryDate,
      quantity: newQuantity,
      unit: newUnit,
      category: newCategory,
      emoji,
      purchaseDate: todayStr,
      opened: false,
      memo: newMemo,
      isExpanded: false,
    });

    resetForm();
  };

  // 보기 및 필터 상태
  const [viewMode, setViewMode] = useState<'shelf' | 'all' | 'fridge' | 'freezer' | 'pantry' | 'etc'>('shelf');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');

  // 분류 필터 적용한 식재료 목록
  const filteredIngredients = ingredients.filter(item => {
    if (selectedCategory === '전체') return true;
    return item.category === selectedCategory;
  });

  // 정렬 함수
  const getSortedItems = (items: Ingredient[]) => {
    return [...items].sort((a, b) => {
      let valA: any = a[sortField as keyof Ingredient] ?? '';
      let valB: any = b[sortField as keyof Ingredient] ?? '';

      // 특별 케이스: 유통기한이 비어있는 것은 정렬 시 항상 맨 뒤로 배치
      if (sortField === 'expiryDate') {
        if (!valA && valB) return 1;
        if (valA && !valB) return -1;
        if (!valA && !valB) return 0;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' 
          ? valA.localeCompare(valB, 'ko-KR') 
          : valB.localeCompare(valA, 'ko-KR');
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }

      return sortOrder === 'asc'
        ? String(valA).localeCompare(String(valB), 'ko-KR')
        : String(valB).localeCompare(String(valA), 'ko-KR');
    });
  };

  // 정렬 적용된 식재료 목록
  const sortedIngredients = getSortedItems(filteredIngredients);

  // 칼럼별 데이터 나누기
  const fridgeItems = sortedIngredients.filter(item => item.location === 'fridge');
  const freezerItems = sortedIngredients.filter(item => item.location === 'freezer');
  const pantryItems = sortedIngredients.filter(item => item.location === 'pantry');
  const etcItems = sortedIngredients.filter(item => item.location === 'etc' || !item.location);

  // 날짜별 색상 변화 유틸리티
  const getDateColorClass = (item: Ingredient) => {
    if (!item.expiryDate) return 'text-gray-400';
    const dday = calculateDDay(item.expiryDate);
    if (dday.days <= 0) {
      return 'text-[#E53E3E] font-semibold'; // 지나거나 당일
    } else if (dday.days <= 3) {
      return 'text-[#D97706] font-semibold'; // 얼마 안 남음
    } else {
      return 'text-[#5D6D54] font-medium'; // 그 외 충분히 남음
    }
  };

  // 컬럼 렌더링 헬퍼
  const renderColumn = (
    title: string,
    icon: string,
    items: Ingredient[],
    locationKey: StorageLocation,
    bgColor: string,
    borderColor: string,
    accentColor: string,
    isSingle: boolean = false
  ) => {
    return (
      <div className={`${isSingle ? 'w-full' : 'w-full lg:w-[23%] shrink-0 min-w-[270px]'} rounded-2xl p-4 border ${borderColor} ${bgColor} shadow-sm flex flex-col`}>
        {/* 칼럼 헤더 */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E0DBCF] border-dashed">
          <h3 className="font-serif font-bold text-[#5D6D54] text-xs flex items-center gap-2">
            <span>{icon}</span> {title}
          </h3>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${accentColor}`}>
            {items.length}개
          </span>
        </div>

        {/* 카드들: 보관별 내부 스크롤을 완전히 없애고 한데 흐르도록 함 */}
        <div className="flex flex-col gap-3">
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs font-sans border border-dashed border-[#E0DBCF] rounded-xl bg-white/50">
              비어있습니다.
            </div>
          ) : (
            items.map(item => {
              const dateColorClass = getDateColorClass(item);

              return (
                <div
                  key={item.id}
                  data-ingredient-card={item.id}
                  className={`bg-white/80 border border-[#E0DBCF] rounded-xl p-2.5 shadow-xs hover:shadow-md transition-shadow flex flex-col relative backdrop-blur-xs ${
                    activeEmojiPicker === item.id ? 'z-40 shadow-md' : 'z-10'
                  }`}
                >
                  {/* 카드 첫째 줄: 이모지와 이름 (이어지게 좌정렬) */}
                  <div className="flex items-center gap-1.5 cursor-pointer min-w-0" onClick={() => toggleExpand(item.id)}>
                    {/* 이모지 및 클릭 수동선택 */}
                    <div className="relative shrink-0 select-none">
                      <button
                        id={`emoji-btn-${item.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveEmojiPicker(activeEmojiPicker === item.id ? null : item.id);
                        }}
                        className="hover:scale-110 transition-transform text-xs"
                        title="이모지 수동 변경"
                      >
                        {item.emoji}
                      </button>

                      {/* 이모지 팝오버 셀렉터 */}
                      {activeEmojiPicker === item.id && (
                        <div className="absolute top-6 left-0 z-50 bg-white border border-[#E0DBCF] rounded-xl p-1.5 shadow-xl w-44 emoji-picker-popover text-left">
                          <p className="text-[9px] text-gray-400 font-bold mb-1 text-center">
                            이모지 변경 🎨
                          </p>
                          <div className="grid grid-cols-5 gap-0.5">
                            {ALL_EMOJIS.map(em => (
                              <button
                                key={em}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateIngredient(item.id, { emoji: em });
                                  setActiveEmojiPicker(null);
                                }}
                                className="text-xs p-1 hover:bg-[#F9F7F2] rounded-lg transition-colors"
                              >
                                {em}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <span className="font-bold text-[#4A4A4A] text-xs truncate" title={item.name}>
                      {item.name}
                    </span>
                  </div>

                  {/* 카드 둘째 줄: 날짜와 개수 (각각 좌, 우 정렬) */}
                  <div className="flex justify-between items-center mt-1.5 text-[10px]">
                    {/* 좌측: 유통기한 */}
                    <div className={`font-mono whitespace-nowrap ${dateColorClass}`}>
                      {item.expiryDate ? formatDisplayDate(item.expiryDate) : '기한 없음'}
                    </div>

                    {/* 우측: 개수 조절 (텍스트 클릭 시에만 조절 영역 활성화) */}
                    <div className="flex items-center font-mono text-gray-500">
                      {editingQuantityId === item.id ? (
                        <div className="flex items-center gap-1 bg-[#F9F7F2] border border-[#E0DBCF] rounded-md px-1 py-0.5" data-qty-editor>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.quantity > 1) {
                                onUpdateIngredient(item.id, { quantity: item.quantity - 1 });
                              } else {
                                if (confirm('이 재료를 냉장고에서 삭제할까요?')) {
                                  onDeleteIngredient(item.id);
                                }
                              }
                            }}
                            className="p-0.5 hover:text-[#829379] text-gray-400 transition-colors"
                            title="감소"
                          >
                            <Minus size={10} />
                          </button>
                          <span
                            className="font-bold text-[#4A4A4A] select-none px-1 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingQuantityId(null);
                            }}
                            title="완료"
                          >
                            {item.quantity}{item.unit || '개'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateIngredient(item.id, { quantity: item.quantity + 1 });
                            }}
                            className="p-0.5 hover:text-[#829379] text-gray-400 transition-colors"
                            title="증가"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                      ) : (
                        <span
                          data-qty-text
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingQuantityId(item.id);
                          }}
                          className="font-bold text-[#4A4A4A] hover:text-[#829379] cursor-pointer hover:bg-[#F9F7F2] px-1.5 py-0.5 rounded-md transition-all select-none"
                          title="클릭하여 수량 수정"
                        >
                          {item.quantity}{item.unit || '개'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 아코디언 상세 정보 */}
                  {item.isExpanded && (
                    <div className="mt-3 pt-3 border-t border-dashed border-[#E0DBCF] text-xs text-[#4A4A4A] space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {/* 구매일 대신 유통기한 수정 */}
                        <div>
                          <span className="text-[10px] text-[#4A4A4A]/60 block">유통기한</span>
                          <input
                            type="date"
                            value={item.expiryDate}
                            onChange={e =>
                              onUpdateIngredient(item.id, { expiryDate: e.target.value })
                            }
                            className="w-full bg-white border border-[#E0DBCF] rounded-md px-1.5 py-0.5 text-[11px] text-[#4A4A4A] focus:outline-hidden font-mono"
                          />
                        </div>
                        
                        {/* 구매일 · 개봉일 · 냉동한 날짜 dot 텍스트 선택 UI */}
                        <div className="flex flex-col justify-end">
                          <span className="text-[10px] text-[#4A4A4A]/60 block mb-1">날짜 기록</span>
                          <div className="flex flex-wrap items-center gap-1 text-[10px] text-gray-400 font-bold">
                            <button
                              type="button"
                              onClick={() => {
                                const d = prompt('구매일을 입력하세요 (YYYY-MM-DD)', item.purchaseDate || formatDate(new Date()));
                                if (d) onUpdateIngredient(item.id, { purchaseDate: d });
                              }}
                              className={`hover:text-[#829379] hover:underline whitespace-nowrap ${item.purchaseDate ? 'text-[#829379]' : ''}`}
                            >
                              구매일
                            </button>
                            <span>·</span>
                            <button
                              type="button"
                              onClick={() => {
                                const d = prompt('개봉일을 입력하세요 (YYYY-MM-DD)', item.openedDate || formatDate(new Date()));
                                if (d) onUpdateIngredient(item.id, { opened: true, openedDate: d });
                              }}
                              className={`hover:text-[#829379] hover:underline whitespace-nowrap ${item.opened && item.openedDate ? 'text-[#829379]' : ''}`}
                            >
                              개봉일
                            </button>
                            <span>·</span>
                            <button
                              type="button"
                              onClick={() => {
                                const d = prompt('냉동한 날짜를 입력하세요 (YYYY-MM-DD)', item.frozenDate || formatDate(new Date()));
                                if (d) {
                                  onUpdateIngredient(item.id, { 
                                    frozenDate: d,
                                    location: 'freezer'
                                  });
                                }
                              }}
                              className={`hover:text-[#829379] hover:underline whitespace-nowrap ${item.frozenDate ? 'text-[#829379]' : ''}`}
                            >
                              냉동일
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 기록 목록 상세 표시 */}
                      <div className="bg-[#F9F7F2] border border-[#E0DBCF]/60 rounded-lg p-2 space-y-0.5 text-[10px] text-[#4A4A4A]/80 font-sans">
                        <div className="flex justify-between">
                          <span>구매일:</span>
                          <span className="font-mono">{item.purchaseDate || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>개봉일:</span>
                          <span className="font-mono">{item.opened ? (item.openedDate || '기록 없음') : '미개봉'}</span>
                        </div>
                        {item.frozenDate && (
                          <div className="flex justify-between text-[#829379]">
                            <span>냉동일:</span>
                            <span className="font-mono">{item.frozenDate}</span>
                          </div>
                        )}
                      </div>

                      {/* 개봉 상태 토글 및 카테고리 */}
                      <div className="flex items-center gap-2 pt-1">
                        <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                          <input
                            type="checkbox"
                            checked={item.opened}
                            onChange={e => {
                              const checked = e.target.checked;
                              onUpdateIngredient(item.id, {
                                opened: checked,
                                openedDate: checked ? formatDate(new Date()) : undefined,
                              });
                            }}
                            className="rounded-sm border-gray-300 text-[#829379] focus:ring-[#829379] h-3 w-3"
                          />
                          <span>개봉함</span>
                        </label>
                        {item.category && (
                          <span className="text-[9px] bg-[#DDE5D7] text-[#5D6D54] px-2 py-0.5 rounded-full ml-auto">
                            {item.category}
                          </span>
                        )}
                      </div>

                      {/* 메모 입력 */}
                      <div>
                        <span className="text-[10px] text-[#4A4A4A]/60 block">메모</span>
                        <input
                          type="text"
                          value={item.memo || ''}
                          placeholder="특이사항"
                          onChange={e => onUpdateIngredient(item.id, { memo: e.target.value })}
                          className="w-full bg-white border border-[#E0DBCF] rounded-md px-2 py-1 text-[11px] text-[#4A4A4A] focus:outline-hidden"
                        />
                      </div>

                      {/* 삭제 버튼 */}
                      <div className="flex justify-end pt-1">
                        <button
                          id={`del-btn-${item.id}`}
                          onClick={() => {
                            if (confirm('이 재료를 삭제하시겠습니까?')) {
                              onDeleteIngredient(item.id);
                            }
                          }}
                          className="text-[#9E7676] hover:bg-[#F2E1E1] p-1 rounded-md transition-colors flex items-center gap-1 text-[10px] font-bold"
                        >
                          <Trash2 size={12} />
                          <span>삭제</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderCompactListItem = (item: Ingredient) => {
    const dateColorClass = getDateColorClass(item);

    const locationLabel = item.location === 'fridge' ? '냉장' : item.location === 'freezer' ? '냉동' : item.location === 'pantry' ? '팬트리' : '그 외';
    const locationBg = item.location === 'fridge' ? 'bg-blue-50 text-blue-600 border-blue-100' : item.location === 'freezer' ? 'bg-gray-100 text-gray-600 border-gray-200' : item.location === 'pantry' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-stone-50 text-stone-600 border-stone-200';

    return (
      <div
        key={item.id}
        data-ingredient-card={item.id}
        onClick={() => toggleExpand(item.id)}
        className="bg-white/80 border border-[#E0DBCF] hover:border-[#829379] rounded-xl p-2.5 flex flex-col shadow-xs transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl shrink-0">{item.emoji}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-[#4A4A4A] text-xs truncate max-w-[120px]">
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-[9px] font-mono">
                <span className={dateColorClass}>{item.expiryDate ? `~${formatDisplayDate(item.expiryDate)}` : '기한 없음'}</span>
                <span className="text-gray-300">·</span>
                <span className="text-[#4A4A4A]/60">{item.quantity}{item.unit || '개'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md border ${locationBg} whitespace-nowrap`}>
              {locationLabel}
            </span>
            <span className="text-[8px] bg-gray-50 text-gray-400 border border-gray-100 px-1.5 py-0.5 rounded-md whitespace-nowrap">
              {item.category}
            </span>
          </div>
        </div>

        {/* 아코디언 상세 정보 */}
        {item.isExpanded && (
          <div className="mt-2 pt-2 border-t border-dashed border-[#E0DBCF] text-xs text-[#4A4A4A] space-y-2" onClick={e => e.stopPropagation()}>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[9px] text-[#4A4A4A]/60 block">유통기한 수정</span>
                <input
                  type="date"
                  value={item.expiryDate}
                  onChange={e =>
                    onUpdateIngredient(item.id, { expiryDate: e.target.value })
                  }
                  className="w-full bg-white border border-[#E0DBCF] rounded-md px-1.5 py-0.5 text-[10px] text-[#4A4A4A] focus:outline-hidden font-mono"
                />
              </div>
              
              <div className="flex flex-col justify-end">
                <span className="text-[9px] text-[#4A4A4A]/60 block mb-0.5">날짜 기록</span>
                <div className="flex flex-wrap items-center gap-1 text-[9px] text-gray-400 font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      const d = prompt('구매일을 입력하세요 (YYYY-MM-DD)', item.purchaseDate || formatDate(new Date()));
                      if (d) onUpdateIngredient(item.id, { purchaseDate: d });
                    }}
                    className={`hover:text-[#829379] hover:underline whitespace-nowrap ${item.purchaseDate ? 'text-[#829379]' : ''}`}
                  >
                    구매일
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => {
                      const d = prompt('개봉일을 입력하세요 (YYYY-MM-DD)', item.openedDate || formatDate(new Date()));
                      if (d) onUpdateIngredient(item.id, { opened: true, openedDate: d });
                    }}
                    className={`hover:text-[#829379] hover:underline whitespace-nowrap ${item.opened && item.openedDate ? 'text-[#829379]' : ''}`}
                  >
                    개봉일
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => {
                      const d = prompt('냉동한 날짜를 입력하세요 (YYYY-MM-DD)', item.frozenDate || formatDate(new Date()));
                      if (d) onUpdateIngredient(item.id, { frozenDate: d });
                    }}
                    className={`hover:text-[#829379] hover:underline whitespace-nowrap ${item.frozenDate ? 'text-[#829379]' : ''}`}
                  >
                    냉동일
                  </button>
                </div>
              </div>
            </div>

            {/* 메모 및 삭제/수량 */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <input
                type="text"
                value={item.memo || ''}
                placeholder="메모 입력"
                onChange={e =>
                  onUpdateIngredient(item.id, { memo: e.target.value })
                }
                className="flex-1 bg-white border border-[#E0DBCF] rounded-md px-1.5 py-0.5 text-[10px] text-[#4A4A4A] focus:outline-hidden"
              />
              <div className="flex items-center gap-1.5">
                <div className="flex items-center bg-gray-50 border border-[#E0DBCF] rounded-md p-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (item.quantity > 1) {
                        onUpdateIngredient(item.id, { quantity: item.quantity - 1 });
                      } else if (item.quantity === 1) {
                        if (confirm('수량이 0이 되어 식재료를 삭제합니다. 정말 삭제하시겠습니까?')) {
                          onDeleteIngredient(item.id);
                        }
                      }
                    }}
                    className="p-0.5 hover:bg-gray-100 rounded text-gray-500"
                  >
                    <Minus size={8} />
                  </button>
                  <span className="text-[10px] font-bold font-mono px-1.5 text-gray-700">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => onUpdateIngredient(item.id, { quantity: item.quantity + 1 })}
                    className="p-0.5 hover:bg-gray-100 rounded text-gray-500"
                  >
                    <Plus size={8} />
                  </button>
                </div>
                <select
                  value={item.unit || '개'}
                  onChange={e => onUpdateIngredient(item.id, { unit: e.target.value })}
                  className="bg-white border border-[#E0DBCF] rounded-md px-1 py-0.5 text-[9px] text-[#4A4A4A] focus:outline-hidden font-medium"
                >
                  {['개', 'g', 'kg', 'ml', 'L', '팩', '봉지', '병'].map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('이 재료를 삭제할까요?')) {
                      onDeleteIngredient(item.id);
                    }
                  }}
                  className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                  title="삭제"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. 신규 식재료 간편 추가 영역 */}
      <div className="bg-white/40 border border-[#E0DBCF] rounded-2xl p-5 shadow-sm text-[#4A4A4A]">
        <h3 className="font-serif font-bold text-sm md:text-base flex items-center gap-2 mb-3 text-[#5D6D54]">
          <PackagePlus size={18} className="text-[#829379]" />
          <span>식재료 추가</span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* 1-1. 재료 이름 */}
            <div>
              <label className="text-xs font-bold text-[#5D6D54]/80 block mb-1">식재료명</label>
              <input
                type="text"
                value={newName}
                onChange={e => handleNameChange(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && e.nativeEvent.isComposing) {
                    e.preventDefault();
                  }
                }}
                placeholder="재료명"
                className="w-full bg-white border border-[#E0DBCF] rounded-xl px-3 py-2 text-xs text-[#4A4A4A] focus:outline-hidden focus:ring-1 focus:ring-[#829379] font-medium"
              />
            </div>

            {/* 1-2. 보관 위치 */}
            <div>
              <label className="text-xs font-bold text-[#5D6D54]/80 block mb-1">보관</label>
              <select
                value={newLocation}
                onChange={e => setNewLocation(e.target.value as StorageLocation)}
                className="w-full bg-white border border-[#E0DBCF] rounded-xl px-3 py-2 text-xs text-[#4A4A4A] focus:outline-hidden focus:ring-1 focus:ring-[#829379] font-medium"
              >
                <option value="fridge">❄️ 냉장고</option>
                <option value="freezer">🧊 냉동실</option>
                <option value="pantry">🥫 팬트리</option>
                <option value="etc">📦 그 외</option>
              </select>
            </div>

            {/* 1-3. 분류 */}
            <div>
              <label className="text-xs font-bold text-[#5D6D54]/80 block mb-1">분류</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="w-full bg-white border border-[#E0DBCF] rounded-xl px-3 py-2 text-xs text-[#4A4A4A] focus:outline-hidden focus:ring-1 focus:ring-[#829379] font-medium"
              >
                {['기타', '미분류', '곡류', '채소·버섯', '과일', '육류', '수산물', '유제품', '소스'].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* 1-4. 유통 기한 */}
            <div>
              <label className="text-xs font-bold text-[#5D6D54]/80 block mb-1">유통기한</label>
              <input
                type="date"
                value={newExpiry}
                onChange={e => setNewExpiry(e.target.value)}
                className="w-full bg-white border border-[#E0DBCF] rounded-xl px-3 py-2 text-xs text-[#4A4A4A] focus:outline-hidden focus:ring-1 focus:ring-[#829379] font-mono font-medium"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-1 border-t border-dashed border-[#E0DBCF]">
            {/* 수량 및 메모 */}
            <div className="flex flex-col sm:flex-row gap-4 w-full flex-1 items-stretch sm:items-center">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-bold text-[#5D6D54]/80">수량</span>
                <div className="flex items-center bg-white border border-[#E0DBCF] rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setNewQuantity(prev => Math.max(1, prev - 1))}
                    className="p-1 hover:bg-[#F9F7F2] rounded-md text-[#4A4A4A]"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-xs font-bold font-mono px-2 text-[#4A4A4A]">
                    {newQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setNewQuantity(prev => prev + 1)}
                    className="p-1 hover:bg-[#F9F7F2] rounded-md text-[#4A4A4A]"
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <select
                  value={newUnit}
                  onChange={e => setNewUnit(e.target.value)}
                  className="bg-white border border-[#E0DBCF] rounded-lg px-2 py-1 text-xs text-[#4A4A4A] focus:outline-hidden focus:ring-1 focus:ring-[#829379] font-medium"
                >
                  {['개', 'g', 'kg', 'ml', 'L', '팩', '봉지', '병'].map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <input
                  type="text"
                  value={newMemo}
                  onChange={e => setNewMemo(e.target.value)}
                  placeholder="메모를 입력해 더 상세히 관리해 보세요"
                  className="w-full bg-white border border-[#E0DBCF] rounded-lg px-3 py-1.5 text-xs text-[#4A4A4A] focus:outline-hidden focus:ring-1 focus:ring-[#829379]"
                />
              </div>
            </div>

            {/* 등록 버튼 */}
            <button
              type="submit"
              className="w-full sm:w-auto bg-[#829379] hover:bg-[#6D7D65] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
            >
              <Plus size={14} />
              <span>등록</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. 보기 옵션 분할 레이아웃 */}
      <div className="flex flex-col md:flex-row gap-5">
        {/* 좌측: 분류별 카테고리 필터 */}
        <div className="w-full md:w-24 shrink-0 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 border-b md:border-b-0 md:border-r border-[#E0DBCF]/60 pr-0 md:pr-2">
          <p className="hidden md:block text-[11px] font-bold text-gray-400 mb-2 pl-2">분류별 보기</p>
          {['전체', '기타', '미분류', '곡류', '채소·버섯', '과일', '육류', '수산물', '유제품', '소스'].map(cat => {
            const isCatSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-2 text-xs rounded-xl font-bold whitespace-nowrap transition-all text-left flex items-center justify-between ${
                  isCatSelected
                    ? 'bg-[#829379] text-white shadow-xs'
                    : 'hover:bg-[#F9F7F2] text-[#4A4A4A]/80 hover:text-[#4A4A4A]'
                }`}
              >
                <span>{cat}</span>
                {isCatSelected && <span className="text-[10px] hidden md:inline opacity-80">●</span>}
              </button>
            );
          })}
        </div>

        {/* 우측: 보기 모드 변경 탭 및 리스트 렌더링 영역 */}
        <div className="flex-1 space-y-4 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dashed border-[#E0DBCF] pb-2">
            <div>
              <div className="text-[11px] font-bold text-gray-500">
                총 <span className="font-mono text-[#829379]">{filteredIngredients.length}</span>개 식재료
              </div>
            </div>

            {/* 보기 모드 탭들 */}
            <div className="flex items-center gap-1 bg-[#F9F7F2] border border-[#E0DBCF] rounded-xl p-0.5 self-end sm:self-auto">
              {[
                { key: 'all', label: '전체' },
                { key: 'shelf', label: '선반' },
                { key: 'fridge', label: '냉장' },
                { key: 'freezer', label: '냉동' },
                { key: 'pantry', label: '팬트리' },
                { key: 'etc', label: '그 외' }
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setViewMode(tab.key as any)}
                  className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                    viewMode === tab.key
                      ? 'bg-white text-[#5D6D54] shadow-xs border border-[#E0DBCF]/40'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* 전체 모드가 아닐 때 노출할 텍스트 정렬 메뉴 - 점선 아래에 우측 정렬로 노출 */}
          {viewMode !== 'all' && (
            <div className="flex justify-end items-center gap-1 text-[10px] text-gray-400 font-medium -mt-2 pb-1">
              <span className="text-gray-400/70 mr-0.5">정렬:</span>
              {[
                { field: 'name', label: '이름순' },
                { field: 'expiryDate', label: '유통기한순' },
                { field: 'quantity', label: '수량순' },
                { field: 'category', label: '분류순' },
                { field: 'id', label: '등록순' },
              ].map((item, idx, arr) => {
                const isSelected = sortField === item.field;
                return (
                  <React.Fragment key={item.field}>
                    <button
                      type="button"
                      onClick={() => {
                        if (sortField === item.field) {
                          setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
                        } else {
                          setSortField(item.field as any);
                          setSortOrder('asc');
                        }
                      }}
                      className={`hover:text-[#829379] transition-colors font-bold ${
                        isSelected ? 'text-[#829379] underline decoration-dotted' : ''
                      }`}
                    >
                      {item.label}
                      {isSelected && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                    </button>
                    {idx < arr.length - 1 && <span className="text-gray-300 font-bold mx-0.5">·</span>}
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* 보기 모드별 렌더링 */}
          {viewMode === 'shelf' && (
            <div className="max-h-[500px] md:max-h-[600px] overflow-y-auto pr-1">
              <div className="flex flex-col lg:flex-row gap-4 overflow-x-auto pb-4 no-scrollbar">
                {renderColumn(
                  '냉장 보관',
                  '❄️',
                  fridgeItems,
                  'fridge',
                  'bg-[#E3F2FD]/60',
                  'border-blue-100',
                  'bg-[#DDE5D7] text-[#5D6D54] border border-[#C9D5C3]/40',
                  false
                )}
                {renderColumn(
                  '냉동 보관',
                  '🧊',
                  freezerItems,
                  'freezer',
                  'bg-[#F5F5F5]/80',
                  'border-gray-200',
                  'bg-gray-200/80 text-gray-700',
                  false
                )}
                {renderColumn(
                  '팬트리',
                  '🥫',
                  pantryItems,
                  'pantry',
                  'bg-[#F3E5DC]/60',
                  'border-[#E0DBCF]',
                  'bg-[#E0DBCF]/80 text-[#8A7B70]',
                  false
                )}
                {renderColumn(
                  '그 외',
                  '📦',
                  etcItems,
                  'etc',
                  'bg-[#F4EFEB]/50',
                  'border-[#E0DBCF]/60',
                  'bg-[#EAE4D9] text-[#7A6A53] border border-[#7A6A53]/20',
                  false
                )}
              </div>
            </div>
          )}

          {viewMode === 'all' && (
            <div className="bg-white/60 border border-[#E0DBCF] rounded-2xl overflow-hidden shadow-xs">
              {sortedIngredients.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs font-sans">
                  식재료가 비어있습니다.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs text-[#4A4A4A] table-fixed">
                    <thead>
                      <tr className="bg-[#F9F7F2]/80 border-b border-[#E0DBCF] text-[11px] font-bold text-gray-500">
                        {[
                          { field: 'name', label: '이름', width: 'w-[42%] min-w-[150px]' },
                          { field: 'category', label: '분류', width: 'w-[14%] min-w-[90px]' },
                          { field: 'location', label: '보관', width: 'w-[14%] min-w-[90px]' },
                          { field: 'expiryDate', label: '유통기한', width: 'w-[16%] min-w-[110px]' },
                          { field: 'quantity', label: '수량 / 단위', width: 'w-[14%] min-w-[90px]' },
                        ].map(col => {
                          const isSelected = sortField === col.field;
                          return (
                            <th
                              key={col.field}
                              onClick={() => {
                                if (sortField === col.field) {
                                  setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
                                } else {
                                  setSortField(col.field as any);
                                  setSortOrder('asc');
                                }
                              }}
                              className={`py-3 px-4 ${col.width} cursor-pointer select-none hover:bg-[#E0DBCF]/20 hover:text-[#4A4A4A] transition-colors`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="truncate">{col.label}</span>
                                <span className="text-[10px] text-gray-400 font-normal shrink-0">
                                  {isSelected ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                                </span>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedIngredients.map(item => {
                        const dateColorClass = getDateColorClass(item);
                        const locationLabel = item.location === 'fridge' ? '냉장' : item.location === 'freezer' ? '냉동' : item.location === 'pantry' ? '팬트리' : '그 외';
                        const displayExpiry = formatDisplayDate(item.expiryDate);

                        return (
                          <React.Fragment key={item.id}>
                            <tr
                              onClick={() => toggleExpand(item.id)}
                              className="border-b border-[#E0DBCF]/40 hover:bg-[#F9F7F2]/40 transition-colors cursor-pointer group"
                            >
                              <td className="py-3 px-4 font-bold">
                                <div className="flex items-center gap-2">
                                  <span className="text-base shrink-0">{item.emoji}</span>
                                  <span className="truncate max-w-[185px]" title={item.name}>{item.name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-[10px] bg-gray-50 text-gray-400 border border-gray-100 px-1.5 py-0.5 rounded-md">
                                  {item.category}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-[#4A4A4A]/80 font-medium">{locationLabel}</td>
                              <td className="py-3 px-4">
                                <div className={`font-mono text-[11px] ${dateColorClass}`}>
                                  {displayExpiry}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center" onClick={e => e.stopPropagation()}>
                                  {editingQuantityId === item.id ? (
                                    <div className="flex items-center gap-1.5" data-qty-editor>
                                      <div className="flex items-center bg-white border border-[#E0DBCF] rounded-md p-0.5 shadow-xs">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (item.quantity > 1) {
                                              onUpdateIngredient(item.id, { quantity: item.quantity - 1 });
                                            } else if (item.quantity === 1) {
                                              if (confirm('수량이 0이 되어 식재료를 삭제합니다. 정말 삭제하시겠습니까?')) {
                                                onDeleteIngredient(item.id);
                                              }
                                            }
                                          }}
                                          className="p-0.5 hover:bg-gray-100 rounded text-gray-500"
                                        >
                                          <Minus size={8} />
                                        </button>
                                        <span
                                          className="text-[10px] font-bold font-mono px-1.5 text-gray-700 cursor-pointer"
                                          onClick={() => setEditingQuantityId(null)}
                                        >
                                          {item.quantity}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => onUpdateIngredient(item.id, { quantity: item.quantity + 1 })}
                                          className="p-0.5 hover:bg-gray-100 rounded text-gray-500"
                                        >
                                          <Plus size={8} />
                                        </button>
                                      </div>
                                      <select
                                        value={item.unit || '개'}
                                        onChange={e => onUpdateIngredient(item.id, { unit: e.target.value })}
                                        className="bg-white border border-[#E0DBCF] rounded-md px-1 py-0.5 text-[9px] text-[#4A4A4A] focus:outline-hidden font-medium shadow-xs"
                                      >
                                        {['개', 'g', 'kg', 'ml', 'L', '팩', '봉지', '병'].map(u => (
                                          <option key={u} value={u}>{u}</option>
                                        ))}
                                      </select>
                                    </div>
                                  ) : (
                                    <span
                                      data-qty-text
                                      onClick={() => setEditingQuantityId(item.id)}
                                      className="font-bold text-[#4A4A4A] hover:text-[#829379] cursor-pointer hover:bg-[#F9F7F2] px-2 py-1 rounded-md transition-all select-none font-mono"
                                      title="클릭하여 수량/단위 수정"
                                    >
                                      {item.quantity}{item.unit || '개'}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                            {item.isExpanded && (
                              <tr className="bg-[#F9F7F2]/20">
                                <td colSpan={5} className="py-3 px-6 border-b border-[#E0DBCF]/40" onClick={e => e.stopPropagation()}>
                                  <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                                    <div className="flex gap-4 text-[11px] text-gray-500">
                                      <div>
                                        <span className="font-bold">구매일:</span>{' '}
                                        <span className="font-mono">{item.purchaseDate || '-'}</span>
                                      </div>
                                      {item.opened && (
                                        <div>
                                          <span className="font-bold text-[#829379]">개봉일:</span>{' '}
                                          <span className="font-mono text-[#829379]">{item.openedDate || '기록 없음'}</span>
                                        </div>
                                      )}
                                      {item.frozenDate && (
                                        <div>
                                          <span className="font-bold text-blue-500">냉동일:</span>{' '}
                                          <span className="font-mono text-blue-500">{item.frozenDate}</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                      <input
                                        type="text"
                                        value={item.memo || ''}
                                        placeholder="특이사항 메모 입력"
                                        onChange={e => onUpdateIngredient(item.id, { memo: e.target.value })}
                                        className="flex-1 md:w-64 bg-white border border-[#E0DBCF] rounded-lg px-2.5 py-1 text-[11px] text-[#4A4A4A] focus:outline-hidden"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (confirm('이 재료를 삭제하시겠습니까?')) {
                                            onDeleteIngredient(item.id);
                                          }
                                        }}
                                        className="text-[#9E7676] hover:bg-[#F2E1E1] px-2 py-1 rounded-md transition-colors flex items-center gap-1 text-[10px] font-bold"
                                      >
                                        <Trash2 size={12} />
                                        <span>삭제</span>
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {viewMode === 'fridge' && (
            <div className="w-full">
              {renderColumn(
                '냉장 보관',
                '❄️',
                fridgeItems,
                'fridge',
                'bg-[#E3F2FD]/60',
                'border-blue-100',
                'bg-[#DDE5D7] text-[#5D6D54] border border-[#C9D5C3]/40',
                true
              )}
            </div>
          )}

          {viewMode === 'freezer' && (
            <div className="w-full">
              {renderColumn(
                '냉동 보관',
                '🧊',
                freezerItems,
                'freezer',
                'bg-[#F5F5F5]/80',
                'border-gray-200',
                'bg-gray-200/80 text-gray-700',
                true
              )}
            </div>
          )}

          {viewMode === 'pantry' && (
            <div className="w-full">
              {renderColumn(
                '팬트리',
                '🥫',
                pantryItems,
                'pantry',
                'bg-[#F3E5DC]/60',
                'border-[#E0DBCF]',
                'bg-[#E0DBCF]/80 text-[#8A7B70]',
                true
              )}
            </div>
          )}

          {viewMode === 'etc' && (
            <div className="w-full">
              {renderColumn(
                '그 외',
                '📦',
                etcItems,
                'etc',
                'bg-[#F4EFEB]/50',
                'border-[#E0DBCF]/60',
                'bg-[#EAE4D9] text-[#7A6A53] border border-[#7A6A53]/20',
                true
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
