const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

const toUrl = (url: string) => {
  if (/^https?:\/\//.test(url)) return url;
  return `${API_BASE_URL}${url}`;
};

export const apiClient = {
  async get<T>(url: string): Promise<T> {
    const response = await fetch(toUrl(url));
    if (!response.ok) {
      throw new Error(`GET ${url} failed`);
    }
    return response.json() as Promise<T>;
  },

  async post<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(toUrl(url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      throw new Error(`POST ${url} failed`);
    }
    return response.json() as Promise<T>;
  },

  async postForm<T>(url: string, body: FormData): Promise<T> {
    const response = await fetch(toUrl(url), {
      method: "POST",
      body
    });
    if (!response.ok) {
      throw new Error(`POST ${url} failed`);
    }
    return response.json() as Promise<T>;
  }
};
