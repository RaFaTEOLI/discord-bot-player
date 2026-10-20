import { describe, expect, it } from 'vitest';
import { validateYoutubeCookieFormat } from './youtube-cookie-validation';

describe('validateYoutubeCookieFormat', () => {
  it('rejects empty', () => {
    expect(validateYoutubeCookieFormat('')).toEqual({
      ok: false,
      reason: 'YOUTUBE_COOKIE is empty or whitespace.'
    });
    expect(validateYoutubeCookieFormat('   ').ok).toBe(false);
  });

  it('rejects too short', () => {
    expect(validateYoutubeCookieFormat('a=b').ok).toBe(false);
  });

  it('rejects missing equals', () => {
    const long = 'x'.repeat(50);
    expect(validateYoutubeCookieFormat(long).ok).toBe(false);
  });

  it('accepts plausible cookie header', () => {
    const cookie =
      'VISITOR_INFO1_LIVE=abc123def456; __Secure-3PSID=g.a0000example; PREF=f4=4000000';
    expect(validateYoutubeCookieFormat(cookie)).toEqual({ ok: true });
  });
});
