// bot.js is the main file, start the bot from here: ``node bot`` in console.

require("dotenv").config();

require("./modules/globals");
require('./modules/EmbedPages');

global.config = require("./configs/config.json");

global.db = require('quick.db');

global.Discord = require("discord.js");
const { Client, Intents } = Discord;
global.client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILD_MEMBERS]});

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    client.setMaxListeners(0);

    client.commands = [];
    require('./modules/item-reader').initItems(require('./configs/items.json').items);
    require('./modules/crafting/crafting')(client);
    require('./modules/economy/economy')(client);
    require('./modules/seasons/seasons')(client);
    require('./modules/homesteads/homesteads')(client);
    require('./modules/lookups/lookups')(client);
    require('./modules/mini-games/minigames')(client);
    require('./modules/moderation/moderation')(client);
    require('./modules/reaction-roles/reaction-roles')(client);
    require('./modules/shop/shop')(client);
    require('./modules/help/help')(client);

    require('./modules/join-leave')(client);

    process.on("uncaughtException", () => {});
    client.on("uncaughtException", () => {});

    (await client.guilds.cache.get(config.ids.guildID).members.fetch()).forEach(member => {
        const user = member.user;
        if(db.get(user.id) === null){
            initUser(user);
        }
    })

    const { REST } = require("@discordjs/rest");
    const { Routes } = require("discord-api-types/v9");

    const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

    try {
        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, config.ids.guildID), { body: client.commands });
    } catch (err) {
        console.error(err);
    }
});

client.on('guildMemberAdd', (member) => {
    initUser(member.user);
})

client.login(process.env.TOKEN);
