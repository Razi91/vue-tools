
# Chained setters with validation
Setting one field sets another, and that one changing should change another?

It's not easy to track such dependencies and using `watch` can easily lead to hard to debug an infinite update loops, not to mention losing actual information about what is about to change and why.

## What are we working with?
Assume data structure:
```ts
const data = ref({
  startDate: "2024-05-20",
  endDate: "2024-05-25",
  duration: 5,
  category: null as null | Category
});
```
Those 3 values are bound to each other: `endDate = startDate + duration`. There are multiple strategies to keep this equation true, one of them:
 * when changing `startDate`, recalculate `endDate` using current `duration`
 * when changing `duration`, recalculate `endDate` using current `startDate`
 * when changing `endDate`, recalculate `duration` using current `startDate`


## Old way
### Correct way: separate setters
Normally we would have to write three separate setters:
```ts
function setStartDate(startDate: string) {
  if (startDate == data.value.startDate) return;
  const endDate = DateTime.fromISO(startDate).plus({ days: data.value.duration }).toISODate();
  data.value.startDate = startDate;
  data.value.endDate = endDate;
}

function setEndDate(endDate: string) {
  if (endDate == data.value.endDate) return;
  const duration = DateTime.fromISO(endDate).diff(DateTime.fromISO(startDate), 'days').days;
  data.value.duration = duration;
  data.value.endDate = endDate;
}

function setDuration(duration: number) {
  if (duration == data.value.duration) return;
  const endDate = DateTime.fromISO(startDate).plus({ days: data.value.duration }).toISODate();
  data.value.endDate = endDate;
  data.value.duration = duration;
}
```
However, this is a highly uncomfortable way to do it. Like you can't use simple `v-model="data.startDate"`, but instead:
```html
<DatePicker
  label="Start date"
  :model-value="data.startDate"
  @update:modelValue="setStartDate"
/>
```
or you could create a computed for that:
```ts
const startDate = computed({
  get: () => data.value.startDate,
  set: (v) => setStartDate(v),
})
```
Either way, it is not why we decided to use Vue in the first place, right?

### Lazy way: `watch`es
Many devs would choose those three watches instead:
```ts
watch(() => data.startDate, startDate => {
  const endDate = DateTime.fromISO(startDate).plus({ days: data.value.duration }).toISODate();
  if (data.value.endDate != endDate) {
    data.value.endDate = endDate;
  }
});

watch(() => data.endDate, startDate => {
  data.duration = DateTime.fromISO(endDate).diff(DateTime.fromISO(startDate), 'days').days;
  if (data.value.duration != duration) {
    data.value.duration = duration;
  }
});

watch(() => data.endDate, startDate => {
  data.startDate = DateTime.fromISO(t.startDate).minus({ days: duration }).toISODate();
  if (data.value.startDate != startDate) {
    data.value.startDate = startDate;
  }
});
```

It's easy to implement, easy to put into composable to reuse:
```ts
export function useDateDurationRange<T extends {
  startDate: string,
  endDate: string,
  duration: number
}>(data: Ref<T>) {
 // watches 
}
```
It's also bulletproof if there is another place that changes one of those three fields.
However, with this approach, there is a risk of causing an infinite loop of updating fields, it won't even throw an `Stack overflow` exception because `watch` works on event loop (if you don't set the `sync` option), even the app will continue to work, but with 100% cpu usage.

## With `useFormProxy`
```ts
const { form } = useFormProxy(data, {
  setters: {
    startDate: (t, startDate) => ({
      startDate,
      endDate: DateTime.fromISO(startDate).plus({ days: t.duration }).toISODate(),
    }),
    endDate: (t, endDate) => ({
      endDate,
      duration: DateTime.fromISO(endDate).diff(DateTime.fromISO(startDate), 'days').days,
    }),
    duration: (t, duration) => ({
      duration,
      endDate: DateTime.fromISO(t.startDate).minus({ days: duration }).toISODate(),
    }),
  }
})
```
If you change `duration`, it will call 2 setters, making your code bulletproof for any mistakes:
Setting `duration` requires to set also `endDate`, so `endDate`'s setter will be called as well. This `endDate`'s setter will require to call `duration` setter as well, but... it will just check if it's required.

