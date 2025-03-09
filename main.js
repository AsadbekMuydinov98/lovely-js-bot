const TelegramBot = require('node-telegram-bot-api');

// Bot tokeni
const token = '8112954505:AAGMrNmHGXJekKeoXpbpENJWJTTfvsx-wuM'; // Bu yerga o'zingizning tokeningizni kiriting
const bot = new TelegramBot(token, { polling: true }); 

// Test savollari va ballar
const questions = [
    { question: "Yoshingiz nechida?", options: ["0–39", "40–49", "50–59", "60+"], points: [0, 1, 2, 3] },
    { question: "Jinsingiz?", options: ["Erkak", "Ayol"], points: [1, 0] },
    { question: "Qarindoshlaringizda diabet bormi?", options: ["Yo‘q", "Ha, 2-darajali", "Ha, 1-darajali"], points: [0, 1, 2] },
    { question: "Tana massasi indeksi (BMI)?", options: ["< 25", "25–30", "> 30"], points: [0, 1, 3] },
    { question: "Bel atrofi katta (erkaklar > 94 sm, ayollar > 80 sm)?", options: ["Yo‘q", "Ha"], points: [0, 3] },
    { question: "Kuniga 30 daqiqa harakat qilasizmi?", options: ["Ha", "Yo‘q"], points: [0, 2] },
    { question: "Sizda yuqori qon bosimi bormi?", options: ["Yo‘q", "Ha"], points: [0, 2] },
    { question: "Sizda shifokor tomonidan diabet xavfi aniqlanganmi?", options: ["Yo‘q", "Ha"], points: [0, 5] }
];

const userScores = {};

// Klaviatura yaratish
function createKeyboard(options) {
    return {
        reply_markup: {
            keyboard: options.map(option => [{ text: option }]),
            one_time_keyboard: true,
            resize_keyboard: true
        }
    };
}

// Start komandasi
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    userScores[chatId] = { score: 0, questionIndex: 0 };
    
    bot.sendMessage(chatId, "Assalomu alaykum! Diabet xavfini aniqlash testiga xush kelibsiz! 😊\n\nKeling, savollarga javob bering.", 
        createKeyboard(questions[0].options));
});

// Foydalanuvchi javoblarini qayta ishlash
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    if (!userScores[chatId]) return; // Agar foydalanuvchi testni boshlamagan bo'lsa

    const userData = userScores[chatId];
    const currentQuestion = questions[userData.questionIndex];

    // Javobni ballga aylantirish
    if (currentQuestion.options.includes(msg.text)) {
        const answerIndex = currentQuestion.options.indexOf(msg.text);
        userData.score += currentQuestion.points[answerIndex];
    }

    // Keyingi savol yoki natija chiqarish
    userData.questionIndex += 1;
    if (userData.questionIndex < questions.length) {
        const nextQuestion = questions[userData.questionIndex];
        bot.sendMessage(chatId, nextQuestion.question, createKeyboard(nextQuestion.options));
    } else {
        // Test natijasini hisoblash
        const totalScore = userData.score;
        let riskLevel = '';
        if (totalScore <= 6) {
            riskLevel = "✅ Diabet xavfi past. Sog‘lom turmush tarzini davom ettiring!";
        } else if (totalScore <= 11) {
            riskLevel = "⚠️ Diabet xavfi bor. Profilaktika choralarini ko‘rish tavsiya etiladi.";
        } else {
            riskLevel = "🚨 Diabet xavfi yuqori! Tez orada shifokorga murojaat qiling.";
        }

        bot.sendMessage(chatId, `Test yakunlandi!\n\nSizning umumiy ballingiz: ${totalScore}\n\n${riskLevel}`);
        bot.sendMessage(chatId, 
            `Sizni o'z salomatligingiz haqida ko'proq ma'lumot olish uchun kanal va guruhlarimizga taklif qilamiz:
            📱 Kanalimiz: [@Dr_Muydinov](https://t.me/Dr_Muydinov)
            💬 Guruhimiz: [@Endokrinolog_Muydinov](https://t.me/Endokrinolog_Muydinov)`
        );

        // Testni tugatgandan keyin foydalanuvchi ma'lumotlarini o'chirish
        delete userScores[chatId];
    }
});