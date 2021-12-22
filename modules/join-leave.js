<<<<<<< Updated upstream
module.exports.startEvent = function (client) {
=======
module.exports = function (client) {
>>>>>>> Stashed changes
    client.on("guildMemberAdd", async member => {

        initUser(member.user);
        await sendWelcome(member);

        if (config.roles.join.enabled.enabled) {
            const joinRole = member.guild.roles.cache.get(config.roles.join.id);
            await member.roles.add(joinRole);
        }
    });

    client.on("guildMemberRemove", async member => {
        await sendLeave(member);
    });
}

const sendWelcome = async (member) => {

    const channel = member.guild.channels.cache.get(config.ids.welcomeID);

    const rules = member.guild.channels.cache.get(config.ids.rulesChannelID);
    const embed = new Discord.MessageEmbed()
        .setTitle("<:i_flower:885526297747521606> Welcome on in!")
        .setColor(config.colors.defaultColor)
        .setDescription("Thank you for joining us here at Gale's End " + getMentionFromID(member.id) + "! If this is your first time here, feel free to check out our guidebook (" + `${rules}` + ") to get started. Or, even better, you can also just head on over to our website: " + config.websiteURL + "! We hope you have a fantastic day.");
    channel.send({embeds: [embed]})
}

const sendLeave = async (member) => {

    const channel = member.guild.channels.cache.get(config.ids.welcomeID);

    const embed = new Discord.MessageEmbed()
        .setTitle("<:i_waterlily:885600363078647828> Until next time!")
        .setColor(config.colors.defaultColor)
        .setDescription("Thanks for visiting " + getMentionFromID(member.id) + ", we hope you enjoyed your stay!");

    channel.send({embeds: [embed]})
}

global.getMentionFromID = function (id) {
    return `<@${id}>`;
}
