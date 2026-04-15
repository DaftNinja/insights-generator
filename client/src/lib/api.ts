const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error ?? `Request failed: ${res.status}`);
  }

  return res.json();
}

export const api = {
  auth: {
    auditLog: (page = 1) => request<any>(`/auth/audit-log?page=${page}`),
  },
  reports: {
    list: () => request<any[]>("/reports"),
    get: (slug: string) => request<any>(`/reports/${slug}`),
    generate: (companyName: string, forceRefresh = false) =>
      request<any>("/reports/generate", {
        method: "POST",
        body: JSON.stringify({ companyName, forceRefresh }),
      }),
    delete: (id: number) =>
      request<any>(`/reports/${id}`, { method: "DELETE" }),
    salesEnablement: (slug: string, sellerProduct: string) =>
      request<any>(`/reports/${slug}/sales-enablement`, {
        method: "POST",
        body: JSON.stringify({ sellerProduct }),
      }),
    investorPresentation: (slug: string) =>
      request<any>(`/reports/${slug}/investor-presentation`, { method: "POST" }),
    batch: (companies: string[]) =>
      request<any>("/reports/batch", {
        method: "POST",
        body: JSON.stringify({ companies }),
      }),
  },
};
