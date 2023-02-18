import { globby } from 'globby';
import Command from './Interfaces/Command';

const files = await globby(`./Commands/*.ts`);

const commands = async () => await Promise.all(files
    .map(async (commandPath) => (await import(commandPath))?.Command));

export const Commands: Command[] = await commands();