# Emitting and receiving events
 Once you have an event bus instance, you can use it's API.

## Emit events
Just use the `bus` instance and its `emit` method:
```ts
bus.emit("foo", 4);
bus.emit("buz");
```
TypeScript will cause an error if a wrong type was used.

## Receive events
There are a few methods to mount a listener for specific events:

### Method `on (eventName, handler)`
```ts
bus.on("foo", (value) => {
  console.log(`Received foo with value ${value}`)
});
```
::: tip

You can also chain those methods:
```ts
bus
  .on("foo", (value) => console.log(`Received foo with value ${value}`))
  .on("bar", (value) => console.log(`Received bar with value ${value}`));
```
::: 

### Method `once (eventName, handler)`
if you want the receiver to be called only once, you can use the `once` method:
```ts
bus.once("foo", (value) => {
  console.log(`Received foo with value ${value}`);
});
```
Since the `bus` is associated to the Vue component's lifecycle, you can use it safely also outside the setup context:

```ts{4}
const bus = useGlobalEventBus(MyBus, "contact-form");

async function save() {
  bus.once('saved', relaod);
  // perform save
  // some other mechanism will emit the `saved` event
}
```

### Method `onMany (handlers)`
```ts
bus.onMany({
  foo: (value) => console.log(`Received foo with value ${value}`),
  bar: (value) => console.log(`Received bar with value ${value}`)
});
```


::: warning
Events are stored as pair key-handler. Each handler should be unique for a key.
:::

## Release a listener
In most cases you won't need to do it manually, as if `use*EventBus` when is used within setup context, it wll automaticaly release all mounted handlers, when the component will unmount.

But if you are using it outside setup context, you will need to release the handlers yourself:
```ts{6}
function handlerFoo(value: number) {
  console.log(`Received foo with value ${value}`)
}
bus.on("foo", handlerFoo);
//
bus.off("foo", handlerFoo)
```
