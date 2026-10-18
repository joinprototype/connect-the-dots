// Small DOM helpers shared by the bundles.

/** A new element with an optional class and text. */
export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

/** Add a stylesheet link to the head; resolves once it has loaded or failed. */
export function loadStylesheet(href: string): Promise<void> {
  return new Promise((resolve) => {
    const link = el('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = link.onerror = () => resolve();
    document.head.append(link);
  });
}
