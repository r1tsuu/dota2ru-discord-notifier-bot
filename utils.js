const config = require("./config.json");
const axios = require('axios');
const Discord = require("discord.js");
const io = require('socket.io-client')

/**
 * @param {number} ms
 * @return {Promise<unknown>}
 */
let sleep = (ms) => {
    return new Promise( (resolve) => {setTimeout(resolve, ms)});
}
Promise.resolve()

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
 * @description Returns parameter by name from config.json or ENV
 */
let getConfigParam = (paramName) => {
    if (typeof config[paramName] === 'undefined') {
        throw new Error(`Parameter ${paramName} doesn't exist!`);
    }
    let param = config[paramName];
    if (param[0] === '$') {
        let VAR_NAME = param.substring(1);
        if (typeof process.env[VAR_NAME] != 'undefined') {
            return process.env[VAR_NAME];
        }
        throw new Error(`Env variable ${VAR_NAME} doesn't exist`);
    }
    return param;
}

let getCookie = (response) => {
    return response.headers['set-cookie']
}

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

let auth = async (login, password) => {
    try {
        let response = await axios(getRequestConfig(login, password))
        return {
            status: response.data.status,
            cookie: response.headers['set-cookie']
        }
    } catch (error) {
        console.log(error);
    }
}

( async() => {
    const socket = io('https://dota2.ru', {
        reconnectionAttemps: 10,
        reconnectionDelay: 5e3,
        extraHeaders: {
            Cookie: "forum_auth=JhCII3mRpziLcSLH142DLI%2FW0Iiqu%2FSC%2BNhZFwGd07vctXTy2EzmBrPiOX2I0v4JcEbldEDhNVGiyrzOW%2B7xjjrfwWdClWLEtKrsJEi%2FyOuvrRTqQgYXDGjxBKdthv1Pgr2MiB7lEu8v79y3s9it%2BpYJgXa1tTa5vTcZFtMTdT8%3D"
        }
    })
    socket.on('connect', () => console.log("connected"));
    socket.on('notification', (data) => console.log(data));
})()
module.exports = {
    sleep,
    getRandomInt,
    getConfigParam,
    auth
}


