import { create } from 'venom-bot'
import * as dotenv from 'dotenv'
import OpenAI from 'openai';

dotenv.config()

create({
    session: 'Chat-GPT',
    multidevice: true
})
    .then((client) => {
        start(client)
        console.log('cliente iniciado')
    })
    .catch((erro) => {
        console.log(erro);
    });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY 
});

const getDavinciResponse = async (clientText) => {
    console.log('entrei no davi')

    try {
        const response = await openai.completions.create({
            model: "text-davinci-003",
            max_tokens: 4000,
          });
        let botResponse = ""
        response.choices[0].forEach(({ text }) => {
            botResponse += text
        })
        return `Chat GPT 🤖\n\n ${botResponse.trim()}`
    } catch (e) {
        return `❌ OpenAI Response Error: ${e.error.message}`
    }
}

const getDalleResponse = async (clientText) => {
    const options = {
        prompt: clientText, // Descrição da imagem
        n: 1, // Número de imagens a serem geradas
        size: "1024x1024", // Tamanho da imagem
    }

    try {
        const response = await openai.createImage(options);
        return response.data.data[0].url
    } catch (e) {
        return `❌ OpenAI Response Error: ${e.response.data.error.message}`
    }
}

const commands = (client, message) => {

    console.log(message)
    const iaCommands = {
        davinci3: "/bot",
        dalle: "/img"
    }

    let firstWord = message.body.substring(0, message.body.indexOf(" "));

    switch (firstWord) {
        case iaCommands.davinci3:
            const question = message.body.substring(message.body.indexOf(" "));
            getDavinciResponse(question).then((response) => {
                /*
                 * Faremos uma validação no message.from
                 * para caso a gente envie um comando
                 * a response não seja enviada para
                 * nosso próprio número e sim para 
                 * a pessoa ou grupo para o qual eu enviei
                 */
                client.sendText(message.from === process.env.PHONE_NUMBER ? message.to : message.from, response)
            })
            break;

        case iaCommands.dalle:
            const imgDescription = message.text.substring(message.text.indexOf(" "));
            getDalleResponse(imgDescription, message).then((imgUrl) => {
                client.sendImage(
                    message.from === process.env.PHONE_NUMBER ? message.to : message.from,
                    imgUrl,
                    imgDescription,
                    'Imagem gerada pela IA DALL-E 🤖'
                )
            })
            break;
    }
}

async function start(client) {
    client.onAnyMessage((message) => commands(client, message));
}