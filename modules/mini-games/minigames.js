module.exports = function (client) {
    setupCommands(client);
    handleCommands(client);
}

function setupCommands(client) {
    const fishCommand = {
        name: 'fish',
        description: 'Go fishing!',
    };

    const mineCommand = {
        name: 'mine',
        description: 'Go mining!',
    };

    const gatherCommand = {
        name: 'gather',
        description: 'Gather some materials!',
    };

    client.commands.push(fishCommand);
    client.commands.push(mineCommand);
    client.commands.push(gatherCommand);
}

const fishedRecently = [];
const minedRecently = [];
const gatheredRecently = [];

function handleCommands(client) {
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isCommand()) return;

        if (interaction.commandName === "mine") {
            let found = false;
            let seconds = 0;
            for (let i = 0; i < minedRecently.length; i++) {
                if (minedRecently[i][0] === interaction.user.id) {
                    found = true;
                    seconds = minedRecently[i][1];
                }
            }
            if (found) {
                await replyError(interaction, "Please wait " + seconds + " seconds before using this command again.");
                return;
            }

            const profiles = db.get(interaction.user.id + ".profiles");
            const profile = Array.isArray(profiles) ? profiles[0] : profiles;

            const embed = new Discord.MessageEmbed()
                .setTitle("<:m_mining:888103893798625301> You march forth, into the caves of Galinn Peak..")
                .setColor(config.colors.defaultColor)
                .setDescription("With nary but your tools in hand, you see a series of rocks that could be fruitful. Sift through the stones, and perhaps you'll find treasure!");

            minedRecently.push([interaction.user.id, config.minigames.timeBetweenMinigames]);
            let interval = setInterval(function () {
                for (let i = 0; i < minedRecently.length; i++) {
                    if (minedRecently[i][0] === interaction.user.id) {
                        minedRecently[i][1] -= 1;
                        break;
                    }
                }
            }, 1000)
            setTimeout(function () {
                clearInterval(interval);
                for (let i = 0; i < minedRecently.length; i++) {
                    if (minedRecently[i][0] === interaction.user.id) {
                        minedRecently.splice(i, 1);
                        break;
                    }
                }
            }, config.minigames.timeBetweenMinigames * 1000);

            interaction.reply({embeds: [new Discord.MessageEmbed().setColor(config.colors.defaultColor).setDescription("Where will you search?")]});

            const row = new Discord.MessageActionRow().addComponents(
                new Discord.MessageButton().setCustomId('mine1' + interaction.user.id).setEmoji('⛰').setStyle("SECONDARY"),
                new Discord.MessageButton().setCustomId('mine2' + interaction.user.id).setEmoji('🏔️').setStyle("SECONDARY"),
                new Discord.MessageButton().setCustomId('mine3' + interaction.user.id).setEmoji('🗻').setStyle("SECONDARY")
            )
            interaction.channel.send({embeds: [embed], components: [row]});

            let interacted = false;

            client.on('interactionCreate', async (interaction) => {
                if(interacted) return;
                if (!interaction.isButton()) return;
                const id = interaction.customId;

                if (!id.includes(interaction.user.id)) return;
                if (id.includes('mine1') || id.includes('mine2') || id.includes('mine3')) {
                    interacted = true;

                    const level = getRandomByProbability(1, 3);
                    const item = getItemFromLevel(level, 'mining');

                    if (getItemByName(item.name) === null) {
                        await replyError(interaction, "There has been an error finding an item.");
                        return;
                    }

                    const m = item['reward-text'] === "" ? levelRewardText(level) : item['reward-text'];
                    const em = item.emoji === "" ? "❌" : item.emoji;

                    const e = new Discord.MessageEmbed()
                        .setTitle("You land a solid hit! You can see something in the cracks..")
                        .setColor(config.colors.successColor)
                        .setDescription(`${m} With a whole lot of effort on your part, you are able to unearth one **${capitalize(item.name)} ${em}**! Your new item has been added to *${profile.title}.*`);

                    interaction.update({
                        embeds: [e],
                        components: []
                    });

                    giveItem(profile, getItemByName(item.name), 1);
                }
            })
        } else if (interaction.commandName === 'fish') {
            let found = false;
            let seconds = 0;
            for (let i = 0; i < fishedRecently.length; i++) {
                if (fishedRecently[i][0] === interaction.user.id) {
                    found = true;
                    seconds = fishedRecently[i][1];
                }
            }
            if (found) {
                await replyError(interaction, "Please wait " + seconds + " seconds before using this command again.");
                return;
            }

            const profiles = db.get(interaction.user.id + ".profiles");
            let profile = Array.isArray(profiles) ? profiles[0] : profiles;

            const embed = new Discord.MessageEmbed()
                .setTitle("<:m_fishing:888103893840572437> Maybe this time you'll get the big one?")
                .setColor(config.colors.defaultColor)
                .setDescription("You approach your fishing hole of choice, your trusty rod in hand. You ready your spot, attach your bait, and prepare yourself for a good catch. Click at the right time to reel it in!");

            fishedRecently.push([interaction.user.id, config.minigames.timeBetweenMinigames]);
            let interval = setInterval(function () {
                for (let i = 0; i < fishedRecently.length; i++) {
                    if (fishedRecently[i][0] === interaction.user.id) {
                        fishedRecently[i][1] -= 1;
                        break;
                    }
                }
            }, 1000)
            setTimeout(function () {
                clearInterval(interval);
                for (let i = 0; i < fishedRecently.length; i++) {
                    if (fishedRecently[i][0] === interaction.user.id) {
                        fishedRecently.splice(i, 1);
                        break;
                    }
                }
            }, config.minigames.timeBetweenMinigames * 1000);


            interaction.reply({embeds: [new Discord.MessageEmbed().setColor(config.colors.defaultColor).setDescription("You cast your line into the water..")]});


            const row = new Discord.MessageActionRow().addComponents(
                new Discord.MessageButton().setCustomId('fish' + interaction.user.id).setEmoji('🎣').setStyle("DANGER").setDisabled(true)
            );
            interaction.channel.send({embeds: [embed], components: [row]}).then(embedMessage => {
                setTimeout(() => {
                    let failed = false;
                    const timer = setTimeout(() => {
                        failed = true;
                        embed.setColor(config.colors.errorColor);
                        embed.setDescription("Oops..! You sure did miss your chance there! Hopefully no one saw that.");
                        embedMessage.edit({embeds: [embed], components: []});
                        return;
                    }, getRandomByRange(2000, 4000));
                    embed.setColor(config.colors.successColor);

                    row.components[0].setDisabled(false);
                    row.components[0].setStyle("SUCCESS");
                    embedMessage.edit({embeds: [embed], components: [row]})

                    let interacted = false;

                    client.on('interactionCreate', async (interaction) => {
                        if (interacted) return;
                        if (!interaction.isButton()) return;

                        if (interaction.customId === 'fish' + interaction.user.id) {
                            interacted = true;

                            clearTimeout(timer);

                            const level = getRandomByProbability(1, 3);
                            const item = getItemFromLevel(level, "fishing");

                            if (getItemByName(item.name) === null) {
                                replyError(interaction, "There has been an error finding an item.");
                                return;
                            }

                            const m = item["reward-text"] === "" ? levelRewardText(level) : item["reward-text"];
                            const em = item.emoji === "" ? "❌" : item.emoji;

                            const e = new Discord.MessageEmbed()
                                .setTitle("The line on your rod tugs...")
                                .setColor(config.colors.successColor)
                                .setDescription(`${m} With a big heave and a giant *whoa*, you reel back one **${capitalize(item.name)} ${em}**! Your catch has been added to *${profile.title}.*`);

                            if(!failed){
                                interaction.update({
                                    embeds: [e],
                                    components: []
                                });
                            }

                            giveItem(profile, getItemByName(item.name), 1);
                        }
                    })
                }, getRandomByRange(3000, 6000));
            });
        } else if (interaction.commandName === 'gather') {
            let found = false;
            let seconds = 0;
            for (let i = 0; i < gatheredRecently.length; i++) {
                if (gatheredRecently[i][0] === interaction.user.id) {
                    found = true;
                    seconds = gatheredRecently[i][1];
                }
            }
            if (found) {
                await replyError(interaction, "Please wait " + seconds + " seconds before using this command again.");
                return;
            }

            const profiles = db.get(interaction.user.id + ".profiles");
            let profile = Array.isArray(profiles) ? profiles[0] : profiles;

            gatheredRecently.push([interaction.user.id, config.minigames.timeBetweenMinigames]);
            let interval = setInterval(function () {
                for (let i = 0; i < gatheredRecently.length; i++) {
                    if (gatheredRecently[i][0] === interaction.user.id) {
                        gatheredRecently[i][1] -= 1;
                        break;
                    }
                }
            }, 1000)
            setTimeout(function () {
                clearInterval(interval);
                for (let i = 0; i < gatheredRecently.length; i++) {
                    if (gatheredRecently[i][0] === interaction.user.id) {
                        gatheredRecently.splice(i, 1);
                        break;
                    }
                }
            }, config.minigames.timeBetweenMinigames * 1000);

            interaction.reply({embeds: [new Discord.MessageEmbed().setColor(config.colors.defaultColor).setDescription("You head out to explore...")]});

            const row = new Discord.MessageActionRow().addComponents(
                new Discord.MessageButton().setCustomId('gather' + interaction.user.id).setEmoji('🧤').setStyle("SECONDARY")
            );

            const embed = new Discord.MessageEmbed()
                .setTitle("<:m_gathering:888222560804831242> Basket in tow, you chart into the woods..")
                .setColor(config.colors.defaultColor)
                .setDescription("The forest is a place where the bounty is plenty. What will we be able to gather today?");

            interaction.channel.send({embeds: [embed], components: [row]})

            let interacted = false;

            client.on('interactionCreate', (interaction) => {
                if (interacted) return;
                if (!interaction.isButton()) return;

                if (interaction.customId === 'gather' + interaction.user.id) {
                    interacted = true;

                    let side = getRandomIntInclusive(1, 6)
                    const level = getRandomByProbability(1, 3);
                    const item = getItemFromLevel(level, "gathering");

                    if (getItemByName(item.name) === null) {
                        replyError(interaction, "There has been an error finding an item.");
                        return;
                    }

                    const m = item["reward-text"] === "" ? levelRewardText(level) : item["reward-text"];
                    const em = item.emoji === "" ? "❌" : item.emoji;

                    const e = new Discord.MessageEmbed()
                        .setTitle(`You're out there for almost ${side}0 minutes..`)
                        .setColor(config.colors.successColor)
                        .setDescription(`${m} Within a bush, betwixt some roots, high in the trees or nestled in the tall grass, you find one **${capitalize(item.name)} ${em}**! A nice reward for a hard day's work. Your forage has been added to *${profile.title}.*`);

                    interaction.reply({
                        embeds: [e],
                        components: []
                    });

                    giveItem(profile, getItemByName(item.name), 1);
                }
            })
        }
    })
}

