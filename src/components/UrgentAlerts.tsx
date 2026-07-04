/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Ingredient, StorageLocation } from '../types';
import { calculateDDay, formatDate } from '../utils';
import { AlertCircle, X, Plus, Minus, Trash2 } from 'lucide-react';

interface UrgentAlertsProps {
  ingredients: Ingredient[];
  onUpdateIngredient: (id: string, updated: Partial<Ingredient>) => void;
  onDeleteIngredient: (id: string) => void;
}

export default function UrgentAlerts({
  ingredients,
  onUpdateIngredient,
  onDeleteIngredient,
}: UrgentAlertsProps) {
  const [daysInput, setDaysInput] = useState<string>('7');
  const [daysThreshold, setDaysThreshold] = useState<number>(7);

  // 수정 대상 식재료 상태
  const [editingItem, setEditingItem] = useState<Ingredient | null>(null);

  // 간이 모달 내의 수정 폼 데이터
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState<StorageLocation>('fridge');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editQuantity, setEditQuantity] = useState(1);
  const [editUnit, setEditUnit] = useState('개');
  const [editMemo, setEditMemo] = useState('');
  const [editOpened, setEditOpened] = useState(false);

  const handleApplyThreshold = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(daysInput, 10);
    if (!isNaN(val) && val > 0) {
      setDaysThreshold(val);
    }
  };

  // 카드 클릭 시 모달 열기 및 폼 기본값 로드
  const handleCardClick = (item: Ingredient) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditLocation(item.location);
    setEditExpiryDate(item.expiryDate || '');
    setEditQuantity(item.quantity);
    setEditUnit(item.unit || '개');
    setEditMemo(item.memo || '');
    setEditOpened(item.opened || false);
  };

  // 수정 저장
  const handleSaveEdit = () => {
    if (!editingItem) return;
    onUpdateIngredient(editingItem.id, {
      name: editName.trim(),
      location: editLocation,
      expiryDate: editExpiryDate,
      quantity: editQuantity,
      unit: editUnit,
      memo: editMemo,
      opened: editOpened,
      openedDate: editOpened && !editingItem.opened ? formatDate(new Date()) : (editOpened ? editingItem.openedDate : undefined),
    });
    setEditingItem(null);
  };

  // 수정 삭제
  const handleConfirmDelete = () => {
    if (!editingItem) return;
    if (confirm(`'${editingItem.name}' 식재료를 삭제하시겠습니까?`)) {
      onDeleteIngredient(editingItem.id);
      setEditingItem(null);
    }
  };

  // 오늘 기준 유통기한이 설정한 일수 이하로 남았거나 지난 재료 필터링
  const urgentItems = ingredients
    .map(item => ({
      ...item,
      ddayInfo: calculateDDay(item.expiryDate),
    }))
    .filter(item => item.ddayInfo.days <= daysThreshold)
    // D-Day가 작은 순서대로 정렬 (만료된 것 -> 임박한 것)
    .sort((a, b) => a.ddayInfo.days - b.ddayInfo.days);

  return (
    <div className="bg-[#F4EFEB]/60 border border-[#E0DBCF] rounded-2xl p-4 mb-5 shadow-sm relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E0DBCF]/60 pb-2.5 mb-3">
        <div className="flex items-center gap-2 text-[#7A6A53] font-serif font-bold text-sm md:text-base">
          <AlertCircle size={18} className="shrink-0" />
          <span className="whitespace-nowrap">긴급 소비 (D-{daysThreshold})</span>
        </div>

        {/* 직접 일수 입력 설정 옵션 */}
        <form onSubmit={handleApplyThreshold} className="flex items-center gap-1.5 self-end sm:self-auto">
          <span className="text-[11px] text-gray-500 whitespace-nowrap">조회 범위:</span>
          <input
            type="number"
            min="1"
            max="100"
            value={daysInput}
            onChange={e => setDaysInput(e.target.value)}
            className="w-12 bg-white border border-[#E0DBCF] rounded-lg px-1.5 py-0.5 text-center text-xs text-[#4A4A4A] focus:outline-hidden focus:ring-1 focus:ring-[#829379]"
          />
          <span className="text-[11px] text-gray-500 whitespace-nowrap">일 이내</span>
          <button
            type="submit"
            className="bg-[#829379] hover:bg-[#6D7D65] text-white font-bold text-[10px] px-2.5 py-0.5 rounded-lg transition-colors shadow-xs whitespace-nowrap"
          >
            변경
          </button>
        </form>
      </div>

      {urgentItems.length === 0 ? (
        <div className="py-6 text-center text-gray-400 text-xs font-sans">
          설정 기간 내 소비해야 할 임박 식재료가 없습니다.
        </div>
      ) : (
        /* 가로 스크롤 리스트 */
        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          {urgentItems.map(item => {
            const days = item.ddayInfo.days;
            const ddayLabel = days < 0 
              ? `D+${Math.abs(days)}` 
              : days === 0 
                ? 'D-Day' 
                : `D-${days}`;

            const isUrgentDanger = days <= 0;

            return (
              <div
                key={item.id}
                style={{ minWidth: '140px', maxWidth: '170px' }}
                onClick={() => handleCardClick(item)}
                className={`flex-shrink-0 flex items-center gap-2 bg-white rounded-xl p-2.5 transition-all duration-200 border cursor-pointer hover:shadow-md hover:scale-[1.02] hover:border-[#829379] ${
                  isUrgentDanger 
                    ? 'border-[#E57373] bg-[#FFF8F8]' 
                    : 'border-[#E0DBCF]/60'
                }`}
                title="클릭하여 상세 정보 보기 및 수정"
              >
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-bold text-[#4A4A4A] text-xs truncate" title={item.name}>
                    {item.emoji} {item.name}
                  </p>
                  <div className="flex items-center justify-between gap-1 mt-1">
                    <p className="text-[10px] text-gray-400 font-medium truncate font-sans">
                      {item.quantity}{item.unit || '개'}
                    </p>
                    <span className={`text-[10px] font-mono font-bold ${isUrgentDanger ? 'text-[#E53E3E]' : 'text-[#7A6A53]'}`}>
                      {ddayLabel}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 🛠️ 식재료 간이 수정 모달 (Overlay) */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white border border-[#E0DBCF] rounded-2xl w-full max-w-sm p-5 shadow-2xl text-[#4A4A4A] space-y-4">
            <div className="flex items-center justify-between border-b border-dashed border-[#E0DBCF] pb-2.5">
              <h3 className="font-serif font-bold text-sm text-[#5D6D54] flex items-center gap-1.5">
                <span>{editingItem.emoji}</span> 식재료 수정
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* 이름 */}
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">식재료 명칭</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-[#F9F7F2] border border-[#E0DBCF] rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-[#829379]"
                />
              </div>

              {/* 보관 장소 및 개봉 여부 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">보관 위치</label>
                  <select
                    value={editLocation}
                    onChange={e => setEditLocation(e.target.value as StorageLocation)}
                    className="w-full bg-[#F9F7F2] border border-[#E0DBCF] rounded-lg px-2 py-1.5 focus:outline-hidden"
                  >
                    <option value="fridge">냉장실</option>
                    <option value="freezer">냉동실</option>
                    <option value="pantry">실온 보관소</option>
                    <option value="etc">기타 보관함</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer py-2">
                    <input
                      type="checkbox"
                      checked={editOpened}
                      onChange={e => setEditOpened(e.target.checked)}
                      className="rounded-sm border-[#E0DBCF] text-[#829379] focus:ring-[#829379] h-3.5 w-3.5"
                    />
                    <span className="text-[11px] font-bold">개봉함</span>
                  </label>
                </div>
              </div>

              {/* 유통기한 및 수량 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">유통기한</label>
                  <input
                    type="date"
                    value={editExpiryDate}
                    onChange={e => setEditExpiryDate(e.target.value)}
                    className="w-full bg-[#F9F7F2] border border-[#E0DBCF] rounded-lg px-2 py-1.5 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">수량 / 단위</label>
                  <div className="flex items-center gap-1 bg-[#F9F7F2] border border-[#E0DBCF] rounded-lg px-1 py-0.5">
                    <button
                      type="button"
                      onClick={() => editQuantity > 1 && setEditQuantity(editQuantity - 1)}
                      className="p-1 hover:text-[#829379] text-gray-400 transition-colors"
                    >
                      <Minus size={12} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={editQuantity}
                      onChange={e => {
                        const v = parseInt(e.target.value, 10);
                        if (!isNaN(v) && v > 0) setEditQuantity(v);
                      }}
                      className="w-10 bg-transparent border-none text-center font-bold text-xs p-0 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setEditQuantity(editQuantity + 1)}
                      className="p-1 hover:text-[#829379] text-gray-400 transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                    <input
                      type="text"
                      value={editUnit}
                      onChange={e => setEditUnit(e.target.value)}
                      placeholder="개"
                      className="w-8 bg-transparent border-none text-right text-xs p-0 focus:outline-hidden max-w-[30px]"
                    />
                  </div>
                </div>
              </div>

              {/* 메모 */}
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">메모</label>
                <input
                  type="text"
                  value={editMemo}
                  onChange={e => setEditMemo(e.target.value)}
                  placeholder="특이사항 적기"
                  className="w-full bg-[#F9F7F2] border border-[#E0DBCF] rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-[#829379]"
                />
              </div>
            </div>

            {/* 하단 제어 버튼 */}
            <div className="flex items-center justify-between pt-3 border-t border-dashed border-[#E0DBCF]">
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="text-xs font-bold text-[#9E7676] bg-[#F2E1E1] hover:bg-[#E9C7C7] px-3 py-2 rounded-xl flex items-center gap-1 transition-all"
              >
                <Trash2 size={13} />
                <span>삭제</span>
              </button>

              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="text-xs font-bold text-gray-500 bg-[#F9F7F2] hover:bg-[#E0DBCF]/50 px-3 py-2 rounded-xl transition-all"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="text-xs font-bold text-white bg-[#829379] hover:bg-[#6D7D65] px-4 py-2 rounded-xl transition-all shadow-md"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
