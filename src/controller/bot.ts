import TelegramBot from "node-telegram-bot-api";
import {
  getEmoji,
  isGroup,
  isUserAdmin,
  stickerPackName,
} from "../utils/utils";
import { createSticker, createStickerPack } from "../services/bot";

export const createPackController = async (
  msg: TelegramBot.Message,
  bot: TelegramBot,
) => {
  // Only react in groups
  if (!isGroup(msg)) {
    return;
  }
  // Only admin user can create the pack
  if (!(await isUserAdmin(msg.chat.id, msg.from?.id ?? 0, bot))) {
    await bot.sendMessage(
      msg.chat.id,
      "Only group admins can use this command",
    );
    return;
  }

  let packName = "";
  try {
    packName = await createStickerPack(
      bot,
      msg.from?.id ?? 0,
      msg.chat.title,
      msg.chat.id,
    );
    await bot.sendMessage(
      msg.chat.id,
      `Created pack: https://t.me/addstickers/${packName}`,
    );
  } catch {
    await bot.sendMessage(msg.chat.id, "Failed to create pack");
    return;
  }
  try {
    // If success, send the new sticker
    const newSticker = (await bot.getStickerSet(packName)).stickers.at(-1);
    if (newSticker) {
      await bot.sendSticker(msg.chat.id, newSticker.file_id);
    }
  } catch (error) {
    console.error(error);
  }
};

export const createStickerController = async (
  msg: TelegramBot.Message,
  bot: TelegramBot,
) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;
  const caption = msg.caption?.split(" ") ?? [];

  // User ID must be available
  if (!userId) return;

  // Only react in groups
  if (!isGroup(msg)) {
    return;
  }

  const packName = stickerPackName(chatId);

  if (caption.indexOf("#stiku") >= 0) {
    const fileId = msg.photo?.pop()?.file_id || msg.sticker?.file_id;
    if (!fileId) return;

    try {
      await createSticker(
        bot,
        fileId,
        packName,
        chatId,
        getEmoji(caption) ?? "🖼️",
      );
      await bot.sendMessage(chatId, "✅ Sticker added to the pack!");
      const newSticker = (await bot.getStickerSet(packName)).stickers.at(-1);
      if (newSticker) {
        await bot.sendSticker(chatId, newSticker.file_id);
      }
    } catch (error) {
      console.error(error);
      await bot.sendMessage(
        chatId,
        "❌ Failed to add the sticker. Make sure the bot has permission.",
      );
    }
  }
};
