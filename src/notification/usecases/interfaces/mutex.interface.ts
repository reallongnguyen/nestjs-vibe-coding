export interface Mutex {
  lock: <T>(keys: string[], cb: (...args: any[]) => Promise<T>) => Promise<T>;
}
