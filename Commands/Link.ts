import { SlashCommandBuilder } from 'discord.js';
import Command from '../Interfaces/Command';

import Embed from '../Embed';
import Colors from '../EmbedColors';

import { tables } from '../Lib/mysql/queries';
import { selectInTable, updateInTable } from '../Lib/mysql/functions';

import { randomUUID } from 'crypto';

export const Command: Command = ({
    Command: new SlashCommandBuilder()
        .setName('link')
        .setDescription('Link your server monitor account.')
    .addStringOption((o) => o
        .setName('link_key')
        .setDescription('Your discord link key.')
        .setRequired(true))
    .addBooleanOption((o) => o
        .setName('show_everyone')
        .setDescription('Show response to everyone.')
        .setRequired(false)),
    Execute: async (client, interaction, reply) => {
        const discordId = interaction?.user?.id;
        const discordLinkKey = interaction.options.get('link_key', true)?.value ?? 'Invalid';
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
            `🔗 ${username} Linked`,
            'Your Server Monitor account has been linked.',
            Colors.Green
        );

        const { exists: userExists } = await selectInTable(tables.users, null, [
            { name: 'discord_id', value: discordId }
        ]);

        if (userExists) return await reply({ embeds: [errorEmbed('Discord account already linked to a Server Monitor account, unlink first.')], ephemeral: true });

        const { data: { rows: [user] } } = await selectInTable(tables.users, 'id, username, discord_id', [
            { name: 'discord_link_key', value: discordLinkKey }
        ]);

        const { id, username, discord_id } = user ?? {};

        if (!user) return await reply({ embeds: [errorEmbed('Invalid discord link key.')], ephemeral: true });

        if (discord_id !== null && discord_id !== interaction?.user?.id) return await reply({ embeds: [errorEmbed('Account already linked to another discord account.')], ephemeral: true });

        const { error: userUpdateError } = await updateInTable(tables.users, [
            { name: 'discord_id', value: interaction?.user?.id },
            { name: 'discord_link_key', value: randomUUID() }
        ], [
            { name: 'id', value: id }
        ]);

        if (userUpdateError) return await reply({ embeds: [errorEmbed('Failed to link account.')], ephemeral: true });

        await reply({ embeds: [successEmbed(username)], ephemeral: !showEveryone });
    }
});
