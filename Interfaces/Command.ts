import { Client, CommandInteraction, InteractionReplyOptions } from 'discord.js';

export default interface Command {
    Command: any;
    AdministratorRequired?: boolean;
    Execute: (client: Client, interaction: CommandInteraction, reply: (info: InteractionReplyOptions) => void) => void;
};