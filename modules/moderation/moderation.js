module.exports = function (client) {
    client.on("messageCreate", message => {
        const args = message.content.split(" ").map(arg => arg.toLowerCase());
        const command = args[0];
        args.shift();

        const prefix = config.moderationPrefix;

        if (command === prefix + "ban") {
            if(!message.member.permissionsIn(message.channel).has("BAN_MEMBERS")) return;

            if (!args[0]) return rError(message, "You must specify a user.");

            let banMember = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.guild.members.cache.find(r => r.user.username.toLowerCase() === args[0].toLocaleLowerCase()) || message.guild.members.cache.find(ro => ro.displayName.toLowerCase() === args[0].toLocaleLowerCase());
            if (!banMember) return rError(message, "User is not in the guild.");
            if (banMember === message.member) return rError(message, "You cannot ban yourself.");

            let reason = args.slice(1).join(" ");
            if (!banMember.bannable) return rError(message, "You cannot kick that user.");
            try {
                message.guild.members.ban(banMember);
                banMember.send(`**Hello, you have been banned from ${message.guild.name} for - ${reason || "No Reason"}**`).catch(() => null);
            } catch {
                message.guild.members.ban(banMember);
            }
            if (reason) {
                const sembed = new Discord.MessageEmbed()
                    .setColor(config.colors.successColor)
                    .setDescription(`**${banMember.user.username}** has been banned for ${reason}.`);
                message.channel.send(sembed);
            } else {
                const sembed2 = new Discord.MessageEmbed()
                    .setColor(config.colors.successColor)
                    .setDescription(`**${banMember.user.username}** has been banned.`);
                message.channel.send(sembed2);
            }
            let channel = message.guild.channels.cache.get(config.ids.modlogID);
            if (!channel) return;

            const embed = new Discord.MessageEmbed()
                .setAuthor(`${message.guild.name} Modlogs`, message.guild.iconURL())
                .setColor(config.colors.errorColor)
                .setThumbnail(banMember.user.displayAvatarURL({dynamic: true}))
                .setFooter(message.guild.name, message.guild.iconURL())
                .addField("**Moderation**", "ban")
                .addField("**Banned**", banMember.user.username)
                .addField("**ID**", banMember.id)
                .addField("**Banned By**", message.author.username)
                .addField("**Reason**", `${reason || "**No Reason**"}`)
                .addField("**Date**", message.createdAt.toLocaleString())
                .setTimestamp();

            channel.send(embed);
        } else if (command === prefix + "unban") {
            if(!message.member.permissionsIn(message.channel).has("BAN_MEMBERS")) return;

            if (!args[0]) return rError(message, "Please enter a name!");

            let bannedMemberInfo = message.guild.fetchBans();

            let bannedMember;
            bannedMember = bannedMemberInfo.find(b => b.user.username.toLowerCase() === args[0].toLocaleLowerCase()) || bannedMemberInfo.get(args[0]) || bannedMemberInfo.find(bm => bm.user.tag.toLowerCase() === args[0].toLocaleLowerCase());
            if (!bannedMember) return rError(message, "Please provide a valid username, tag, or ID or the user is not banned.");

            let reason = args.slice(1).join(" ");

            try {
                if (reason) {
                    message.guild.members.unban(bannedMember.user.id, reason);
                    const sembed = new Discord.MessageEmbed()
                        .setColor(config.colors.successColor)
                        .setDescription(`**${bannedMember.user.tag} has been unbanned for **${reason}**.`);
                    message.channel.send(sembed);
                } else {
                    message.guild.members.unban(bannedMember.user.id, reason);
                    const sembed = new Discord.MessageEmbed()
                        .setColor(config.colors.successColor)
                        .setDescription(`**${bannedMember.user.tag} has been unbanned.`);
                    message.channel.send(sembed);
                }
            } catch {
            }

            let channel = message.guild.channels.cache.get(config.ids.modlogID);
            if (!channel) return;

            let embed = new Discord.MessageEmbed()
                .setColor(config.colors.successColor)
                .setThumbnail(bannedMember.user.displayAvatarURL({dynamic: true}))
                .setAuthor(`${message.guild.name} Modlogs`, message.guild.iconURL())
                .addField("**Moderation**", "unban")
                .addField("**Unbanned**", `${bannedMember.user.username}`)
                .addField("**ID**", `${bannedMember.user.id}`)
                .addField("**Moderator**", message.author.username)
                .addField("**Reason**", `${reason}` || "**No Reason**")
                .addField("**Date**", message.createdAt.toLocaleString())
                .setFooter(message.guild.name, message.guild.iconURL())
                .setTimestamp();

            channel.send(embed);
        } else if (command === prefix + "purge") {
            if(!message.member.permissionsIn(message.channel).has("MANAGE_MESSAGES")) return;
            if (isNaN(args[0]))
                return rError(message, '**Please supply a valid amount to delete messages!**');

            if (args[0] > 100)
                return rError(message, "**Please supply a number less than 100!**");

            if (args[0] < 1)
                return rError(message, "**Please supply a number more than 1!**");

            message.channel.bulkDelete(parseInt(args[0]) + 1).then(messages => {
                const embed = new Discord.MessageEmbed()
                    .setColor(config.colors.successColor)
                    .setDescription(`**Succesfully deleted \`${messages.size - 1}/${args[0]}\` messages**`);

                message.channel.send(embed).then(msg => msg.delete({timeout: 5000}))
            }).catch(() => null)
        } else if (command === prefix + "whois" || command === prefix + "m") {
            let permissions = [];
            let acknowledgements = 'None';

            if(!message.member.permissionsIn(message.channel).has("MANAGE_MESSAGES")) return;

            const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;

            if (member.hasPermission("KICK_MEMBERS")) {
                permissions.push("Kick Members");
            }

            if (member.hasPermission("BAN_MEMBERS")) {
                permissions.push("Ban Members");
            }

            if (member.hasPermission("ADMINISTRATOR")) {
                permissions.push("Administrator");
            }

            if (member.hasPermission("MANAGE_MESSAGES")) {
                permissions.push("Manage Messages");
            }

            if (member.hasPermission("MANAGE_CHANNELS")) {
                permissions.push("Manage Channels");
            }

            if (member.hasPermission("MENTION_EVERYONE")) {
                permissions.push("Mention Everyone");
            }

            if (member.hasPermission("MANAGE_NICKNAMES")) {
                permissions.push("Manage Nicknames");
            }

            if (member.hasPermission("MANAGE_ROLES")) {
                permissions.push("Manage Roles");
            }

            if (member.hasPermission("MANAGE_WEBHOOKS")) {
                permissions.push("Manage Webhooks");
            }

            if (member.hasPermission("MANAGE_EMOJIS")) {
                permissions.push("Manage Emojis");
            }

            if (permissions.length == 0) {
                permissions.push("No Key Permissions Found");
            }

            if (member.user.id == message.guild.ownerID) {
                acknowledgements = 'Server Owner';
            }

            const embed = new Discord.MessageEmbed()
                .setDescription(`<@${member.user.id}>`)
                .setAuthor(`${member.user.tag}`, member.user.displayAvatarURL())
                .setColor(config.colors.defaultColor)
                .setFooter(`ID: ${message.author.id}`)
                .setThumbnail(member.user.displayAvatarURL())
                .setTimestamp()
                .addField("__Status__", `${status[member.user.presence.status]}`, true)
                .addField('__Joined at:__ ', `${moment(member.joinedAt).format("dddd, MMMM Do YYYY, HH:mm:ss")}`, true)
                .addField('__Created On__', member.user.createdAt.toLocaleString(), true)
                .addField(`\n__Roles [${member.roles.cache.filter(r => r.id !== message.guild.id).map(roles => `\`${roles.name}\``).length}]__`, `${member.roles.cache.filter(r => r.id !== message.guild.id).map(roles => `<@&${roles.id}>`).join(" **|** ") || "No Roles"}`, true)
                .addField("\n__Acknowledgements:__ ", `${acknowledgements}`, true)
                .addField("\n__Permissions:__ ", `${permissions.join(` | `)}`);

            message.channel.send({embeds: [embed]});
        } else if (command === prefix + "lock") {
            if(!message.member.permissionsIn(message.channel).has("ADMINISTRATOR")) return;

            let channel = message.channel;

            try {
                message.guild.roles.cache.forEach(role => {
                    channel.createOverwrite(role, {
                        SEND_MESSAGES: false,
                        ADD_REACTIONS: false
                    });
                });
            } catch (e) {
                console.log(e);
            }

            const embed = new Discord.MessageEmbed()
                .setColor(config.colors.successColor)
                .setDescription("**Locked**!");

            message.channel.send(embed);
        } else if (command === prefix + "unlock"){
            if(!message.channel.permissionsFor(message.member).has("ADMINISTRATOR") ) return;

            let channel = message.channel;

            try {
                message.guild.roles.cache.forEach(role => {
                    channel.createOverwrite(role, {
                        SEND_MESSAGES: true,
                        ADD_REACTIONS: true
                    });
                });
            } catch (e) {
                console.log(e);
            }

            const embed = new Discord.MessageEmbed()
                .setColor(config.colors.successColor)
                .setDescription("**Unlocked**!");

            message.channel.send(embed);
        } else if (command === prefix + "warn"){
            if(!message.member.permissionsIn(message.channel).has("MANAGE_MESSAGES")) return;

            let member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
            if(!member) return rError(message, "Please mention a valid member of this server");

            let reason = args.slice(1).join(' ');
            if(!reason) reason = "(No Reason Provided)";

            member.send(`You have been warned by ${message.author} for : ${reason}`)
                .catch(error => rError(message, `Sorry ${message.author} I couldn't not warn because of : ${error}`));

            const channel = message.guild.channels.cache.get(config.ids.modlogID);

            const e = new Discord.MessageEmbed()
                .setAuthor(`${message.guild.name} Modlogs`, message.guild.iconURL())
                .setColor(config.colors.errorColor)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setFooter(message.guild.name, message.guild.iconURL())
                .addField("**Moderation**", "warn")
                .addField("**User Kicked**", member.user.username)
                .addField("**Kicked By**", message.author.username)
                .addField("**Reason**", `${reason || "**No Reason**"}`)
                .addField("**Date**", message.createdAt.toLocaleString())
                .setTimestamp();

            channel.send(e);
        } else if (command === prefix + "kick"){
            if(!message.member.permissionsIn(message.channel).has("KICK_MEMBERS")) return;

            if (!args[0]) return rError(message, '**Enter A User To Kick!**')

            let kickMember = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.guild.members.cache.find(r => r.user.username.toLowerCase() === args[0].toLocaleLowerCase()) || message.guild.members.cache.find(ro => ro.displayName.toLowerCase() === args[0].toLocaleLowerCase());
            if (!kickMember) return rError(message, "**User Is Not In The Guild!**");

            if (kickMember.id === message.member.id) return rError(message, "**You Cannot Kick Yourself!**")

            if (!kickMember.kickable) return rError(message, "**Cannot Kick This User!**")
            if (kickMember.user.bot) return rError(message, "**Cannot Kick A Bot!**")

            let reason = args.slice(1).join(" ");
            try {
                const sembed2 = new Discord.MessageEmbed()
                    .setColor("RED")
                    .setDescription(`**You Have Been Kicked From ${message.guild.name} for - ${reason || "No Reason!"}**`)
                    .setFooter(message.guild.name, message.guild.iconURL())
                kickMember.send(sembed2).then(() =>
                    kickMember.kick()).catch(() => null)
            } catch {
                kickMember.kick()
            }
            if (reason) {
                const sembed = new Discord.MessageEmbed()
                    .setColor(config.colors.successColor)
                    .setDescription(`**${kickMember.user.username}** has been kicked for ${reason}`)
                message.channel.send(sembed);
            } else {
                const sembed2 = new Discord.MessageEmbed()
                    .setColor(config.colors.successColor)
                    .setDescription(`**${kickMember.user.username}** has been kicked`)
                message.channel.send(sembed2);
            }
            let channel = message.guild.channels.cache.get(config.ids.modlogID)
            if (!channel) return;

            const embed = new Discord.MessageEmbed()
                .setAuthor(`${message.guild.name} Modlogs`, message.guild.iconURL())
                .setColor(config.colors.errorColor)
                .setThumbnail(kickMember.user.displayAvatarURL({ dynamic: true }))
                .setFooter(message.guild.name, message.guild.iconURL())
                .addField("**Moderation**", "kick")
                .addField("**User Kicked**", kickMember.user.username)
                .addField("**Kicked By**", message.author.username)
                .addField("**Reason**", `${reason || "**No Reason**"}`)
                .addField("**Date**", message.createdAt.toLocaleString())
                .setTimestamp();

            channel.send(embed)
        } else if (command === prefix + "give"){
            if(!message.member.permissionsIn(message.channel).has("ADMINISTRATOR")) return;
            if(args.length < 2) return rError(message, "``" + prefix + "give <user> <item> [amount]``");

            const mentionedUser = message.mentions.members.first();
            if(mentionedUser === null || mentionedUser === undefined) return rError(message, "Please specify a valid user.");

            const item = getItemByName(args[1].replace("_", " "));
            if(item === null) return rError(message, "Please specify a valid item.");

            const profile = getProfileByString("Bank", mentionedUser.user);
            if(profile === null) return rError(message, "There was an error fetching that user's profile.");

            let amount = 1;
            if(args[2]) {
                if(!isNaN(args[2])) amount = parseInt(args[2]);
            }
            giveItem(profile, item, amount);

            const embed = new Discord.MessageEmbed()
                .setColor(config.colors.successColor)
                .setDescription("You have successfully given " + mentionedUser.user.toString() + " x" + amount + " " + capitalize(item.name) + "!");

            message.channel.send({embeds: [embed]});
        }
    });
}

const status = {
    online: "Online",
    idle: "Idle",
    dnd: "Do Not Disturb",
    offline: "Offline/Invisible"
};

async function rError(message, msg) {
    const embed = new Discord.MessageEmbed()
        .setColor(config.colors.errorColor)
        .setDescription(msg);

    message.channel.send({embeds: [embed]});

    return true;
}
