import { SlashCommandBuilder, ChannelType } from 'discord.js';
import Command from '../Interfaces/Command';

import Embed from '../Embed';
import Colors from '../EmbedColors';

import { tables } from '../Lib/mysql/queries';
import { selectInTable, deleteFromTable } from '../Lib/mysql/functions';

export const Command: Command = ({
    Command: new SlashCommandBuilder()
        .setName('removestatuschannel')
        .setDescription('Remove an existing status channel.')
        .addChannelOption((o) => o
            .setName('channel')
            .setDescription('Channel to remove.')
            .setRequired(true))
        .addStringOption((o) => o
            .setName('type')
            .setDescription('Server type.')
            .setRequired(true)
            .addChoices({
                name: 'IP Address',
                value: 'ipServers'
            },
            {
                name: 'Linux OS',
                value: 'linuxServers'
            },
            {
                name: 'FiveM',
                value: 'fivemServers'
            }))
        .addStringOption((o) => o
            .setName('id_nickname')
            .setDescription('Server id or nickname.')
            .setRequired(true))
        .addUserOption((o) => o
            .setName('user')
            .setDescription('Run command on behalf of this user.')
            .setRequired(false))
        .addBooleanOption((o) => o
            .setName('show_everyone')
            .setDescription('Show response to everyone.')
            .setRequired(false)),
    Execute: async (client, interaction, reply) => {
        const discordId = interaction?.user?.id;
        const discordChannel = interaction.options.get('channel')?.channel;
        const discordUser = interaction.options.get('user', false);

        const serverType = interaction.options.get('type', true)?.value ?? 'ipServers';
        const serverTable = tables[serverType];

        const idOrNickname = interaction.options.get('id_nickname', true)?.value ?? 'Invalid';
        const showEveryone = interaction.options.get('show_everyone')?.value ?? false;

        const errorEmbed = (description) => Embed(
            client,
            interaction,
            '❌ Error',
            description,
            Colors.Red
        );

        const successEmbed = (nickname) => Embed(
            client,
            interaction,
            `⚡ ${discordChannel?.name} not recieving status updates`,
            `This channel is now not recieving updates from the ${nickname} server.`,
            Colors.Green
        );

        const removeStatusChannel = async (id) => {
            const { data: { rows: [server] } } = await selectInTable(serverTable, '*', [
                { name: 'owner_id', value: id, seperator: 'AND' },
                { name: 'id', value: idOrNickname, seperator: 'OR' },
                { name: 'owner_id', value: id, seperator: 'AND' },
                { name: 'UPPER(nickname)', value: idOrNickname?.toString().toUpperCase() }
            ]);
    
            if (!server) return await reply({ embeds: [errorEmbed('The server does not exist or unauthorized.')], ephemeral: true });
    
            const { exists: statusChannelExists } = await selectInTable(tables.discordStatusChannels, null, [
                { name: 'guild_id', value: interaction?.guild?.id, seperator: 'AND' },
                { name: 'channel_id', value: discordChannel?.id, seperator: 'AND' },
                { name: 'server_id', value: server?.id, seperator: 'AND' },
                { name: 'server_table', value: serverTable },
            ]);
    
            if (!statusChannelExists) return await reply({ embeds: [errorEmbed('Status channel not found.')], ephemeral: true });
    
            const { error: failedStatusChannelDeletion } = await deleteFromTable(tables.discordStatusChannels, [
                { name: 'guild_id', value: interaction?.guild?.id, seperator: 'AND' },
                { name: 'channel_id', value: discordChannel?.id, seperator: 'AND' },
                { name: 'server_id', value: server?.id, seperator: 'AND' },
                { name: 'server_table', value: serverTable }
            ]);
    
            if (failedStatusChannelDeletion) return await reply({ embeds: [errorEmbed('Failed to delete status channel.')], ephemeral: true });
    
            await reply({ embeds: [successEmbed(server?.nickname)], ephemeral: !showEveryone });
        };

        if (discordUser?.user?.id === interaction?.user?.id) return await reply({ embeds: [errorEmbed('You cannot pass yourself as the user.')], ephemeral: true });
        if (discordUser?.user?.bot) return await reply({ embeds: [errorEmbed('You cannot pass a bot as the user.')], ephemeral: true });

        if (discordUser) {
            const { data: { rows: [user] } } = await selectInTable(tables.users, 'id', [
                { name: 'discord_id', value: discordUser?.user?.id }
            ]);
    
            const { id } = user ?? {};
    
            if (!id) return await reply({ embeds: [errorEmbed('That user does not have a Linked Account.')], ephemeral: true });

            const { exists: adminExists } = await selectInTable(tables.discordAdmins, null, [
                { name: 'admin_id', value: id, seperator: 'AND' },
                { name: 'discord_id', value: interaction?.user?.id }
            ]);
    
            if (!adminExists) return await reply({ embeds: [errorEmbed('You are not an administrator of that account.')], ephemeral: true });

            return await removeStatusChannel(id);
        };

        if (!discordChannel) return await reply({ embeds: [errorEmbed('Invalid channel passed.')], ephemeral: true });
        if (![ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildVoice].includes(discordChannel?.type)) return await reply({ embeds: [errorEmbed('You can only remove status channel updates from a text channel.')], ephemeral: true });

        const { data: { rows: [user] } } = await selectInTable(tables.users, 'id', [
            { name: 'discord_id', value: discordId }
        ]);

        const { id } = user ?? {};

        if (!id) return await reply({ embeds: [errorEmbed('Link a Server Monitor account first.')], ephemeral: true });

        await removeStatusChannel(id);
    }
});
