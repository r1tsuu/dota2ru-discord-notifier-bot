const Discord = require('discord.js');
const consoleLog = require('./consoleLog');
const utils = require('./utils');
const User = require('./user');
const io = require('socket.io-client');

let getPrefix = () => (utils.getConfigParam('COMMAND_PREFIX'))

module.exports = function commandParser(message) {
    let prefix = getPrefix();
    if (!message.startsWith(prefix)) {
        return 'not command';
    }
    let messageSplit = message.toLowerCase().slice(prefix.length).split(' ');
    let command = commands.find( function(object) {
        return (this.toString() === object.name);
    }, messageSplit[0]);

    return (typeof command == 'object') ? {command: command, args: messageSplit.slice(1)} : 'unknown command';
}

/**
 * @param {Discord.Client} client
 * @param {Discord.Message} message
 */
let help = async (client, message) => {
    const helpMsg = commands.reduce((accumulator, command) => (
        getPrefix() + command.name + ' ' + command.description + '\n' + accumulator), '')
    await message.author.send(helpMsg);
}

/**
 * @param {Discord.Client} client
 * @param {Discord.Message} message
 */
let shutdown = async (client, message) => {
    consoleLog.print("");
    await message.author.send("Bye");
    client.destroy();
}

/**
 * @param {Discord.Client} client
 * @param {Discord.Message} message
 */
let start = async (client, message) => {
    let user = new User(message.author.id);
    let doesExist = await user.doesExist();
    if (!doesExist) {
        await user.createUser();
        await message.author.send(`Hello ${message.author.username}!\\n` +
            `Type ${getPrefix()}login to log in to dota2.ru\``);
        consoleLog.print(`User ${message.author.username} session has been started`)
        return 0;
    }
    await message.author.send(`You are already started, type ${getPrefix()}on for turn on receiving notifications`);
    return 0;
}

/**
 * @param {Discord.Client} client
 * @param {Discord.Message} message
 */
let login = async (client, message) => {
    let user = new User(message.author.id);
    let doesExist = await user.doesExist()
    if (!doesExist) {
        await message.author.send(`Type ${getPrefix()}start before this`);
        return 0;
    }
    await user.updateFromDb();
    if (user.authCookie) {
        await message.author.send("You are already logged")
        return 0;
    }

    await message.author.send("Enter your login:  ")
    const awaitMessagesTimeout = 60000;
    let login = (await message.channel.awaitMessages(() => true, {max: 1, time: awaitMessagesTimeout})).first().content;
    if (typeof login === 'undefined') {
        await message.author.send("Timeout exceeded, try again");
        return 0;
    }

    await message.author.send("Enter your password:  ")
    let password = (await message.channel.awaitMessages(() => true, {max: 1, time: awaitMessagesTimeout})).first().content;
    if (typeof password === 'undefined') {
        await message.author.send("Timeout exceeded, try again");
        return 0;
    }

    let authData = await utils.auth(login, password);

    let successFunction = (authCookie) => {
        user.setAuthCookie(authCookie);
        user.updateDb();
        message.author.send(`You have successfully authorized`);
        message.author.send(`Type ${getPrefix()}on for turn on receiving notifications from dota2.ru`);
        console.log(`User ${message.author.username} has successfully logged in`);
    }

    switch (authData.status) {
        case 'success':
            successFunction(authData.authCookie);
            return;
        case 'wrongCredentials':
            await message.author.send("Wrong login or password, you can try again \n " +
                "Note that if enter a login data incorrectly 5 times you will be banned");
            return;
        case 'throttle':
            await message.author.send("Addsky has banned your IP, try again after 24 hours (or just use vpn lol)");
            return;
        default:
            await message.author.send("You MUST not got it because this response status doesn't exist");
            return;
    }

}

/**
 * @param {Discord.Client} client
 * @param {Discord.Message} message
 */
let logout = async (client, message) => {
    let user = new User(message.author.id);
    let doesExist = await user.doesExist();
    if (!doesExist) {
        await message.author.send(`Type ${getPrefix()}start before this`);
        return;
    }
    await user.updateFromDb();
    if (user.getAuthCookie() == null) {
        await message.author.send("You are already not logged in")
    }
    user.setAuthCookie(null);
    await user.updateDb();
    await message.author.send("You have successfully logged out");
    console.log(`User ${message.author.username} has logged out`)
}
/**
 * @param {Discord.Client} client
 * @param {Discord.Message} message
 */
let on = async (client, message) => {
    let user = new User(message.author.id);
    let doesExist = user.doesExist();
    if (!doesExist) {
        await message.author.send(`Type ${getPrefix()}start before this`);
        return;
    }
    await user.updateFromDb();
    if (user.authCookie == null) {
        await message.author.send(`You have to log in before this, type ${getPrefix()}login`)
        return;
    }
    if (user.getNotifyEnabled()) {
        await message.author.send(`You already have enabled receiving notifications, type ${getPrefix()}off for turn off`)
        return;
    }

    // Connect to d2ru socket.io server
    const socket = io('https://dota2.ru', {
        reconnectionAttemps: 10,
        reconnectionDelay: 5e3,
        extraHeaders: {
            Cookie: user.authCookie
        }
    })

    socket.on('connect', async () => {
        consoleLog.print(`New socket.io connection by user: ${message.author.username}`)
        user.setNotifyEnable(true);
        await user.updateDb();
        await message.author.send("You have been connected to dota2.ru" +
            " socket.io server \n I'll notice you if you were got a notification")
    });

    socket.on('notification', async (response) => {
        await user.doesExist();
        if (!user.getNotifyEnabled()) {
            socket.disconnect();
        }
        console.log(response);
        await message.author.send(utils.getThisWithRemovedTags(response.description));
    })
}

/**
 * @param {Discord.Client} client
 * @param {Discord.Message} message
 */
let off = async (client, message) => {
    let user = new User(message.author.id);
    let doesExist = await user.doesExist();
    if (!doesExist) {
        await message.author.send(`Type ${getPrefix()}start before this`);
        return;
    }
    await user.updateFromDb();
    if (user.authCookie == null) {
        await message.author.send(`You have to log in before this, type ${getPrefix()}`);
        return;
    }
    if (!user.getNotifyEnabled()) {
        await message.author.send(`You already have disabled receiving notifications,
                                type ${getPrefix()}on for turn on`);
        return;
    }
    user.setNotifyEnable(false);
    await user.updateDb();
    await message.author.send("Receiving notifications has been disabled");
    consoleLog.print(`User ${message.author.username} has disabled receiving notifications`)
}

const commands = [
    {
        name: "shutdown",
        action: shutdown,
        ownerOnly: true,
        description: "Shutdowns bot application, owner only"
    },
    {
        name: 'start',
        action: start,
        ownerOnly: false,
        description: "Starts user session"
    },
    {
        name: 'login',
        action: login,
        ownerOnly: false,
        description: "Log in to dota2.ru"
    },
    {
        name: 'logout',
        action: logout,
        ownerOnly: false,
        description: "Log out "
    },
    {
        name: "on",
        action: on,
        ownerOnly: false,
        description: "Turn on receiving notifications from dota2.ru, requires log in"
    },
    {
        name: 'off',
        action: off,
        ownerOnly: false,
        description: "Turn off receiving notifications from dota2.ru"
    },
    {
        name: 'help',
        action: help,
        ownerOnly: false,
        description: "Shows all available commands"
    }
]
