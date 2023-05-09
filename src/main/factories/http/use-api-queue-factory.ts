import 'dotenv/config';

export const useApiQueueFactory = (): boolean => {
  if (process.env.BOT_USE_API_QUEUE === 'true') {
    return true;
  }
  return false;
};
