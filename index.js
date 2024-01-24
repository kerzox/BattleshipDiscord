const fs = require("node:fs");
const path = require("node:path");
const { Client, Collection, Events, GatewayIntentBits } = require("discord.js");
const { token } = require("./config.json");

const Game = require("./battleship.js");
const { running, getNextPlayer } = require("./game.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
  allowedMentions: { parse: ["users", "roles"] },
});

client.commands = new Collection();

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;
  if (Game.instance.running) {
    const filterPlayer = (m) =>
      m.author.id ===
      Game.instance.players[Game.instance.currentPlayerIndex].id;
    const collector = message.channel.createMessageCollector({
      filter: filterPlayer,
      max: 1,
      time: 60000,
    });

    collector.on("collect", (msg) => {
      let index = Game.instance.currentPlayerIndex;
      if (filterPlayer(msg)) {
        console.log(msg.content);
        let pos = Game.gridInputToIndices(msg.content);
        console.log(pos);
        let cell =
          Game.instance.boards[Game.instance.getNextPlayer(index)][pos.row][
            pos.col
          ];
        if (
          Game.attemptHit(
            cell,
            Game.instance.boards[Game.instance.getNextPlayer(index)],
            Game.instance.players[Game.instance.getNextPlayer(index)],
            Game.instance.players[index]
          )
        ) {
          Game.instance.currentPlayerIndex = Game.instance.getNextPlayer(index);
          return message.channel.send("Thats a hit!");
        } else {
          Game.instance.currentPlayerIndex = Game.instance.getNextPlayer(index);
          return message.channel.send("Thats a miss!");
        }
      }
    });

    collector.on("end", (collected, reason) => {
      message.channel.send(
        `${Game.instance.players[Game.instance.currentPlayerIndex]} you're up`
      );
    });
  }
});

client.login(token);
