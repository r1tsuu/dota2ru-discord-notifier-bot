const config = require("./config.json");
const axios = require('axios');
const Discord = require("discord.js");
const io = require('socket.io-client')

/**
 * @param {number} ms
 * @return {Promise<void>}
 */
let sleep = (ms) => {
    return new Promise( (resolve) => {setTimeout(resolve, ms)});
}

/**
 * @param {number} min
 * @param {number} max
 * @returns {number}
 * @description Returns random number in interval [min:max] without including the max number
 */
let getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * @param {string} paramName
 * @returns {string|string}
 * @description Returns value of parameter by name from config.json or ENV
 */
let getConfigParam = (paramName) => {
    if (typeof config[paramName] === 'undefined') {
        throw new Error(`Parameter ${paramName} doesn't exist!`);
    }
    let paramValue = config[paramName];
    if (paramValue[0] === '$') {
        let VAR_NAME = paramValue.substring(1);
        if (typeof process.env[VAR_NAME] != 'undefined') {
            return process.env[VAR_NAME];
        }
        throw new Error(`Env variable ${VAR_NAME} doesn't exist`);
    }
    return paramValue;
}

// Returns config of axios https://dota2.ru auth request
let getRequestConfig = (login, password) => ({
    method: 'post',
    url: 'https://dota2.ru/forum/api/user/auth',
    data: {
        login: login,
        password: password,
        refer: 'https://dota2.ru/',
        remember: true,
        silent: false
    },
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
    }
})

/**
 * @param {string} login
 * @param {string} password
 * @return {Promise<{authCookie: string, status: string}>}
 * @description Sending to https://dota2.ru auth request
 */
let auth = async (login, password) => {
    try {
        let response = await axios(getRequestConfig(login, password))
        return {
            status: response.data.status,
            authCookie: response.headers['set-cookie'][1]
        }
    } catch (error) {
        console.log(error);
    }
}

// Remove from message HTML tags
let getThisWithRemovedTags = (message) => {
    return message.replace(/<\/?[^>]+(>|$)/g, "");
}
module.exports = {
    sleep,
    getRandomInt,
    getConfigParam,
    auth,
    getThisWithRemovedTags
}
