import { SlashCommandBuilder } from 'discord.js';
import Command from '../Interfaces/Command';
import Embed from '../Embed';

import { config } from '../../config';

const { domain } = config;

export const Command: Command = ({
    Command: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Returns information about the bot.'),
    Execute: async (client, interaction, reply) => {
        const pingEmbed = Embed(
            client,
            interaction,
            '📄 Bot Information',
            null,
            'White',
            [
                {
                    name: 'Version',
                    value: '1.0.0',
                    inline: true
                },
                {
                    name: 'Library',
                    value: 'discord.js',
                    inline: true
                },
                {
                    name: 'Developer',
                    value: 'Snipcola#0001',
                    inline: true
                },
                {
                    name: 'Servers',
                    value: client.guilds.cache.size.toString(),
                    inline: true
                },
                {
                    name: 'Users',
                    value: client.users.cache.size.toString(),
                    inline: true
                },
                {
                    name: 'Website',
                    value: `[Click here](${domain})`,
                    inline: true
                }
            ]
        );

        await reply({ embeds: [pingEmbed], ephemeral: true });
    }
});
