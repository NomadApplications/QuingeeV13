const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');

global.backId = 'back';
global.forwardId = 'forward';
global.backButton = new MessageButton({
    style: 'SECONDARY',
    label: 'Back',
    emoji: '⬅️',
    customId: backId
});
global.forwardButton = new MessageButton({
    style: 'SECONDARY',
    label: 'Forward',
    emoji: '➡️',
    customId: forwardId
});