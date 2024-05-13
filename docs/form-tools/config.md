# Configuration

## Mode: `"assign"`
Assigns changes using `Object.assign(target.value, changes)`.
It's like setting the fields manually using assignment operator for every field.

This mode is default, but will work fine **only** on deep reactive `Ref`

## Mode: `"reassign"`
Completely reassigns given `Ref` with new instance vie `target.value = { ...target.value, changes };`
Use this mode if you use it on object received from a prop, when you can't be sure about deep reactivity, or you need `emit` to be called (like when you use `defineModel`)

```ts
import {useFormProxy} from "./form-proxy";

const model = defineModel<ItemType>({ required: true });

const { form } = useFormProxy(model, {
  mode: "reassign",
});
```
