/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShoppingItem, Ingredient } from '../types';
import { Plus, Trash2, CheckSquare, Square, ShoppingCart } from 'lucide-react';
import CustomModal from './CustomModal';

interface ShoppingAndRecipeProps {
  ingredients: Ingredient[];
  shoppingList: ShoppingItem[];
  onAddShoppingItem: (name: string) => void;
  onToggleShoppingItem: (id: string) => void;
  onDeleteShoppingItem: (id: string) => void;
  onClearCompletedShopping: () => void;
  onAddFromShoppingToFridge: (name: string) => void;
  onUpdateShoppingItemNote?: (id: string, note: string) => void;
}

export default function ShoppingAndRecipe({
  ingredients,
  shoppingList,
  onAddShoppingItem,
  onToggleShoppingItem,
  onDeleteShoppingItem,
  onClearCompletedShopping,
  onAddFromShoppingToFridge,
  onUpdateShoppingItemNote,
}: ShoppingAndRecipeProps) {
  // 장보기 새 입력값
  const [newShopName, setNewShopName] = useState('');
  
  // 한글 IME 입력 중복 체크
  const [isComposing, setIsComposing] = useState(false);

  // 장보기 완료 -> 냉장고 추가 제안 모달 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingCompletedItems, setPendingCompletedItems] = useState<ShoppingItem[]>([]);

  // 장보기 등록
  const handleAddShoppingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName.trim()) return;
    onAddShoppingItem(newShopName.trim());
    setNewShopName('');
  };

  // 장보기 토글 핸들러
  const handleToggle = (item: ShoppingItem) => {
    onToggleShoppingItem(item.id);
  };

  // 체크한 재료 지우기 클릭 시 모달 오픈
  const handleClearCompletedClick = () => {
    const completed = shoppingList.filter(item => item.completed);
    if (completed.length === 0) return;
    setPendingCompletedItems(completed);
    setModalOpen(true);
  };

  // 냉장고 바로 이동 수락
  const handleConfirmMoveToFridge = () => {
    pendingCompletedItems.forEach(item => {
      onAddFromShoppingToFridge(item.name);
    });
    onClearCompletedShopping();
    setModalOpen(false);
    setPendingCompletedItems([]);
  };

  // 냉장고 이동하지 않고 그냥 지우기
  const handleOnlyDelete = () => {
    onClearCompletedShopping();
    setModalOpen(false);
    setPendingCompletedItems([]);
  };

  // 냉장고 바로 이동 취소
  const handleCancelMoveToFridge = () => {
    setModalOpen(false);
    setPendingCompletedItems([]);
  };

  return (
    <div className="text-[#4A4A4A]">
      {/* 1. 장보기 리스트 영역 */}
      <div className="bg-white/40 border border-[#E0DBCF] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-dashed border-[#E0DBCF] pb-3 mb-4">
            <h3 className="font-serif font-bold text-sm md:text-base flex items-center gap-1.5 text-[#5D6D54]">
              <ShoppingCart size={16} /> 장보기 목록
            </h3>
            <span className="text-xs bg-[#829379]/10 text-[#829379] border border-[#829379]/20 font-bold px-2.5 py-0.5 rounded-full">
              {shoppingList.filter(item => item.completed).length}/{shoppingList.length}
            </span>
          </div>

          {/* 장보기 추가 폼 */}
          <form onSubmit={handleAddShoppingSubmit} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newShopName}
              onChange={e => setNewShopName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && e.nativeEvent.isComposing) {
                  e.preventDefault();
                }
              }}
              placeholder="품목"
              className="flex-1 bg-white border border-[#E0DBCF] rounded-xl px-3 py-2 text-xs text-[#4A4A4A] focus:outline-hidden focus:ring-1 focus:ring-[#829379]"
            />
            <button
              type="submit"
              className="bg-[#829379] hover:bg-[#6D7D65] text-white font-bold text-xs px-4 rounded-xl shadow-md transition-colors"
            >
              추가
            </button>
          </form>

          {/* 장보기 항목 리스트 */}
          <div className="max-h-[280px] overflow-y-auto pr-1">
            {shoppingList.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-xs font-sans border border-dashed border-[#E0DBCF]/80 rounded-xl bg-white/40">
                품목이 없습니다.
              </div>
            ) : (
              shoppingList.map(item => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between py-2.5 border-b border-dotted border-[#E0DBCF] last:border-b-0 transition-all ${
                    item.completed ? 'opacity-50' : ''
                  }`}
                >
                  {/* 체크박스 전용 버튼 */}
                  <button
                    id={`toggle-shop-btn-${item.id}`}
                    onClick={() => handleToggle(item)}
                    className="p-1 -ml-1 rounded hover:bg-[#F9F7F2] shrink-0 transition-colors"
                    title={item.completed ? "미완료 처리" : "완료 처리"}
                  >
                    {item.completed ? (
                      <CheckSquare size={14} className="text-[#829379]" />
                    ) : (
                      <Square size={14} className="text-gray-300 hover:text-[#829379]" />
                    )}
                  </button>

                  {/* 텍스트 정보 및 메모 영역 (체크박스 바깥은 클릭해도 토글 안됨) */}
                  <div className="flex-1 flex items-center justify-between min-w-0 pl-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`text-xs font-medium ${item.completed ? 'line-through text-gray-400' : 'text-[#4A4A4A]'}`}>
                        {item.name}
                      </span>
                      {item.addedFromMealPlan && (
                        <span className="text-[8px] bg-[#F2E1E1]/80 border border-[#E9C7C7]/50 text-[#9E7676] font-bold px-1 py-0.2 rounded-sm shrink-0">
                          식단 연동
                        </span>
                      )}
                    </div>

                    {/* 메모 입력창 (휴지통 버튼의 왼쪽, 우정렬) */}
                    <input
                      type="text"
                      value={item.note || ''}
                      onChange={(e) => onUpdateShoppingItemNote?.(item.id, e.target.value)}
                      placeholder="메모..."
                      className="w-24 sm:w-36 bg-transparent text-right text-[10px] text-gray-400 focus:text-[#4A4A4A] outline-hidden border-b border-transparent focus:border-[#E0DBCF]/80 px-1 transition-all ml-auto mr-1.5"
                    />
                  </div>

                  <button
                    id={`del-shop-btn-${item.id}`}
                    onClick={() => onDeleteShoppingItem(item.id)}
                    className="text-gray-400 hover:text-red-500 p-0.5 rounded-md transition-colors shrink-0"
                    title="삭제"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 하단 완료 일괄 삭제 */}
        {shoppingList.some(item => item.completed) && (
          <div className="mt-4 pt-3 border-t border-dashed border-[#E0DBCF] flex justify-end">
            <button
              onClick={handleClearCompletedClick}
              className="text-[10px] font-bold text-[#9E7676] hover:bg-[#F2E1E1] px-2.5 py-1.5 rounded-lg transition-colors border border-dashed border-[#E9C7C7]"
            >
              체크한 재료 지우기
            </button>
          </div>
        )}
      </div>

      {/* 장보기 완료 시 냉장고 이동 제안 아기자기한 커스텀 모달 */}
      <CustomModal
        isOpen={modalOpen}
        onClose={handleCancelMoveToFridge}
        title="냉장고로 바로 채워 넣을까요?"
      >
        <div className="space-y-4 text-center py-2">
          <div className="flex justify-center mb-1">
            <div className="bg-[#DDE5D7] text-4xl p-4 rounded-3xl border border-[#C9D5C3]/60">
              🧺 ➡️ ❄️
            </div>
          </div>
          <p className="text-sm font-bold text-[#4A4A4A]">
            체크한 {pendingCompletedItems.length}개의 재료를 장보셨나요?
          </p>
          <div className="bg-[#F9F7F2] border border-[#E0DBCF]/60 rounded-xl p-2.5 max-h-[100px] overflow-y-auto text-[11px] text-gray-500 font-medium text-left">
            {pendingCompletedItems.map(item => item.name).join(', ')}
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            확인하시면 해당 식재료를 냉장고 보관에 자동으로 등록해 드립니다.
          </p>

          <div className="flex gap-2 justify-center pt-3 border-t border-dashed border-[#E0DBCF] flex-wrap sm:flex-nowrap">
            <button
              onClick={handleCancelMoveToFridge}
              className="px-3 py-1.5 text-[11px] font-bold text-gray-500 bg-white rounded-xl hover:bg-[#E0DBCF]/40 transition-colors border border-[#E0DBCF]"
            >
              취소
            </button>
            <button
              onClick={handleOnlyDelete}
              className="px-3 py-1.5 text-[11px] font-bold text-[#9E7676] bg-[#F2E1E1]/50 border border-[#E9C7C7]/50 rounded-xl hover:bg-[#F2E1E1] transition-colors"
            >
              냉장고 추가 없이 지우기
            </button>
            <button
              onClick={handleConfirmMoveToFridge}
              className="px-4 py-1.5 text-[11px] font-bold text-white bg-[#829379] rounded-xl hover:bg-[#6D7D65] shadow-md transition-colors"
            >
              네, 냉장고에 추가!
            </button>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}
