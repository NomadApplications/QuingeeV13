client.commands.push({
    name: 'help',
    description: 'See all of the commands in embed form.'
});

module.exports = function (client) {
    client.on('interactionCreate', async (interaction) => {
        if (interaction.commandName === 'help') {
            const miscCommands = [];
            const profileCommands = [];
            const currencyCommands = [];
            const minigameCommands = [];
            const homesteadCommands = [];
            const craftingCommands = [];

            miscCommands.push(new CommandInfo("help", "See all of the commands.", []));

            profileCommands.push(new CommandInfo("profile", "See / manage your profiles", [new CommandParam("list, create, delete", true), new CommandParam("name", false)]));
            profileCommands.push(new CommandInfo("inventory", "See all of your items.", [new CommandParam("profile", false)]));
            profileCommands.push(new CommandInfo("rename", "Rename a profile", [new CommandParam("profile", true), new CommandParam("name", true)]));

            currencyCommands.push(new CommandInfo("shop", "See the shop for all items.", []));
            currencyCommands.push(new CommandInfo("buy", "Buy items.", [new CommandParam("profile", true), new CommandParam("item", true), new CommandParam("quantity", false)]));
            currencyCommands.push(new CommandInfo("sell", "Sell items.", [new CommandParam("profile", true), new CommandParam("item", true), new CommandParam("amount", false)]));
            currencyCommands.push(new CommandInfo("gift", "Gift an item to someone else", [new CommandParam("user", true), new CommandParam("item", true)]));
            currencyCommands.push(new CommandInfo("transfer", "Transfer money.", [new CommandParam("profile1", true), new CommandParam("profile2", true), new CommandParam("amount", true)]));
            currencyCommands.push(new CommandInfo("itemtransfer", "Transfer items.", [new CommandParam("profile1", true), new CommandParam("profile2", true), new CommandParam("item", true)]));

            minigameCommands.push(new CommandInfo("fish", "Fish for new items!", []));
            minigameCommands.push(new CommandInfo("mine", "Sift through rocks to get rare items!", []));
            minigameCommands.push(new CommandInfo("gather", "Roll the dice to see what item you get!", []));

            homesteadCommands.push(new CommandInfo("home", "See info about your home.", [new CommandParam("profile", true)]));
            homesteadCommands.push(new CommandInfo("upgrade", "Upgrade your home!", [new CommandParam("profile", true)]));
            homesteadCommands.push(new CommandInfo("setnode", "Set one of your nodes.", [new CommandParam("profile", true), new CommandInfo("item", true)]));
            homesteadCommands.push(new CommandInfo("removenode", "Remove one of your nodes.", [new CommandParam("profile", true), new CommandInfo("item", true)]));
            homesteadCommands.push(new CommandInfo("claimnodes", "Claim your nodes!", [new CommandParam("profile", true)]));

            craftingCommands.push(new CommandInfo("recipes", "See all of the crafting recipes.", []));
            craftingCommands.push(new CommandInfo("craft", "Craft items!", [new CommandParam("profile", true), new CommandParam("item1", true), new CommandParam("item2", true)]));

            // 21 Commands as of 8/12/21

            const embed = new Discord.MessageEmbed()
                .setTitle("Quingee Help")
                .setDescription("All commands for the Quingee bot (<> means mandatory, [] means optional):")
                .setColor(config.colors.defaultColor);

            const miscCommandString = getCommandPageInfo(miscCommands);
            const profileCommandString = getCommandPageInfo(profileCommands);
            const currencyCommandString = getCommandPageInfo(currencyCommands);
            const minigameCommandString = getCommandPageInfo(minigameCommands);
            const craftingCommandString = getCommandPageInfo(craftingCommands);
            const homesteadsCommandString = getCommandPageInfo(homesteadCommands);

            embed.addField("⚙ Miscellaneous", miscCommandString, false);
            embed.addField("📝 Profile", profileCommandString, false);
            embed.addField("💰 Currency", currencyCommandString, false);
            embed.addField("🧤 Forage", minigameCommandString, false);
            embed.addField("⚒ Crafting", craftingCommandString, false);
            embed.addField("🏡 Homesteads", homesteadsCommandString, false);

            interaction.reply({embeds: [embed]});

            if (interaction.member.permissionsIn(interaction.channel).has("KICK_MEMBERS")) {
                const mod = new Discord.MessageEmbed()
                    .setTitle("Moderation Commands ⚙")
                    .setColor("#939393")
                    .setDescription("All moderation commands (<> means mandatory, [] means optional):");

                const moderationCommands = [];

                moderationCommands.push(new CommandInfo("ban", "Ban members.", [new CommandParam("member", true), new CommandParam("reason", false)]));
                moderationCommands.push(new CommandInfo("unban", "Unban members.", [new CommandParam("member", true)]));
                moderationCommands.push(new CommandInfo("kick", "Kick members.", [new CommandParam("member", true), new CommandParam("reason", false)]));
                moderationCommands.push(new CommandInfo("warn", "Warn members.", [new CommandParam("member", true), new CommandParam("reason", false)]));
                moderationCommands.push(new CommandInfo("lock", "Locks a channel.", []));
                moderationCommands.push(new CommandInfo("unlock", "Unlocks a channel.", []));
                moderationCommands.push(new CommandInfo("purge", "Mass delete messages.", [new CommandParam("amount", true)]));
                moderationCommands.push(new CommandInfo("give", "Give item to user.", [new CommandParam("user", true), new CommandParam("item", true), new CommandParam("amount", false)]));
                moderationCommands.push(new CommandInfo("take", "Take item from user.", [new CommandParam("user", true), new CommandParam("item", true), new CommandParam("amount", false)]));
                moderationCommands.push(new CommandInfo("add", "Give currency to user.", [new CommandParam("user", true), new CommandParam("amount", true)]));
                moderationCommands.push(new CommandInfo("remove", "Remove currency from user.", [new CommandParam("user", true), new CommandParam("amount", true)]));

                const moderationCommandString = getCommandPageInfo(moderationCommands);

                mod.addField("Commands", moderationCommandString, false);

                interaction.member.send({embeds: [mod]});
            }
        }
    });
}

function getCommandPageInfo(arr) {
    let cs = "";
    arr.forEach(command => {
        let paramString = "";
        if (command.params.length > 0) {
            command.params.forEach(param => {
                if (param.required === true) {
                    paramString += `<${param.name}> `;
                } else {
                    paramString += `[${param.name}] `;
                }
            })
        }
        cs += `> __/${command.name}__ ${paramString} **- ${command.description}**\n`;
    });


    return cs;
}

class CommandInfo {
    constructor(name, description, params) {
        this.name = name;
        this.description = description;
        this.params = params;
    }
}

class CommandParam {
    constructor(name, required) {
        this.name = name;
        this.required = required;
    }
}
