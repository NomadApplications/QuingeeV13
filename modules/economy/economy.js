module.exports = function(){
    setupCommands(client);
    handleCommands(client);
}

global.initUser = function(user) {
    if(db.get(user.id) !== null) return;
    const startingProfile = new EcoProfile(config.economy.startingCurrency, [], 'Bank', user.id, config.ids.guildID, config.homesteads.houses[0]);
    db.set(user.id, { profiles: [startingProfile], daily: true });
};

global.addNewProfile = function(user, profile) {
    if(db.get(user.id) === null) initUser(user);
    db.push(user.id + ".profiles", profile);
}

global.addCurrency = function(profile, currencyAmount) {
    if(db.get(profile.id) === null) initUser(getUserById(profile.id, profile.guildId));
    const newProfile = profile;
    newProfile.currencyAmount += currencyAmount;
    if(newProfile.currencyAmount<0) newProfile.currencyAmount=0;
    updateProfile(newProfile);
}

global.removeCurrency = function(profile, currencyAmount) {
    if(db.get(profile.id) === null) initUser(getUserById(profile.id, profile.guildId));
    const newProfile = profile;
    newProfile.currencyAmount -= currencyAmount;
    if(newProfile.currencyAmount<0) newProfile.currencyAmount=0;
    updateProfile(newProfile);
}

global.getUserById = function(userId, guildId){
    return client.guilds.cache.get(guildId).members.cache.get(userId).user;
}

global.addItemToProfile = function(profile, item){
    if(db.get(profile.id) === null) initUser(getUserById(profile.id, profile.guildId));
    const newProfile = profile;
    newProfile.inventory.push(item);
    updateProfile(newProfile);
    return true;
}

global.removeItem = function(profile, item, amount = 1) {
    if(db.get(profile.id) === null) initUser(getUserById(profile.id, profile.guildId));
    const newProfile = profile;
    for(let i = 0; i < amount; i++){
        const index = newProfile.inventory.findIndex(x => x.name === item.name);
        if(index === -1) continue;
        newProfile.inventory.splice(index, 1);
    }
    updateProfile(newProfile);
    return true;
}

global.updateProfile = function(profile) {
    const profiles = db.get(profile.id + '.profiles');
    if(Array.isArray(profiles)){
        const index = profiles.findIndex(x => x.title === profile.title);
        const list = db.get(profile.id + ".profiles");
        list[index] = profile;
        db.set(profile.id + ".profiles", list);
    } else {
        db.set(profile.id + ".profiles", profile);
    }
}

global.getItemByCategory = function(profile, category) {
    const items = profile.inventory.filter(item => item.category === category.name);
    return items;
}

global.EcoProfile = class {
    constructor(currencyAmount = config.economy.startingCurrency, inventory = [], title = 'Bank', id, guildId, houseType = houses[0]){
        this.currencyAmount = currencyAmount;
        this.inventory = inventory;
        this.title = title;

        this.id = id;
        this.guildId = guildId;

        this.houseType = houseType;
        this.nodeSlots = [];
        for(let i = 0; i < this.houseType.nodeAmount; i++){
            this.nodeSlots.push(null);
        }
        this.claimedNodes = false;
    }
}

global.setClaimedNodes = (profile, bool) => {
    const p = profile;
    p.claimedNodes = bool;
    updateProfile(p);
}

global.setNode = (profile, item, slot) => {
    if(slot > profile.nodeSlots.length) return false;
    if(profile.inventory.filter(i => i.name === item.name).length > 0){
        profile.nodeSlots[slot] = item;
        removeItem(profile, item);
        return true;
    }
    return false;
}

global.removeNode = function (profile, item) {
    if(profile.nodeSlots.filter(i => {
        if(i === null) return false;
        else if (i.name === item.name) return true;
        else return false;
    }).length > 0){
        let itemNames = [];
        profile.nodeSlots.forEach(i => {
            if(i !== null) itemNames.push(i.name)
            else itemNames.push(null)
        });
        const i = itemNames.indexOf(item.name);
        profile.nodeSlots[i] = null;
        addItemToProfile(profile, item);
        return true;
    }
    return false;
}

