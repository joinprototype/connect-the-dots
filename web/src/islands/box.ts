/**
 * <ctd-box>: the field in every header. It sits on every page, so this much is all a page that nobody types
 * on pays for: the rest (box-field.ts, the parser, the search files) loads when a person focuses the field.
 */
export class CtdBox extends HTMLElement {
  connectedCallback(): void {
    const input = this.querySelector('input');
    const form = input?.closest('form');
    if (!input || !form) return;
    let field: Promise<{ submit(): Promise<void> }> | undefined;
    const wake = () => (field ??= import('./box-field').then(({ BoxField }) => new BoxField(this, input)));
    input.addEventListener('focus', () => void wake(), { once: true });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      void wake().then((f) => f.submit());
    });
    if (document.activeElement === input) void wake();
  }
}
