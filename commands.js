const Discord = require('discord.js');
const consoleLog = require('./consoleLog')
const utils = require('./utils')
const User = require('user')
const axios = require('axios')

let commandParser = (message, prefix) => {
    if (!message.startsWith(prefix)) {
        return 'not command';
    }
    let messageSplit = message.toLowerCase().slice(prefix.length).split(' ');
    let command = commands.find( function(object) {
        return (this.toString() === object.name);
    }, messageSplit[0]);

    return (typeof command == 'object') ? {command: command, args: messageSplit.slice(1)} : 'unknown command';
}
module.exports = commandParser;


/**
 * @param {Discord.Client} client
 * @param {Discord.Message} message
 */
let shutdown = async (client, message) => {
    consoleLog.print("");
    await message.author.send("Bye");
    client.destroy();
    return 1;
}

/**
 * @param {Discord.Client} client
 * @param {Discord.Message} message
 */
let start = async (client, message) => {
    let user = new User(message.author.id);
    let starTime = Date.now()
    consoleLog.print(`Send NoSQL query to check user existence, user initiator: ${message.author.username}`)
    let userData = await user.findUser();
    if (!userData) {
        console.log(`User ${message.author.username} doesn't exist in database, `);
        await user.createUser();
        await message.author.send(`Hello ${message.author.username}!`);
        await message.author.send(`To start receiving notifications type ${utils.getConfigParam('COMMAND_PREFIX')}login`);
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
    let userData = await user.findUser();
    if (userData == null) {
        await message.author.send(`Type ${utils.getConfigParam('COMMAND_PREFIX')}start before login`);
        return 0;
    }
    if (userData['is_logged']) {
        await message.author.send("You are already logged")
        return 0;
    }

    await message.author.send("Enter your login:  ")
    let login = (await message.channel.awaitMessages(() => true, {max: 1, time: 60000})).first().content;
    if (typeof login === 'undefined') {
        await message.author.send("Timeout exceeded, try again");
        return 0;
    }

    await message.author.send("Enter your password:  ")
    let password = (await message.channel.awaitMessages(() => true, {max: 1, time: 60000})).first().content;
    if (typeof password === 'undefined') {
        await message.author.send("Timeout exceeded, try again");
        return 0;
    }

    let authData = await utils.auth(login, password);

    let successFunction = (authCookie) => {
        user.setAuthCookie(authCookie);
        user.setIsLogged(true);
        user.update();
        message.author.send(`You has been successfully authorized`);
        message.author.send(`Type ${utils.getConfigParam('COMMAND_PREFIX')}on for enable notifications from dota2.ru`);
    }

    switch (authData.status) {
        case 'wrongCredentials':
            await message.author.send("Wrong login or password, you can try again");
            await message.author.send("Note that if enter the login data incorrectly 5 times you will be banned");
            return 0
        case 'throttle':
            await message.author.send("Addsky has banned you, try again after 24 hours (or just use vpn lol)");
            return 0
        case 'success':
            successFunction(authData.auth_cookie);
            return 0
        default:
            await message.author.send("Unknown auth response status");
            return 0
    }

}

let commands = [
    {
        name: "shutdown",
        action: shutdown,
        ownerOnly: true,
    },
    {
        name: 'start',
        action: start,
        ownerOnly: false
    },
    {
        name: 'login',
        action: login,
        ownerOnly: false,
    }
]

