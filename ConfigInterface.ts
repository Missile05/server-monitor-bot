import { Client } from "discord.js";

export default interface Config {
    Token: string;
    Client: () => Client;
};