const { Client, GatewayIntentBits, CommandInteraction } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const discordBotToken = process.env.DISCORD_BOT_TOKEN;
const skyblockApiKey = process.env.SKYBLOCK_API_KEY;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const auth_key = skyblockApiKey;

client.once('ready', () => {
    console.log('Bot is ready');
    console.log('Bot is currently in these guilds:');
    client.guilds.cache.forEach((guild) => {
      console.log(`- ${guild.name} (ID: ${guild.id})`);
      console.log('Channels:');
      guild.channels.cache.forEach((channel) => {
        console.log(` - ${channel.name} (ID: ${channel.id})`);
      });
    });
  });

  
// Register the /key command
client.on('ready', async () => {
    try {

      await client.application?.commands.set([
        {
          name: 'alert',
          description: 'Set up an alert on a specified items for a price limit.',
          options: [
            {
              name: 'price',
              description: 'If an item drop under this limit, you will be alerted.',
              type: 10,
              required: true,
            },
          ],
        },
      ]);
      console.log('Command /alert is registered.');
    } catch (error) {
      console.error('Error registering commands:', error.message);
    }
  });
