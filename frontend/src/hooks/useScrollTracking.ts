import { useEffect, useRef } from 'react';
import { analytics } from '@/lib/analytics';

interface ScrollTrackingOptions {
  targetType: string;
  targetId: string;
  threshold?: number; // 閾値(%)、デフォルトは25%
  debounceMs?: number; // デバウンス時間、デフォルトは500ms
}

export const useScrollTracking = (options: ScrollTrackingOptions) => {
  const { targetType, targetId, threshold = 25, debounceMs = 500 } = options;
  const maxScrollDepth = useRef(0);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSentDepth = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // スクロール深度を計算（0-100%）
      const scrollDepth = Math.round((scrollTop + windowHeight) / documentHeight * 100);
      
      // 最大スクロール深度を更新
      if (scrollDepth > maxScrollDepth.current) {
        maxScrollDepth.current = scrollDepth;
        
        // 閾値を超えた場合のみ送信（デバウンス付き）
        if (scrollDepth > lastSentDepth.current + threshold) {
          if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
          }
          
          debounceTimer.current = setTimeout(() => {
            analytics.trackScroll(targetType, targetId, scrollDepth);
            lastSentDepth.current = scrollDepth;
          }, debounceMs);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [targetType, targetId, threshold, debounceMs]);

  // コンポーネントアンマウント時に最終スクロール深度を送信
  useEffect(() => {
    return () => {
      if (maxScrollDepth.current > 0) {
        analytics.trackScroll(targetType, targetId, maxScrollDepth.current);
      }
    };
  }, [targetType, targetId]);
};