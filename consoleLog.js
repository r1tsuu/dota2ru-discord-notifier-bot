//
const utils = require('./utils');
const chalk = require('chalk');

// Next message delay
const delay = 150;
const colors = ['redBright', 'blueBright', 'greenBright', 'cyanBright',
                'magentaBright', 'yellowBright', 'whiteBright'];

let setRandomStringColor = (string) => {
    return chalk[colors[utils.getRandomInt(0, colors.length)]](string);
};

// Arguments is an array from message split by ' '
let printArgs = (arguments) => {
    let coloredArgs = arguments.map(setRandomStringColor);
    let argsToMessage = (accumulator, currentArg) => accumulator + ' ' + currentArg;
    console.log(coloredArgs.reduce(argsToMessage));
}

// More cooler version of console.log
let print = (string) => {
    printArgs(string.split(' '))
};


// Uses print function with delay after for all string args
let printLines = async (...args) => {
    let printWithDelayAfter = async (message) => {
        print(message);
        await utils.sleep(delay);
    }
    for (let i in args) {
        await printWithDelayAfter(args[i]);
    }
}

let start = async (token) => {
    await printLines(
        '---------------------------------------------',
        '---------------------------------------------',
        '---------------------------------------------',
        '---STARTING DISCORD DOTA2.RU NOTIFIER BOT---',
        '-------------CREATED BY r1tsuu---------------',
        '------------CURRENT VERSION 1.0.0------------',
        '---------------------------------------------',
        '---------------------------------------------',
        '---------------------------------------------',
        `Sent request to Discord login with BOT_TOKEN=${token}, waiting response...`)
};

let botLogged = async (botName, responseTime, prefix, ownerId) => {
    await printLines ("Connected to Discord server",
        `Response Time: ${responseTime} ms`,
        `Bot username: ${botName}`,
        `Command Prefix: \`${prefix}\``,
        `Owner ID: ${ownerId}`)
};

let commandCall = (commandName, id, username, args) => {
    print(`User id: ${id}, username: ${username} calling command ${commandName}, commands args: ${args}, Date: ${Date.now().toString()}`);
}


let functions = {
    print,
    start,
    botLogged,
    commandCall,
};
module.exports = functions;

