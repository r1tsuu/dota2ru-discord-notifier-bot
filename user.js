const utils = require("./utils");
const Database = require('./database')

/**
 * @description Model of user
 */
module.exports = class User extends Database {
    /**
     * @param {string} discordId
     */
    constructor(discordId) {
        super();
        this.collection_name = "Users";
        this.discordId = discordId;
        this.authCookie = 'none';
        this.notifyEnabled = false;
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
                this.authCookie = userData.auth_cookie;
                this.notifyEnabled = userData.notify_enabled;
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
                    auth_cookie: this.authCookie,
                    notify_enabled: this.notifyEnabled
                }
            );

        } catch (error) {
            console.log(error);
        } finally {
            await client.close();
        }
    }

    // Updates values in database
    async updateDb() {
        const client = await this.getClient();
        if (!client) {
            return
        }
        try {
            const db = client.db(this.db_name);
            const collection = db.collection(this.collection_name);
            await collection.updateOne(
                { discord_id: this.discordId },
                { $set: {"auth_cookie": this.authCookie, "notify_enabled": this.notifyEnabled }},
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

    getNotifyEnabled() {
        return this.notifyEnabled;
    }

    setNotifyEnable(notifyEnabled) {
        this.notifyEnabled = notifyEnabled;
    }

}







