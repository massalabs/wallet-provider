/**
 * This file defines a TypeScript module with various time-related Typescript methods.
 *
 * @remarks
 * - The classes and their methods implemented here are quite generic and might be useful in other contexts too
 *  but have been particularly developed for the purposes of this library
 * - If you want to work on this repo, you will probably be interested in this object
 *
 */

/**
 * This class provides an implementation of a timer calling a callback hook after it ticks.
 * @remarks
 * The timer is being resetted only after the execution of the callback method has finished
 */
export class Timeout {
  /**
   * Timeout constructor
   *
   * @param timeoutMil - The number of milliseconds for the timeout.
   * @param callback - a callback to execute.
   * @returns An instance of the Timeout class.
   */
  constructor(timeoutMil: number, callback: () => void) {
    this.clear = this.clear.bind(this);

    const that = this;
    this.isCleared = false;
    this.isCalled = false;
    this.timeoutHook = setTimeout(() => {
      if (!that.isCleared) {
        this.isCalled = true;
        callback();
      }
    }, timeoutMil);
  }
  private isCleared: boolean;
  private isCalled: boolean;
  private timeoutHook: NodeJS.Timer;

  /**
   * A method to clear the timeout
   *
   * @returns void
   */
  public clear(): void {
    if (!this.isCleared) {
      clearTimeout(this.timeoutHook);
      this.isCleared = true;
    }
  }
}

/**
 * This class provides an implementation of a continuous timer calling a callback hook after every given milliseconds.
 * @remarks
 * The timer is being resetted every given milliseconds
 * irregardless whether the execution of the method is still running or not
 */
export class Interval {
  /**
   * Interval constructor
   *
   * @param timeoutMil - The number of milliseconds for the interval.
   * @param callback - a callback to execute.
   * @returns An instance of the Interval class.
   */
  constructor(timeoutMil: number, callback: () => void) {
    this.clear = this.clear.bind(this);

    const that = this;
    this.isCleared = false;
    this.isCalled = false;
    this.intervalHook = setInterval(() => {
      if (!that.isCleared) {
        this.isCalled = true;
        callback();
      }
    }, timeoutMil);
  }
  private isCleared: boolean;
  private isCalled: boolean;
  private intervalHook: NodeJS.Timer;

  /**
   * A method to clear the interval
   *
   * @returns void
   */
  public clear(): void {
    if (!this.isCleared) {
      clearInterval(this.intervalHook);
      this.isCleared = true;
    }
  }
}

/**
 * A function that waits pauses the execution loop for a number of milliseconds
 *
 * @param timeMilli - The number of milliseconds to wait.
 * @returns void
 */
export const wait = async (timeMilli: number): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    const timeout = new Timeout(timeMilli, () => {
      timeout.clear();
      return resolve();
    });
  });
};

/**
 * A function that awaits a promise with a timeout.
 *
 * @param promise - a promise to execute.
 * @param timeoutMs - The number of milliseconds to wait before a timeout.
 * @returns void
 *
 * @remarks
 * The promise is being polled with a timeout. Once the timeout is reached, if not fulfilled, the error is thrown.
 */
export async function withTimeoutRejection<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  const sleep = new Promise((resolve, reject) =>
    setTimeout(
      () =>
        reject(
          new Error(
            `Timeout of ${timeoutMs} has passed and promise did not resolve`,
          ),
        ),
      timeoutMs,
    ),
  );
  return Promise.race([promise, sleep]) as Promise<T>;
}
