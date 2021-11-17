global.houses = config.homesteads.houses;

module.exports = function(client){
    setupCommands(client);
    handleCommands(client);
}

function setupCommands(client) {
    const homeCommand = {
        name: 'home',
        description: 'All home commands.',
        options: [
            {
                name: 'profile',
                description: 'Name of profile [not case sensitive].',
                required: true,
                type: 3,
            }
        ]
    };

    const setnodeCommand = {
        name: 'setnode',
        description: 'Set a node to one of your profiles.',
        options: [
            {
                name: 'profile',
                description: 'Name of profile [not case sensitive].',
                required: true,
                type: 3,
            },
            {
                name: 'item',
                description: 'Name of item [not case sensitive].',
                required: true,
                type: 3
            }
        ]
    }

    const removenodeCommand = {
        name: 'removenode',
        description: 'Remove a node from one of your profiles.',
        options: [
            {
                name: 'profile',
                description: 'Name of profile [not case sensitive].',
                required: true,
                type: 3,
            },
            {
                name: 'item',
                description: 'Name of item [not case sensitive].',
                required: true,
                type: 3
            }
        ]
    }

    const upgradeCommand = {
        name: 'upgrade',
        description: 'Buy / Upgrade a house!',
        options: [
            {
                name: "profile",
                description: "Which profile you would like to upgrade.",
                required: true,
                type: 3
            }
        ]
    };

    const claimnodesCommand = {
        name: 'claimnodes',
        description: 'Claim all nodes from a specific profile',
        options: [
            {
                name: 'profile',
                description: 'Which profile you would like to cliam from.',
                required: true,
                type: 3
            }
        ]
    }

    client.commands.push(homeCommand);
    client.commands.push(setnodeCommand);
    client.commands.push(removenodeCommand);
    client.commands.push(upgradeCommand);
    client.commands.push(claimnodesCommand);
}

