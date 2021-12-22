module.exports = function(client){
    setupCommands(client);
    handleCommands(client);

    initPages();
}

function setupCommands(client) {
    const shopCommand = {
        name: 'shop',
        description: 'See the shops.',
        options: [
            {
                name: 'type',
                description: 'Which shop you would like to see.',
                required: true,
                type: 3,
                choices: [
                    {
                        name: 'Item Shop',
                        value: 'items'
                    },
                    {
                        name: 'Furniture Shop',
                        value: 'furniture'
                    }
                ]
            }
        ]
    };

    const sellCommand = {
        name: 'sell',
        description: 'Sell any items in your inventory.',
        options: [
            {
                name: 'profile',
                description: 'Which profile you would like to sell from.',
                required: true,
                type: 3,
            },
            {
                name: 'item',
                description: 'Which item you would like to sell.',
                required: true,
                type: 3,
            },
            {
                name: 'amount',
                description: '[number, max].',
                required: false,
                type: 3
            }
        ]
    };

    const buyCommand = {
        name: 'buy',
        description: 'Buy an item from the shop.',
        options: [
            {
                name: 'profile',
                description: 'Which profile you would like to buy from.',
                required: true,
                type: 3,
            },
            {
                name: 'item',
                description: 'What item you would like to purchase. (type /shop to see all items).',
                required: true,
                type: 3,
            },
            {
                name: 'quantity',
                description: 'How much you would like to buy.',
                required: true,
                type: 3,
            }
        ]
    };

    const transferCommand = {
        name: "transfer",
        description: "Transfer money between accounts",
        options: [
            {
                name: "profile1",
                description: "The profile you will take money from.",
                required: true,
                type: 3,
            },
            {
                name: "profile2",
                description: "The profile you will give money to.",
                required: true,
                type: 3,
            },
            {
                name: "amount",
                description: "Amount of money to transfer.",
                required: true,
                type: 3
            }
        ]
    };

    const transferItemCommand = {
        name: "itemtransfer",
        description: "Transfer an item between profiles.",
        options: [
            {
                name: "profile1",
                description: "The profile you will take an item from.",
                required: true,
                type: 3,
            },
            {
                name: "profile2",
                description: "The profile you will give an item to.",
                required: true,
                type: 3,
            },
            {
                name: "item",
                description: "Which item to transfer.",
                required: true,
                type: 3
            }
        ]
    };

    client.commands.push(shopCommand);
    client.commands.push(sellCommand);
    client.commands.push(buyCommand);
    client.commands.push(transferCommand);
    client.commands.push(transferItemCommand);
}

