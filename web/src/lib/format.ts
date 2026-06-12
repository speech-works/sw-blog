export function formatDate(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function byline(name?: string, credentials?: string): string {
  if (!name) return "";
  return credentials ? `${name}, ${credentials}` : name;
}
