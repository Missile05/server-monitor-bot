import { ChannelType, Client, CommandInteraction, InteractionReplyOptions } from 'discord.js';
import { Commands } from '../Commands';
import Event from '../Interfaces/Event';

const HandleSlashCommand = async (client: Client, interaction: CommandInteraction, reply) => {
    const SlashCommand = Commands.find((c) => c.Command.name === interaction.commandName);
    const Administrator = interaction?.memberPermissions?.has('Administrator');

    if (!SlashCommand) return await interaction.reply({ content: '❌ This slash command does not exist.', ephemeral: true }).catch();
    if (SlashCommand.AdministratorRequired && !Administrator) return await interaction.reply({ content: '❌ You do not have administrator permissions.', ephemeral: true }).catch();

    SlashCommand.Execute(client, interaction, reply);
};

export const Event: Event = ({
    Name: 'interactionCreate',
    Execute: async (client: Client, interaction: any) => {
        if (![ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildVoice].includes(interaction?.channel?.type)) return;

        const reply = async (options: InteractionReplyOptions) => await interaction.reply({ ...options }).catch();

        try {
            if (interaction?.isCommand() || interaction?.isContextMenuCommand()) await HandleSlashCommand(client, interaction, reply);
        } catch { };
    }
});