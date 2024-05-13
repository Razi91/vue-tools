import {
  type ComponentInternalInstance,
  getCurrentInstance,
  isRef,
  MaybeRef,
  onUnmounted,
  toValue,
  watch,
} from "vue";
import { type MaybeRefOrGetter } from "vue";
import {
  logEventbusEvent,
  logEventbusListenerCtor,
  logEventbusListenerDto,
  logEventBusReceived,
} from "./eventBusDevtools";
import { notNull } from "../utils";

let __groupId = 0;

type HandlerFn<T = unknown> = (data: T) => unknown | Promise<unknown>;

type Handlers<Events extends object> = Partial<{
  [Key in keyof Events]: HandlerFn<Events[Key]>;
}>;

export class EventBus<Events extends object> {
  private readonly handlers: Map<keyof Events, HandlerFn<unknown>[]>;
  private busName: string;
  private groupId?: string;

  /**
   * Locally mounted handlers to release in onUnmounted()
   * @private
   */
  private readonly localHandlers: Array<{
    key: keyof Events;
    handler: HandlerFn<unknown>;
    unwatch?: () => void;
  }>;
  private readonly ctx: ComponentInternalInstance | null;

  /**
   * Create a new event bus or create a client for source
   * @param parent
   * @param instanceName
   */
  constructor(
    parent: EventBus<Events> | string,
    private instanceName = null as null | MaybeRef<string>,
    private bc?: BroadcastChannel,
  ) {
    this.busName = typeof parent == "object" ? parent.busName : parent;
    this.handlers = typeof parent == "object" ? parent.handlers : new Map();
    this.localHandlers = [];
    this.ctx = getCurrentInstance();

    if (this.ctx) {
      // is inside Setup context, associate with Vue component
      const name = toValue(this.instanceName);
      this.groupId = `${name ?? "unnamed"}-${__groupId++}`;
      const log = {
        component: this.ctx,
        groupId: this.groupId,
        busName: this.busName,
        instanceName: toValue(this.instanceName),
      };
      if (process.env.NODE_ENV === "development" || __VUE_PROD_DEVTOOLS__) {
        logEventbusListenerCtor(log).then(() => {});
        if (isRef(this.instanceName)) {
          watch(this.instanceName, (newName, oldName) => {
            logEventbusListenerDto({ ...log, instanceName: oldName });
            logEventbusListenerCtor({ ...log, instanceName: newName });
          });
        }
      }
      // called inside setup context
      onUnmounted(() => {
        for (const { key, handler, unwatch } of this.localHandlers) {
          this.off(key, handler);
          unwatch?.();
        }
        if (process.env.NODE_ENV === "development" || __VUE_PROD_DEVTOOLS__) {
          logEventbusListenerDto({
            ...log,
            instanceName: toValue(this.instanceName),
          });
        }
      });
    }
  }

  /**
   * Utility to add event handler to the array
   * @param eventName
   * @param handler
   * @param unwatch
   * @private
   */
  private setEvent<EventName extends keyof Events>(
    eventName: EventName,
    handler: HandlerFn<Events[EventName]>,
    unwatch?: () => void,
  ) {
    const handlersAtKey = this.handlers.get(eventName) ?? [];
    handlersAtKey.push(handler as HandlerFn<unknown>);
    this.handlers.set(eventName, handlersAtKey);
    if (process.env.NODE_ENV === "development" || __VUE_PROD_DEVTOOLS__) {
      // console.log("!!! unmounted");
    }
    this.localHandlers.push({
      key: eventName,
      handler: handler as HandlerFn<unknown>,
      unwatch,
    });
  }

  /**
   * Mount listener to an event, if in Vue context, handles `.off` automatically
   * @param event event name
   * @param handler function called when event is emitted
   */
  on<EventName extends keyof Events>(
    event: MaybeRefOrGetter<EventName | null>,
    handler: HandlerFn<Events[EventName]>,
  ) {
    const eventName = toValue(event);

    if (process.env.NODE_ENV === "development" || __VUE_PROD_DEVTOOLS__) {
      // eslint-disable-next-line
      (handler as any).groupId = this.groupId;
    }
    if (isRef(event) || typeof event == "function") {
      const unwatch = watch(
        event,
        (newEvent, oldEvent) => {
          if (process.env.NODE_ENV === "development" || __VUE_PROD_DEVTOOLS__) {
            console.log("!!! unwatch");
          }
          if (oldEvent) this.off(oldEvent, handler);
          if (newEvent) this.setEvent(newEvent, handler, unwatch);
        },
        { flush: "sync" },
      );
      if (eventName) {
        this.setEvent(eventName, handler, unwatch);
      }
    } else {
      if (eventName) {
        this.setEvent(eventName, handler);
      }
    }
    return this;
  }

