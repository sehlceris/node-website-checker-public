export const delayPromise = (delay: number, resolveAfterTime: boolean = true): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(resolveAfterTime ? resolve : reject, delay);
  });
};

export const promiseTimeout = <T>(
  promise: Promise<T>,
  timeout: number = 1000,
): Promise<T | void> => {
  const timeoutPromise = delayPromise(timeout, false);
  return Promise.race([promise, timeoutPromise]);
};
