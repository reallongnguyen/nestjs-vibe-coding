declare module 'k6/http' {
  export interface Response {
    status: number;
    json(selector?: string): any;
  }

  export interface RequestParams {
    headers?: { [key: string]: string };
  }

  export function post(
    url: string,
    body?: any,
    params?: RequestParams,
  ): Response;
  export function patch(
    url: string,
    body?: any,
    params?: RequestParams,
  ): Response;
  export function del(
    url: string,
    body?: any,
    params?: RequestParams,
  ): Response;
}

declare module 'k6' {
  export function check(
    val: any,
    sets: { [key: string]: (val: any) => boolean },
  ): boolean;
  export function sleep(t: number): void;
}

declare module 'k6/metrics' {
  export class Rate {
    constructor(name: string);
    add(value: number): void;
  }
}

declare const __ENV: {
  [key: string]: string;
};
