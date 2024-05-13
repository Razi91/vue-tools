# Vue tools
Useful vue tools:
 * mitt-like event bus
 * form wrapper

No dependencies.

## Event Bus
 * mostly compatible with mitt (without wildcard) -- almost drop-in replace
 * vue-friendly -- removes handlers on component's `onUnmounted` and other tweaks
 * both global and local (via provide/inject) -- all done
 * TypeScript by default -- keep your code safe
 * Broadcast Channel supported -- notify your apps in other tabs
 * devtools -- find out what's going on on a timeline

### Example

```ts
export const TasksBus: EventBusType<{
  created: any;
  deleted: number,
  [key: `deleted:${number}`]: number,
  updated: number,
  [key: `updated:${number}`]: number,
  'needReload': never; // no payload
}> = Symbol("Tasks");

// in component:
const bus = useLocalEventBus(TasksBus)
  .on("created", () => notify.showInfo("New tasks available"))
  .on(
    () => props.item.id ? `updated:${props.item.id}` : null, 
    () => notify.showInfo("This task has been updated")
  )
  .on("deleted", (id) => {
    if (list.value.find(task => task.id == id)) reloadList();
  });

async function deleteItem() {
  // api.delete(`/tasks/${props.item.id}`);
  bus.emit("deleted", props.item.id);
  bus.emit(`deleted:${props.item.id}`, props.item.id);
}
```

## Form wrapper (TODO)
 * custom setters for fields (and just used with `v-model="form.myField"`!)
 * changes monitoring
