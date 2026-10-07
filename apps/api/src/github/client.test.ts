import { describe, expect, it } from 'vitest';
import { parseRepo } from '@app/shared';

describe('parseRepo', () => {
  it('accepts owner/repo', () => {
    expect(parseRepo('facebook/react')).toEqual({ owner: 'facebook', name: 'react' });
  });

  it('accepts a full GitHub URL', () => {
    expect(parseRepo('https://github.com/facebook/react')).toEqual({
      owner: 'facebook',
      name: 'react',
    });
  });

  it('accepts a URL with trailing slash and .git suffix', () => {
    expect(parseRepo('https://github.com/facebook/react.git/')).toEqual({
      owner: 'facebook',
      name: 'react',
    });
  });

  it('accepts a bare domain without protocol', () => {
    expect(parseRepo('github.com/facebook/react')).toEqual({ owner: 'facebook', name: 'react' });
  });

  it('rejects invalid input', () => {
    expect(parseRepo('not-a-repo')).toBeNull();
    expect(parseRepo('too/many/parts')).toBeNull();
    expect(parseRepo('')).toBeNull();
    expect(parseRepo('  ')).toBeNull();
  });
});
