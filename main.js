const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const discordBotToken = process.env.DISCORD_BOT_TOKEN;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
let alerts = []; // Store user alerts in this array
const alertedItems = {}; // Store alerted item IDs and their prices

client.once('ready', () => {
    console.log('Bot is ready');
    console.log('Bot is currently in these guilds:');
    client.guilds.cache.forEach((guild) => {
        console.log(`- ${guild.name} (ID: ${guild.id})`);
    });
    console.log(`Total alerts loaded: ${alerts.length}`);

    // Periodically fetch auctions for alerts (every 5 seconds)
    setInterval(fetchAuctionsForAlerts, 5000);
});

// Function to add an alert
function addAlert(userId, itemName, price, rarity) {
    alerts.push({ userId, itemName, price, rarity });
}

// Function to fetch auctions based on user alerts
async function fetchAuctionsForAlerts() {
    try {
        const response = await axios.get('https://api.hypixel.net/skyblock/auctions');
        if (response.data.success) {
            const auctions = response.data.auctions;

            // Loop through user alerts and find matching auctions
            for (const alert of alerts) {
                const { userId, itemName, price, rarity } = alert;
                const matchingItems = auctions.filter((item) => {
                    const itemMatches = item.bin && item.item_name.toLowerCase().includes(itemName);
                    if (rarity) {
                        return itemMatches && item.tier.includes(rarity) && item.starting_bid <= price;
                    } else {
                        return itemMatches && item.starting_bid <= price;
                    }
                });

                for (const item of matchingItems) {
                    const itemId = item.uuid;
                    const currentPrice = item.starting_bid;

                    // Check if the item has been alerted before
                    if (alertedItems[itemId]) {
                        const alertedPrice = alertedItems[itemId];

                        // If the price has changed, send an updated alert
                        if (currentPrice !== alertedPrice) {
                            alertedItems[itemId] = currentPrice;

                            const user = await client.users.fetch(userId);
                            if (user) {
                                console.log(`Alert for user ${userId}: Updated price for "${itemName}" - Rarity: ${item.tier}, New Price: ${currentPrice} coins`);
                                user.send(`Alert: Updated price for "${itemName}" - Rarity: ${item.tier}, New Price: ${currentPrice} coins`);
                            }
                        }
                    } else {
                        // If it's a new item, send the alert and store its price
                        alertedItems[itemId] = currentPrice;

                        const user = await client.users.fetch(userId);
                        if (user) {
                            console.log(`Alert for user ${userId}: Matching item found for "${itemName}" - Rarity: ${item.tier}, Price: ${currentPrice} coins`);
                            user.send(`Alert: Matching item found for "${itemName}" - Rarity: ${item.tier}, Price: ${currentPrice} coins`);
                        }
                    }
                }
            }
        } else {
            console.error('Failed to fetch data from the API:', response.data.cause);
        }
    } catch (error) {
        console.error('Error fetching data from the API:', error.message);
    }
}

// Register the /alert command
client.on('ready', async () => {
    try {
        await client.application?.commands.set([
            {
                name: 'alert',
                description: 'Set up an alert for a specific item.',
                options: [
                    {
                        name: 'item',
                        description: 'Name of the item.',
                        type: 3, // String type
                        required: true,
                    },
                    {
                        name: 'price',
                        description: 'Price limit for the item.',
                        type: 4, // Integer type
                        required: true,
                    },
                    {
                        name: 'rarity',
                        description: 'Rarity of the item',
                        type: 3, // String type
                        required: false,
                        choices: [
                            {
                                name: 'Common',
                                value: 'COMMON', // Use uppercase to match your item data
                            },
                            {
                                name: 'Uncommon',
                                value: 'UNCOMMON', // Use uppercase to match your item data
                            },
                            {
                                name: 'Rare',
                                value: 'RARE', // Use uppercase to match your item data
                            },
                            {
                                name: 'Epic',
                                value: 'EPIC', // Use uppercase to match your item data
                            },
                            {
                                name: 'Legendary',
                                value: 'LEGENDARY', // Use uppercase to match your item data
                            },
                            {
                                name: 'Mythic',
                                value: 'MYTHIC', // Use uppercase to match your item data
                            },
                            {
                                name: 'Divine',
                                value: 'DIVINE', // Use uppercase to match your item data
                            },
                            {
                                name: 'Special',
                                value: 'SPECIAL', // Use uppercase to match your item data
                            },
                            {
                                name: 'Very Special',
                                value: 'VERY_SPECIAL', // Use uppercase to match your item data
                            },
                        ],
                    },
                ],
            },
        ]);
        console.log('Command /alert is registered.');
    } catch (error) {
        console.error('Error registering commands:', error.message);
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'alert') {
        const userId = interaction.user.id;
        const alertPrice = options.getInteger('price');
        const inputItemName = options.getString('item').toLowerCase(); // Convert input item name to lowercase
        const alertRarity = options.getString('rarity');

        if (alertPrice !== null) {
            // Store the alert
            addAlert(userId, inputItemName, alertPrice, alertRarity);

            interaction.reply('Alert set successfully.');
        } else {
            interaction.reply('Please provide a valid price.');
        }
    }
});

client.login(discordBotToken);
