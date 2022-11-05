import { BotModel } from '@/domain/models/bot';
import 'dotenv/config';

export const mockBotModel = (): BotModel => ({
  name: process.env.BOT_NAME,
  description: process.env.BOT_DESCRIPTION
});
