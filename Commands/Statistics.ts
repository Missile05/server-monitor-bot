import { SlashCommandBuilder } from 'discord.js';
import Command from '../Interfaces/Command';

import Embed from '../Embed';
import Colors from '../EmbedColors';

import { tables } from '../Lib/mysql/queries';
import { selectInTable } from '../Lib/mysql/functions';

export const Command: Command = ({
    Command: new SlashCommandBuilder()
        .setName('statistics')
        .setDescription('View the statistics of your servers.')
        .addStringOption((o) => o
            .setName('type')
            .setDescription('Server type.')
            .setRequired(true)
            .addChoices({
                name: 'IP Address',
                value: 'ipServers'
            },
            {
                name: 'Roblox Game',
                value: 'robloxServers'
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
        const serverType = interaction.options.get('type', true)?.value ?? 'ipServers';
        const discordUser = interaction.options.get('user', false);
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

        const dataEmbed = (nickname, data) => Embed(
            client,
            interaction,
            `📊 ${nickname} Statistics`,
            null,
            Colors.Green,
            data?.map(({ value, name }) => ({
                name,
                value,
                inline: true
            }))
        );

        const getStatistics = async (id) => {
            const { data: { rows: [server] } } = await selectInTable(serverTable, '*', [
                { name: 'owner_id', value: id, seperator: 'AND' },
                { name: 'id', value: idOrNickname, seperator: 'OR' },
                { name: 'owner_id', value: id, seperator: 'AND' },
                { name: 'UPPER(nickname)', value: idOrNickname?.toString().toUpperCase() }
            ]);
    
            if (!server) return await reply({ embeds: [errorEmbed('The server does not exist or unauthorized.')], ephemeral: true });
    
            let data: { name: string, value: string }[];
    
            if (serverType === 'ipServers') data = [
                { name: 'Monitoring', value: server?.monitoring === 'TRUE' ? '✅ Yes' : server?.monitoring === 'FALSE' ? '❌ No' : '⚠️ Pending / Unknown' },
                { name: 'Status', value: server?.status === 'ONLINE' ? '✅ Online' : server?.status === 'OFFLINE' ? '❌ Offline' : '⚠️ Pending / Unknown' },
                { name: 'IP Address', value: `🌐 ${showEveryone ? server?.ip_address?.replace(/[0-9]/g, '-') : server?.ip_address}` },
                { name: 'Response Time', value: `⌛ ${server?.response_time} ms` }
            ];
            else if (serverType === 'robloxServers') data = [
                { name: 'Monitoring', value: server?.monitoring === 'TRUE' ? '✅ Yes' : server?.monitoring === 'FALSE' ? '❌ No' : '⚠️ Pending / Unknown' },
                { name: 'Place Id', value: `🌍 ${server?.place_id}` },
                { name: 'Universe Id', value: `🌍 ${server?.universe_id}` },
                { name: 'Genre', value: `🌍 ${server?.genre}` },
                { name: 'Name', value: `✏️ ${server?.name}` },
                { name: 'Description', value: `✏️ ${server?.description}` },
                { name: 'Creator Name', value: `🔧 ${server?.creator_name}` },
                { name: 'Creator Type', value: `🔧 ${server?.creator_type}` },
                { name: 'Price', value: `💸 ${server?.price?.toString()}` },
                { name: 'Copying Enabled', value: server?.copying_allowed?.toUpperCase() === 'TRUE' ? '✅ Yes' : server?.copying_allowed?.toUpperCase() === 'FALSE' ? '❌ No' : '⚠️ Pending / Unknown' },
                { name: 'Game Created', value: `🕒 ${server?.game_created}` },
                { name: 'Game Updated', value: `🕒 ${server?.game_updated}` },
                { name: 'Max Players', value: `📈 ${server?.max_players?.toString()}` },
                { name: 'Favorites', value: `📈 ${server?.favorites?.toString()}` },
                { name: 'Visits', value: `📈 ${server?.visits?.toString()}` },
                { name: 'Players', value: `📈 ${server?.playing?.toString()}` },
                { name: 'Likes', value: `📈 ${server?.likes?.toString()}` },
                { name: 'Dislikes', value: `📈 ${server?.dislikes?.toString()}` }
            ];
            else if (serverType === 'linuxServers') data = [
                { name: 'Monitoring', value: server?.monitoring === 'TRUE' ? '✅ Yes' : server?.monitoring === 'FALSE' ? '❌ No' : '⚠️ Pending / Unknown' },
                { name: 'Status', value: server?.status === 'ONLINE' ? '✅ Online' : server?.status === 'OFFLINE' ? '❌ Offline' : '⚠️ Pending / Unknown' },
                { name: 'Host', value: `🌐 ${showEveryone ? server?.host?.replace(/[0-9]/g, '-') : server?.host}` },
                { name: 'Port', value: `🌐 ${showEveryone ? server?.port?.replace(/[0-9]/g, '-') : server?.port}` },
                { name: 'Manufacturer', value: `💻 ${server?.manufacturer}` },
                { name: 'Model', value: `💻 ${server?.model}` },
                { name: 'Serial', value: `💻 ${showEveryone ? server?.serial?.replace(/[a-zA-Z0-9]/g, '-') : server?.serial}` },
                { name: 'BIOS Vendor', value: `💻 ${server?.bios_vendor}` },
                { name: 'BIOS Serial', value: `💻 ${showEveryone ? server?.bios_serial?.replace(/[a-zA-Z0-9]/g, '-') : server?.bios_serial}` },
                { name: 'OS Kernel', value: `💻 ${server?.os_kernel}` },
                { name: 'OS Build', value: `💻 ${server?.os_build}` },
                { name: 'CPU Usage', value: `💻 ${server?.cpu_usage}%` },
                { name: 'CPU Temperature', value: `💻 ${server?.cpu_temperature}°C` },
                { name: 'RAM Usage', value: `💻 ${server?.ram_usage}%` },
                { name: 'Disk Used', value: `💻 ${server?.disk_used}MB` }
            ];
            else if (serverType === 'fivemServers')  data = [
                { name: 'Monitoring', value: server?.monitoring === 'TRUE' ? '✅ Yes' : server?.monitoring === 'FALSE' ? '❌ No' : '⚠️ Pending / Unknown' },
                { name: 'Status', value: server?.status === 'ONLINE' ? '✅ Online' : server?.status === 'OFFLINE' ? '❌ Offline' : '⚠️ Pending / Unknown' },
                { name: 'Host', value: `🌐 ${showEveryone ? server?.host?.replace(/[0-9]/g, '-') : server?.host}` },
                { name: 'Port', value: `🌐 ${showEveryone ? server?.port?.replace(/[0-9]/g, '-') : server?.port}` },
                { name: 'Players', value: `📈 ${server?.players?.toString()}` },
                { name: 'CPU Usage', value: `💻 ${server?.cpu_usage}%` },
                { name: 'CPU Temperature', value: `💻 ${server?.cpu_temperature}°C` },
                { name: 'RAM Usage', value: `💻 ${server?.ram_usage}%` },
                { name: 'Disk Used', value: `💻 ${server?.disk_used}MB` }
            ];
    
            if (!data) await reply({ embeds: [errorEmbed('The server type provided was invalid.')], ephemeral: true });
            else await reply({ embeds: [dataEmbed(server?.nickname, data)], ephemeral: !showEveryone });
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

            return await getStatistics(id);
        };

        const { data: { rows: [user] } } = await selectInTable(tables.users, 'id', [
            { name: 'discord_id', value: interaction?.user?.id }
        ]);

        const { id } = user ?? {};

        if (!id) return await reply({ embeds: [errorEmbed('Link a Server Monitor account first.')], ephemeral: true });

        await getStatistics(id);
    }
});
