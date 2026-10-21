'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SidebarControl, useSidebarMode, SidebarMode } from './SidebarControl';

export interface SidebarNavItem<T extends string = string> {
  id: T;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface SidebarBottomLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DesktopSidebarProps<T extends string = string> {
  navItems: readonly SidebarNavItem<T>[] | SidebarNavItem<T>[] | any[];
  activeTab: T;
  onTabChange: (id: T) => void;
  layoutPillId: string;
  bottomLink?: SidebarBottomLink | null;
}

export default function DesktopSidebar<T extends string = string>({
  navItems,
  activeTab,
  onTabChange,
  layoutPillId,
  bottomLink,
}: DesktopSidebarProps<T>) {
  const asideRef = useRef<HTMLElement | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const { mode, setMode } = useSidebarMode();

  // Determine if sidebar is visually expanded:
  // - In 'expanded' mode: always true
  // - In 'collapsed' mode: false (unless popover is open)
  // - In 'hover' mode: true if hovered OR if popover is open
  const isExpanded = mode === 'expanded' || isPopoverOpen || (mode === 'hover' && isHovered);

  // Mouse enter handler with edge jitter prevention
  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (mode === 'hover') {
      setIsHovered(true);
    }
  }, [mode]);

  // Mouse leave handler with short delay before collapsing
  const handleMouseLeave = useCallback((e: React.MouseEvent) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // Short delay before collapsing (200ms) to prevent flicker/jumping
    hoverTimeoutRef.current = setTimeout(() => {
      // Check if mouse actually left the aside element
      if (asideRef.current && !asideRef.current.matches(':hover')) {
        setIsHovered(false);
      }
    }, 200);
  }, []);

  // When popover closes or when mode changes, verify if mouse is actually over aside
  useEffect(() => {
    if (!isPopoverOpen && mode === 'hover') {
      if (asideRef.current && !asideRef.current.matches(':hover')) {
        setIsHovered(false);
      }
    }
  }, [isPopoverOpen, mode]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // When width transition ends, fire a single resize event so charts and tables resize cleanly once
  const handleTransitionEnd = (e: React.TransitionEvent<HTMLElement>) => {
    if (e.target === asideRef.current && e.propertyName === 'width') {
      window.dispatchEvent(new Event('resize'));
    }
  };

  return (
    <aside
      ref={asideRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTransitionEnd={handleTransitionEnd}
      className={`hidden md:flex flex-col shrink-0 sticky top-[73px] h-[calc(100vh-73px)] z-20 bg-white border-r border-gray-200 transition-[width] duration-300 ease-in-out py-6 shadow-sm select-none ${
        isExpanded ? 'w-60' : 'w-20'
      }`}
    >
      <nav className="flex-1 space-y-1 px-2 relative overflow-y-auto overflow-x-hidden min-h-0">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              title={!isExpanded ? item.label : undefined}
              aria-label={item.label}
              className={`group/btn relative w-full text-left py-3 px-4 flex items-center transition-all cursor-pointer rounded-xl ${
                isActive
                  ? 'text-brand-navy font-bold'
                  : 'text-slate-600 hover:text-brand-navy hover:bg-slate-50'
              }`}
            >
              {/* Animated sliding highlight background pill */}
              {isActive && (
                <motion.div
                  layoutId={layoutPillId}
                  className="absolute inset-0 bg-slate-100 border-l-4 border-brand-navy rounded-xl -z-10"
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                />
              )}

              <item.icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-brand-navy' : 'text-slate-400 group-hover/btn:text-brand-navy'
                }`}
              />
              <span
                className={`text-xs font-semibold tracking-wide ml-4 transition-opacity duration-200 whitespace-nowrap overflow-hidden ${
                  isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                {item.label}
              </span>

              {/* Tooltip on hover when collapsed */}
              {!isExpanded && (
                <div className="opacity-0 group-hover/btn:opacity-100 transition-opacity duration-150 absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none drop-shadow-md">
                  {item.label}
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Optional bottom link (e.g. TL portal / My portal) */}
      {bottomLink && (
        <div className="px-2 border-t border-slate-100 pt-3 pb-1">
          <Link
            href={bottomLink.href}
            title={!isExpanded ? bottomLink.label : undefined}
            aria-label={bottomLink.label}
            className="group/btn relative w-full text-left py-3 px-4 flex items-center transition-all cursor-pointer rounded-xl text-slate-600 hover:text-brand-navy hover:bg-slate-50"
          >
            <bottomLink.icon className="w-4 h-4 shrink-0 text-slate-400 group-hover/btn:text-brand-navy" />
            <span
              className={`text-xs font-semibold tracking-wide ml-4 transition-opacity duration-200 whitespace-nowrap overflow-hidden ${
                isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              {bottomLink.label}
            </span>
            {!isExpanded && (
              <div className="opacity-0 group-hover/btn:opacity-100 transition-opacity duration-150 absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none drop-shadow-md">
                {bottomLink.label}
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
              </div>
            )}
          </Link>
        </div>
      )}

      {/* Sidebar control pinned to bottom */}
      <div className="mt-auto px-2 pt-2 border-t border-slate-100 relative shrink-0 overflow-visible">
        <SidebarControl
          mode={mode}
          setMode={(newMode) => {
            setMode(newMode);
            if (newMode === 'hover' && asideRef.current && !asideRef.current.matches(':hover')) {
              setIsHovered(false);
            }
          }}
          isPopoverOpen={isPopoverOpen}
          setIsPopoverOpen={setIsPopoverOpen}
          isExpanded={isExpanded}
        />
      </div>
    </aside>
  );
}
