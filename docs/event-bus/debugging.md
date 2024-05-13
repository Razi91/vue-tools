# Debugging
This utility is made precisely for Vue, so it provides proper devtools to debug your events!

All you have to do is to install them, which is purely optional:
```ts
app.use(EventBusDevtools, {
  // TODO
});
```

And that's it!

## Better experiences
As mentioned previously, for better experiences you should attach names to both event bus (the `Symbol`'s description):
```ts{3}
const Bus: EventBusType<{
  foo: number;
  bar: string;
}> = Symbol("bus");
```
And then, whenever you use:
```ts
const bus = useGlobalEventBus(Bus, 'Task form');
```

Devtools will display component name anyway, but you can still provide your name for that instance.
