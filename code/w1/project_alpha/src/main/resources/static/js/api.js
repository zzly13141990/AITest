/**
 * REST 调用封装：基址为同源 /api（规格 5.2）。
 */
window.Api = {
  async json(path, options = {}) {
    const headers = {
      Accept: "application/json",
      ...options.headers,
    };
    if (options.body && typeof options.body === "string") {
      headers["Content-Type"] = "application/json";
    }
    const res = await fetch(path, { ...options, headers });
    if (res.status === 204) {
      return null;
    }
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const err = new Error(data?.message || res.statusText);
      err.status = res.status;
      err.body = data;
      throw err;
    }
    return data;
  },
};
