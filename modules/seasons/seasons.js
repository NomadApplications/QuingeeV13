const schedule = require("node-schedule");

module.exports = function(client){
    setupManager(client);
    setupCommands(client);
    handleCommands(client);
}

function setupCommands(client){
    const dayCommand = {
        name: 'day',
        description: 'See the current day of the season.',
    }

    client.commands.push(dayCommand);
}

function handleCommands(client){
    client.on('interactionCreate', async (interaction) => {
        if(!interaction.isCommand()) return;

        if(interaction.commandName === 'day'){
            if(db.get('seasons') === null){
                initSeasons();
            }
            let currentDay = db.get('seasons.currentDay');
            let currentSeason = db.get('seasons.currentSeason');

            interaction.reply({
               embeds: [
                   new Discord.MessageEmbed().setColor(config.colors.defaultColor).setDescription(`It is currently day ${currentDay}/${config.calendar.seasonLength} of ${convertSeasonName(currentSeason)}!`)
               ]
            });
        }
    })
}

function setupManager(client){
    global.seasons = [
        'spring1',
        'spring2',
        'summer1',
        'summer2',
        'fall1',
        'fall2',
        'winter1',
        'winter2',
    ];

    init(client);
    if(db.get('seasons') === null) initSeasons();

    const s = schedule.scheduleJob({hour: 0, minute: 0}, function() {
        newDay();
    });
}

function init(){
    client.guilds.cache.get(config.ids.guildID).members.cache.forEach(member => {
        const user = member.user;
        if(db.get(user.id) === null){
            initUser(user);
        }
        db.set(user.id + '.daily', true);
        db.get(user.id + '.profiles').forEach(profile => {
            setClaimedNodes(profile, false);
        })
    })
}

function initSeasons(){
    db.set('seasons', {currentDay: 1, currentSeason: seasons[0]});
}

global.newDay = () => {
    if(db.get('seasons') === null) initSeasons();

    init();

    db.add('seasons.currentDay', 1);
    const announcementChannel = client.guilds.cache.get(config.ids.guildID).channels.cache.get(config.ids.announcementChannelID);

    if(db.get('seasons.currentDay') >= config.calendar.seasonLength){
        db.set('seasons.currentDay', 1);

        switch(db.get('seasons.currentSeason')){
            case 'spring1':
                setSeason('spring2');
                initPages();
                announcementChannel.send("http://galesend.twohoot.net/calendar/months2.png");
                break;
            case 'spring2':
                setSeason('summer1');
                initPages();
                announcementChannel.send("http://galesend.twohoot.net/calendar/months3.png");
                break;
            case 'summer1':
                setSeason('summer2');
                initPages();
                announcementChannel.send("http://galesend.twohoot.net/calendar/months4.png");
                break;
            case 'summer2':
                setSeason('fall1');
                initPages();
                announcementChannel.send("http://galesend.twohoot.net/calendar/months5.png");
                break;
            case 'fall1':
                setSeason('fall2');
                initPages();
                announcementChannel.send("http://galesend.twohoot.net/calendar/months6.png");
                break;
            case 'fall2':
                setSeason('winter1');
                initPages();
                announcementChannel.send("http://galesend.twohoot.net/calendar/months7.png");
                break;
            case 'winter1':
                setSeason('winter2');
                initPages();
                announcementChannel.send("http://galesend.twohoot.net/calendar/months8.png");
                break;
            case 'winter2':
                setSeason('spring1');
                initPages();
                announcementChannel.send("http://galesend.twohoot.net/calendar/months1.png");
                break;
        }
    }
    for(let i = 0; i < config.calendar.seasonEvents.length; i++){
        const event = config.calendar.seasonEvents[i];

        const eventSeason = event.eventSeason;
        const eventDay = event.eventDay;

        const season = seasons.find(s => s.toLowerCase() === eventSeason.toLowerCase());
        if(season === null) continue;
        if(db.get('seasons.currentSeason') !== season) continue;
        if(db.get('seasons.currentDay') !== parseInt(eventDay)) continue;

        const announcementChannel = client.guilds.cache.get(config.ids.guildID).channels.cache.get(config.ids.announcementChannelID);
        announcementChannel.send(event.announcementMessage);
    }

    let am = config.calendar.dailyAnnouncement.message;
    am = am.replace("{season}", convertSeasonName(db.get("seasons.currentSeason")));
    am = am.replace("{weather}", getRandomWeather());
    am = am.replace("{day}", db.get("seasons.currentDay"));
    am = am.replace("{totalDays}", config.calendar.seasonLength);
    announcementChannel.send(am);
}

