/** Strip punctuation, lowercase, remove noise words. */
const STOP_WORDS = new Set([
  "i","a","an","the","is","it","its","my","me","to","in","of","and","or",
  "can","how","do","does","did","why","what","when","which","will","be",
  "been","was","were","am","are","at","by","for","from","on","this","that",
  "with","but","not","so","if","as","up","out","also","just","very","too",
]);

export function normaliseQuery(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w))
    .join(" ")
    .trim();
}

/** Returns individual meaningful tokens from the normalised query. */
export function tokenise(normalised: string): string[] {
  return normalised.split(/\s+/).filter(Boolean);
}

/** True if the query contains any of the given phrases. */
export function containsAny(query: string, phrases: string[]): boolean {
  const q = query.toLowerCase();
  return phrases.some(p => q.includes(p.toLowerCase()));
}
