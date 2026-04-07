import "dotenv/config";

type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
  my_chat_member?: {
    chat: TelegramChat;
    date?: number;
  };
};

type TelegramMessage = {
  message_id: number;
  date: number;
  text?: string;
  chat: TelegramChat;
};

type TelegramChat = {
  id: number;
  type: string;
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
};

type TelegramGetUpdatesResponse = {
  ok: boolean;
  result?: TelegramUpdate[];
  description?: string;
};

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token || token === "replace-with-telegram-bot-token") {
  console.error("TELEGRAM_BOT_TOKEN is not configured in .env");
  process.exit(1);
}

const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
const payload = (await response.json()) as TelegramGetUpdatesResponse;

if (!response.ok || !payload.ok) {
  console.error(payload.description ?? "Telegram getUpdates failed.");
  process.exit(1);
}

const updates = payload.result ?? [];

if (updates.length === 0) {
  console.log("No updates found.");
  console.log("Add the bot to each Telegram room, send one message in each room, then run this again.");
  process.exit(0);
}

const rows = updates
  .map((update) => {
    const message = update.message ?? update.edited_message ?? update.channel_post;
    const chat = message?.chat ?? update.my_chat_member?.chat;
    const date = message?.date ?? update.my_chat_member?.date;

    if (!chat) {
      return null;
    }

    return {
      updateId: update.update_id,
      chatId: chat.id,
      type: chat.type,
      name: chat.title ?? chat.username ?? [chat.first_name, chat.last_name].filter(Boolean).join(" "),
      text: message?.text ?? "",
      date: date ? new Date(date * 1000).toISOString() : "",
    };
  })
  .filter((row) => row !== null);

console.table(rows);
