import type { BitbucketPaginated } from "./types.js";

const BASE_URL = "https://api.bitbucket.org/2.0";

export class BitbucketApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: string,
  ) {
    const parsed = BitbucketApiError.parseErrorMessage(body);
    super(`Bitbucket API error ${status} ${statusText}: ${parsed}`);
    this.name = "BitbucketApiError";
  }

  private static parseErrorMessage(body: string): string {
    try {
      const json = JSON.parse(body);
      // Format: { error: { message: "..." } }
      if (json?.error?.message) {
        return json.error.detail
          ? `${json.error.message} — ${json.error.detail}`
          : json.error.message;
      }
      // Format: { type: "error", error: { message: "..." } }
      if (json?.type === "error" && json?.error?.message) {
        return json.error.message;
      }
      // Format: { message: "..." }
      if (json?.message) {
        return json.message;
      }
    } catch {
      // Not JSON
    }
    return body.slice(0, 200);
  }
}

interface RequestOptions {
  body?: unknown;
  query?: Record<string, string>;
}

export class BitbucketClient {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  async request<T>(
    method: string,
    path: string,
    options?: RequestOptions,
  ): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`);
    if (options?.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined && value !== "") {
          url.searchParams.set(key, value);
        }
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      Accept: "application/json",
    };

    if (options?.body) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new BitbucketApiError(
        response.status,
        response.statusText,
        errorBody,
      );
    }

    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  }

  async requestRaw(method: string, path: string): Promise<string> {
    const url = new URL(`${BASE_URL}${path}`);

    const response = await fetch(url.toString(), {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "text/plain",
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new BitbucketApiError(
        response.status,
        response.statusText,
        errorBody,
      );
    }

    return await response.text();
  }

  async fetchPage<T>(absoluteUrl: string): Promise<BitbucketPaginated<T>> {
    const response = await fetch(absoluteUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new BitbucketApiError(
        response.status,
        response.statusText,
        errorBody,
      );
    }

    return (await response.json()) as BitbucketPaginated<T>;
  }
}
