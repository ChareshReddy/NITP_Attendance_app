/**
 * Universal Indian Date Formatting Utilities (DD-MM-YYYY)
 */

export function formatDateToIndian(dateVal: string | Date | null | undefined): string {
  if (!dateVal) return '-';
  
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined' || trimmed === 'N/A' || trimmed === '-') return '-';
    
    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split('-');
      return `${d}-${m}-${y}`;
    }
    
    // DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
      return trimmed;
    }
    
    // ISO string starting with YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
      const datePart = trimmed.split('T')[0];
      const [y, m, d] = datePart.split('-');
      return `${d}-${m}-${y}`;
    }
  }

  const date = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
  if (!date || isNaN(date.getTime())) {
    return typeof dateVal === 'string' ? dateVal : '-';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

export function formatDateTimeToIndian(dateVal: string | Date | null | undefined): string {
  if (!dateVal) return '-';
  const date = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
  if (!date || isNaN(date.getTime())) {
    return typeof dateVal === 'string' ? dateVal : '-';
  }

  const dateStr = formatDateToIndian(date);
  const timeStr = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${dateStr}, ${timeStr}`;
}

export function formatTimeToIndian(dateVal: string | Date | null | undefined): string {
  if (!dateVal) return '--:--';
  
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    if (!trimmed || trimmed === '-' || trimmed === '--:--') return '--:--';
    
    // Check if it's already HH:MM or HH:MM:SS format
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmed)) {
      const [hStr, mStr] = trimmed.split(':');
      let hour = parseInt(hStr, 10);
      const minute = mStr;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12;
      if (hour === 0) hour = 12;
      return `${String(hour).padStart(2, '0')}:${minute} ${ampm}`;
    }
  }

  const date = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
  if (!date || isNaN(date.getTime())) {
    return typeof dateVal === 'string' ? dateVal : '--:--';
  }

  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
