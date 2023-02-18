import { Config } from './Config';
import { Events } from './Events';

const client = Config.Client();

Events.forEach(({ Name, Execute }) => client.on(Name, (...args) => Execute(client, ...args)));

client.login(Config?.Token)
  .catch(() => console.log(`Token '${Config?.Token}' invalid, aborted.`));