export interface Chunk {
  id: string; // stable id, e.g. "company-policies#3"
  documentId: string; // file name without extension
  title: string; // the document's "# " title
  section: string; // the "## " heading this chunk belongs to
  chunkIndex: number; // position of the chunk inside the document
  content: string; // text that gets embedded: "Title — Section" + section text
}

export interface ChunkOptions {
  maxChars?: number; // soft limit per chunk (~4 characters ≈ 1 token)
}

const DEFAULT_MAX_CHARS = 1500;

// Splits a Markdown document into chunks:
// 1. one section per "## " heading
// 2. sections longer than maxChars are split at paragraph breaks
// 3. every chunk starts with "Title — Section" so it keeps its context
export function chunkMarkdown(
  documentId: string,
  markdown: string,
  options: ChunkOptions = {},
): Chunk[] {
  const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
  const lines = markdown.split(/\r?\n/);

  const title =
    lines
      .find((line) => line.startsWith('# '))
      ?.slice(2)
      .trim() ?? documentId;

  // Group lines under their "## " heading. Text before the first heading and
  // blockquote lines (">" disclaimers) are not part of any section.
  const sections: { heading: string; lines: string[] }[] = [];
  for (const line of lines) {
    if (line.startsWith('## ')) {
      sections.push({ heading: line.slice(3).trim(), lines: [] });
    } else if (sections.length > 0 && !line.startsWith('>')) {
      sections[sections.length - 1].lines.push(line);
    }
  }

  const chunks: Chunk[] = [];
  for (const section of sections) {
    const paragraphs = section.lines
      .join('\n')
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    for (const text of groupParagraphs(paragraphs, maxChars)) {
      const chunkIndex = chunks.length;
      chunks.push({
        id: `${documentId}#${chunkIndex}`,
        documentId,
        title,
        section: section.heading,
        chunkIndex,
        content: `${title} — ${section.heading}\n\n${text}`,
      });
    }
  }
  return chunks;
}

// Packs whole paragraphs together until adding the next one would exceed maxChars.
// A single paragraph longer than maxChars becomes its own chunk (never cut mid-paragraph).
function groupParagraphs(paragraphs: string[], maxChars: number): string[] {
  const groups: string[] = [];
  let current = '';
  for (const paragraph of paragraphs) {
    if (current && current.length + paragraph.length + 2 > maxChars) {
      groups.push(current);
      current = paragraph;
    } else {
      current = current ? `${current}\n\n${paragraph}` : paragraph;
    }
  }
  if (current) groups.push(current);
  return groups;
}
