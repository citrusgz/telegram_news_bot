const { chromium } = require('playwright');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const telegramToken = process.env.TELEGRAM_TOKEN;
const chatId = process.env.CHAT_ID;

const bot = new TelegramBot(telegramToken, { polling: true });

const url = process.env.URL;

const newIds = [];
let messageCount = 0;

async function scrapeAndPost() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto(url);

    const ids = await page.$$eval('.post-container > div', divs => divs.map(div => div.id).slice(0, 1));

    for (const id of ids) {
        if (!newIds.includes(id)) {
            newIds.push(id);

            const { href, title } = await page.$eval(`#${id} .post-title a`, a => ({ href: a.href, title: a.textContent }));
            const meta = await page.$eval(`#${id} .post-meta a:nth-of-type(2)`, a => a.textContent);

            console.log(`Novo post encontrado: ${title} - ${href} - ${meta}`);

            await bot.sendMessage(chatId, `Por ${meta} - <a href="${href}">${title}</a>`, { parse_mode: 'HTML' })
            .then(() => {
                console.log('Mensagem enviada com sucesso!');
                messageCount++;
                if (messageCount >= 3) {
                    newIds.length = 0;
                    messageCount = 0;
                    console.log('Array newIds foi limpo.');
                }
            })
            .catch((error) => {
                console.error('Erro ao enviar mensagem:', error);
            });
        }
    }

    await browser.close();
}

setInterval(scrapeAndPost, 5 * 60 * 1000);

scrapeAndPost();
