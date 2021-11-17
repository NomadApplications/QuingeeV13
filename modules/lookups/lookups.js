const lookup = require('../../configs/lookup.json');

module.exports = function(client) {
    setupCommands(client);
    handleCommands(client);
}

function setupCommands(client){
    const lookupCommand = {
        name: "lookup",
        description: "Lookup something from the table.",
        options: [
            {
                name: "object",
                description: "Which object you would like to lookup, /dictionary to see all.",
                required: true,
                type: 3,
            }
        ]
    };

    const dictionaryCommand = {
        name: "dictionary",
        description: "All lookup definitions"
    };

    client.commands.push(lookupCommand);
    client.commands.push(dictionaryCommand);
}

function handleCommands(client){
    client.on('interactionCreate', async (interaction) => {
        if(!interaction.isCommand()) return;

        if(interaction.commandName === 'dictionary'){
            const embed = new Discord.MessageEmbed()
                .setTitle("📚 Dictionary")
                .setColor(config.colors.defaultColor);

            let dictionaryLookupString = "";
            for(let i = 0; i < lookup.lookups.length; i++){
                const l = lookup.lookups[i];
                dictionaryLookupString += capitalize(l.title) + " " + l.emoji + "\n";
            }

            embed.addField("Lookups:", dictionaryLookupString);

            await reply(interaction, embed);
        } else if (interaction.commandName === 'lookup'){
            let l = lookup.lookups.find(x => x.title.toLowerCase() === interaction.options.getString('object').toLowerCase());

            if(l === null || l === undefined){
                replyError(interaction, "Please specify a valid lookup. To see all type ``/dictionary``.");
                return;
            }

            const embed = new Discord.MessageEmbed()
                .setTitle("Lookup for " + l.emoji + " " + capitalize(l.title))
                .setColor(config.colors.defaultColor)
                .setDescription(l.message);

            if(l.imageURL !== ""){
                embed.setThumbnail(l.imageURL);
            }

            await reply(interaction, embed);
        }
    })
}