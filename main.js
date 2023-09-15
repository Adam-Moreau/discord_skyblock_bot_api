const { Client, GatewayIntentBits, CommandInteraction } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const discordBotToken = process.env.DISCORD_BOT_TOKEN;
const skyblockApiKey = process.env.SKYBLOCK_API_KEY;

