/**
 * Parses and resolves spintax syntax: {Option A|Option B|Option C}
 * Supports nested spintax expressions.
 */
export function resolveSpintax(text: string): string {
  const spintaxRegex = /\{([^{}]+)\}/g;

  let resolved = text;
  let matchesExist = true;

  // Process until no curly brace expressions remain (handles nested spintax)
  while (matchesExist) {
    matchesExist = false;
    resolved = resolved.replace(spintaxRegex, (_, optionsStr: string) => {
      matchesExist = true;
      const options = optionsStr.split("|");
      const chosen = options[Math.floor(Math.random() * options.length)];
      return chosen;
    });
  }

  return resolved;
}

/**
 * Checks if a string contains spintax formatting `{a|b}`.
 */
export function hasSpintax(text: string): boolean {
  return /\{[^{}]+\|[^{}]+\}/.test(text);
}
