import { getErrorMessageFromError } from './discord-errors';

describe('DiscordErrors', () => {
  const errorTitle = '⛔  Error.';

  test('should return SearchIsNull error message', () => {
    const errorMessage = getErrorMessageFromError('SearchIsNull');
    expect(errorMessage).toEqual({ title: '🎵  Song Not Found', description: 'Cannot find this song!' });
  });
  test('should return InvalidPlaylist error message', () => {
    const errorMessage = getErrorMessageFromError('InvalidPlaylist');
    expect(errorMessage).toEqual({ title: '🎵  Playlist Not Found', description: 'Cannot find this playlist!' });
  });
  test('should return InvalidSpotify error message', () => {
    const errorMessage = getErrorMessageFromError('InvalidSpotify');
    expect(errorMessage).toEqual({ title: '🎵  Song Not Found', description: 'Cannot find this song!' });
  });
  test('should return QueueIsNull error message', () => {
    const errorMessage = getErrorMessageFromError('QueueIsNull');
    expect(errorMessage).toEqual({
      title: '🎵  No Music Playing',
      description: 'There is no music playing right now.'
    });
  });
  test('should return VoiceChannelTypeInvalid error message', () => {
    const errorMessage = getErrorMessageFromError('VoiceChannelTypeInvalid');
    expect(errorMessage).toEqual({
      title: errorTitle,
      description: 'You need to be in a voice channel!'
    });
  });
  test('should return LiveUnsupported error message', () => {
    const errorMessage = getErrorMessageFromError('LiveUnsupported');
    expect(errorMessage).toEqual({
      title: errorTitle,
      description: 'We do not support YouTube Livestreams.'
    });
  });
  test('should return VideoUnavailable error message', () => {
    const errorMessage = getErrorMessageFromError('VideoUnavailable');
    expect(errorMessage).toEqual({
      title: errorTitle,
      description: 'Something went wrong while playing the current song, skipping...'
    });
  });
  test('should return NotANumber error message', () => {
    const errorMessage = getErrorMessageFromError('NotANumber');
    expect(errorMessage).toEqual({
      title: errorTitle,
      description: 'The provided argument was Not A Number.'
    });
  });
  test('should return MessageTypeInvalid error message', () => {
    const errorMessage = getErrorMessageFromError('MessageTypeInvalid');
    expect(errorMessage).toEqual({
      title: errorTitle,
      description: 'Not an object!'
    });
  });
  test('should return Status code: 410 error message', () => {
    const errorMessage = getErrorMessageFromError('Status code: 410');
    expect(errorMessage).toEqual({
      title: errorTitle,
      description: 'Oops! Resource Unavailable!'
    });
  });
  test('should return Something went wrong! Try again later error message', () => {
    const errorMessage = getErrorMessageFromError('UnexpectedError: Something went wrong! Try again later');
    expect(errorMessage).toEqual({
      title: errorTitle,
      description: 'Something went wrong! Try again later'
    });
  });
  test('should return default error message', () => {
    const errorMessage = getErrorMessageFromError('UNKNOWN');
    expect(errorMessage).toEqual({
      title: '❌  Unknown Error',
      description: 'Unknown Error'
    });
  });
});
