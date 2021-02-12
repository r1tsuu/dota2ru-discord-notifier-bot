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
let shutdown = async (client, message) => {
    consoleLog.print("");
    await message.author.send("Bye");
    client.destroy();
    return 0;
}

/**
 * @param {Discord.Client} client
 * @param {Discord.Message} message
 */
let start = async (client, message) => {
    let user = new User(message.author.id);
    let starTime = Date.now()
    consoleLog.print(`Send NoSQL query to check user existence, user initiator: ${message.author.username}`)
    await user.findUser();
    if (!user) {
        console.log(`User ${message.author.username} doesn't exist in database, `);
        await user.createUser();
        await message.author.send(`Hello ${message.author.username}!`);
        await message.author.send(`To start receiving notifications type ${getPrefix()}login`);
        return 0;
    }
    console.log(`User ${message.author.username} already exist in database, `);
    await message.author.send("You have been already added to database");
    return 0;
}

/**
 * @param {Discord.Client} client
 * @param {Discord.Message} message
 */
let login = async (client, message) => {
    let user = new User(message.author.id);
    await user.findUser();
    if (!user) {
        await message.author.send(`Type ${getPrefix()}start before login`);
        return 0;
    }
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
        message.author.send(`You have been successfully authorized`);
        message.author.send(`Type ${getPrefix()}on for enable notifications from dota2.ru`);
    }

    switch (authData.status) {
        case 'success':
            successFunction(authData.authCookie);
            return 0
        case 'wrongCredentials':
            await message.author.send("Wrong login or password, you can try again");
            await message.author.send("Note that if enter the login data incorrectly 5 times you will be banned");
            return 0
        case 'throttle':
            await message.author.send("Addsky has banned you, try again after 24 hours (or just use vpn lol)");
            return 0
        default:
            await message.author.send("Unknown auth response status");
            return 0
    }

}

/**
 * @param {Discord.Client} client
 * @param {Discord.Message} message
 */
let on = async (client, message) => {
    let user = new User(message.author.id);
    await user.findUser();
    if (!user) {
        await message.author.send(`Type ${getPrefix()}start before this`);
        return 0;
    }
    if (!user.authCookie) {
        await message.author.send(`You have to login before this, type ${getPrefix()}`)
        return 0;
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
        user.setNotifyEnable(true);
        await user.updateDb();
        await message.author.send("You have been connected to https://dota2.ru" +
            "socket.io server \n I'll notice you if you were got a notification")
    });
    
    let socketStatus = null;
    socket.on('notification', async (response) => {
        await user.findUser();
        if (!user.getNotifyEnabled()) {
            socketStatus = 0;
            return;
        }
        await message.author.send(response.description);
    })
    if (socketStatus === 0) {
        return 0;
    }
}

/**
 * @param {Discord.Client} client
 * @param {Discord.Message} message
 */
let off = async (client, message) => {
    let user = new User(message.author.id);
    await user.findUser();


}
let commands = [
    {
        name: "shutdown",
        action: shutdown,
        ownerOnly: true
    },
    {
        name: 'start',
        action: start,
        ownerOnly: false
    },
    {
        name: 'login',
        action: login,
        ownerOnly: false
    },
    {
        name: "on",
        action: on,
        ownerOnly: false
    }
]

