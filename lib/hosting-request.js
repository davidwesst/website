// Only failures of the remote HTTP contract are eligible for convergence retries.
export class HostingFailure extends Error {
  constructor(message, diagnostics = {}, options) {
    super(message, options);
    this.name = "HostingFailure";
    this.diagnostics = diagnostics;
  }
}

export function requireHosting(condition, message, response, extra = {}) {
  if (!condition) throw new HostingFailure(message, { ...response?.diagnostics, ...extra });
}

export function createRequest(origin, { fetchImpl = fetch, now = () => performance.now(), deadline = Infinity, requestTimeoutMs = 20000 } = {}) {
  return async (route, { body = false, redirect = "manual" } = {}) => {
    // Concatenation intentionally keeps //missing-path probes on the same origin.
    const url = `${origin}${route}`;
    const timeout = Math.min(requestTimeoutMs, deadline - now());
    const diagnostics = { url, status: null, location: null, cfRay: null, age: null, cfCacheStatus: null };
    if (timeout <= 0) throw new HostingFailure("Verification deadline exhausted", diagnostics);
    const controller = new AbortController();
    let timer;
    const expired = new Promise((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(new HostingFailure(`Request/body timed out after ${Math.ceil(timeout)}ms`, diagnostics));
      }, timeout);
    });
    try {
      return await Promise.race([expired, (async () => {
        let response;
        try {
          response = await fetchImpl(url, { redirect, signal: controller.signal, cache: "no-store" });
        } catch (error) {
          // Native fetch reports network failures as TypeError with a cause.
          if (controller.signal.aborted || (error instanceof TypeError && error.cause)) {
            throw new HostingFailure(`Request failed: ${error.message}`, diagnostics, { cause: error });
          }
          throw error;
        }
        Object.assign(diagnostics, {
          status: response.status, location: response.headers.get("location"),
          cfRay: response.headers.get("cf-ray"), age: response.headers.get("age"), cfCacheStatus: response.headers.get("cf-cache-status"),
        });
        let bytes;
        try {
          if (body) bytes = Buffer.from(await response.arrayBuffer());
          else await response.body?.cancel();
        } catch (error) {
          if (controller.signal.aborted || error.name === "AbortError" || (error instanceof TypeError && error.cause)) {
            throw new HostingFailure(`Response body failed: ${error.message}`, diagnostics, { cause: error });
          }
          throw error;
        }
        return { status: response.status, headers: response.headers, url: response.url || url, bytes, diagnostics };
      })()]);
    } finally {
      clearTimeout(timer);
    }
  };
}
