module.exports = function(){
    setupCommands(client);
    handleCommands(client);
}

global.initUser = function(user) {
    if(db.get(user.id) !== null) return;
    const startingProfile = new EcoProfile(config.economy.startingCurrency, [], 'Bank', user.id, config.ids.guildID, houses[0]);
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
    updateProfile(newProfile);
}

global.removeCurrency = function(profile, currencyAmount) {
    if(db.get(profile.id) === null) initUser(getUserById(profile.id, profile.guildId));
    const newProfile = profile;
    newProfile.currencyAmount -= currencyAmount;
    updateProfile(newProfile);
}

global.addItemToProfile = function(profile, item){
    if(db.get(profile.id) === null) initUser(getUserById(profile.id, profile.guildId));
    const newProfile = profile;
    newProfile.inventory.push(item);
    updateProfile(newProfile);
    return true;
}

global.removeItem = function(profile, item) {
    if(db.get(profile.id) === null) initUser(getUserById(profile.id, profile.guildId));
    const newProfile = profile;
    const index = newProfile.inventory.findIndex(x => x.name === item.name);
    if(index === -1) return false;
    newProfile.inventory.splice(index, 1);
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
    if(profile.nodeSlots.filter(i => i.name === item.name).length > 0){
        let itemNames = [];
        profile.nodeSlots.forEach(i => itemNames.push(i.name));
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
                        name: "Create",
                        value: "create"
                    },
                    {
                        name: "List",
                        value: "list"
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

    const dailyCommand = {
        name: 'daily',
        description: 'Get your daily rewards.'
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

    client.commands.push(profileCommand);
    client.commands.push(dailyCommand);
    client.commands.push(inventoryCommand);
    client.commands.push(renameCommand);
}

function handleCommands(client) {
    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isCommand()) return;

        const user = interaction.user;

        if (interaction.commandName === "profile") {
            if (!db.get(user.id + ".profiles")) {
                initUser(interaction.user);
            }
            let type = interaction.options.getString('type');
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
                if (getProfileByString(profileName, user) !== null) {
                    await replyError(interaction, "You already have a profile named " + profileName + "!");
                    return;
                }
                if (!interaction.options.getString("name")) {
                    const profile = new EcoProfile(config.economy.startingCurrency, [], profileName, user.id, config.ids.guildID, houses[0]);
                    addNewProfile(user, profile);
                    removeCurrency(p, config.economy.profileCosts[currentAmount]);
                    await replySuccess(interaction, "Successfully created a new profile with the name " + profileName + " for " + config.economy.moneyPrefix + " " + config.economy.profileCosts[currentAmount] + "!");
                    return;
                }
                profileName = interaction.options.getString('name');
                if (getProfileByString(profileName, user) !== null) {
                    await replyError(interaction, "You already have a profile named " + profileName + "!");
                    return;
                }
                const profile = new EcoProfile(config.economy.startingCurrency, [], profileName, user.id, config.ids.guildID, houses[0]);
                addNewProfile(user, profile);
                removeCurrency(p, config.economy.profileCosts[currentAmount]);
                await replySuccess(interaction, `Successfully created a new profile with the name ${profileName} for ${config.economy.moneyPrefix} ${config.economy.profileCosts[currentAmount]}!`);
            } else if (type === 'list') {
                const profiles = db.get(user.id + ".profiles");

                const embed = new Discord.MessageEmbed()
                    .setTitle("Quingee Profiles")
                    .setColor(config.colors.currencyColor)
                    .setDescription("``/home [profile]`` to see your home stats. Your profiles:");

                if (!Array.isArray(profiles)) {
                    embed.addField(profiles.title, profiles.currencyAmount, false);
                    await reply(interaction, embed);
                    return;
                }
                for (let i = 0; i < profiles.length; i++) {
                    const profile = profiles[i];
                    embed.addField(profile.title, `${config.economy.moneyPrefix} ${profile.currencyAmount}\n${profile.inventory.length} items`, false);
                }
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
                if(profie.title === 'Bank' || db.get(user.id + ".profiles").length === 1){
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
        } else if (interaction.commandName === "daily"){
            if(!db.get(user.id)) initUser(user);

            const dailyReward = getRandom(config.economy.daily.min, config.economy.daily.max, 0);

            if(!db.get(user.id + '.daily')){
                let midnight = new Date();
                midnight.setHouse(24, 0, 0, 0);
                let time = (midnight.getTime() - new Date().getTime()) / 1000 / 60;
                time = Math.floor(time);
                const print = convert(time);

                await replyError(interaction, "You've already redeemed your daily reward! Please try again in " + print + " hours.");
                return;
            }

            let addedTo = [];
            const profiles = db.get(user.id + ".profiles");
            if(Array.isArray(profiles)){
                for(let i = 0; i < profiles.length; i++){
                    let m = 0;
                    profiles[i].nodeSlots.forEach(node => { if(node !== null) m++; });
                    if(m > 0){
                        addCurrency(profiles[i], dailyReward * m);
                        addedTo.push([profiles[i], m + 1]);
                    }
                }
            } else {
                let m = 0;
                profiles.nodeSlots.forEach(node => { if(node !== null) m++; });
                if(m > 0){
                    addCurrency(profiles, dailyReward * m);
                    addedTo.push([profiles, m + 1]);
                }
            }
            if(addedTo.length === 0){
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

            await reply(interaction, embed);
            return;
        } else if (interaction.commandName === 'rename'){
            const profile = getProfileByString(interaction.options.getString('profile'), user);
            if(profile === null){
                await replyError(interaction, "Please specify a valid profile name. If you would like to see your current profiles, type ``/profile list``.");
                return;
            }
            if(profile.title.toLowerCase() === "bank"){
                await replyError(interaction, "You cannot chnge the name of your *Bank* profile.");
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
                    description: `*Your current amount of Gald:* **${config.economy.moneyPrefix}** ${profile.currencyAmount} \n \n Your current cache: \n`,
                    color: config.colors.defaultColor,
                })

                const counted = getCounted(start);

                countedArray = Object.entries(counted).slice(start, start + 10);

                for(let i = 0; i < countedArray.length; i++){
                    const c = countedArray[i][1]
                    embed.addField(`x${c.amount} ${getEmojiByCategory(c.category)} ${capitalize(c.name)}`, `Sell: ${c.sell < 0 ? "N/A" : c.sell}`);
                }
                embed.setFooter("Page " + ((start / 10) + 1) + " / " + Math.ceil(Object.keys(counted).length / 10));
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