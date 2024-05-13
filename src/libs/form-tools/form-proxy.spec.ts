import { describe, it, expect } from "vitest";
import { ref } from "vue";
import { useFormProxy } from "./form-proxy";

describe("FormTools", () => {
  it("Simple tests", async () => {
    const data = ref({
      foo: "foo",
      bar: "bar",
    });

    const { form, waitForChanges } = useFormProxy(data, {
      setters: {
        foo(target, foo) {
          if (foo.length > 0) return;
          return { foo: "placeholder" };
        },
        async bar(target, bar) {
          return new Promise((resolve) => {
            setTimeout(() => resolve({ bar: bar.toLowerCase() }));
          });
        },
      },
    });

    form.value.foo = "bar";
    await waitForChanges();
    expect(form.value.foo).toBe("bar");

    form.value.bar = "Baz";
    await waitForChanges();
    expect(form.value.bar).toBe("baz");
  });

  it("FormProxy", async () => {
    //
    const data = ref({
      foo: "foo",
      caseType: "lower" as "lower" | "upper" | "mixed",
      isMixedCaseType: false,
    });

    const { form, waitForChanges } = useFormProxy(data, {
      setters: {
        foo(target, newValue) {
          const lowercase = newValue.toLowerCase() === newValue;
          const uppercase = newValue.toUpperCase() === newValue;
          return {
            foo: newValue,
            caseType:
              !lowercase && !uppercase
                ? "mixed"
                : lowercase
                  ? "lower"
                  : "upper",
          };
        },
        caseType(target, newValue) {
          if (newValue == "lower")
            return {
              foo: target.foo.toLowerCase(),
              caseType: newValue,
              isMixedCaseType: false,
            };
          if (newValue == "upper")
            return {
              foo: target.foo.toUpperCase(),
              caseType: newValue,
              isMixedCaseType: false,
            };
          return { caseType: newValue, isMixedCaseType: true };
        },
        isMixedCaseType(target, newValue) {
          if (newValue == target.isMixedCaseType) return {};
          if (!newValue && target.caseType == "mixed") {
            return {
              caseType: "lower",
              isMixedCaseType: false,
            };
          }
          return {};
        },
      },
    });
    form.value.foo = "LoremIpsum";
    expect(await waitForChanges()).toBe(true);
    expect(form.value.caseType).toBe("mixed");
    expect(form.value.isMixedCaseType).toBe(true);

    form.value.foo = "LOREM IPSUM";
    expect(await waitForChanges()).toBe(true);
    expect(form.value.caseType).toBe("upper");
    expect(form.value.isMixedCaseType).toBe(false);
  });

  it("Async setter", async () => {
    const data = ref({
      foo: "foo",
    });

    const { form, waitForChanges, isSetting } = useFormProxy(data, {
      setters: {
        foo(target, newValue) {
          return new Promise((resolve) => {
            setTimeout(() => resolve({ foo: newValue }), 10);
          });
        },
      },
    });

    form.value.foo = "baz";
    expect(form.value.foo).toBe("foo");
    expect(isSetting.value).toBe(true);
    const result2 = await waitForChanges();
    expect(result2).toBe(true);
    expect(form.value.foo).toBe("baz");
    expect(isSetting.value).toBe(false);
  });

  it("Detects incompatibility", async () => {
    const data = ref({
      foo: "foo",
      bar: "FOO",
    });

    // obviously invalid dependencies
    const { form, waitForChanges } = useFormProxy(data, {
      setters: {
        foo(target, newValue) {
          return {
            foo: newValue,
            bar: newValue.toUpperCase(),
          };
        },
        bar(target, newValue) {
          return {
            foo: newValue.toLowerCase(),
            bar: newValue,
          };
        },
      },
    });

    form.value.foo = "Baz";
    const result = await waitForChanges();
    expect(result).toBe(false);
    expect(form.value.foo).toBe("foo");

    form.value.foo = "baz";
    const result2 = await waitForChanges();
    expect(result2).toBe(true);
    expect(form.value.foo).toBe("baz");
  });

  it("queues setters", async () => {
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
    form.value.foo = "bar";
    form.value.forceUppercase = true;
    expect(isSetting.value).toBe(true);
    await waitForChanges();
    expect(isSetting.value).toBe(false);
    expect(form.value.foo).toBe("BAR");
  });
});
