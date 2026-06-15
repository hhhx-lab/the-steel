const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

const toUrl = (url: string) => {
  if (/^https?:\/\//.test(url)) return url;
  return `${API_BASE_URL}${url}`;
};

const ensureOk = async (response: Response, label: string) => {
  if (response.ok) return;
  let message = `${label} failed`;
  try {
    const payload = await response.json();
    message = payload?.error?.message ?? message;
  } catch {
    message = response.statusText || message;
  }
  throw new Error(message);
};

export const apiClient = {
  async get<T>(url: string): Promise<T> {
    const response = await fetch(toUrl(url));
    await ensureOk(response, `GET ${url}`);
    return response.json() as Promise<T>;
  },

  async post<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(toUrl(url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    await ensureOk(response, `POST ${url}`);
    return response.json() as Promise<T>;
  },

  async patch<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(toUrl(url), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    await ensureOk(response, `PATCH ${url}`);
    return response.json() as Promise<T>;
  },

  async postForm<T>(url: string, body: FormData): Promise<T> {
    const response = await fetch(toUrl(url), {
      method: "POST",
      body
    });
    await ensureOk(response, `POST ${url}`);
    return response.json() as Promise<T>;
  }
};
