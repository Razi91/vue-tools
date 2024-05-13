# Defining Event Bus
You don't create any Event Bus directly, you just create a `Symbol` typed for an Event Bus as an object, where key is name of the event, and type of its value is type of the payload for this event.

```ts
import { type EventBusType } from "vue-tools";
export const MyBus: EventBusType<{
  foo: number;
  bar: string;
  baz: {
    id: number;
    name: string;
  }
  buz: never;
  saved: never;
}> = Symbol("MyBus");
```

Explanation:
 * `bar: string;` means the event name is `bus` and it's emits a string
 * `baz: { id: number; name: string; }` means thee event name is `baz` and it's emitting an object of given type
 * `buz: never` means the event name is `buz` and it doesn't have ane payload.


The `Symbol`'s description will be used in devtools for a better debugging experiences.

The actual Event Bus will be created when you first time use it.

## Using global event bus
Now that you somewhere created a `Symbol` typed as `EventBusType`, you can create and use the actual event bus using composable: `useGlobalEventBus`.

It might be composable, but it will work outside setup context as well, just you will have to unmount any listeners manually.

```ts
const bus = useGlobalEventBus(MyBus, "contact-form");
```
Again, the given second string improves debugging experiences in devtools, providing you information about who sent the event or who received it.

## Using local event bus
Sometimes you don't want the event bus to be global. Like: you define a floating window with a form within you need a contextual event bus. For that you use `useLocalEventBus`:

```ts
const bus = useLocalEventBus(MyBus, "contact-form");
```
It works the same way. it either provides new bus to child components, or attaches to an existing one.

Both have the same API
