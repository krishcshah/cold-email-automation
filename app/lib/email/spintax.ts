export function resolveSpintax(text: string): string {
  if (!text) return "";
  return text.replace(/\{([^{}]+)\}/g, (_, choices) => {
    const options = choices.split("|");
    const randomIndex = Math.floor(Math.random() * options.length);
    return options[randomIndex].trim();
  });
}
