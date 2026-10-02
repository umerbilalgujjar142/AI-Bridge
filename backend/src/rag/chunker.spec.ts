import { chunkMarkdown } from './chunker.js';

const doc = `# Test Handbook

> Disclaimer line that should be ignored.

## Remote Work

Employees may work remotely up to 2 days per week.

Tuesday and Thursday are office days.

## Leave

Everyone gets 22 days of leave.
`;

describe('chunkMarkdown', () => {
  it('creates one chunk per "##" section with labels', () => {
    const chunks = chunkMarkdown('handbook', doc);

    expect(chunks).toHaveLength(2);
    expect(chunks.map((c) => c.section)).toEqual(['Remote Work', 'Leave']);
    expect(chunks[0]).toMatchObject({
      id: 'handbook#0',
      documentId: 'handbook',
      title: 'Test Handbook',
      chunkIndex: 0,
    });
  });

  it('prefixes every chunk with "Title — Section" for context', () => {
    const [first] = chunkMarkdown('handbook', doc);
    expect(first.content.startsWith('Test Handbook — Remote Work\n\n')).toBe(
      true,
    );
  });

  it('ignores the title, disclaimer and text before the first section', () => {
    const all = chunkMarkdown('handbook', doc)
      .map((c) => c.content)
      .join('\n');
    expect(all).not.toContain('Disclaimer');
  });

  it('splits a long section at paragraph breaks', () => {
    const chunks = chunkMarkdown('handbook', doc, { maxChars: 60 });
    const remote = chunks.filter((c) => c.section === 'Remote Work');

    expect(remote).toHaveLength(2);
    expect(remote[0].content).toContain('2 days per week');
    expect(remote[1].content).toContain('Tuesday and Thursday');
    expect(remote[1].content.startsWith('Test Handbook — Remote Work')).toBe(
      true,
    ); // context kept
  });
});
