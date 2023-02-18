import { REST } from '@discordjs/rest';
import { Client, Routes } from 'discord.js';

import { Commands } from '../Commands';
import Event from '../Interfaces/Event';

import { Config } from '../Config';
import { executeHost } from '../Lib/functions.js';

export const Event: Event = ({
    Name: 'ready',
    Execute: async (client: Client, _interface) => {
        const rest = new REST({ version: '10' }).setToken(Config.Token);

        if (!(client.user || client.application)) return;

        await rest.put(Routes.applicationCommands(client.user.id), { body: Commands.map(({ Command }) => Command) });
        await executeHost(client);
    }
});