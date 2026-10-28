import { describe, expect, it } from 'vitest';
import { toYoutubeFailureCode } from './youtube-failure';

describe('toYoutubeFailureCode', () => {
  it.each([
    "Sign in to confirm you're not a bot",
    'LOGIN_REQUIRED',
    'Sign in to confirm your age',
    'Request failed with status 403'
  ])('maps "%s" to YoutubeBlocked', message => {
    expect(toYoutubeFailureCode(new Error(message))).toBe('YoutubeBlocked');
  });

  it('maps an HTTP 403 media response to YoutubeBlocked', () => {
    const err = Object.assign(new Error('The server responded with a non 2xx status code'), {
      info: { response: { status: 403 } }
    });
    expect(toYoutubeFailureCode(err)).toBe('YoutubeBlocked');
  });

  it('maps other HTTP failures to VideoUnavailable', () => {
    const err = Object.assign(new Error('The server responded with a non 2xx status code'), {
      info: { response: { status: 500 } }
    });
    expect(toYoutubeFailureCode(err)).toBe('VideoUnavailable');
  });

  it('maps other errors to VideoUnavailable', () => {
    expect(toYoutubeFailureCode(new Error('No matching formats found'))).toBe('VideoUnavailable');
  });

  it('handles non-Error values', () => {
    expect(toYoutubeFailureCode('LOGIN_REQUIRED')).toBe('YoutubeBlocked');
    expect(toYoutubeFailureCode(undefined)).toBe('VideoUnavailable');
    expect(toYoutubeFailureCode(null)).toBe('VideoUnavailable');
  });
});
