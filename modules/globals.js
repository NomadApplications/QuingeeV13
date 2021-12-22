global.getProfileByString = function (title, user) {
    const profiles = db.get(user.id + ".profiles");
    let profile = null;

    if(Array.isArray(profiles)){
        let titles = profiles.map(p => p.title.toLowerCase());
        const profileIndex = titles.indexOf(title.toLowerCase());
        if(profileIndex < 0) return null;
        profile = profiles[profileIndex];
    } else {
        profile = profiles;
        if(profile === null) return null;
        if(profile.title.toLowerCase() !== title.toLowerCase()) return null;
    }

    return profile;
}

global.replyError = (interaction, message) => {
    const embed = new Discord.MessageEmbed().setColor(config.colors.errorColor).setDescription(message);
    embed.setFooter("Quingee Bot", interaction.user.displayAvatarURL());
    interaction.reply({embeds: [embed]});
}

global.replySuccess = (interaction, message) => {
    const embed = new Discord.MessageEmbed().setColor(config.colors.successColor).setDescription(message);
    embed.setFooter("Quingee Bot", interaction.user.displayAvatarURL());
    interaction.reply({embeds: [embed]});
}

global.reply = (interaction, embed) => {
    embed.setFooter("Quingee Bot", interaction.user.displayAvatarURL());
    interaction.reply({embeds: [embed]});
}

global.capitalize = function(string = "") {
    const lower = string.toLowerCase();
    const sentence = lower.split(" ");

    let final = "";

    for(let i = 0; i < sentence.length; i++){
        const first = sentence[i].charAt(0);
        const upper = first.toUpperCase();
        const sliced = sentence[i].slice(1);

        if(i === sentence.length -1){
            final += upper + sliced;
        } else {
            final += upper + sliced + " ";
        }
    }

    return final;
}