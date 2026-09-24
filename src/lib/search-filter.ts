// The site search's matching and ordering, kept pure so it is tested without a browser. The index is
// small (every published piece) and filtered in memory.

export type Searchable = { title: string; summary?: string; tags: string[]; date: string };

const fold = (text: string) => text.normalize('NFKC').toLowerCase();
const newestFirst = (a: Searchable, b: Searchable) => b.date.localeCompare(a.date);

/**
 * Every item containing all the query's words, in its title, tags or summary. A title hit outranks a
 * tag hit, which outranks a summary hit; ties go to the newer piece. An empty query lists everything.
 */
export function searchEntries<T extends Searchable>(items: T[], query: string): T[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [...items].sort(newestFirst);

  const scored: { item: T; score: number }[] = [];
  for (const item of items) {
    const title = fold(item.title);
    const tags = item.tags.map(fold);
    const summary = fold(item.summary ?? '');
    let score = 0;
    for (const word of words) {
      const hit = (title.includes(word) ? 3 : 0) || (tags.some((tag) => tag.includes(word)) ? 2 : 0) || (summary.includes(word) ? 1 : 0);
      if (!hit) {
        score = 0;
        break;
      }
      score += hit;
    }
    if (score) scored.push({ item, score });
  }
  return scored.sort((a, b) => b.score - a.score || newestFirst(a.item, b.item)).map(({ item }) => item);
}
