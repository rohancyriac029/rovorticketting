export interface ParsedRepo {
  owner: string;
  name: string;
}

const SLUG_RE = /^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/;

/**
 * Accepts "owner/repo" or a full GitHub URL (with/without protocol, trailing
 * slash, or .git suffix) and normalizes it to { owner, name }. Returns null
 * if the input doesn't look like a valid GitHub repo reference.
 */
export function parseRepo(input: string): ParsedRepo | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let rest = trimmed;
  const urlMatch = trimmed.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/(.+)$/i);
  if (urlMatch) {
    rest = urlMatch[1]!;
  }

  rest = rest.replace(/\/+$/, '').replace(/\.git$/i, '');

  const parts = rest.split('/').filter(Boolean);
  if (parts.length !== 2) return null;

  const [owner, name] = parts as [string, string];
  if (!SLUG_RE.test(owner) || !SLUG_RE.test(name)) return null;

  return { owner, name };
}

export function repoFullName(repo: ParsedRepo): string {
  return `${repo.owner}/${repo.name}`.toLowerCase();
}