function handleCommands(client) {
    client.on('interactionCreate', async (interaction) => {
        if(!interaction.isCommand()) return;

        const user = interaction.member.user;

        if(interaction.commandName === 'home'){
            const profile = getProfileByString(interaction.options.getString('profile'), user);
            if (profile === null) {
                await replyError(interaction, "Please specify a valid profile name. If you would like to see your current profiles, type ``/profile list``.");
                return;
            }

            const embed = new Discord.MessageEmbed()
                .setTitle(`${profile.title.toUpperCase()} ACCESSED`)
                .setDescription(`**House Type**: *${profile.houseType.name}*`)
                .setColor(config.colors.successColor);

            const nodes = [];

            for (let i = 0; i < profile.nodeSlots.length; i++) {
                const slot = profile.nodeSlots[i];
                if (slot === null) {
                    nodes.push("OPEN");
                    continue;
                }
                nodes.push(slot.name);
            }

            let nodeString = "";
            for (let i = 0; i < nodes.length; i++) {
                const nodeTitle = nodes[i] === "OPEN" ? "OPEN" : capitalize(nodes[i]);
                nodeString += "**" + (i + 1) + "**: " + nodeTitle + "\n";
            }

            embed.addField("Node Slots:", nodeString, false);

            let furnitureString = "";
            const f = profile.inventory.filter(i => i.category === "furniture");
            if (f.length <= 0) embed.addField("Furniture:", "You do not have any furniture.", false);
            else {
                let itemNames = [];
                f.forEach(i => itemNames.push(i.name));

                let looped = [];
                for (let i = 0; i < f.length; i++) {
                    if (looped.includes(f[i].name)) continue;
                    looped.push(f[i].name);

                    const count = findCounts(itemNames)[f[i].name];
                    furnitureString += "x" + count + " " + capitalize(f[i].name) + "\n";
                }
                embed.addField("Furniture:", furnitureString, false);
            }
            await reply(interaction, embed);
        } else if (interaction.commandName === 'setnode'){
            const profile = getProfileByString(interaction.options.getString('profile'), user);
            if (profile === null) {
                await replyError(interaction, "Please specify a valid profile name. If you would like to see your current profiles, type ``/profile list``.");
                return;
            }

            const items = profile.inventory.filter(i => i.name === interaction.options.getString('item'));
            if (items.length <= 0) {
                await replyError(interaction, "Please enter an item that you have in your inventory. If you would like to see your current inventory, type ``/inventory [profile]``.");
                return;
            }

            let item = Array.isArray(items) ? items[0] : items;

            const nodeItem = getNodeItem(item.name);
            if(nodeItem === null){
                await replyError(interaction, "You must supply a node item.");
                return;
            }

            let slot = -1;

            for (let i = 0; i < profile.nodeSlots.length; i++) {
                if (profile.nodeSlots[i] === null) {
                    slot = i;
                    break;
                }
            }

            if(slot === -1){
                await replyError(interaction, "You must remove a node or upgrade your house before adding any more.");
                return;
            }

            const added = setNode(profile, item, slot);
            if (!added) {
                await replyError(interaction, "There was an error adding this node.");
                return;
            }
            await replySuccess(interaction, "You have successfully added " + capitalize(item.name) + " to your node slots in " + profile.title + ". Type ``/home [profile]`` to see your current nodes.");
        } else if (interaction.commandName === 'removenode'){
            const profile = getProfileByString(interaction.options.getString('profile'), user);
            if (profile === null) {
                await replyError(interaction, "Please specify a valid profile name. If you would like to see your current profiles, type ``/profile list``.");
                return;
            }

            let item = null;
            for(let i = 0; i < profile.nodeSlots.length; i++){
                if(profile.nodeSlots[i] === null) continue;
                if(profile.nodeSlots[i].name === interaction.options.getString('item')){
                    item = profile.nodeSlots[i];
                    break;
                }
            }
            if (item === null) {
                await replyError(interaction, "Please enter an item that is currently in a slot. If you would like to see your current node slots, type ``/home [profile]``.");
                return;
            }

            const removed = removeNode(profile, item);
            if (!removed) {
                await replyError(interaction, "There was an error removing this node.");
                return;
            }

            await replySuccess(interaction, "You have successfully removed " + capitalize(item.name) + " from your node slots in " + profile.title + ". Type ``/home [profile]`` to see your current nodes.");
        } else if (interaction.commandName === 'upgrade'){
            const profile = getProfileByString(interaction.options.getString('profile'), user);
            if (profile === null) {
                await replyError(interaction, "Please specify a valid profile name. If you would like to see your current profiles, type ``/profile list``.");
                return;
            }
            let houseType = profile.houseType;
            let previous =  profile.houseType;
            const index = houses.findIndex(x => x.name === houseType.name);
            if(index === -1){
                await replyError(interaction, "There was an error upgrading, please contact an administrator.");
                return;
            }
            if(index=== houses.length - 1){
                await replyError(interaction, "You already have the best house.");
                return;
            }
            houseType = houses[index + 1];

            if(profile.currencyAmount < houseType.price){
                await replyError(interaction, "You do not have enough " + config.economy.name + " to upgrade your house! You need " + houseType.price + " and you currently have " + profile.currencyAmount);
                return;
            }

            const embed = new Discord.MessageEmbed()
                .setTitle("🏠 House Upgrade!")
                .setDescription(`*${profile.houseType.name}* -> **${houseType.name}** (**${config.economy.moneyPrefix} ${houseType.price}**). If you would like to confirm, react with ✅.`)
                .setColor(config.colors.defaultColor);

            const row = new Discord.MessageActionRow()
                .addComponents(
                    new Discord.MessageButton()
                        .setCustomId('confirm')
                        .setLabel('Confirm')
                        .setStyle('SUCCESS')
                        .setEmoji('✅'),
                );


            interaction.reply({embeds: [embed], components: [row]})

            client.on('interactionCreate', async (interaction) => {
                if(!interaction.isButton()) return;

                if(interaction.customId === 'confirm'){
                    removeCurrency(profile, houseType.price);
                    const p = profile;
                    p.houseType = houseType;

                    let previousNodes = profile.nodeSlots;
                    let newNodes = [];
                    for(let i = 0; i < previousNodes.length; i++){
                        if(previousNodes[i] === null) continue;
                        newNodes.push(previousNodes[i]);
                    }
                    for(let i = 0; i < houseType.nodeAmount; i++){
                        if(!newNodes[i]) newNodes.push(null);
                    }
                    p.nodeSlots = newNodes;
                    updateProfile(p);

                    const s = new Discord.MessageEmbed()
                        .setTitle("SUCCESS")
                        .setColor(config.colors.successColor)
                        .setDescription("You have upgraded from *" + previous.name + "* to **" + houseType.name + "**!");

                    interaction.component.setDisabled(true);

                    //interaction.reply({embeds: [s]});
                    interaction.update({
                        embeds: [s],
                        components: []
                    });
                    return;
                }
            })
        } else if (interaction.commandName === 'claimnodes'){
            const profile = getProfileByString(interaction.options.getString('profile'), user);
            if (profile === null) {
                await replyError(interaction, "Please specify a valid profile name. If you would like to see your current profiles, type ``/profile list``.");
                return;
            }

            if(profile.nodeSlots.length <= 0 || profile.nodeSlots.find(x => x != null) === undefined){
                await replyError(interaction, "You dont have any node slots available.");
                return;
            }

            if(profile.claimedNodes){
                let midnight = new Date();
                midnight.setHours(24, 0, 0, 0);

                let time = (midnight.getTime() - new Date().getTime()) / 1000 / 60;
                time = Math.floor(time);
                const print = convert(time);

                await replyError(interaction, "You already claimed your nodes for this profile! Please wait Please wait until tomorrow to redeem again. " + print + " remaining.");
                return;
            }

            setClaimedNodes(profile, true);

            let added = [];

            for(let i = 0; i < profile.nodeSlots.length; i++){
                const n = profile.nodeSlots[i];
                if(n === null) continue;
                const nodeItem = getNodeItem(n.name);
                if(nodeItem === null) continue;

                const c = getItemByName(nodeItem.item);
                if(c === null) continue;

                let z = [];
                const a = getRandomIntInclusive(nodeItem.amountMin, nodeItem.amountMax);
                for(let i = 0; i < a; i++){
                    addItemToProfile(profile, c);
                    z.push(c.name);
                }
                added.push([n.name, z]);
            }

            if(added.length === 0){
                await replyError(interaction, "There was an error.");
                setClaimedNodes(profile, false);
                return;
            }

            const embed = new Discord.MessageEmbed()
                .setTitle("<:c_node:888103894343888896> Claimed Nodes")
                .setColor(config.colors.currencyColor)
                .setDescription("You collect the following items from your nodes:");

            for(let i = 0; i < added.length; i++){
                embed.addField(capitalize(added[i][0]), "x" + added[i][1].length + " " + added[i][1][0]);
            }

            await reply(interaction, embed);
        }
    })
}

const node_config = require("../../configs/nodes.json");

function getNodeItem(name){
    for(let i = 0; i < node_config.nodes.length; i++){
        if(node_config.nodes[i].name === name){
            return node_config.nodes[i];
        }
    }
    return null;
}

global.findCounts = arr => arr.reduce((prev, curr) => (prev[curr] = ++prev[curr] || 1, prev), {});
global.getRandomIntInclusive = (min, max) => {
    min = Math.min(min, max);
    max = Math.max(max, min);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}