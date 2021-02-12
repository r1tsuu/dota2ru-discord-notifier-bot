const utils = require("./utils");
const MongoClient = require("mongodb").MongoClient


module.exports = class Database {
    constructor() {
        if (utils.getConfigParam('DBMS').toLowerCase() !== 'mongodb') {
            throw new Error(`This DBMS is not supported`)
        }
        this.url = utils.getConfigParam('DB_URL')
        this.db_name = utils.getConfigParam('DB_NAME')
    }

    /** @returns {Promise<MongoClient>} */
    async getClient() {
        try {
            return MongoClient.connect(this.url, {useUnifiedTopology: true});
        } catch (error) {
            console.log(error);
        }
    }
}