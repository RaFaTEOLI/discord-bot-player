import 'dotenv/config';
import { PlayerModel } from '@/domain/models/player';
import { mockBotModel } from './mock-bot';

export const mockPlayerModel = (): PlayerModel => ({
  prefix: process.env.BOT_PREFIX,
  token: process.env.BOT_TOKEN,
  bot: mockBotModel()
});
