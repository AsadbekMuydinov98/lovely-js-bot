const TelegramBot = require('node-telegram-bot-api');
const token = '8112954505:AAGMrNmHGXJekKeoXpbpENJWJTTfvsx-wuM'; // O'zingizning tokenni kiriting
const bot = new TelegramBot(token, { polling: true });

const questions = [
    { question: 'Yoshingiz nechida?', options: ['0–39', '40–49', '50–59', '60+'], scores: [0, 1, 2, 3] },
    { question: 'Jinsingiz?', options: ['Erkak', 'Ayol'], scores: [1, 0] },
    { question: 'Qarindoshlaringizda diabet bormi?', options: ['Yo‘q', 'Ha, 2-darajali', 'Ha, 1-darajali'], scores: [0, 1, 2] },
    { question: 'Tana massasi indeksi (BMI)?', options: ['< 25', '25–30', '> 30'], scores: [0, 1, 3] },
    { question: 'Bel atrofi katta (erkaklar > 94 sm, ayollar > 80 sm)?', options: ['Yo‘q', 'Ha'], scores: [0, 3] },
    { question: 'Kuniga 30 daqiqa harakat qilasizmi?', options: ['Ha', 'Yo‘q'], scores: [0, 2] },
    { question: 'Sizda yuqori qon bosimi bormi?', options: ['Yo‘q', 'Ha'], scores: [0, 2] },
    { question: 'Sizda shifokor tomonidan diabet xavfi aniqlanganmi?', options: ['Yo‘q', 'Ha'], scores: [0, 5] }
];

let userScores = {};

function createKeyboard(options) {
    return {
        reply_markup: {
            keyboard: options.map(option => [option]),
            one_time_keyboard: true,
            resize_keyboard: true,
        },
    };
}

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    userScores[chatId] = { score: 0, questionIndex: 0 };
    
    const firstQuestion = questions[0];
    bot.sendMessage(chatId, firstQuestion.question, createKeyboard(firstQuestion.options));
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    
    if (!userScores[chatId]) return;
    
    const userData = userScores[chatId];
    const currentQuestion = questions[userData.questionIndex];
    
    // Foydalanuvchining javobini topib ballni qo'shish
    const answerIndex = currentQuestion.options.indexOf(msg.text);
    if (answerIndex >= 0) {
        userData.score += currentQuestion.scores[answerIndex];
    }

    // Keyingi savol yoki yakunlash
    userData.questionIndex += 1;
    if (userData.questionIndex < questions.length) {
        const nextQuestion = questions[userData.questionIndex];
        bot.sendMessage(chatId, nextQuestion.question, createKeyboard(nextQuestion.options));
    } else {
        // Testni yakunlash va natijalarni yuborish
        const totalScore = userData.score;
        let riskLevel;

        if (totalScore <= 6) {
            riskLevel = "✅ Diabet xavfi past. Sog‘lom turmush tarzini davom ettiring!";
        } else if (totalScore <= 11) {
            riskLevel = "⚠️ Diabet xavfi bor. Profilaktika choralarini ko‘rish tavsiya etiladi.";
        } else {
            riskLevel = "🚨 Diabet xavfi yuqori! Tez orada shifokorga murojaat qiling.";
        }

        bot.sendMessage(chatId, `Test yakunlandi!\n\nSizning umumiy ballingiz: ${totalScore}\n\n${riskLevel}`);
        bot.sendMessage(chatId, 
            `Sizni o'z salomatligingiz haqida ko'proq ma'lumot olish uchun kanal va guruhlarimizga taklif qilamiz: /n📱 Kanalimiz: [@Dr_Muydinov](https://t.me/Dr_Muydinov) /n💬 Guruhimiz: [@Endokrinolog_Muydinov](https://t.me/Endokrinolog_Muydinov)`)
        delete userScores[chatId]; // Testni tugatgandan keyin foydalanuvchining ma'lumotlarini o'chirish
    }
});