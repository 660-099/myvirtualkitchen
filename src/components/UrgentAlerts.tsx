/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Ingredient, StorageLocation } from '../types';
import { calculateDDay, formatDate } from '../utils';
import { AlertCircle, X, Plus, Minus, Trash2 } from 'lucide-react';
import { DESIGN_THEME } from '../theme';

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
  const [confirmDelete, setConfirmDelete] = useState(false);

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
    setConfirmDelete(false);
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
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => {
        setConfirmDelete(false);
      }, 3000);
      return;
    }
    onDeleteIngredient(editingItem.id);
    setEditingItem(null);
    setConfirmDelete(false);
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
    <div className={`${DESIGN_THEME.colors.warning.bgLight} border ${DESIGN_THEME.colors.warning.border} ${DESIGN_THEME.layout.roundedLarge} ${DESIGN_THEME.layout.paddingCard} mb-5 shadow-2xs relative`}>
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b ${DESIGN_THEME.colors.warning.border} pb-2.5 mb-3`}>
        <div className={`flex items-center gap-2 ${DESIGN_THEME.colors.warning.text} ${DESIGN_THEME.fonts.sans} font-bold text-sm md:text-base`}>
          <AlertCircle size={DESIGN_THEME.icons.sizes.md} className="shrink-0" />
          <span className="whitespace-nowrap">긴급 소비 (D-{daysThreshold})</span>
        </div>

        {/* 직접 일수 입력 설정 옵션 */}
        <form onSubmit={handleApplyThreshold} className="flex items-center gap-1.5 self-end sm:self-auto">
          <span className={`${DESIGN_THEME.fontSizes.caption} whitespace-nowrap`}>조회 범위:</span>
          <input
            type="number"
            min="1"
            max="100"
            value={daysInput}
            onChange={e => setDaysInput(e.target.value)}
            className="w-12 bg-white border border-[#E0DBCF] rounded-lg px-1.5 py-0.5 text-center text-xs text-[#4A4A4A] focus:outline-hidden focus:ring-1 focus:ring-[#829379]"
          />
          <span className={`${DESIGN_THEME.fontSizes.caption} whitespace-nowrap`}>일 이내</span>
          <button
            type="submit"
            className={`${DESIGN_THEME.buttons.badgeBtn} whitespace-nowrap`}
          >
            변경
          </button>
        </form>
      </div>

      {urgentItems.length === 0 ? (
        <div className={DESIGN_THEME.containers.emptyZone}>
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
                className={`flex-shrink-0 flex items-center gap-2 bg-white rounded-xl p-2.5 transition-all duration-200 border cursor-pointer hover:shadow-md hover:scale-[1.02] ${
                  isUrgentDanger 
                    ? 'border-red-400 bg-red-50/50 hover:border-red-500' 
                    : 'border-[#E0DBCF]/60 hover:border-[#829379]'
                }`}
                title="클릭하여 상세 정보 보기 및 수정"
              >
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-bold text-[#4A4A4A] text-xs truncate" title={item.name}>
                    {item.emoji} {item.name}
                  </p>
                  <div className="flex items-center justify-between gap-1 mt-1">
                    <p className={`${DESIGN_THEME.fontSizes.meta} font-medium truncate`}>
                      {item.quantity}{item.unit || '개'}
                    </p>
                    <span className={`text-[10px] ${DESIGN_THEME.fonts.mono} font-bold ${isUrgentDanger ? 'text-red-500' : 'text-[#7A6A53]'}`}>
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
        <div 
          onClick={() => setEditingItem(null)}
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-xs cursor-pointer"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className={`bg-white border ${DESIGN_THEME.colors.neutral.border} ${DESIGN_THEME.layout.roundedLarge} w-full max-w-sm p-5 shadow-2xl text-[#4A4A4A] space-y-4 cursor-default`}
          >
            <div className="flex items-center justify-between border-b border-dashed border-[#E0DBCF] pb-2.5">
              <h3 className={`${DESIGN_THEME.colors.primary.text} ${DESIGN_THEME.fonts.sans} font-bold text-sm flex items-center gap-1.5`}>
                <span>{editingItem.emoji}</span> 식재료 수정
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={DESIGN_THEME.icons.sizes.md} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* 이름 */}
              <div>
                <label className={`${DESIGN_THEME.fontSizes.caption} font-bold block mb-1`}>식재료 명칭</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className={DESIGN_THEME.inputs.text}
                />
              </div>

              {/* 보관 장소 및 개봉 여부 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`${DESIGN_THEME.fontSizes.caption} font-bold block mb-1`}>보관 위치</label>
                  <select
                    value={editLocation}
                    onChange={e => setEditLocation(e.target.value as StorageLocation)}
                    className={DESIGN_THEME.inputs.select}
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
                      className={DESIGN_THEME.inputs.checkbox}
                    />
                    <span className="text-[11px] font-bold">개봉함</span>
                  </label>
                </div>
              </div>

              {/* 유통기한 및 수량 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`${DESIGN_THEME.fontSizes.caption} font-bold block mb-1`}>유통기한</label>
                  <input
                    type="date"
                    value={editExpiryDate}
                    onChange={e => setEditExpiryDate(e.target.value)}
                    className={`${DESIGN_THEME.inputs.text} ${DESIGN_THEME.fonts.mono}`}
                  />
                </div>

                <div>
                  <label className={`${DESIGN_THEME.fontSizes.caption} font-bold block mb-1`}>수량 / 단위</label>
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
                <label className={`${DESIGN_THEME.fontSizes.caption} font-bold block mb-1`}>메모</label>
                <input
                  type="text"
                  value={editMemo}
                  onChange={e => setEditMemo(e.target.value)}
                  placeholder="특이사항 적기"
                  className={DESIGN_THEME.inputs.text}
                />
              </div>
            </div>

            {/* 하단 제어 버튼 */}
            <div className="flex items-center justify-between pt-3 border-t border-dashed border-[#E0DBCF]">
              <button
                type="button"
                onClick={handleConfirmDelete}
                className={confirmDelete ? DESIGN_THEME.buttons.dangerConfirm : DESIGN_THEME.buttons.danger}
              >
                <Trash2 size={13} />
                <span>{confirmDelete ? '진짜 삭제? (한번 더!)' : '삭제'}</span>
              </button>

              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className={DESIGN_THEME.buttons.secondary}
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className={DESIGN_THEME.buttons.primary}
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