const levelRewardText = (level) => {
    if (level === 1) return minigamesConfig.level1;
    else if (level === 2) return minigamesConfig.level2;
    else if (level === 3) return minigamesConfig.level3;
    return "";
}

function getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

global.getRandomIntInclusive = (min, max) => {
    min = Math.min(min, max);
    max = Math.max(max, min);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomByRange(min, max) {
    return Math.random() * (max - min) + min;
}

function getRandomByProbability(min, max) {
    const arr = [];
    for (let i = max; i >= min; i--) arr.push(i);
    return triangularWeightedRandomSelect(arr);
}

function triangularWeightedRandomSelect(arr) {
    let ii = Math.floor(Math.random() * (arr.length + 1) * arr.length / 2);
    let ie = 0;
    while ((ie + 2) * ((ie + 1) / 2) < ii) {
        ie++;
    }
    return arr[arr.length - 1 - ie];
}

const minigamesConfig = require("../../configs/minigames.json");

function getItemFromLevel(level, category) {
    if (level === 1) {
        if (category === "mining") {
            return getRandom(minigamesConfig.mining.level1.items);
        } else if (category === "fishing") {
            return getRandom(minigamesConfig.fishing.level1.items);
        } else if (category === "gathering") {
            return getRandom(minigamesConfig.gathering.level1.items);
        }
    } else if (level === 2) {
        if (category === "mining") {
            return getRandom(minigamesConfig.mining.level2.items);
        } else if (category === "fishing") {
            return getRandom(minigamesConfig.fishing.level2.items);
        } else if (category === "gathering") {
            return getRandom(minigamesConfig.gathering.level2.items);
        }
    } else if (level === 3) {
        if (category === "mining") {
            return getRandom(minigamesConfig.mining.level3.items);
        } else if (category === "fishing") {
            return getRandom(minigamesConfig.fishing.level3.items);
        } else if (category === "gathering") {
            return getRandom(minigamesConfig.gathering.level3.items);
        }
    }
    return null;
}