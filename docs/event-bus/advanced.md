# Advanced usage

## Dynamic event names with `on`
The method `on` can receive the key as a computed value in a few forms:
```ts
bus.on('foo', fooHandler);
const fooOrBar = ref<'foo' | 'bar'>('foo');
bus.on(fooOrBar, fooOrBarHandler);
bus.on(computed(() => useFoo.value ? 'foo' : 'bar'), fooOrBarHandler);
bus.on(() => useFoo.value ? 'foo' : 'bar', fooOrBarHandler);
```

## Dyamic listeners with `onMany`
Also `onMany` can change its listeners on the fly:
```ts
bus.on('foo', fooHandler);
const fooOrBar = ref<'foo' | 'bar'>('foo');
bus.on(() => ({
  [fooOrBar.value]: fooOrBarhandlers
}));
```

## String literal template as event name:
Event names don't have to be constant literals, you can use TypeScript's [Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)
```ts
export const TasksBus: EventBusType<{
  deleted: number,
  [key: `deleted:${number}`]: number,
  updated: number,
  [key: `updated:${number}`]: number,
}> = Symbol("Tasks");
```
And then:
```ts
bus.on(() => `updated:${props.item.id}`, onItemUpdated);
```
It's still type safe!
