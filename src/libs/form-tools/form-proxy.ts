import { computed, Ref, shallowRef } from "vue";
import { resolvePromise } from "../utils";

export type FormProxySetter<T extends object, K extends keyof T> = (
  src: T,
  v: T[K],
) => Partial<T> | Promise<Partial<T> | undefined> | undefined;

export type FormProxySetters<T extends object> = Partial<{
  [K in keyof T & string]: FormProxySetter<T, K>;
}>;

type Comparator<T> = (a: T, b: T) => boolean;
type Comparators<T extends object> = Partial<{
  [key in keyof T]: Comparator<T[key]>;
}>;

export function useFormProxy<T extends object>(
  target: Ref<T>,
  opt: {
    mode?: "assign" | "reassign";
    setters: FormProxySetters<T>;
    onConflict?: (setterName: keyof T) => void;
    comparators?: Comparators<T>;
  },
) {
  const { setters = {} as FormProxySetters<T> } = opt;

  type SetterEntry = { key: keyof T; value: unknown };
  const setterQueue = shallowRef([] as Array<SetterEntry>);

  function setterDone(partial: SetterEntry) {
    setterQueue.value = setterQueue.value.filter((s) => s != partial);
  }

  let waitForChangesListeners = [] as Array<{
    resolve: (result: boolean) => void;
    reject: () => void;
  }>;

  function waitForChanges() {
    if (setterQueue.value.length == 0) return true;
    return new Promise<boolean>((resolve, reject) => {
      waitForChangesListeners.push({ resolve, reject });
    });
  }

  function apply(changes: Partial<T>) {
    switch (opt.mode ?? "assign") {
      case "assign":
        Object.assign(target.value, changes);
        break;
      case "reassign":
        target.value = { ...target.value, data: changes };
        break;
    }
    const [nextSet, ...rest] = setterQueue.value;
    setterQueue.value = rest;
    if (nextSet == null) {
      for (const cb of waitForChangesListeners) {
        cb.resolve(true);
      }
      waitForChangesListeners = [];
    } else {
      form.value[nextSet.key] = nextSet.value as never;
    }
  }

  function reject() {
    for (const cb of waitForChangesListeners) {
      cb.resolve(false);
    }
    waitForChangesListeners = [];
  }

  /**
   *
   * @param state virtual state after applying changes
   * @param fieldsToSet
   * @param fromSetters
   */
  async function applyChanges(
    state: T,
    fieldsToSet: Partial<T>,
    fromSetters: Set<keyof T>,
  ) {
    const currentState = { ...state, ...fieldsToSet };
    for (const key of Object.keys(fieldsToSet) as Array<keyof T & string>) {
      const value = fieldsToSet[key];
      // field returned by its own setter, no need to call it again
      if (fromSetters.has(key)) {
        continue;
      }
      const setter = setters[key];
      if (setter) {
        const result = await setter(
          { ...currentState, [key]: state[key] },
          value as never,
        );
        const toSet = result ?? ({ [key]: value } as Partial<T>);
        if (toSet) {
          fromSetters.add(key);
          const result = await applyChanges(currentState, toSet, fromSetters);
          // verify if newly called setter caused any incompatibility
          for (const innerKey of Object.keys(result) as Array<keyof T>) {
            if (innerKey in fieldsToSet) {
              const equal =
                opt?.comparators?.[innerKey]?.(
                  fieldsToSet[innerKey] as never,
                  result[innerKey] as never,
                ) ?? fieldsToSet[innerKey] !== result[innerKey];
              if (equal) {
                opt?.onConflict?.(key);
                throw new Error("Conflict in setters");
              }
            }
          }
          Object.assign(fieldsToSet, result);
          Object.assign(currentState, result);
        }
      } else {
        fieldsToSet[key] = value;
      }
    }
    return fieldsToSet;
  }

  const controller: ProxyHandler<T> = {
    ownKeys: (target) => Object.keys(target),
    has: (target, key) => key in target,
    get(target, p) {
      return target[p as keyof T];
    },
    set(target, p, newValue) {
      const partial = { key: p, value: newValue } as SetterEntry;
      setterQueue.value.push(partial);
      if (setterQueue.value.length != 1) {
        return true;
      }
      const key = p as keyof T & string;
      const setter = setters[key];
      if (setter) {
        const result = setter(target, newValue);
        const fields = new Set<keyof T>([key]);
        resolvePromise(result, (result) => {
          const toSet = result ?? ({ [key]: newValue } as Partial<T>);
          resolvePromise(
            applyChanges({ ...target, ...toSet }, toSet, fields),
            (applyFurther) => {
              setterDone(partial);
              apply(applyFurther);
            },
            () => {
              setterDone(partial);
              reject();
            },
          );
        });
      } else {
        setterDone(partial);
        apply({ [key]: newValue } as Partial<T>);
      }
      return true;
    },
  };

  const form = computed({
    get() {
      return new Proxy<T>(target.value, controller);
    },
    set(v) {
      target.value = v;
    },
  });

  return {
    form,
    waitForChanges,
    isSetting: computed(() => setterQueue.value.length > 0),
  };
}
