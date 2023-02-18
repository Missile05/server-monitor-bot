import { Client, ColorResolvable, CommandInteraction, EmbedAuthorData, EmbedBuilder, EmbedField, EmbedFooterData } from 'discord.js';
import Colors from './EmbedColors';

import process from 'process';

export default (
    client: Client,
    interaction: CommandInteraction,
    title: string,
    description: string,
    color?: ColorResolvable,
    fields?: EmbedField[],
    url?: string,
    author?: EmbedAuthorData,
    thumbnail?: string,
    image?: string,
    footer?: EmbedFooterData
) => {
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color ?? Colors.Green);
    
    if (url) embed.setURL(url);
    if (author) embed.setAuthor(author);
    if (thumbnail) embed.setThumbnail(thumbnail);
    if (fields) embed.setFields(fields);
    if (image) embed.setImage(image);

    embed.setFooter(footer ?? {
        iconURL: client.user.avatarURL(),
        text: `Server Monitor • PID: ${process.pid}, Shard ID: ${interaction.guild.shardId}, Uptime: ${Math.floor((client.uptime / 1000) / 60)} mins, Latency: ${Date.now() - interaction.createdTimestamp} ms`
    });

    return embed;
};