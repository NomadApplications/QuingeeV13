// bot.js is the main file, start the bot from here: ``node bot`` in console.

require("dotenv").config();

require("./modules/globals");
require('./modules/EmbedPages');

global.config = require("./configs/config.json");

global.db = require('quick.db');

global.Discord = require("discord.js");
const { Client, Intents } = Discord;
global.client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILD_MEMBERS]});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);

    client.guilds.cache.get(config.ids.guildID).members.cache.forEach(member => {
        const user = member.user;
        if(db.get(user.id) === null){
            initUser(user);
        }
    })

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

    const { REST } = require("@discordjs/rest");
    const { Routes } = require("discord-api-types/v9");

    const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

    (async() => {
        try {
            await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, config.ids.guildID), { body: client.commands });
        } catch (err) {
            console.error(err);
        }
    })();
});

client.on("messageCreate", message => {
    const args = message.content.split(" ").map(arg => arg.toLowerCase());

    if(args[0] === "!add"){
        if(!args[1]) return message.channel.send("Please specify amount.");
        if(isNaN(args[1])) return message.channel.send("Please specify valid number.");

        const profiles = db.get(message.author.id + ".profiles");
        let profile = null;
        if(Array.isArray(profiles)){
            profile = profiles[0];
        } else {
            profile = profiles;
        }
        const newProfile = profile;
        newProfile.currencyAmount += parseInt(args[1]);
        updateProfile(newProfile);
        message.channel.send("Successfully added " + args[1] + " to " + message.author.username);
    } else if (args[0] === "!remove"){
        if(!args[1]) return message.channel.send("Please specify amount.");
        if(isNaN(args[1])) return message.channel.send("Please specify valid number.");

        const profiles = db.get(message.author.id + ".profiles");
        let profile = null;
        if(Array.isArray(profiles)){
            profile = profiles[0];
        } else {
            profile = profiles;
        }
        const newProfile = profile;
        newProfile.currencyAmount -= parseInt(args[1]);
        updateProfile(newProfile);
        message.channel.send("Successfully removed " + args[1] + " from " + message.author.username);
    } else if (args[0] === "!give"){
        const item = getItemByName(args[1]);
        if(item === null) {
            message.channel.send("There was an error finding " + args[1]);
            return;
        }
        message.channel.send("Given " + item.name);
        const p = getProfileByString('bank', message.author);
        giveItem(p, item, 1);
    } else if (args[0] === '!newday'){
        newDay();
    }
})

client.login(process.env.TOKEN);