# Asynchronous setters
`useFormProxy` allows you to make your setters asynchronous and still be safe.

```ts
import { useFormProxy, isSetting } from "./form-proxy";

const { form, waitForChanges } = useFormProxy(data, {
  setters: {
    foo (target, foo) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ foo }), 500);
      });
    },
  },
})
```
And then:
```ts
// form.value.foo == "foo"
form.value.foo = 'bar';
// form.value.foo == "foo"
await waitForChanges();
// form.value.foo == "bar"
```

## Queue
If for some reason you will call another setter, while the previous one didn't finished, it will be placed on queue and executed like it was after the previous setter done its job.

Let's take a look:
```ts    
const data = ref({
  foo: "foo",
  forceUppercase: false,
});
const { form, waitForChanges, isSetting } = useFormProxy(data, {
  setters: {
    foo(target, newValue) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            foo: target.forceUppercase ? newValue.toUpperCase() : newValue,
          });
        }, 10);
      });
    },
    forceUppercase(target, force) {
      if (force)
        return { forceUppercase: true, foo: target.foo.toUpperCase() };
      return { forceUppercase: force };
    },
  },
});
```

This is perfectly fine to do:
```ts
// form.value.foo == "foo"
form.value.foo = "bar";
// form.value.foo == "foo"
form.value.forceUppercase = true;
// form.value.foo == "foo"
await waitForChanges();
// form.value.foo == "BAR"
```
As well as:
```ts
// form.value.foo == "foo"
form.value.forceUppercase = true;
// form.value.foo == "foo"
form.value.foo = "bar";
// form.value.foo == "foo"
await waitForChanges();
// form.value.foo == "BAR"
```
