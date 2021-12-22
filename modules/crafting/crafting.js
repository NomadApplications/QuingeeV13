const recipes = require('../../configs/crafting-recipes.json').recipes;

module.exports = function(client){
    setupCommands(client);
    handleCommands(client);
}

function setupCommands(client){
    const craftCommand = {
        name: "craft",
        description: "Combine items to make new items!",
        options: [
            {
                name: "profile",
                description: "Which profile you would like to use.",
                required: true,
                type: 3
            },
            {
                name: 'recipe',
                description: 'Which recipe to use.',
                required: true,
                type: 3
            }
        ]
    };

    const recipesCommand = {
        name: "recipes",
        description: "See all recipes",
    };

    client.commands.push(craftCommand);
    client.commands.push(recipesCommand);
}

function handleCommands(client = Discord.Client){
    client.on("interactionCreate", async (interaction) => {
        if(!interaction.isCommand()) return;

        if(interaction.commandName === "craft"){
            const profileArg = interaction.options.getString('profile');
            const profile = getProfileByString(profileArg, interaction.user);
            if(profile === null) {
                await replyError(interaction, "Please specify a valid profile name. If you would like to see your current profiles, type ``/profile list``.");
                return;
            }

            const newItem = combineItems(interaction.options.getString("recipe"), profile);

            if(newItem.error !== undefined){
                await replyError(interaction, newItem.error);
                return;
            }

            const newI = getItemByName(newItem.result);
            if(newI === null){
                await replyError(interaction, "There was an error combining these items.");
                return;
            }

            let combinedString = '';
            for(let i = 0; i < newItem.items.length; i++){
                const item = newItem.items[i];
                if(i === newItem.items.length - 1 && i !== 0){
                    combinedString += `and **x${item.amount} ${capitalize(item.name)}**`;
                } else {
                    let n = `**x${item.amount} ${capitalize(item.name)}**`;
                    if(i === newItem.items.length - 2) n += " "
                    else n += ", ";
                    combinedString += n;
                }
            }

            await replySuccess(interaction, `You have combined ${combinedString} to make one **${capitalize(newItem.result)}**!`);

            for(let i = 0; i < newItem.items.length; i++){
                for(let j = 0; j < newItem.items[i].amount; j++){
                    removeItem(profile, getItemByName(newItem.items[i].name));
                }
            }

            addItemToProfile(profile, newI);
        } else if (interaction.commandName === "recipes"){
            const user = interaction.user;
            const channel = interaction.channel;

            if(recipes.length === 0){
                await replyError(interaction, "There are no crafting recipes.");
                return;
            }

            const getItemString = (recipe) => {
                let itemsString = '';
                for(let i = 0; i < recipe.items.length; i++){
                    itemsString += `x${recipe.items[i].amount} ${capitalize(recipe.items[i].name)}`;
                    if(i !== recipe.items.length - 1){
                        itemsString += ", ";
                    }
                }
                return itemsString;
            }

            const generateEmbed = async start => {
                const current = recipes.slice(start, start + 10);

                return new Discord.MessageEmbed({
                    title: "Crafting Recipes",
                    color: config.colors.defaultColor,
                    fields: await Promise.all(
                        current.map(async o => ({
                            name: capitalize(o.result),
                            value: getItemString(o)
                        }))
                    )
                })
            }

            const canFitOnOnePage = recipes.length <= 10;
            interaction.reply("Recipes below:")
            const embedMessage = await channel.send({
                embeds: [await generateEmbed(0)],
                components: canFitOnOnePage ? [] : [new Discord.MessageActionRow({components: [forwardButton]})]
            });

            if(canFitOnOnePage) return;

            const collector = embedMessage.createMessageComponentCollector({
                filter: ({user}) => user.id === interaction.user.id
            });

            let currentIndex = 0;
            collector.on('collect', async interaction => {
                interaction.customId === backId ? (currentIndex -= 10) : (currentIndex += 10);
                await interaction.update({
                    embeds: [await generateEmbed(currentIndex)],
                    components: [
                        new Discord.MessageActionRow({
                            components: [
                                ...(currentIndex ? [backButton] : []),
                                ...(currentIndex + 10 < recipes.length ? [forwardButton]: [])
                            ]
                        })
                    ]
                })
            });
        }
    });
}

const combineItems = (recipeName, profile) => {
    let recipe = null;
    recipes.forEach(i => {
        if(i.result === recipeName) recipe = i;
    })
    if(recipe === null){
        return { error: "Please specify a valid recipe. Check out ``/recipes`` for more info!" };
    }
    let amountOfItems = {};
    recipe.items.forEach(x=>amountOfItems[x.name]=0);

    for(let i = 0; i < profile.inventory.length; i++){
        if(recipe.items.find(x=>x.name===profile.inventory[i].name) != undefined)
            amountOfItems[profile.inventory[i].name]++;
    }

    for(let i = 0; i < Object.keys(amountOfItems).length; i++){
        if(amountOfItems[i] === 0)
            return { error: "You do not have enough items for this recipe. Please check out ``/recipes`` to see how many items you need for it!" };
    }

    for(let i = 0; i < recipe.items.length; i++){
        if(amountOfItems[recipe.items[i].name] < recipe.items[i].amount)
            return { error: "You do not have enough items for this recipe. Please check out ``/recipes`` to see how many items you need for it!" };
    }

    return recipe;
}