function handleCommands(client){
    client.on('interactionCreate', async (interaction) => {
        if(interaction.commandName === 'shop'){
            if(interaction.options.getString('type') === 'items'){
                const generateEmbed = (start) => {
                    const embed = new Discord.MessageEmbed()
                        .setTitle("<:c_wares:888103894306152498> General Store")
                        .setColor(config.colors.currencyColor)
                        .setDescription("To buy items, type ``/buy [item] [amount]``.")
                        .setFooter("Page " + (start / 10 + 1) + " / " + Math.ceil(pages.length / 10));

                    const current = pages.slice(start, start + 10);

                    for(let i = 0; i < current.length; i++){
                        const item = current[i];

                        const emoji = getEmojiByCategory(item);
                        embed.addField(`${capitalize(item.name)} ${emoji}`, `*Price*: ${item.buy}`, true);
                    }

                    return embed;
                }

                const canFitOnOnePage = pages.length <= 10;
                interaction.reply({embeds: [new Discord.MessageEmbed().setColor(config.colors.defaultColor).setDescription("Item shop below: ")]});
                const embedMessage = await interaction.channel.send({
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
                                    ...(currentIndex + 10 < pages.length ? [forwardButton]: [])
                                ]
                            })
                        ]
                    })
                });
            } else if (interaction.options.getString('type') === 'furniture'){
                const generateEmbed = (start) => {
                    const embed = new Discord.MessageEmbed()
                        .setTitle("<:c_furniture:888103893916086314> Furniture Catalogue")
                        .setColor(config.colors.currencyColor)
                        .setDescription("To buy items, type ``/buy [item] [amount]``.")
                        .setFooter("Page " + (start / 10 + 1) + " / " + Math.ceil(furniture_pages.length / 10));

                    const current = furniture_pages.slice(start, start + 10);

                    for(let i = 0; i < current.length; i++){
                        const item = current[i];

                        const emoji = getEmojiByCategory(item);
                        embed.addField(`${capitalize(item.name)} ${emoji}`, `*Price*: ${item.buy}`, true);
                    }

                    return embed;
                }

                const canFitOnOnePage = furniture_pages.length <= 10;
                interaction.reply({embeds: [new Discord.MessageEmbed().setColor(config.colors.defaultColor).setDescription("Furniture shop below: ")]});
                const embedMessage = await interaction.channel.send({
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
                                    ...(currentIndex + 10 < furniture_pages.length ? [forwardButton]: [])
                                ]
                            })
                        ]
                    })
                });
            }
        } else if (interaction.commandName === 'buy'){
            if(db.get(interaction.user.id) === null) initUser(interaction.user);
            const item = getItemByName(interaction.options.getString("item"));

            const profile = getProfileByString(interaction.options.getString("profile"), interaction.user);
            if (profile === null) {
                await replyError(interaction, "Please specify a valid profile name. If you would like to see your current profiles, type ``/profile list``.");
                return;
            }

            if (item === null || item === undefined) {
                await replyError(interaction, "Please say a valid item. To view all items and prices, type ``/shop.``");
                return;
            }

            if (item.buy === -1) {
                await replyError(interaction, "You cannot buy this item.");
                return;
            }

            let amount = 0;

            if(interaction.options.getString("quantity")){
                if(isNaN(interaction.options.getString("quantity"))){
                    await replyError(interaction, "Please enter a valid number.");
                    return;
                }
                amount = parseInt(interaction.options.getString("quantity"));
            } else { amount = 1; }

            if(amount <= 0){
                await replyError(interaction, "Please specify a number above 0.");
                return;
            }


            if (profile.currencyAmount >= item.buy * amount) {
                giveItem(profile, item, amount);
                const newBalance = profile.currencyAmount;
                let plural = "";
                if(amount > 1) plural = "s";
                await replyCurrency(interaction, "You have successfully bought " + amount + " **" + capitalize(item.name) + plural + "** for " + (item.buy * amount) + "! You now have a total of " + newBalance + " in " + profile.title + ".");
                return;
            } else {
                let plural = "";
                if(amount > 1) plural = "s";
                await replyError(interaction, "You do not have enough " + config.economy.name + " to purchase " + amount + " **" + capitalize(item.name) + plural + "**!");
                return;
            }
        } else if (interaction.commandName === 'sell'){
            const profile = getProfileByString(interaction.options.getString('profile'), interaction.user);
            if (profile === null) {
                await replyError(interaction, "Please specify a valid profile name. If you would like to see your current profiles, type ``/profile list``.");
                return;
            }
            const item = getItemByName(interaction.options.getString('item').toLowerCase());

            if (item === null || item === undefined) {
                await replyError(interaction, "Please say a valid item. To see all items in your inventory type ``/inventory``.");
                return;
            }

            if(item.sell <= 0){
                await replyError(interaction, "You cannot sell this item.");
                return;
            }

            const valid = profile.inventory.findIndex(x => x.name === item.name) !== -1;

            let amount = profile.inventory.filter(x=>x.name===item.name).length;

            let f = 0;
            if(interaction.options.getString('amount')){
                if(isNaN(interaction.options.getString('amount'))){
                    if(interaction.options.getString('amount') === "max"){
                        f = amount;
                    } else {
                        await replyError(interaction, "Please specify a valid amount ``[number, max]``.");
                        return;
                    }
                } else {
                    let c = parseInt(interaction.options.getString('amount'));
                    if(c > amount || c <= 0){
                        await replyError(interaction, "Please specify a valid amount (check ``/inventory [profile]``");
                        return;
                    }
                    f = c;
                }

                if(f <= 0){
                    await replyError(interaction, "Please specify a valid amount (check ``/inventory [profile]``");
                    return;
                }
            } else { f = 1 }


            if (valid) {
                interaction.reply({
                    embeds:[
                        new Discord.MessageEmbed()
                            .setColor(config.colors.currencyColor)
                            .setDescription("You have successfully sold x" + f + " **" +
                                capitalize(item.name) + "** for " + item.sell * f + "! " +
                                "You now have a total of " + (profile.currencyAmount + item.sell * f) + " in " + profile.title + ".")
                    ]
                });
                removeItem(profile, item, f);
                addCurrency(profile, item.sell * f);
                return;
            } else {
                await replyError(interaction, "You do not have **" + capitalize(item.name) + "** in your inventory. Type ``/inventory`` to see your inventory");
                return;
            }
        } else if (interaction.commandName === 'transfer'){
            const profile1 = getProfileByString(interaction.options.getString('profile1'), interaction.user);
            const profile2 = getProfileByString(interaction.options.getString('profile2'), interaction.user);
            if (profile1 === null || profile2 === null) {
                await replyError(interaction, "Please specify a valid profile name. If you would like to see your current profiles, type ``/profile list``.");
                return;
            }

            if(profile1.title === profile2.title){
                await replyError(interaction, 'You can not transfer from and to the same profile.');
                return;
            }

            if(isNaN(interaction.options.getString('amount'))){
                await replyError(interaction, "Please specify a valid number.");
                return;
            }

            const amount = parseInt(interaction.options.getString('amount'));

            if(amount <= 0){
                await replyError(interaction, "Please specify a number over 0.");
                return;
            }

            if(profile1.currencyAmount - amount < 0){
                await replyError(interaction, "You don't have enough money in this profile to transfer.");
                return;
            }

            removeCurrency(profile1, amount);
            addCurrency(profile2, amount);

            await replySuccess(interaction, "You have successfully transferred **" + config.economy.moneyPrefix + " " + amount + "** from **" + profile1.title + "** to **" + profile2.title + "**.");
        } else if(interaction.commandName === 'itemtransfer'){
            const profile1 = getProfileByString(interaction.options.getString('profile1'), interaction.user);
            const profile2 = getProfileByString(interaction.options.getString('profile2'), interaction.user);
            if (profile1 === null || profile2 === null) {
                await replyError(interaction, "Please specify a valid profile name. If you would like to see your current profiles, type ``/profile list``.");
                return;
            }

            const item = getItemByName(interaction.options.getString('item'));

            if (item === null || item === undefined) {
                await replyError(interaction, "Please say a valid item. To view all items and prices, type ``/shop``.");
                return;
            }

            if(profile1.title === profile2.title){
                await replyError(interaction, 'You can not transfer from and to the same profile.');
                return;
            }

            const valid = profile1.inventory.findIndex(x => x.name === item.name) !== -1;

            if(valid){
                removeItem(profile1, item);
                giveItem(profile2, item, 1);

                await replySuccess(interaction, "Successfully transferred **" + capitalize(item.name) + "** from **" + profile1.title + "** to **" + profile2.title + "**.");
                return;
            } else {
                await replyError(interaction, "You do not have **" + capitalize(item.name) + "** in **" + profile1.title + "**.");
                return;
            }
        }
    });
}

const replyCurrency = (interaction, response) => {
    interaction.reply({embeds: [new Discord.MessageEmbed().setColor(config.colors.currencyColor).setDescription(response).setFooter("Quingee Bot", interaction.user.displayAvatarURL())]});
}

let pages = [];
let furniture_pages = [];

global.initPages = () => {
    pages = [];
    furniture_pages = [];

    const items = Object.keys(getAllItems());

    for(let i = 0; i < items.length; i++){
        const item = getAllItems()[items[i]];
        if(item.category === 'furniture') continue;
        if(item.season !== -1){
            if(seasons[item.season - 1] === db.get('seasons.currentSeason')) {
                if(item.buy !== -1){
                    pages.push(item);
                    continue;
                }
            } else continue;
        }
        if(item.buy !== -1){
            pages.push(item);
        }
    }

    const furniture_items = Object.keys(furniture);

    for(let i = 0; i < furniture_items.length; i++){
        const item = furniture[furniture_items[i]];
        if(item.category !== 'furniture') continue;
        if(item.buy !== -1){
            furniture_pages.push(item);
        }
    }
}