// Escapes the LIKE wildcards so a search for "50%" looks for that exact text.
export function containsPattern(text: string): string {
  return `%${text.trim().replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}
