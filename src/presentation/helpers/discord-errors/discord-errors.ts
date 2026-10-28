export const getErrorMessageFromError = (error: any): { title: string; description: string } => {
  let errorTitle = '⛔  Error.';
  let errorMessage = error as string;

  const msg = typeof error?.message === 'string' ? error.message : '';
  if (msg === 'SpotifyNotConfigured') {
    return {
      title: '🎵  Spotify not configured',
      description:
        'Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to the environment to play Spotify links. YouTube links work without them.'
    };
  }
  if (msg === 'UnsupportedSource') {
    return {
      title: '🎵  Unsupported link',
      description: 'Only YouTube and Spotify links are supported right now.'
    };
  }
  if (msg === 'InvalidUrl') {
    return {
      title: '🎵  Invalid link',
      description: 'That does not look like a supported music URL.'
    };
  }
  if (msg === 'SpotifyAuthFailed' || msg.startsWith('SpotifyApiError:')) {
    return {
      title: '🎵  Spotify error',
      description: 'Could not reach Spotify. Check your credentials and try again.'
    };
  }
  if (msg === 'YoutubeBlocked') {
    return {
      title: '🎵  YouTube playback',
      description:
        'YouTube refused to serve this video (bot check or sign-in required). Set YOUTUBE_COOKIE with browser cookies for youtube.com (optionally YOUTUBE_PO_TOKEN and YOUTUBE_VISITOR_DATA), then restart the bot.'
    };
  }

  switch (error.toString()) {
    // Thrown when the YouTube search could not find any song with that query.
    case 'SearchIsNull':
      errorTitle = '🎵  Song Not Found';
      errorMessage = 'Cannot find this song!';
      break;
    // Thrown when the provided YouTube Playlist could not be found.
    case 'InvalidPlaylist':
      errorTitle = '🎵  Playlist Not Found';
      errorMessage = 'Cannot find this playlist!';
      break;
    // Thrown when the provided YouTube Playlist could not be found.
    case 'There was no Playlist found with that link.':
      errorTitle = '🎵  Playlist Not Found';
      errorMessage = 'Cannot find this playlist!';
      break;
    // Thrown when the provided Spotify Song could not be found.
    case 'InvalidSpotify':
      errorTitle = '🎵  Song Not Found';
      errorMessage = 'Cannot find this song!';
      break;
    // Thrown when the Guild Queue does not exist (no music is playing).
    case 'QueueIsNull':
      errorTitle = '🎵  No Music Playing';
      errorMessage = 'There is no music playing right now.';
      break;
    // Thrown when the Members is not in a VoiceChannel.
    case 'VoiceChannelTypeInvalid':
      errorMessage = 'You need to be in a voice channel!';
      break;
    // Thrown when the current playing song was an live transmission (that is unsupported).
    case 'LiveUnsupported':
      errorMessage = 'We do not support YouTube Livestreams.';
      break;
    // Thrown when the current playing song was unavailable.
    case 'VideoUnavailable':
      errorMessage = 'Something went wrong while playing the current song, skipping...';
      break;
    // Thrown when provided argument was Not A Number.
    case 'NotANumber':
      errorMessage = 'The provided argument was Not A Number.';
      break;
    // Thrown when the first method argument was not a Discord Message object.
    case 'MessageTypeInvalid':
      errorMessage = 'Not an object!';
      break;
    case 'Status code: 410':
      errorMessage = 'Oops! Resource Unavailable!';
      break;
    case 'UnexpectedError: Something went wrong! Try again later':
      errorMessage = 'Something went wrong! Try again later';
      break;
    default:
      errorTitle = '❌  Unknown Error';
      errorMessage = 'Unknown Error';
      break;
  }
  return {
    title: errorTitle,
    description: errorMessage
  };
};
