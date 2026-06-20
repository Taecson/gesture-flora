export function describeError(error) {
  if (!error) return "未知错误";
  if (typeof error === "string") return error;

  if (error instanceof Error) {
    return error.message || error.name || "未知错误";
  }

  if (typeof Event !== "undefined" && error instanceof Event) {
    const target = error.target ?? error.currentTarget;
    const source = target?.currentSrc || target?.src || target?.href || target?.responseURL || "";
    const mediaError = target?.error;
    const details = mediaError?.message || mediaError?.code || "";
    return [`浏览器资源加载事件：${error.type}`, source, details].filter(Boolean).join("；");
  }

  if (typeof error === "object") {
    if ("message" in error && error.message) return String(error.message);
    if ("type" in error && error.type) return `浏览器事件：${error.type}`;

    try {
      const serialized = JSON.stringify(error);
      if (serialized && serialized !== "{}") return serialized;
    } catch {
      // Fall through to String().
    }
  }

  return String(error);
}

export function wrapError(prefix, error) {
  return new Error(`${prefix}：${describeError(error)}`);
}
