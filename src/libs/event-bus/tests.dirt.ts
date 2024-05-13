import { EventBusType, useEventBus } from "./index";
import { computed, ref } from "vue";

const Tasks: EventBusType<{
  created: number;
  [key: `created:${number}`]: never;
  updated: number;
  [key: `updated:${number}`]: string;
  reload: never;
}> = Symbol("tasks");

const bus = useEventBus(Tasks)
  .on("updated", (id) => {
    console.log(`Task ${id} has been updated`);
  })
  .on(
    () => `updated`,
    () => {
      console.log("Current item has been updated");
    },
  )
  .on("updated:3", (arg) => {
    console.log("Current item has been updated", arg);
  })
  .on("reload", () => {
    //
  })
  .onMany({
    created: (id) => {
      console.log("!! created", id);
    },
  })
  .onMany(
    computed(() => ({
      created: (id) => {
        console.log("!! created", id);
      },
    })),
  );
// .on(
// "wtf", () => {
//   //
// });

bus.emit("reload");
bus.emit("updated", 7);

{
  const Bus: EventBusType<{
    foo: number;
    bar: string;
  }> = Symbol("bus");

  const key = ref<"foo" | "bar">("foo");
  const bus = useEventBus(Bus);
  bus.on(
    () => key.value,
    (arg) => console.log("!! ", arg),
  );
}
