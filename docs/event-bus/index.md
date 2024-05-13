
# Intro
This is **not** a wrapper for [mitt](https://github.com/developit/mitt). It's highly inspired by it, but written from scratch (so muh work... duh), but specifically for Vue. It is meant to have 0 (zero) dependencies except the Vue itself.

This library is **not** designed to be lightweight, but secure and functional. It is meant to use in bigger application, where nobody would care about additional 1KiB of code. It contains some utilities and wrappers you would most likely write yourself in your code.

# Quick start

## Defining event bus

You can define the eventBus by typing a `Symbol` as `InjectionKey`. You can use TypeScript string templates:

```ts
import { type EventBusType } from "vue-tools";

export const TasksBus: EventBusType<{
  created: any;
  deleted: number,
  [key: `deleted:${number}`]: number,
  updated: number,
  [key: `updated:${number}`]: number,
  'needReload': never; // no payload
}> = Symbol("Tasks");
```

This symbol will grant you access to the event bus of that type.

## Use in the component
Just call `useGlobalEventBus` in `setup` context:
```ts
const bus = useGlobalEventBus(TasksBus)
  .on("created", () => notify.showInfo("New tasks available"))
  .on("deleted", (id) => {
    if (list.value.find(task => task.id == id)) reloadList();
  });
```

You will get an existing event bus associated with this component (don't try to pass it through props, if you don't want any troubles).

Every method returns the bus controller, so you can easily chain it like that.

## Just emit anything
Just as in mitt, you can emit events using the `bus` instance:
```ts
bus.emit("deleted", item.id);
```

The `emit` method returns `Promise<any[]>` (TODO: typing results) which will resolve, when all listeners would finish their jobs (if they are written properly).

There is also second method `emitSync` which does the same, but just returns what handlers returns, which might be Promise, might be now.

## Unmounting listeners
There is no need to do that (in most cases). This library will do it for you (as long as `useGlobalEventBus` will be called inside `setup`). However, you can still do it... for some reasons.


And you can even make your event keys reactive!
```ts
const bus = useGlobalEventBus(TasksBus)
  .on(() => `updated:${props.item.id}`, () => {
    notify.showInfo({
      label: "This item has been updated",
      actions: [{ label: "Reload", handler: () => emit("requestReload") }]
    })
  })
```
* notify is not part of this library. 

## `bus` is associated with a component!
Don't pass the `Event Bus` instance to other components, every `.on` and `.once` is bound to a component and creates an `onUnmounted` hook.

If `useGlobalEventBus` is called outside `setup` context, it will be "loose" and will not unmount any listener automatically.

Thanks to that, you can use `.on` (but why? On your own risk) and `.once` ouside `setup` context:
```ts
const bus = useGlobalEventBus(TasksBus);

async function updateItem(item: TaskItem) {
  bus.once(`updated:${item.id}`, reloadList);
  await itemsApi.save(item);
}
```
## Local event bus? Sure!
Just instead of `useGlobalEventBus` use `useLocalEventBus`, it will either create local context or use the one in local context.

The top component you call it will create the context, while its children will reuse it.

## Get feedback from your listeners? Sure!
It's not normally present in Event Bus implementations, but... why not?

Just return something from the handler:

```ts
const bus = useGlobalEventBus(TasksBus)
  .on("update", () => {
    reloadList();
    return true;
  })
```

And receive it on emit:
```ts
async function save() {
  const result = await itemsApi.save(item);
  const results = await bus.emit("update", item.id);
  const results2 = await bus.emit(`update:${item.id}`);
  const feedbacks = [...results, ...results2];
  notify.showSuccess(`Informed ${feedbacks.length} listeners!`)
}
```
Note: empty results (`undefined` or `null`) are removed from the arrays.

But even if you don't want to get any feedbacks, that way you can make sure that every listener will parse the event before you will go forward with your work in the function.

Why would you need that? It's up to you, but sometimes it's nice to know, that all receivers finished their jobs, even the async ones.
