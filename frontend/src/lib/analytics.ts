import apiClient from './api';

// 行動ログの型定義
export interface BehaviorEvent {
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: {
    viewDuration?: number;
    scrollDepth?: number;
    hoverTime?: number;
    clickPosition?: { x: number; y: number };
    viewport?: { width: number; height: number };
    referrer?: string;
    timestamp?: number;
    [key: string]: any;
  };
}

export interface AnalyticsConfig {
  batchSize: number;
  flushInterval: number; // ミリ秒
  enableConsoleLog: boolean;
  maxRetries: number;
}

class AnalyticsTracker {
  private config: AnalyticsConfig;
  private eventQueue: BehaviorEvent[] = [];
  private sessionId: string;
  private flushTimer: NodeJS.Timeout | null = null;
  private isOnline: boolean = true;
  private retryCount: number = 0;

  constructor(config?: Partial<AnalyticsConfig>) {
    this.config = {
      batchSize: 10,
      flushInterval: 5000, // 5秒
      enableConsoleLog: process.env.NODE_ENV === 'development',
      maxRetries: 3,
      ...config
    };

    // セッションIDの生成
    this.sessionId = this.generateSessionId();
    
    // オンライン状態の監視
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.flush(); // オンライン復帰時に送信
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });

      // ページ離脱時に残りのイベントを送信
      window.addEventListener('beforeunload', () => {
        this.flush(true);
      });

      // visibility change時の処理
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush(true);
        }
      });
    }

    this.startFlushTimer();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private log(...args: any[]): void {
    if (this.config.enableConsoleLog) {
      console.log('[Analytics]', ...args);
    }
  }

  public track(event: BehaviorEvent): void {
    // メタデータの補完
    const enrichedEvent: BehaviorEvent = {
      ...event,
      metadata: {
        timestamp: Date.now(),
        viewport: typeof window !== 'undefined' ? {
          width: window.innerWidth,
          height: window.innerHeight
        } : undefined,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
        ...event.metadata
      }
    };

    this.eventQueue.push(enrichedEvent);
    this.log('Event tracked:', enrichedEvent);

    // バッチサイズに達したら即座に送信
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  public async flush(isSync: boolean = false): Promise<void> {
    if (this.eventQueue.length === 0 || !this.isOnline) {
      return;
    }

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      this.log(`Sending ${eventsToSend.length} events to server`);

      if (isSync && 'sendBeacon' in navigator) {
        // 同期送信（ページ離脱時）
        const payload = JSON.stringify({
          sessionId: this.sessionId,
          logs: eventsToSend
        });
        
        navigator.sendBeacon('/api/v1/analytics/behavior/batch', payload);
        this.log('Events sent via sendBeacon');
      } else {
        // 非同期送信
        await apiClient.request('/api/v1/analytics/behavior/batch', {
          method: 'POST',
          body: JSON.stringify({
            sessionId: this.sessionId,
            logs: eventsToSend
          })
        });
        this.log('Events sent successfully');
      }

      this.retryCount = 0;
    } catch (error) {
      console.error('Failed to send analytics events:', error);
      
      // リトライ処理
      if (this.retryCount < this.config.maxRetries) {
        this.retryCount++;
        this.eventQueue.unshift(...eventsToSend); // 失敗したイベントを先頭に戻す
        this.log(`Retry attempt ${this.retryCount}/${this.config.maxRetries}`);
      } else {
        this.log('Max retries reached, dropping events');
        this.retryCount = 0;
      }
    }
  }

  // 特定のアクション用のヘルパーメソッド
  public trackView(targetType: string, targetId: string, duration?: number): void {
    this.track({
      action: 'view',
      targetType,
      targetId,
      metadata: duration ? { viewDuration: duration } : undefined
    });
  }

  public trackClick(targetType: string, targetId: string, position?: { x: number; y: number }): void {
    this.track({
      action: 'click',
      targetType,
      targetId,
      metadata: position ? { clickPosition: position } : undefined
    });
  }

  public trackHover(targetType: string, targetId: string, hoverTime: number): void {
    this.track({
      action: 'hover',
      targetType,
      targetId,
      metadata: { hoverTime }
    });
  }

  public trackScroll(targetType: string, targetId: string, scrollDepth: number): void {
    this.track({
      action: 'scroll',
      targetType,
      targetId,
      metadata: { scrollDepth }
    });
  }

  public trackLike(targetType: string, targetId: string, isLike: boolean): void {
    this.track({
      action: isLike ? 'like' : 'unlike',
      targetType,
      targetId
    });
  }

  // セッション管理
  public getSessionId(): string {
    return this.sessionId;
  }

  public resetSession(): void {
    this.sessionId = this.generateSessionId();
    this.log('Session reset:', this.sessionId);
  }

  // 設定更新
  public updateConfig(newConfig: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.startFlushTimer(); // タイマーを再起動
  }

  // クリーンアップ
  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush(true); // 最終送信
  }
}

// シングルトンインスタンス
let analyticsInstance: AnalyticsTracker | null = null;

export const getAnalytics = (): AnalyticsTracker => {
  if (!analyticsInstance) {
    analyticsInstance = new AnalyticsTracker();
  }
  return analyticsInstance;
};

export const analytics = {
  track: (event: BehaviorEvent) => getAnalytics().track(event),
  trackView: (targetType: string, targetId: string, duration?: number) => 
    getAnalytics().trackView(targetType, targetId, duration),
  trackClick: (targetType: string, targetId: string, position?: { x: number; y: number }) => 
    getAnalytics().trackClick(targetType, targetId, position),
  trackHover: (targetType: string, targetId: string, hoverTime: number) => 
    getAnalytics().trackHover(targetType, targetId, hoverTime),
  trackScroll: (targetType: string, targetId: string, scrollDepth: number) => 
    getAnalytics().trackScroll(targetType, targetId, scrollDepth),
  trackLike: (targetType: string, targetId: string, isLike: boolean) => 
    getAnalytics().trackLike(targetType, targetId, isLike),
  flush: () => getAnalytics().flush(),
  getSessionId: () => getAnalytics().getSessionId(),
  resetSession: () => getAnalytics().resetSession(),
  updateConfig: (config: Partial<AnalyticsConfig>) => getAnalytics().updateConfig(config)
};

export default analytics;