  onMany(events: MaybeRef<Handlers<Events>>) {
    for (const [key, handler] of Object.entries(toValue(events))) {
      this.setEvent(key as keyof Events, handler as HandlerFn<unknown>);
    }
    if (isRef(events)) {
      watch(
        events,
        (events, oldEvents) => {
          console.log("!!! switch events", events);
          for (const [key, handler] of Object.entries(oldEvents)) {
            this.off(key as keyof Events, handler as HandlerFn<unknown>);
          }
          for (const [key, handler] of Object.entries(events)) {
            this.setEvent(key as keyof Events, handler as HandlerFn<unknown>);
          }
        },
        { flush: "sync" },
      );
    }
    return this;
  }

  /**
   * Removes given handler on an event
   * @param event event name
   * @param handler handler to release
   */
  off<EventName extends keyof Events>(
    event: EventName,
    handler: HandlerFn<Events[EventName]>,
  ) {
    if (process.env.NODE_ENV === "development" || __VUE_PROD_DEVTOOLS__) {
      // console.log("!!! unwatch");
    }
    const handlersAtKey = this.handlers.get(event);
    if (handlersAtKey == null || handlersAtKey.length == 0) return;
    const index = handlersAtKey.indexOf(handler as HandlerFn<unknown>);
    if (index == -1) return;
    handlersAtKey.splice(index, 1);
    if (handlersAtKey.length == 0) {
      this.handlers.delete(event);
    }
    const localIndex = this.localHandlers.findIndex(
      (h) => h.key === event && h.handler === handler,
    );
    if (localIndex == -1) throw new Error("");
    this.localHandlers.splice(localIndex, 1);
    return this;
  }

  /**
   * Mounts a handler that will be called only once
   * @param event
   * @param handler
   */
  once<EventName extends keyof Events>(
    event: EventName,
    handler: HandlerFn<Events[EventName]>,
  ) {
    if (process.env.NODE_ENV === "development" || __VUE_PROD_DEVTOOLS__) {
      console.log("!!! once");
    }
    const fn: HandlerFn<Events[EventName]> = (data: Events[EventName]) => {
      try {
        return handler(data);
      } finally {
        this.off(event, fn as HandlerFn<Events[EventName]>);
      }
    };
    this.on(event, fn);
    return this;
  }

  /**
   * Send event to all listeners
   * @param event
   * @param data
   */
  async emit<EventName extends keyof Events & string>(
    event: Events[EventName] extends undefined | never ? EventName : never,
  ): Promise<unknown>;
  async emit<EventName extends keyof Events & string>(
    event: undefined extends Events[EventName] ? never : EventName,
    data: Events[EventName],
  ): Promise<unknown>;
  async emit<EventName extends keyof Events & string>(
    event: EventName,
    data?: Events[EventName],
  ): Promise<unknown> {
    // const groupId = `group-${__groupId++}`;
    if (process.env.NODE_ENV === "development" || __VUE_PROD_DEVTOOLS__) {
      logEventbusEvent({
        key: event,
        busName: this.busName ?? "Unnamed",
        name: toValue(this.instanceName),
        // groupId,
        data,
        component: this.ctx,
      }).then(() => {});
    }
    const handlers = this.handlers.get(event) ?? [];
    return (
      await Promise.all(
        handlers.map((handler) => {
          try {
            if (
              process.env.NODE_ENV === "development" ||
              __VUE_PROD_DEVTOOLS__
            ) {
              // eslint-ignore-next-line
              const groupId = (handler as any).groupId as string;
              if (groupId) {
                logEventBusReceived({
                  groupId,
                  busName: this.busName ?? "Unnamed",
                  key: event,
                  payload: data,
                }).then(() => {});
              }
            }
            return handler(data);
          } catch (err) {}
        }),
      )
    ).filter(notNull);
  }

  /**
   * Send event to all listeners
   * @param event
   * @param data
   */
  emitSync<EventName extends keyof Events & string>(
    event: Events[EventName] extends undefined | never ? EventName : never,
  ): unknown;
  emitSync<EventName extends keyof Events & string>(
    event: undefined extends Events[EventName] ? never : EventName,
    data: Events[EventName],
  ): unknown;
  emitSync<EventName extends keyof Events & string>(
    event: EventName,
    data?: Events[EventName],
  ): unknown {
    // const groupId = `group-${__groupId++}`;
    if (process.env.NODE_ENV === "development" || __VUE_PROD_DEVTOOLS__) {
      logEventbusEvent({
        key: event,
        busName: this.busName ?? "Unnamed",
        name: toValue(this.instanceName),
        // groupId,
        data,
        component: this.ctx,
      }).then(() => {});
    }
    const handlers = this.handlers.get(event) ?? [];
    const errors = [] as unknown[];
    if (this.bc) {
      this.bc.postMessage({ event, data });
    }
    return handlers
      .map((handler) => {
        try {
          return handler(data);
        } catch (err) {
          errors.push(err);
        }
      })
      .filter(notNull);
  }
}