const convertSeasonName = (season) => {
    switch(season){
        case 'spring1':
            return 'Attith'
        case 'spring2':
            return 'Prian'
        case 'summer1':
            return 'Osidos'
        case 'summer2':
            return 'Heliun'
        case 'fall1':
            return 'Euror'
        case 'fall2':
            return 'Selen'
        case 'winter1':
            return 'Crion'
        case 'winter2':
            return 'Metise'
    }
}

global.setSeason = (newSeason) => {
    const season = seasons.find(s => s.toLowerCase() === newSeason.toLowerCase());
    if(season === undefined || season === null) return;
    db.set('seasons.currentSeason', season);
}

const getRandomWeather = () => {
    const season = db.get("seasons.currentSeason");
    if(season === seasons[0]){
        return getRandomFromArr(["A light rain drizzles down on our sleepy little township today,  casting the area in a fine mist. It isn’t enough to impede any day to day activities. Enjoy the refreshing weather while it lasts!",
            "The morning will be cool and damp today as thick fog rolls in over the valley, and visibility will be low until it burns off at noon when the sun finally comes out; take care of your steps in the woods!",
            "A gentle spring breeze will keep a warm and beautifully clear day easy to be outside in; it’s a good day to pull out a broom, as petals have been floating and scattering everywhere with no end in sight.",
            "Though dewey in the morning, by afternoon the day will be clear and beautiful. The visibility of the mountain is especially high today, and the air up in the peaks feels even cleaner than usual.",
            "It’s sunny and refreshingly windy today, but the pollen count is up along with it; regardless of your allergies, it might be a good day to wash down your patio before it turns yellow. ",
            "It’ll be damp with some on-and-off drizzling today, but the pollen count is up with it, saturating the air instead of getting washed away. It’s slippery, so take care to watch your step! ",
            "The morning will be warm and clear with some scattered showers in the afternoon; the animals seem to love this weather, and the woods are likely to be especially active with life today.",
            "**WARNING:** Heavy rain throughout the day puts the lower residents of the valley in a flash flood warning until late tonight; town hall has sandbags to pick up to protect your home, but take care not to go out in floodwaters.",
            "Heavy rain overnight has led to a slightly flooded and overcast morning; though the flooding should dissipate by evening, check for any flooding in your home and be wary of deep mud in the trails today.",
            "A warm and sunny day has presented some enormous cloud formations stretching across the sky that will continue and change well into the evening. Find your way underneath one to keep cool! ",
            //".",
            "It’ll be sunny in the valley today, with perfect blue skies and the water crisp and clear; still a little cold to swim, unless you’re particularly brave, but with excellent visibility for fishing."]);
    } else if (season === seasons[1]){
        return getRandomFromArr(["Rainy 🌧", "Sunny ☀", "Clear ⛱", "Cloudy ☁"]);
    } else if (season === seasons[2]){
        return getRandomFromArr(["Rainy 🌧", "Sunny ☀", "Clear ⛱", "Cloudy ☁"]);
    } else if (season === seasons[3]){
        return getRandomFromArr(["Rainy 🌧", "Sunny ☀", "Clear ⛱", "Cloudy ☁"]);
    } else if (season === seasons[4]){
        return getRandomFromArr(["Rainy 🌧", "Clear ⛱", "Cloudy ☁"]);
    } else if (season === seasons[5]){
        return getRandomFromArr(["Rainy 🌧", "Sunny ☀", "Clear ⛱", "Cloudy ☁"]);
    } else if (season === seasons[6]){
        return getRandomFromArr(["Rainy 🌧", "Snowing 🌨", "Cloudy ☁"]);
    } else if (season === seasons[7]){
        return getRandomFromArr(["Rainy 🌧", "Sunny ☀", "Clear ⛱", "Cloudy ☁"]);
    }
}

const getRandomFromArr = (arr) => {
    return arr[Math.floor(Math.random() * arr.length)];
}