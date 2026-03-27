/**
 * Event Bus - ناقل الأحداث المركزي
 * 
 * يوفر نظام أحداث بسيط وفعال للتواصل بين الوحدات
 * يحقق المادة V من الدستور: "الاستقلالية بين الوحدات عبر الأحداث فقط"
 */

// ============================================
// Types
// ============================================

/**
 * معالج الحدث - يمكن أن يكون متزامن أو غير متزامن
 */
type EventHandler<T = unknown> = (payload: T) => Promise<void> | void;

/**
 * واجهة ناقل الأحداث
 */
interface IEventBus {
  /**
   * نشر حدث للمستمعين
   */
  publish<T>(event: string, payload: T): Promise<void>;
  
  /**
   * الاشتراك في حدث
   * @returns دالة لإلغاء الاشتراك
   */
  subscribe<T>(event: string, handler: EventHandler<T>): () => void;
  
  /**
   * إلغاء جميع الاشتراكات (للاختبارات)
   */
  clearAll(): void;
}

/**
 * سجل الأحداث للتحقق والتصحيح
 */
interface EventLog {
  event: string;
  payload: unknown;
  timestamp: Date;
  handlersCount: number;
}

// ============================================
// Implementation
// ============================================

/**
 * ناقل الأحداث البسيط
 * 
 * - يدعم المستمعين المتعددين لكل حدث
 * - ينفذ المعالجات بالتوازي
 * - يوفر سجل للأحداث للتصحيح
 */
class SimpleEventBus implements IEventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private eventLog: EventLog[] = [];
  private debugMode: boolean = false;

  /**
   * تفعيل/إيقاف وضع التصحيح
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  /**
   * نشر حدث لجميع المستمعين
   */
  async publish<T>(event: string, payload: T): Promise<void> {
    const handlers = this.handlers.get(event);
    const handlersCount = handlers?.size ?? 0;

    // تسجيل الحدث للتصحيح
    if (this.debugMode) {
      this.eventLog.push({
        event,
        payload,
        timestamp: new Date(),
        handlersCount,
      });
      
      console.log(`[EventBus] Publishing: ${event} to ${handlersCount} handlers`);
    }

    if (!handlers || handlersCount === 0) {
      return;
    }

    // تنفيذ جميع المعالجات بالتوازي
    const results = await Promise.allSettled(
      Array.from(handlers).map(handler => 
        Promise.resolve(handler(payload))
      )
    );

    // تسجيل الأخطاء دون إيقاف التنفيذ
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`[EventBus] Handler ${index} for "${event}" failed:`, result.reason);
      }
    });
  }

  /**
   * الاشتراك في حدث
   */
  subscribe<T>(event: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    
    this.handlers.get(event)!.add(handler as EventHandler);

    if (this.debugMode) {
      console.log(`[EventBus] Subscribed to: ${event}`);
    }

    // إرجاع دالة لإلغاء الاشتراك
    return () => {
      this.handlers.get(event)?.delete(handler as EventHandler);
      if (this.debugMode) {
        console.log(`[EventBus] Unsubscribed from: ${event}`);
      }
    };
  }

  /**
   * إلغاء جميع الاشتراكات (للاختبارات)
   */
  clearAll(): void {
    this.handlers.clear();
    this.eventLog = [];
  }

  /**
   * الحصول على سجل الأحداث
   */
  getEventLog(): EventLog[] {
    return [...this.eventLog];
  }

  /**
   * الحصول على عدد المستمعين لحدث معين
   */
  getHandlerCount(event: string): number {
    return this.handlers.get(event)?.size ?? 0;
  }
}

// ============================================
// Singleton Instance
// ============================================

/**
 * النسخة الوحيدة من ناقل الأحداث
 * استخدم هذه النسخة في جميع أنحاء التطبيق
 */
export const eventBus = new SimpleEventBus();

// ============================================
// Helper Functions
// ============================================

/**
 * إنشاء معالج حدث آمن يلتقط الأخطاء
 */
export function safeHandler<T>(
  handler: EventHandler<T>
): EventHandler<T> {
  return async (payload: T) => {
    try {
      await handler(payload);
    } catch (error) {
      console.error('[EventBus] Safe handler caught error:', error);
    }
  };
}

/**
 * نشر حدث بشكل غير متزامن (fire and forget)
 */
export function publishAsync<T>(event: string, payload: T): void {
  eventBus.publish(event, payload).catch(error => {
    console.error(`[EventBus] Async publish failed for "${event}":`, error);
  });
}

// ============================================
// Types Export
// ============================================

export type { IEventBus, EventHandler, EventLog };
