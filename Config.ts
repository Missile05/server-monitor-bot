import { Client, GatewayIntentBits } from 'discord.js';
import Config from './ConfigInterface';

import { config as discordConfig } from '../config.js';

export const Config: Config = {  
    Token: discordConfig.token,
    Client: () => new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers
        ]
    })
};