require("dotenv/config");

process.env.NTBA_FIX_319 = 1;

const moment = require("moment");
const cron = require("node-cron");
const TelegramBot = require("node-telegram-bot-api");
const logger = require("js-logger");
const { default: TwitterApi } = require("v2-twitter");

logger.useDefaults();

const {
  TELEGRAM_TOKEN,
  GROUP_ID,
  BEARER_TOKEN,
  CONSUMER_KEY,
  CONSUMER_SECRET,
  ACCESS_TOKEN,
  ACCESS_SECRET,
} = process.env;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

const twitter = new TwitterApi({
  BearerToken: BEARER_TOKEN,
  ConsumerKey: CONSUMER_KEY,
  ConsumerSecret: CONSUMER_SECRET,
  AcessToken: ACCESS_TOKEN,
  AcessSecret: ACCESS_SECRET,
});

const sort = (left, right) =>
  moment.utc(left.timeStamp).diff(moment.utc(right.timeStamp));

const filter = (tweet) =>
  moment(tweet.created_at).isSame(moment().format("YYYY-MM-DD"), "day");

const sendTweet = async () => {
  try {
    const { data } = await twitter.getTimelineByUserId("1171894501587247104", {
      tweet: ["created_at"],
    });

    const tweets = data.filter(filter)?.sort(sort)?.reverse();

    const ids = tweets.map(({ id }) => id);

    if (!ids?.length) return;

    const response = await twitter.getMultipleTweets(ids, {
      tweet: ["text", "id"],
    });

    const idsSended = [];

    for (const { id, text } of response?.data) {
      if (idsSended.includes(id)) {
        logger.info("Messages already sended");
        continue;
      }

      idsSended.push(id);

      logger.info("Sending messages");
      await bot.sendMessage(GROUP_ID, text);
    }
  } catch (error) {
    logger.error(error);
  }
};

cron.schedule("30 16 * * *", sendTweet); // All days 13:30
