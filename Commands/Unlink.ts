import { SlashCommandBuilder } from 'discord.js';
import Command from '../Interfaces/Command';

import Embed from '../Embed';
import Colors from '../EmbedColors';

import { tables } from '../Lib/mysql/queries';
import { selectInTable, updateInTable } from '../Lib/mysql/functions';

import { randomUUID } from 'crypto';

export const Command: Command = ({
    Command: new SlashCommandBuilder()
        .setName('unlink')
        .setDescription('Unlink your server monitor account.')
    .addBooleanOption((o) => o
        .setName('show_everyone')
        .setDescription('Show response to everyone.')
        .setRequired(false)),
    Execute: async (client, interaction, reply) => {
        const discordId = interaction?.user?.id;
        const showEveryone = interaction.options.get('show_everyone')?.value ?? false;

        const errorEmbed = (description) => Embed(
            client,
            interaction,
            '❌ Error',
            description,
            Colors.Red
        );

        const successEmbed = (username) => Embed(
            client,
            interaction,
            `🔗 ${username} Unlinked`,
            'Your Server Monitor account has been unlinked.',
            Colors.Green
        );

        const { data: { rows: [user] } } = await selectInTable(tables.users, 'id, username', [
            { name: 'discord_id', value: discordId }
        ]);

        const { id, username } = user ?? {};

        if (!user) return await reply({ embeds: [errorEmbed('Link a Server Monitor account first.')], ephemeral: true });

        const { error: userUpdateError } = await updateInTable(tables.users, [
            { name: 'discord_id', value: null },
            { name: 'discord_link_key', value: randomUUID() }
        ], [
            { name: 'id', value: id }
        ]);

        if (userUpdateError) return await reply({ embeds: [errorEmbed('Failed to link account.')], ephemeral: true });

        await reply({ embeds: [successEmbed(username)], ephemeral: !showEveryone });
    }
});
