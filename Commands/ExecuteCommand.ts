import { SlashCommandBuilder } from 'discord.js';
import Command from '../Interfaces/Command';

import Embed from '../Embed';
import Colors from '../EmbedColors';

import { tables } from '../Lib/mysql/queries';
import { selectInTable } from '../Lib/mysql/functions';

import timeoutSignal from 'timeout-signal';

export const Command: Command = ({
    Command: new SlashCommandBuilder()
        .setName('executecommand')
        .setDescription('Execute a command on a fivem server.')
    .addStringOption((o) => o
        .setName('id_nickname')
        .setDescription('Server id or nickname.')
        .setRequired(true))
    .addStringOption((o) => o
        .setName('command')
        .setDescription('Command to execute.')
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
        const idOrNickname = interaction.options.get('id_nickname', true)?.value ?? 'Invalid';
        const discordUser = interaction.options.get('user', false);
        const command = interaction.options.get('command', true)?.value ?? 'say Server Monitor!';

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
            `⚡ Command executed on ${nickname}`,
            `Ran the command \`\`${command}\`\` on your FiveM Server.`,
            Colors.Green
        );

        const executeCommand = async (id) => {
            const { data: { rows: [server] } } = await selectInTable(tables.fivemServers, '*', [
                { name: 'owner_id', value: id, seperator: 'AND' },
                { name: 'id', value: idOrNickname, seperator: 'OR' },
                { name: 'owner_id', value: id, seperator: 'AND' },
                { name: 'UPPER(nickname)', value: idOrNickname?.toString().toUpperCase() }
            ]);
    
            if (!server) return await reply({ embeds: [errorEmbed('The server does not exist or unauthorized.')], ephemeral: true });
    
            const { host, port, api_key } = server ?? {};
    
            let connected;
    
            try {
                connected = (await (await fetch(`http://${host}:${port}/${api_key}/validate`, { signal: timeoutSignal(2000) }))?.json())?.success;
            }
            catch {
                return await reply({ embeds: [errorEmbed('Failed to connect to your FiveM server.')], ephemeral: true });
            };
    
            if (!connected) return await reply({ embeds: [errorEmbed('FiveM server API Key misconfigured.')], ephemeral: true });
    
            let execute;
    
            try {
                execute = (await (await fetch(`http://${host}:${port}/${api_key}/execute`, {
                    signal: timeoutSignal(2000),
                    method: 'POST',
                    body: JSON.stringify({ command }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }))?.json())?.success;
            }
            catch {
                return await reply({ embeds: [errorEmbed('Failed to connect to your FiveM server.')], ephemeral: true });
            };
    
            if (!execute) return await reply({ embeds: [errorEmbed('Failed to execute command on your FiveM server.')], ephemeral: true });
    
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

            return await executeCommand(id);
        };

        const { data: { rows: [user] } } = await selectInTable(tables.users, 'id', [
            { name: 'discord_id', value: interaction?.user?.id }
        ]);

        const { id } = user ?? {};

        if (!id) return await reply({ embeds: [errorEmbed('Link a Server Monitor account first.')], ephemeral: true });

        await executeCommand(id);
    }
});
