const utils = require("./utils");
const Database = require('./database')

/**
 * @description Model of user
 */
module.exports = class User extends Database {
    constructor(discordId, isLogged=false, authCookie='none') {
        super();
        this.collection_name = "Users";
        this.discordId = discordId;
        this.isLogged = isLogged;
        this.authCookie = authCookie;
    }

    async findUser() {
        const client = await this.getClient();
        if (!client) {
            return
        }
        try {
            const db = client.db(this.db_name);
            const collection = db.collection(this.collection_name);
            let userData = await collection.findOne({discord_id: this.discordId});
            if (userData) {
                this.isLogged = userData.is_logged;
                this.authCookie = userData.auth_cookie;
            }
            return userData;
        } catch (error) {
            console.log(error);
        } finally {
            await client.close();
        }
    }

    async createUser() {
        const client = await this.getClient();
        if (!client) {
            return;
        }
        try {
            const db = client.db(this.db_name);
            const collection = db.collection(this.collection_name);
            return await collection.insertOne(
                {
                    discord_id: this.discordId,
                    is_logged: this.isLogged,
                    auth_cookie: this.authCookie
                }
            );

        } catch (error) {
            console.log(error);
        } finally {
            await client.close();
        }
    }

    // Updates values in database
    async update() {
        const client = await this.getClient();
        if (!client) {
            return
        }
        try {
            const db = client.db(this.db_name);
            const collection = db.collection(this.collection_name);
            await collection.updateOne(
                { discord_id: this.discordId },
                { $set: {"is_logged": this.isLogged, "auth_cookie": this.authCookie }},
                { upsert: true }
            );
        } catch (error) {
            console.log(error);
        } finally {
            await client.close();
        }
    }

    setAuthCookie (authCookie) {
        this.authCookie = authCookie;
    }

    getAuthCookie() {
        return this.authCookie;
    }

    setIsLogged(isLogged) {
        this.isLogged = isLogged;
    }

    getIsLogged() {
        return this.isLogged;
    }

}







