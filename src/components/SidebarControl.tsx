'use client';

import React, { useState, useEffect, useSyncExternalStore, useRef, useCallback } from 'react';
import { PanelLeft } from 'lucide-react';

export type SidebarMode = 'expanded' | 'collapsed' | 'hover';

export const SIDEBAR_STORAGE_KEY = 'nitp_sidebar_mode';

const subscribe = (callback: () => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener('nitp_sidebar_mode_change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('nitp_sidebar_mode_change', callback);
  };
};

const getSnapshot = (): SidebarMode => {
  if (typeof window === 'undefined') return 'hover';
  try {
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (saved === 'expanded' || saved === 'collapsed' || saved === 'hover') {
      return saved as SidebarMode;
    }
  } catch {
    // fallback if localStorage is disabled or throws
  }
  return 'hover';
};

const getServerSnapshot = (): SidebarMode => 'hover';

export function useSidebarMode() {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [isHovered, setIsHovered] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setMode = useCallback((newMode: SidebarMode) => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, newMode);
      window.dispatchEvent(new Event('nitp_sidebar_mode_change'));
    } catch {
      // ignore
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (mode === 'hover') {
      setIsHovered(true);
    }
  }, [mode]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (mode === 'hover') {
      // Short delay before collapsing (250ms)
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovered(false);
      }, 250);
    }
  }, [mode]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // Determine if sidebar is visually open/wide:
  // - In 'expanded' mode: always true
  // - In 'collapsed' mode: false (unless popover is open)
  // - In 'hover' mode: true if hovered OR if popover is open
  const isExpanded = mode === 'expanded' || isPopoverOpen || (mode === 'hover' && isHovered);

  return {
    mode,
    setMode,
    isExpanded,
    isHovered,
    isPopoverOpen,
    setIsPopoverOpen,
    handleMouseEnter,
    handleMouseLeave,
  };
}

const OPTIONS: { id: SidebarMode; label: string }[] = [
  { id: 'expanded', label: 'Expanded' },
  { id: 'collapsed', label: 'Collapsed' },
  { id: 'hover', label: 'Expand on hover' },
];

interface SidebarControlProps {
  mode: SidebarMode;
  setMode: (mode: SidebarMode) => void;
  isPopoverOpen: boolean;
  setIsPopoverOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isExpanded: boolean;
}

export function SidebarControl({
  mode,
  setMode,
  isPopoverOpen,
  setIsPopoverOpen,
  isExpanded,
}: SidebarControlProps) {
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // When popover opens, highlight active option
  useEffect(() => {
    if (isPopoverOpen) {
      const activeIdx = OPTIONS.findIndex((opt) => opt.id === mode);
      setFocusedIndex(activeIdx >= 0 ? activeIdx : 0);
    }
  }, [isPopoverOpen, mode]);

  // Focus the highlighted option when focusedIndex changes while open
  useEffect(() => {
    if (isPopoverOpen && focusedIndex >= 0 && optionRefs.current[focusedIndex]) {
      optionRefs.current[focusedIndex]?.focus();
    }
  }, [isPopoverOpen, focusedIndex]);

  // Handle outside click to close popover
  useEffect(() => {
    if (!isPopoverOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsPopoverOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPopoverOpen, setIsPopoverOpen]);

  // Handle keyboard navigation inside popover
  useEffect(() => {
    if (!isPopoverOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsPopoverOpen(false);
        buttonRef.current?.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % OPTIONS.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + OPTIONS.length) % OPTIONS.length);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setFocusedIndex((curr) => {
          const selected = OPTIONS[curr];
          if (selected) {
            handleSelect(selected.id);
          }
          return curr;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPopoverOpen, setIsPopoverOpen]);

  const handleSelect = (selectedMode: SidebarMode) => {
    setMode(selectedMode);
    setIsPopoverOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div className="relative flex items-center justify-between px-1 py-1">
      <div className="relative group/ctrl">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsPopoverOpen((prev) => !prev)}
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
            isPopoverOpen
              ? 'bg-slate-100 text-brand-navy'
              : 'text-slate-500 hover:text-brand-navy hover:bg-slate-100'
          }`}
          aria-label="Sidebar control"
          aria-haspopup="menu"
          aria-expanded={isPopoverOpen}
          title={!isExpanded ? 'Sidebar control' : undefined}
        >
          <PanelLeft className="w-4 h-4 shrink-0" />
        </button>

        {/* Floating tooltip on hover when sidebar is collapsed */}
        {!isExpanded && (
          <div className="opacity-0 group-hover/ctrl:opacity-100 transition-opacity duration-150 absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none drop-shadow-md">
            Sidebar control
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
          </div>
        )}

        {/* Popover */}
        {isPopoverOpen && (
          <div
            ref={popoverRef}
            role="menu"
            aria-label="Sidebar control"
            className="absolute bottom-full left-0 mb-2 w-52 bg-white rounded-xl shadow-2xl border border-slate-200 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 focus:outline-none"
            tabIndex={-1}
          >
            <div className="px-3 py-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
              Sidebar control
            </div>
            <div className="h-px bg-slate-100 my-1" />
            <div className="space-y-0.5" role="presentation">
              {OPTIONS.map((opt, idx) => {
                const isActive = mode === opt.id;
                const isFocused = focusedIndex === idx;
                return (
                  <button
                    key={opt.id}
                    ref={(el) => {
                      optionRefs.current[idx] = el;
                    }}
                    role="menuitem"
                    type="button"
                    onClick={() => handleSelect(opt.id)}
                    onMouseEnter={() => setFocusedIndex(idx)}
                    className={`w-full flex items-center px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer text-left focus:outline-none ${
                      isFocused ? 'bg-slate-100 text-brand-navy' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {/* Filled dot indicator for active mode */}
                    <span className="w-3.5 flex items-center justify-start shrink-0 mr-2">
                      {isActive ? (
                        <span className="w-2 h-2 rounded-full bg-brand-navy" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-transparent" />
                      )}
                    </span>
                    <span className={isActive ? 'font-bold text-brand-navy' : 'font-medium text-slate-700'}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* When expanded, show label next to the button */}
      <span
        className={`text-xs font-semibold text-slate-400 select-none transition-opacity duration-200 whitespace-nowrap overflow-hidden ${
          isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        Sidebar control
      </span>
    </div>
  );
}
