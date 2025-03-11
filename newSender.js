const { chromium } = require('playwright');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const telegramToken = process.env.TELEGRAM_TOKEN;
const chatId = process.env.CHAT_ID;

const bot = new TelegramBot(telegramToken, { polling: true });

const url = process.env.URL;

const newIds = [];

async function scrapeAndPost() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto(url);

    const posts = await page.$$eval('.post-container > div', divs => divs.map(div => {
        const id = div.id;
        const date = div.querySelector('.post-date').textContent;
        return { id, date };
    }));

    const latestDate = posts[0].date;

    for (const post of posts) {
        if (post.date === latestDate && !newIds.includes(post.id)) {
            newIds.push(post.id);

            const { href, title } = await page.$eval(`#${post.id} .post-title a`, a => ({ href: a.href, title: a.textContent }));
            const meta = await page.$eval(`#${post.id} .post-meta a:nth-of-type(2)`, a => a.textContent);

            console.log(`Novo post encontrado: ${title} - ${href} - ${meta}`);

            await bot.sendMessage(chatId, `Por ${meta} - <a href="${href}">${title}</a>`, { parse_mode: 'HTML' })
            .then(() => {
                console.log('Mensagem enviada com sucesso!');
            })
            .catch((error) => {
                console.error('Erro ao enviar mensagem:', error);
            });
        }
    }

    await browser.close();
}

setInterval(scrapeAndPost, 3 * 60 * 1000);

scrapeAndPost();
