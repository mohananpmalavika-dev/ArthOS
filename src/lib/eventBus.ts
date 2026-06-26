export type EventHandler<T = any> = (payload: T) => void | Promise<void>;

type HandlerSet = Set<EventHandler>;

class EventBus {
  private handlers = new Map<string, HandlerSet>();

  on<T = any>(event: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler as EventHandler);
  }

  off<T = any>(event: string, handler: EventHandler<T>): void {
    const set = this.handlers.get(event);
    if (!set) return;
    set.delete(handler as EventHandler);
    if (!set.size) {
      this.handlers.delete(event);
    }
  }

  emit<T = any>(event: string, payload?: T): void {
    const handlers = this.handlers.get(event);
    if (!handlers) {
      return;
    }

    for (const handler of Array.from(handlers)) {
      try {
        const result = handler(payload as T);
        if (result instanceof Promise) {
          result.catch((error) => {
            console.error(`[EventBus] Error in handler for event '${event}':`, error);
          });
        }
      } catch (error) {
        console.error(`[EventBus] Error in handler for event '${event}':`, error);
      }
    }
  }
}

export const eventBus = new EventBus();
