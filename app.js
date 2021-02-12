//
const Discord = require('discord.js');
const consoleLog = require('./consoleLog');
const utils = require('./utils');
const commandParser = require('./commands');

let createDiscordBot = async function(token) {
    const client = new Discord.Client();
    await consoleLog.start(token);
    consoleLog.print("Discord Client has created")
    let startTime = Date.now();

    try {
        await client.login(token)
    } catch (error) {
        console.log(error);
    }

    let prefix = utils.getConfigParam('COMMAND_PREFIX');
    let ownerId = utils.getConfigParam('BOT_OWNER_ID');

     client.on("ready",  async () => {
        await consoleLog.botLogged(client.user.username, (Date.now() - startTime).toString(), prefix, ownerId);
    })

    client.on('message', async (message) => {
        if (message.author.bot) {
            return;
        }
        consoleLog.print(`User ${message.author.username} typed ${message.content}`);
        let parsed = commandParser(message.content, prefix);
        switch (parsed) {
            case 'not command':
                consoleLog.print(`Typed message by ${message.author.username} isn't command`);
                return;
            case 'unknown command':
                consoleLog.print(`Send to ${message.author.username} unknown command error`);
                await message.author.send(`Unknown command, type ${prefix}help for see all commands`);
                return;
        }
        if (parsed.command.ownerOnly) {
            if (message.author.id !== ownerId) {
                await message.author.send("You don't have permissions for this command")
                return
            }
        }
        consoleLog.commandCall(parsed.command.name, message.author.username, parsed.args)
        let status = await parsed.command.action(client, message, parsed.args)
        switch(status) {
            case 0:
                return 0;
        }
    })
}

let token = utils.getConfigParam('DISCORD_BOT_TOKEN');

(async () => {
    await createDiscordBot(token);
    consoleLog.print("Process exit");
})()


















