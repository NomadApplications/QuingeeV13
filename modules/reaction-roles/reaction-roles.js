const rr = [];

module.exports = function(){
    const guild = client.guilds.cache.get(config.ids.guildID);
    const channel = guild.channels.cache.get(config.roles.reactionRoleChannel);

    channel.bulkDelete(99);

    const reactionRoles = config.roles.reactionRoles;

    if(reactionRoles.length <= 0) return;
    reactionRoles.forEach(r => {
        if(r.options.length > 0){
            const embed = new Discord.MessageEmbed()
                .setTitle(r.name)
                .setColor(config.colors.defaultColor)
                .setDescription(r.description);

            const row = new Discord.MessageActionRow();

            for(let i = 0; i < r.options.length; i++){
                row.addComponents(new Discord.MessageButton().setCustomId(r.options[i].description).setEmoji(r.options[i].emoji).setStyle("SECONDARY"));
                embed.addField(r.options[i].emoji, "- - - -  *"+ r.options[i].description + "*", false);
            }



            channel.send({embeds: [embed], components: [row]}).then(embedMessage => {
                rr.push({
                    message: embedMessage,
                    options: r.options,
                    channel: channel
                });
            });
        }
    })

    client.on('interactionCreate', async (interaction) => {
        if(!interaction.isButton()) return;

        const guild = client.guilds.cache.get(config.ids.guildID);
        const channel = guild.channels.cache.get(config.roles.reactionRoleChannel);

        if(channel.id === interaction.channel.id){
            if(interaction.user.id === client.user.id) return;

            if(rr.length <= 0) return;
            const reactionRole = rr.find(r => r.message.id === interaction.message.id);
            if(reactionRole === null || reactionRole === undefined) return;

            const id = interaction.customId;
            const option = reactionRole.options.find(o => o.description === id);
            if(option === null) return;

            const role = interaction.guild.roles.cache.find(ro => ro.id === option.id);
            if(role === null || role === undefined) return;

            if(interaction.member.roles.cache.has(role.id)){
                await interaction.member.roles.remove(role);
                await interaction.member.send({
                    embeds: [
                        new Discord.MessageEmbed().setColor(config.colors.successColor).setDescription("Successfully added " + role.name)
                    ]
                });
                interaction.update({});
            } else {
                await interaction.member.roles.add(role)
                await interaction.member.send({
                    embeds: [
                        new Discord.MessageEmbed().setColor(config.colors.errorColor).setDescription("Successfully removed " + role.name)
                    ]
                });
                interaction.update({});
            }
        }
    });
}