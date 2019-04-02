const Discord = require("discord.js")
const client = new Discord.Client({disableEveryone: true, autoReconnect:true});
const keys = require("../keys")

module.exports.startClient = function(callback) {
    client.on("ready", () => {
        callback(client);
    })
    client.login(keys.botToken).catch(err => console.log(err))

    client.on('error', function() {
        console.log("Connection failed")
      });
}

module.exports.client = client