function setupCommands(client) {
    const profileCommand = {
        name: "profile",
        description: "Manage your profiles",
        options: [
            {
                name: "type",
                description: "What kind of function you would like to use. [create, list, delete]",
                required: true,
                type: 3,
                choices: [
                    {
                        name: "List",
                        value: "list"
                    },
                    {
                        name: "Create",
                        value: "create"
                    },
                    {
                        name: "Delete",
                        value: "delete"
                    }
                ]
            },
            {
                name: 'name',
                description: 'Name of profile.',
                required: false,
                type: 3,
            }
        ]
    };

    const inventoryCommand = {
        name: 'inventory',
        description: 'See your current inventory.',
        options: [
            {
                name: 'profile',
                description: "Which profile's inventory you would like to see.",
                required: true,
                type: 3
            },
        ]
    };

    const renameCommand = {
        name: 'rename',
        description: 'Rename a profile!',
        options: [
            {
                name: 'profile',
                description: 'Which profile you would like to rename.',
                required: true,
                type: 3,
            },
            {
                name: 'name',
                description: 'New name for your profile',
                required: true,
                type: 3,
            },
        ]
    };

    const giftCommand = {
        name: 'gift',
        description: 'Gift an item to someone else',
        options: [
            {
                name: 'user',
                description: 'Which user you would like to give the item to.',
                type: 6,
                required: true
            },
            {
                name: 'item',
                description: 'Which item you would like to give.',
                type: 3,
                required: true
            }
        ]
    };

    const dailyCommand = {
        name: 'daily',
        description: 'Get your daily rewards.'
    };

    client.commands.push(dailyCommand);
    client.commands.push(giftCommand);
    client.commands.push(profileCommand);
    client.commands.push(inventoryCommand);
    client.commands.push(renameCommand);
}

const giftCooldown = [];

