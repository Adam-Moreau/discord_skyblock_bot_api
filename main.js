const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const discordBotToken = process.env.DISCORD_BOT_TOKEN;
const skyblockApiKey = process.env.SKYBLOCK_API_KEY;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const auth_key = skyblockApiKey;
let allAuctions = []; // Initialize an empty array to store auction data

const itemsPerPage = 10; // Number of items to display per page
const matchingItems = []; // Collect matching items here

client.once('ready', async () => {
    console.log('Bot is ready');
    console.log('Bot is currently in these guilds:');
    client.guilds.cache.forEach((guild) => {
        console.log(`- ${guild.name} (ID: ${guild.id})`);
        console.log('Channels:');
        guild.channels.cache.forEach((channel) => {
            console.log(` - ${channel.name} (ID: ${channel.id})`);
        });
    });

    // Call fetchAllAuctions when the bot is ready to fetch the data
    allAuctions = await fetchAllAuctions();
    console.log(`Fetched ${allAuctions.length} auctions.`);
});

// Function to fetch all pages of auctions
async function fetchAllAuctions() {
    let page = 0;
    const allAuctions = [];

    while (true) {
        try {
            const response = await axios.get(`https://api.hypixel.net/skyblock/auctions?page=${page}`);

            if (response.data.success) {
                // Process the auctions data from the response
                const auctions = response.data.auctions;
                allAuctions.push(...auctions);

                // Check if there are more pages to fetch
                if (page >= response.data.totalPages - 1) {
                    break;
                }
            } else {
                console.error('Failed to fetch data from the API:', response.data.cause);
                break; // Stop fetching if there's an error
            }

            // Increment the page number for the next request
            page++;
        } catch (error) {
            console.error('Error fetching data from the API:', error.message);
            break; // Stop fetching if there's an error
        }
    }

    return allAuctions;
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

// ...
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'alert') {
        const alertPrice = options.getInteger('price');

        if (alertPrice !== null) {
            try {
                if (allAuctions.length > 0) {
                    // Filter auctions where bin is true and rarity matches if provided
                    const matchingItems = allAuctions.filter((item) => {
                        const itemMatches = item.bin && item.item_name.includes(options.getString('item'));
                        if (options.getString('rarity')) {
                            return itemMatches && item.tier.includes(options.getString('rarity'));
                        } else {
                            return itemMatches;
                        }
                    });

                    if (matchingItems.length > 0) {
                        // Find the item with the lowest starting bid among the matching items
                        const cheapestItem = matchingItems.reduce((prev, current) => {
                            return prev.starting_bid < current.starting_bid ? prev : current;
                        });

                        const itemInfo = `Item : ${cheapestItem.item_name}, Rarity : ${cheapestItem.tier}, Price : ${cheapestItem.starting_bid} coins`;

                        interaction.reply(itemInfo);
                    } else {
                        // If no items match, find the item with the closest matching price
                        const closestItem = allAuctions.reduce((prev, current) => {
                            const prevDiff = Math.abs(prev.starting_bid - alertPrice);
                            const currentDiff = Math.abs(current.starting_bid - alertPrice);
                            return prevDiff < currentDiff ? prev : current;
                        });

                        const itemInfo = `No items found under $${alertPrice}. Closest item: Item : ${closestItem.item_name}, Rarity : ${closestItem.tier}, Price : ${closestItem.starting_bid} coins`;

                        interaction.reply(itemInfo);
                    }
                } else {
                    interaction.reply('No auctions data available.');
                }
            } catch (error) {
                console.error('Error fetching data from the API:', error.message);
                interaction.reply('An error occurred while fetching data from the Hypixel Skyblock API.');
            }
        } else {
            interaction.reply('Please provide a valid price.');
        }
    }
});
// ...


client.login(discordBotToken);
