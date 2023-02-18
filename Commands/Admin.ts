import { SlashCommandBuilder } from 'discord.js';
import Command from '../Interfaces/Command';

import Embed from '../Embed';
import Colors from '../EmbedColors';

import { tables } from '../Lib/mysql/queries';
import { selectInTable, insertIntoTable } from '../Lib/mysql/functions';

export const Command: Command = ({
    Command: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('Grant someone access to run commands on your behalf.')
    .addUserOption((o) => o
        .setName('user')
        .setDescription('User to grant commands.')
        .setRequired(true))
    .addBooleanOption((o) => o
        .setName('show_everyone')
        .setDescription('Show response to everyone.')
        .setRequired(false)),
    Execute: async (client, interaction, reply) => {
        const discordId = interaction?.user?.id;
        const discordAdmin = interaction.options.getUser('user');
        const showEveryone = interaction.options.get('show_everyone')?.value ?? false;

        const errorEmbed = (description) => Embed(
            client,
            interaction,
            '❌ Error',
            description,
            Colors.Red
        );

        const successEmbed = Embed(
            client,
            interaction,
            `⚡ ${discordAdmin?.tag} Granted Admin Permissions`,
            'This user is now able to run admin commands on your behalf.',
            Colors.Green
        );

        if (discordAdmin?.id === discordId) return await reply({ embeds: [errorEmbed('You cannot make yourself an admin.')], ephemeral: true });
        if (discordAdmin?.bot) return await reply({ embeds: [errorEmbed('You cannot make a bot an admin.')], ephemeral: true });

        const { data: { rows: [user] } } = await selectInTable(tables.users, 'id', [
            { name: 'discord_id', value: discordId }
        ]);

        const { id } = user ?? {};

        if (!id) return await reply({ embeds: [errorEmbed('Link a Server Monitor account first.')], ephemeral: true });

        const { exists: adminExists } = await selectInTable(tables.discordAdmins, null, [
            { name: 'admin_id', value: id, seperator: 'AND' },
            { name: 'discord_id', value: discordAdmin?.id }
        ]);

        if (adminExists) return await reply({ embeds: [errorEmbed('That user is already an administrator.')], ephemeral: true });

        const { error: failedAdminCreation } = await insertIntoTable(tables.discordAdmins, [
            { name: 'admin_id', value: id },
            { name: 'discord_id', value: discordAdmin?.id }
        ]);

        if (failedAdminCreation) return await reply({ embeds: [errorEmbed('Failed to grant administrator.')], ephemeral: true });

        await reply({ embeds: [successEmbed], ephemeral: !showEveryone });
    }
});