At first, the `duration` setter will be called. It will return an object with fields `duration` and `endDate`.

Since we manually called `duration` setter, the tool will focus on the `endDate`, calling the setter with the new date.

What's important, it will call `endDate`'s setter faking the new state of the object. It will compare it's result, to make sure there are no conflicts in states: if changing `endDate` would return invalid `duration`, it will report an error instead of changing anything.

### Let's make a mistake:

```ts
const data = ref({
  startDate: "2024-05-20",
  endDate: "2024-05-25",
  duration: 5,
});
const { form } = useFormProxy(data, {
  setters: {
    endDate: (t, endDate) => ({
      endDate,
      duration: DateTime.fromISO(endDate).diff(DateTime.fromISO(startDate), 'days').hours,
    }),
    duration: (t, duration) => ({
      duration,
      endDate: DateTime.fromISO(t.startDate).minus({ days: duration }).toISODate(),
    }),
  }
})
```
:::info
Notice that `endDate` setter uses hours instead of days, like in `duration`.
:::

Now call `form.value.duration = 2`. What will happen?
At first `duration(data.value, 2)` will be called. The setter will return `{ duration: 2, endDate: "2024-05-22" }`.
The field `endDate` has its own setter, so it will be called, but this time with modified `t`: `endDate({ ...data.value, duration: 2 }, "2024-05-22")`. That setter will return a patch to apply: `{ endDate: "2024-05-22", duration: 48 }`.

The mechanism implemented in `useFormProxy` will compare the `duration` from the chained setter with the first one and will notice the conflict, resulting in not applying any changes. `onConflict` will be called.

Also, `waitForChanges` will return `false`.

## Make it reusable
Just like with the `watch`es, we can easily extract those dependencies into a composable:
```ts
export function dateRangeSetters<T extends {
  startDate: string, 
  endDate: string, 
  duration: number
}>(data?: Ref<T>): FormProxySetters<T> {
  return {
    startDate: (t, startDate) => ({
      startDate,
      endDate: DateTime.fromISO(startDate).plus({days: t.duration}).toISODate(),
    }),
    endDate: (t, endDate) => ({
      endDate,
      duration: DateTime.fromISO(endDate).diff(DateTime.fromISO(startDate), 'days').days,
    }),
    duration: (t, duration) => ({
      duration,
      endDate: DateTime.fromISO(t.startDate).minus({days: duration}).toISODate(),
    }),
  }
}
```
The argument serves only to provide the type. And then:
```ts
const { form } = useFormProxy(data, {
  setters: {
    ...dateRangeSetters(data),
  }
});
```
## Another dependency
Let's focus on the `category` field and add another rule to existing ones:
 * when changing `startDate`, recalculate `endDate` using current `duration`
 * when changing `duration`, recalculate `endDate` using current `startDate`
 * when changing `endDate`, recalculate `duration` using current `startDate`
 * when changing `category`, if it has `defaultDuration` set, update `duration` and `endDate`

```ts
const { form } = useFormProxy(data, {
  setters: {
    ...dateRangeSetters(data),
    category: (target, category) => ({
      category,
      duration: category.defaultDuration ?? target.duration,
    }),
  },
});
```
And it's done. Seriously, it's done. When you set category, it will set the duration. But the duration has its own setter, so it will be called as well, updating the `endDate`. 

We don't need to remember that we need to also change `endDate` when changing `duration`, however, it would provide additional (but unnecessarily redundant) validation.

In this case, you might want to disable the form input that sets duration, when a category with `defaultDuration` is picked, or disable the setter, you'd need to overwrite it:

```ts
const setters = dateRangeSetters(data);
const { form } = useFormProxy(data, {
  setters: {
    ...dateRangeSetters(data),
    category: (target, category) => ({
      category,
      duration: category.defaultDuration ?? target.duration,
    }),
    duration: (target, duration) => {
      if (target.category?.defaultDuration) return {};
      return seters.duration(target, duration);
    },
  },
});
```

## Summary
You still need to test your code, it won't free you from that.
But this chaining will let you catch your bugs earlier and easier without bloating your code.
You can focus more on atomic changes without remembering the context of the whole.

There shouldn't be any noticeable performance penalty for simple fields
