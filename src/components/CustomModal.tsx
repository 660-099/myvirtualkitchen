/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function CustomModal({ isOpen, onClose, title, children }: CustomModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-[#FCFBF7] p-6 shadow-2xl border-4 border-[#E6DFD3] text-[#4A3E3D]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-dashed border-[#E6DFD3] pb-3 mb-4">
              <h3 className="font-sans text-lg font-bold tracking-tight text-[#5C4D4D] flex items-center gap-2">
                🌸 {title}
              </h3>
              <button
                id="modal-close-btn"
                onClick={onClose}
                className="rounded-full p-1 text-[#8C7A78] hover:bg-[#F3EFE6] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="text-sm font-sans leading-relaxed">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
