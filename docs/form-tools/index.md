# Form tools

## Purpose
Writing a form?
It's easy when it's simple mvvm, but sometimes you need to write custom setters for some fields and that's when the party is starting.

You need to either split your `v-model`s into separate passing `model-value` and handling a separate setter, or implement a separate `computed` with getter and setter for that field.

This tools allows you to make it much easier, safe and reusable.

## Usage
Assuming you have a `Ref<T>`, you can wrap it with a proxy that will handle dirty stuff for you.

```ts
const data = ref({
  category: null as null | Category,
  item: null as null | ItemType,
});
```
We display both pickers. If category is selected, the item picker filters them by category, but if none is selected, then displays all items.

We need to:
 * set category, when item changes
 * clear item, if new category doesn't match the item's category
 * item can't be selected without a selected category

### `watch` way
```ts
watch(() => data.value.item, async (item) => {
  if (item == null) return;
  if (item.categoryId != data.value.category?.id) {
    data.value.category = await categoriesStore.get(item.categoryId);
  }
});

watch(() => data.value.category, (category) => {
  if (
    category == null || 
    (data.value.item && data.value.item?.categoryId != category.id)
  ) {
    data.value.item = null;
  }
});
```

Easy to make a mess in your code, can possibly cause infinite loop of updating your fields, changes are hard to track.

### Setters through `computed` way
```ts
const selectedItem = computed({
  get: () => data.value.item,
  set: async (item) => {
    data.value.item = item;
    if (item.categoryId != data.value.category?.id) {
      data.value.category = await categoriesStore.get(item.categoryId);
    }
  }
});

const selectedCategory = computed({
  get: () => data.value.category,
  set: async (category) => {
    data.value.category = category;
    if (category == null || data.value.item?.categoryid != category.id) {
      data.value.item = null;
    }
  }
})
```

Produces additional symbols you need to provide to your template or other components, you need to remember to not use the original `Ref` for those fields.

### This tool's way

```ts
const { form, isSetting } = useFormProxy(data, {
  setters: {
    async item(target, item) {
      if (item == null) return;
      if (item.categoryId != target.category?.id) {
        return { 
          item, 
          category: await categoriesStore.get(item.categoryId)
        };
      }
    },
    category(target, category) {
      if (category == null || target.item?.categoryid != category.id) {
        return {
          category,
          item: null,
        }
      }
    },
  },
});
```

## In short
Define your own setters that will not produce unnecessary symbols in your scope, provide a single interface to your template to display and manipulate your data with simple `v-model`:

 * setters are optional: you don't need to define all of them, just the ones you need
 * if no another change needs to be done in the setter, just return `undefined`
 * otherwise, return object with fields to be overwritten (including the one we are setting)
 * can be either sync or async
 * the next setter will wait until the previous one is done
