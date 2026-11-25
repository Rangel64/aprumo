/**
 * Devolve a URL normalizada só se for `http:` ou `https:`. Qualquer outra coisa
 * (`javascript:`, `data:`, texto inválido, vazio) vira `null`, e quem chama não renderiza link.
 */
export function safeHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}
