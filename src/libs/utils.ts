export function notNull<T>(obj: T | null): obj is T {
  return obj != null;
}

export function resolvePromise<T>(
  result: T | Promise<T>,
  cb: (data: T) => void,
  onError?: (err: unknown) => void,
) {
  if (result instanceof Promise) {
    result.then(cb).catch(onError);
  } else {
    try {
      cb(result);
    } catch (err) {
      onError?.(err);
    }
  }
}
