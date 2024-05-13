import { EventBus } from "./eventBus";
import { inject, InjectionKey, provide } from "vue";

export type EventBusType<Events extends object> = InjectionKey<
  EventBus<Events>
>;

const globalEventBuses = new WeakMap<EventBusType<object>>();

/**
 * Returns global EventBus
 * @param key
 */
export function useGlobalEventBus<Events extends object>(
  key: EventBusType<Events>,
  name?: string,
): EventBus<Events> {
  if (globalEventBuses.has(key))
    if (name) return new EventBus(globalEventBuses.get(key), name);
    else return globalEventBuses.get(key);
  const bus = new EventBus<Events>(key.description ?? "Unnamed", name);
  globalEventBuses.set(key, bus);
  return bus as EventBus<Events>;
}

export function useBCEventBus<Events extends object>(
  key: EventBusType<Events>,
  name?: string,
): EventBus<Events> {
  if (globalEventBuses.has(key)) {
    if (name) return new EventBus(globalEventBuses.get(key), name);
    else return globalEventBuses.get(key);
  }
  if (process.env.NODE_ENV === "development" || __VUE_PROD_DEVTOOLS__) {
    if (key.description == null) {
      console.warn("Event bus key not provided");
    }
  }
  const bc = new BroadcastChannel(key.description ?? "broadcast");
  const bus = new EventBus<Events>(key.description ?? "Unnamed", name, bc);
  bc.addEventListener("message", (event) => {
    const { key, data } = event.data;
    bus.emit(key, data);
  });
  globalEventBuses.set(key, bus);
  return bus as EventBus<Events>;
}

/**
 * Returns EventBus client associated to context (Vue component) it was called from
 * @param key
 */
export function useLocalEventBus<Events extends object>(
  key: EventBusType<Events>,
  name?: string,
): EventBus<Events> {
  const bus = inject(key, null) as EventBus<Events> | null;
  if (bus == null) {
    const bus = new EventBus<Events>(
      key.description ?? "Unnamed",
      name,
    ) as EventBus<Events>;
    provide(key, bus);
    return bus;
  }
  return new EventBus(bus, name);
}

export { EventBus };