function handleCommands(client) {
    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isCommand()) return;

        const user = interaction.user;

        if (interaction.commandName === "profile") {
            if (!db.get(user.id + ".profiles")) {
                initUser(interaction.user);
            }

            let type = interaction.options.getString('type').toLowerCase();
            if (type === 'create') {
                if (db.get(user.id + '.profiles').length === config.economy.maximumProfiles) {
                    await replyError(interaction, "You already have " + config.economy.maximumProfiles + " profiles.");
                    return;
                }
                const currentAmount = db.get(user.id + '.profiles').length;
                if (config.economy.profileCosts[currentAmount] === null || config.economy.profileCosts[currentAmount] === undefined) {
                    await replyError(interaction, "There has been an error.");
                    return;
                }
                const p = getProfileByString("Bank", user);
                if (p === null) {
                    await replyError(interaction, "There has been an error.");
                    return;
                }
                if (config.economy.profileCosts[currentAmount] > p.currencyAmount) {
                    await replyError(interaction, `You only have ${config.economy.moneyPrefix} ${p.currencyAmount}. You need ${config.economy.moneyPrefix} ${config.economy.profileCosts[currentAmount]}!`);
                    return;
                }
                let profileName = "Profile" + db.get(user.id + ".profiles").length;
                if (!Array.isArray(db.get(user.id + ".profiles"))) {
                    profileName = "Profile1";
                }
                /*if (!interaction.options.getString("name")) {
                    const profile = new EcoProfile(config.economy.startingCurrency, [], profileName, user.id, config.ids.guildID, houses[0]);
                    addNewProfile(user, profile);
                    removeCurrency(p, config.economy.profileCosts[currentAmount]);
                    await replySuccess(interaction, "Successfully created a new profile with the name " + profileName + " for " + config.economy.moneyPrefix + " " + config.economy.profileCosts[currentAmount] + "!");
                    return;
                }*/
                if(interaction.options.getString('name')) profileName = interaction.options.getString('name');
                if (getProfileByString(profileName, user) !== null) {
                    await replyError(interaction, "You already have a profile named " + profileName + "!");
                    return;
                }
                // CREATING NEW PROFILE
                const embed = new Discord.MessageEmbed().setColor(config.colors.defaultColor).setDescription(`<@${interaction.user.id}> - Confirm your purchase of a new profile?`).setFooter("Quingee Bot", interaction.user.displayAvatarURL());
                const row = new Discord.MessageActionRow()
                    .addComponents(
                        new Discord.MessageButton()
                            .setCustomId('confirm')
                            .setLabel('Confirm')
                            .setStyle('SUCCESS')
                            .setEmoji('✅'),
                    );

                interaction.reply({embeds: [embed], components: [row]})

                client.once('interactionCreate', (i) => {
                    if (!i.isButton()) return;

                    if (i.customId === 'confirm' && i.user.id == interaction.user.id) {
                        const profile = new EcoProfile(config.economy.startingCurrency, [], profileName, interaction.user.id, config.ids.guildID, houses[0]);
                        addNewProfile(user, profile);
                        removeCurrency(p, config.economy.profileCosts[currentAmount]);
                        const s = new Discord.MessageEmbed().setColor(config.colors.successColor).setDescription(`Successfully created a new profile with the name ${profileName} for ${config.economy.moneyPrefix} ${config.economy.profileCosts[currentAmount]}!`).setFooter("Quingee Bot", interaction.user.displayAvatarURL());
                        i.component.setDisabled(true);
                        i.update({
                            embeds: [s],
                            components: []
                        });
                        return;
                    }
                });
            } else if (type === 'list') {
                const profiles = db.get(user.id + ".profiles");

                const embed = new Discord.MessageEmbed()
                    .setTitle("Quingee Profiles")
                    .setColor(config.colors.currencyColor)
                    .setDescription("<@" + interaction.user.id + "> - ``/home [profile]`` to see your home stats. Your profiles:");

                if (!Array.isArray(profiles)) {
                    embed.addField(profiles.title, profiles.currencyAmount, false);
                    await reply(interaction, embed);
                    return;
                }
                for (let i = 0; i < profiles.length; i++) {
                    const profile = profiles[i];
                    embed.addField(profile.title, `${config.economy.moneyPrefix} ${profile.currencyAmount}\n${profile.inventory.length} item${profile.inventory.length==1?"":"s"}`, false);
                }
                embed.setFooter("Quingee Bot", interaction.user.displayAvatarURL());
                await reply(interaction, embed);
            } else if (type === 'delete') {
                if (!interaction.options.getString('name')) {
                    await replyError(interaction, 'Please specify a profile name.');
                    return;
                }
                const profile = getProfileByString(interaction.options.getString('name'), user);
                if (profile === null) {
                    await replyError(interaction, 'Please specify a valid profile name. If you would like to see your current profiles, type ``/profile list``.');
                    return;
                }
                if(profile.title === 'Bank' || db.get(user.id + ".profiles").length === 1){
                    await replyError(interaction, "You cannot delete your *Bank* profile.");
                    return;
                }
                const list = db.get(user.id + ".profiles");
                const index = list.findIndex(x => x.title === profile.title);
                if(index === -1){
                    await replyError(interaction, "There was an error.");
                    return;
                }
                profile.inventory.forEach(i => {
                    list[0].inventory.push(i);
                })
                list[0].currencyAmount += profile.currencyAmount;

                list.splice(index, 1);
                db.set(user.id + ".profiles", list);

                await replySuccess(interaction, `You have successfully removed ${profile.title}. All currency and items were transferred to *Bank*.`);
            } else {
                await replyError(interaction, "There was an error.");
            }
        } else if (interaction.commandName === "daily") {
            if (!db.get(user.id)) initUser(user);

            const dailyReward = getRandom(config.economy.daily.min, config.economy.daily.max, 0);

            if (!db.get(user.id + '.daily')) {
                let midnight = new Date();
                midnight.setHours(24, 0, 0, 0);
                let time = (midnight.getTime() - new Date().getTime()) / 1000 / 60;
                const hours = Math.floor(time / 60);
                const minutes = Math.floor(time % 60);

                await replyError(interaction, "You've already redeemed your daily reward! Please try again in **" + hours + "** hours and **" + minutes + "** minutes.");
                return;
            }

            let addedTo = [];
            const profiles = db.get(user.id + ".profiles");
            if (Array.isArray(profiles)) {
                for (let i = 0; i < profiles.length; i++) {
                    let m = 0;
                    profiles[i].nodeSlots.forEach(node => {
                        if (node !== null) m++;
                    });
                    if (m > 0) {
                        addCurrency(profiles[i], dailyReward * m);
                        addedTo.push([profiles[i], m + 1]);
                    }
                }
            } else {
                let m = 0;
                profiles.nodeSlots.forEach(node => {
                    if (node !== null) m++;
                });
                if (m > 0) {
                    addCurrency(profiles, dailyReward * m);
                    addedTo.push([profiles, m + 1]);
                }
            }
            if (addedTo.length === 0) {
                await replyError(interaction, "There are no nodes that can add currency to.");
                return;
            }
            db.set(user.id + ".daily", false);

            const embed = new Discord.MessageEmbed()
                .setTitle('Daily Reward')
                .setColor(config.colors.currencyColor)
                .setDescription("Reward: " + dailyReward);

            addedTo.forEach(a => {
                const p = a[0];
                const m = a[1];
                embed.addField(p.title, `x${m} (${config.economy.moneyPrefix} ${dailyReward * m})`, false);
            });
            embed.setFooter("Quingee Bot", interaction.user.displayAvatarURL())

            await reply(interaction, embed);
            return;
        } else if (interaction.commandName === 'rename'){
            const profile = getProfileByString(interaction.options.getString('profile'), user);
            if(profile === null){
                await replyError(interaction, "Please specify a valid profile name. If you would like to see your current profiles, type ``/profile list``.");
                return;
            }
            if(profile.title.toLowerCase() === "bank"){
                await replyError(interaction, "You cannot change the name of your *Bank* profile.");
                return;
            }
            if(getProfileByString(interaction.options.getString('name'), user) !== null){
                await replyError(interaction, "You cannot change a profile name to an already existing profile name.");
                return;
            }
            const previousTitle = profile.title;
            const p = profile;
            p.title = interaction.options.getString('name');

            const profiles = db.get(user.id + ".profiles");
            if(Array.isArray(profiles)){
                const index = profiles.findIndex(x => x.title === previousTitle);
                const list = db.get(user.id + ".profiles");
                list[index] = p;
                db.set(user.id + '.profiles', list);
            } else {
                db.set(user.id + ".profiles", p);
            }

            await replySuccess(interaction, `You have successfully changed the name of ${interaction.options.getString('profile')} to ${p.title}!`);
            return;
        } else if (interaction.commandName === 'inventory'){
            const channel = interaction.channel;

            const profile = getProfileByString(interaction.options.getString('profile'), user);
            if(profile === null){
                await replyError(interaction, "Please specify a valid profile name. If you would like to see your current profiles, type ``/profile list``.");
                return;
            }

            if(profile.inventory.length === 0){
                await replyError(interaction, "You have no items.");
                return;
            }

            const getCounted = (start) => {
                const counted = {};
                for(let i = 0; i < profile.inventory.length; i++){
                    if(counted[profile.inventory[i].name]){
                        counted[profile.inventory[i].name].amount += 1;
                    } else {
                        counted[profile.inventory[i].name] = {};
                        counted[profile.inventory[i].name].amount = 1;
                        counted[profile.inventory[i].name].name = profile.inventory[i].name;
                        counted[profile.inventory[i].name].category = profile.inventory[i].category;
                        counted[profile.inventory[i].name].sell = profile.inventory[i].sell;
                        continue;
                    }
                }

                return counted;
            }

            const generateEmbed = async start => {
                const embed = new Discord.MessageEmbed({
                    title: `<:c_wares:888103894306152498> `+ profile.title + `'s Inventory`,
                    description: `<@${interaction.user.id}>'s *current amount of Gald:* **${config.economy.moneyPrefix}** ${profile.currencyAmount} \n \n Your current cache: \n`,
                    color: config.colors.defaultColor,
                })

                const counted = getCounted(start);

                let countedArray = Object.entries(counted).slice(start, start + 10);

                for(let i = 0; i < countedArray.length; i++){
                    const c = countedArray[i][1]
                    embed.addField(`x${c.amount} ${capitalize(c.name)} ${getEmojiByCategory(c.category)}`, `Sell: ${c.sell < 0 ? "N/A" : c.sell}`);
                }
                embed.setFooter("Page " + ((start / 10) + 1) + " / " + Math.ceil(Object.keys(counted).length / 10), interaction.user.displayAvatarURL());
                return embed;
            }

            const canFitOnOnePage = Object.keys(getCounted(0)).length <= 10;
            interaction.reply("Inventory below:")
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
                                ...(currentIndex + 10 < Object.keys(getCounted(currentIndex)).length ? [forwardButton]: [])
                            ]
                        })
                    ]
                })
            });
        } else if(interaction.commandName === 'gift'){
            let found = false;
            let seconds = 0;
            for (let i = 0; i < giftCooldown.length; i++) {
                if (giftCooldown[i][0] === interaction.user.id) {
                    found = true;
                    seconds = giftCooldown[i][1];
                }
            }
            if (found) {
                await replyError(interaction, "Please wait " + seconds + " seconds before using this command again.");
                return;
            }

            const profile = getProfileByString('Bank', interaction.user);
            if (profile === null) {
                await replyError(interaction, "Please specify a valid profile name. If you would like to see your current profiles, type ``/profile list``.");
                return;
            }

            const userProfile = getProfileByString('Bank', interaction.options.getUser('user'));
            if(userProfile === null){
                await replyError(interaction, "The user you chose doesn't have their profiles setup correctly!");
                return;
            }

            const item = profile.inventory.find(x=>x.name.toLowerCase() === interaction.options.getString('item').toLowerCase());

            if(item === undefined || item === null){
                await replyError(interaction, "That is not a valid item. Type ``/inventory`` to see which items you can gift.");
                return;
            }

            giftCooldown.push([interaction.user.id, config.minigames.timeBetweenMinigames]);
            let interval = setInterval(function () {
                for (let i = 0; i < giftCooldown.length; i++) {
                    if (giftCooldown[i][0] === interaction.user.id) {
                        giftCooldown[i][1] -= 1;
                        break;
                    }
                }
            }, 1000)
            setTimeout(function () {
                clearInterval(interval);
                for (let i = 0; i < giftCooldown.length; i++) {
                    if (giftCooldown[i][0] === interaction.user.id) {
                        giftCooldown.splice(i, 1);
                        break;
                    }
                }
            }, config.minigames.timeBetweenMinigames * 1000);

            removeItem(profile, item);
            addItemToProfile(userProfile,item);

            await replySuccess(interaction, `You have successfully given ${interaction.options.getUser('user')} **x1 ${item.name}**!`);
            return;
        }
    });
}

global.getRandom = function (min, max, fractionDigits) {
    const fractionMultiplier = Math.pow(10, fractionDigits)
    return Math.round(
        (Math.random() * (max - min) + min) * fractionMultiplier,
    )
}
global.convert = (n) => `0${n / 60 ^ 0}`.slice(-2) + ':' + ('0' + n % 60).slice(-2);