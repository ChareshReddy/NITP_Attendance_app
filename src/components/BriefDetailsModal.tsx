'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Mail, Calendar, Briefcase, Building, User, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDateToIndian } from '@/lib/dateUtils';

export interface PublicEmployeeDTO {
  id: string;
  name: string;
  email: string;
  designation: string;
  department: string;
  dateOfJoining: string | null;
  profileImage: string | null;
  location?: string | null;
}

interface BriefDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId?: string | null;
  employeeIds?: string[] | null;
  initialEmployee?: PublicEmployeeDTO | null;
}

export default function BriefDetailsModal({
  isOpen,
  onClose,
  employeeId,
  employeeIds,
  initialEmployee,
}: BriefDetailsModalProps) {
  const [employees, setEmployees] = useState<PublicEmployeeDTO[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const fetchDetails = useCallback(async () => {
    if (initialEmployee) {
      setEmployees([initialEmployee]);
      setCurrentIndex(0);
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (employeeIds && employeeIds.length > 0) {
        const res = await fetch(`/api/employees/public-profile?ids=${employeeIds.join(',')}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load details');
        setEmployees(data.employees || []);
        setCurrentIndex(0);
      } else if (employeeId) {
        const res = await fetch(`/api/employees/public-profile?id=${employeeId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load details');
        setEmployees(data.employee ? [data.employee] : []);
        setCurrentIndex(0);
      }
    } catch (err: any) {
      setError(err.message || 'Could not load employee details');
    } finally {
      setLoading(false);
    }
  }, [employeeId, employeeIds, initialEmployee]);

  useEffect(() => {
    if (isOpen) {
      fetchDetails();
    } else {
      setEmployees([]);
      setCurrentIndex(0);
      setError('');
    }
  }, [isOpen, fetchDetails]);

  // Keyboard accessibility: ESC key to close & focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Simple focus trap within modal
      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Auto-focus the close button for accessibility
    const timeout = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeout);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentEmployee = employees[currentIndex] || null;

  // Get initials for avatar fallback
  const getInitials = (nameVal: string) => {
    if (!nameVal) return 'NI';
    return nameVal
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
      >
        {/* Navy Header Banner */}
        <div className="bg-gradient-to-r from-[#011f4b] via-[#03396c] to-[#005b96] p-6 text-white relative">
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-white/40"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-white border border-white/20">
              Welcome to the team
            </span>
            {employees.length > 1 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/30 text-emerald-100 border border-emerald-400/30">
                {currentIndex + 1} of {employees.length} new joiners
              </span>
            )}
          </div>

          <h3 id="welcome-modal-title" className="text-xl font-extrabold tracking-tight">
            Meet Our New Colleague!
          </h3>
          <p className="text-xs text-blue-100/90 mt-1">
            Say hello and give a warm welcome to our newest team member.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <div className="w-8 h-8 border-3 border-brand-cta/20 border-t-brand-cta rounded-full animate-spin mb-3" />
              <span className="text-xs font-semibold">Loading member details...</span>
            </div>
          ) : error ? (
            <div className="py-8 text-center text-sm text-brand-red">
              <p>{error}</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : currentEmployee ? (
            <div>
              {/* Profile Avatar & Name Section */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pb-5 border-b border-slate-100">
                {currentEmployee.profileImage ? (
                  <img
                    src={currentEmployee.profileImage}
                    alt={currentEmployee.name}
                    className="w-18 h-18 rounded-2xl object-cover border-2 border-brand-navy/10 shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-[#03396c] to-[#005b96] text-white font-extrabold text-xl flex items-center justify-center shadow-md shrink-0 border-2 border-white">
                    {getInitials(currentEmployee.name)}
                  </div>
                )}

                <div className="text-center sm:text-left flex-1 min-w-0">
                  <h4 className="text-lg font-extrabold text-brand-navy truncate">
                    {currentEmployee.name}
                  </h4>
                  <p className="text-xs font-semibold text-brand-cta mt-0.5 truncate">
                    {currentEmployee.designation}
                  </p>
                  <div className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-mono font-bold text-slate-600 border border-slate-200">
                    ID: {currentEmployee.id.slice(0, 8).toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Public Details Grid */}
              <div className="grid grid-cols-1 gap-3 py-5 text-xs">
                {/* Department */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-150">
                  <div className="p-2 rounded-lg bg-blue-100/60 text-brand-navy shrink-0">
                    <Building className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</span>
                    <span className="font-bold text-brand-navy truncate block">
                      {currentEmployee.department || 'General'}
                    </span>
                  </div>
                </div>

                {/* Designation */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-150">
                  <div className="p-2 rounded-lg bg-purple-100/60 text-purple-700 shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Designation</span>
                    <span className="font-bold text-brand-navy truncate block">
                      {currentEmployee.designation}
                    </span>
                  </div>
                </div>

                {/* Date of Joining */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-150">
                  <div className="p-2 rounded-lg bg-emerald-100/60 text-emerald-700 shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date of Joining</span>
                    <span className="font-bold text-brand-navy block">
                      {currentEmployee.dateOfJoining ? formatDateToIndian(currentEmployee.dateOfJoining) : '-'}
                    </span>
                  </div>
                </div>

                {/* Work Email */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-150">
                  <div className="p-2 rounded-lg bg-blue-100/60 text-brand-cta shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Work Email</span>
                    {currentEmployee.email ? (
                      <a
                        href={`mailto:${currentEmployee.email}`}
                        className="font-bold text-brand-cta hover:underline truncate block"
                        title={currentEmployee.email}
                      >
                        {currentEmployee.email}
                      </a>
                    ) : (
                      <span className="text-slate-400 font-medium">-</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bulk Navigator (if multiple joiners) */}
              {employees.length > 1 && (
                <div className="flex items-center justify-between pt-2 pb-4 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-brand-navy bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {currentIndex + 1} of {employees.length}
                  </span>
                  <button
                    type="button"
                    disabled={currentIndex === employees.length - 1}
                    onClick={() => setCurrentIndex((prev) => Math.min(employees.length - 1, prev + 1))}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-brand-navy bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                {currentEmployee.email && (
                  <a
                    href={`mailto:${currentEmployee.email}?subject=Welcome%20to%20Next%20IT%20Point!`}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-center text-white bg-brand-cta hover:bg-blue-700 shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Say Welcome
                  </a>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-slate-500">
              No employee details found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
