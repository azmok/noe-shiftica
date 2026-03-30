"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = 'noeShiftica_Hearing_Data';

export function useHearingData() {
  const [status, setStatus] = useState({ hasData: false, isCompleted: false });
  const pathname = usePathname();

  useEffect(() => {
    const checkData = () => {
      try {
        const itemStr = localStorage.getItem(STORAGE_KEY);
        if (itemStr) {
          const item = JSON.parse(itemStr);
          // 有効期限内かチェック (7日間)
          if (Date.now() - item.timestamp <= 7 * 24 * 60 * 60 * 1000) {
            const data = item.data || {};
            const questionIds = Array.from({ length: 14 }, (_, i) => `q${i + 1}`);
            const allAnswered = questionIds.every(id => data[id] && data[id].length > 0);
            
            setStatus({ hasData: true, isCompleted: allAnswered });
            return;
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (e) {}
      setStatus({ hasData: false, isCompleted: false });
    };

    checkData();
    window.addEventListener('storage', checkData);
    return () => window.removeEventListener('storage', checkData);
  }, [pathname]);

  return status;
}
