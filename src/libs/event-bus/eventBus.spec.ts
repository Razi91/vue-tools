import { EventBus } from "./eventBus";
import { expect, describe, it, vi } from "vitest";
import { ref } from "vue";

describe("EventBus", () => {
  it("works correctly", () => {
    const bus = new EventBus("test");
    const bus2 = new EventBus(bus);
    expect(bus2).toBeTruthy();
  });

  it("calls handlers", async () => {
    type Events = {
      foo: string;
      bar: string;
    };
    const bus = new EventBus<Events>("test");
    const handler = vi.fn();
    const handler2 = vi.fn();
    bus.on("foo", handler);
    bus.on("bar", handler2);
    await bus.emit("foo", "baz");
    expect(handler).toHaveBeenCalled();
    expect(handler2).not.toHaveBeenCalled();
    expect(handler).toHaveBeenCalledWith("baz");
  });

  it("switches event name", async () => {
    type Events = {
      foo: string;
      bar: string;
      baz: string;
    };
    const bus = new EventBus<Events>("test");
    const handler = vi.fn();
    const handler2 = vi.fn();
    bus.on("foo", handler);
    const key = ref<keyof Events>("bar");
    bus.on(key, handler2);
    await bus.emit("baz", "data");
    expect(handler2).not.toHaveBeenCalled();
    key.value = "baz";
    await bus.emit("baz", "data");
    expect(handler2).toHaveBeenCalled();
  });

  it("Mounts many", async () => {
    type Events = {
      foo: string;
      bar: string;
      baz: string;
    };
    const bus = new EventBus<Events>("test");
    const handler = vi.fn();
    const handler2 = vi.fn();
    bus.onMany({
      foo: handler,
      bar: handler2,
    });
    bus.on("foo", handler);
    bus.on("bar", handler2);
    await bus.emit("foo", "baz");
    expect(handler).toHaveBeenCalled();
    expect(handler2).not.toHaveBeenCalled();
    expect(handler).toHaveBeenCalledWith("baz");
  });

  it("Mounts many, replaces", async () => {
    type Events = {
      foo: string;
      bar: string;
      baz: string;
    };
    const bus = new EventBus<Events>("test");
    const handler = vi.fn();
    const handler2 = vi.fn();
    const handler3 = vi.fn();
    const handlers = ref({
      foo: handler,
      bar: handler2,
    });
    bus.onMany(handlers);
    bus.on("foo", handler);
    bus.on("bar", handler2);
    await bus.emit("foo", "baz");
    expect(handler).toHaveBeenCalled();
    expect(handler2).not.toHaveBeenCalled();
    expect(handler).toHaveBeenCalledWith("baz");
    handlers.value = {
      foo: handler3,
      bar: handler2,
    };
    await bus.emit("foo", "buz");
    expect(handler3).toHaveBeenCalled();
    expect(handler3).toHaveBeenCalledWith("buz");
  });

  it("collects returned values (async)", async () => {
    const bus = new EventBus<{ foo: string }>("test");
    const handler = vi.fn().mockReturnValue("bar");
    bus.on("foo", handler);
    const results = await bus.emit("foo", "data");
    expect((results as string[])[0]).toEqual("bar");
  });

  it("collects returned values (sync)", async () => {
    const bus = new EventBus<{ foo: string }>("test");
    const handler = vi.fn().mockReturnValue("bar");
    bus.on("foo", handler);
    const results = bus.emitSync("foo", "data");
    expect((results as string[])[0]).toEqual("bar");
  });
});
