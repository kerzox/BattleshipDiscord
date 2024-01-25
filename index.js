const fs = require("node:fs");
const path = require("node:path");
const { Client, Collection, Events, GatewayIntentBits } = require("discord.js");
const { token } = require("./config.json");

const Game = require("./battleship.js");
const { running, getNextPlayer, currentPlayerIndex } = require("./game.js");

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
  console.log(Game.instance);
  if (!Game.instance.onFirstMessage && message.author.bot) {
    console.log("word");
    return;
  }
  if (Game.instance.running) {
    Game.instance.onFirstMessage = false;
    const filterPlayer = (m) =>
      m.author.id ===
      Game.instance.players[Game.instance.currentPlayerIndex].id;
    const collector = message.channel.createMessageCollector({
      filter: filterPlayer,
      max: 1,
      time: 60000,
    });

    let switchPlayer = true;

    collector.on("collect", (msg) => {
      if (filterPlayer(msg)) {
        if (!Game.instance.running) {
          collector.stop();
          return;
        }
        if (!Game.instance.stalled) {
          let index = Game.instance.currentPlayerIndex;
          let pos = Game.gridInputToIndices(msg.content);
          if (pos == null || pos == undefined) {
            switchPlayer = false;
            return message.channel.send("Invalid coordinate!");
          }
          let result = Game.attemptHit(
            pos,
            Game.instance.boards[Game.instance.getNextPlayer(index)],
            {
              target: Game.instance.players[Game.instance.getNextPlayer(index)],
              targetIndex: Game.instance.getNextPlayer(index),
            },
            {
              shooter: Game.instance.players[Game.instance.players[index]],
              shooterIndex: Game.instance.players[index],
            }
          );

          if (result.status == "HIT") {
            return message.channel.send("Thats a hit!");
          } else if (result.status == "MISS") {
            return message.channel.send("Thats a miss!");
          } else if (result.status == "SUNK") {
            return message.channel.send(
              `${Game.instance.players[index]} has sunk ${
                Game.instance.players[Game.instance.getNextPlayer(index)]
              }'s ${result.ship}`
            );
          }
        } else {
          if (msg.content == "unpause") {
            Game.instance.stalled = false;
          }
        }
      }
    });

    collector.on("end", (collected, reason) => {
      if (!Game.instance.running) {
        collector.stop();
        return;
      }
      if (reason == "time") {
        if (!Game.instance.stalled) {
          message.channel.send("Game is on hold, send unpause to continue");
        }
        Game.instance.stalled = true;
      } else {
        // check if a player has won

        let canContinue = false;
        console.log(
          Game.instance.shipConditions[
            Game.instance.getNextPlayer(Game.instance.currentPlayerIndex)
          ]
        );

        Object.keys(Game.shipNamesDictionary).forEach((ship) => {
          console.log(
            Game.instance.shipConditions[
              Game.instance.getNextPlayer(Game.instance.currentPlayerIndex)
            ][ship]
          );
          if (
            Game.instance.shipConditions[
              Game.instance.getNextPlayer(Game.instance.currentPlayerIndex)
            ][ship] == "alive"
          ) {
            canContinue = true;
          }
        });

        if (!canContinue) {
          Game.instance.running = Game.endGame(
            message,
            Game.instance.players[Game.instance.currentPlayerIndex],
            Game.instance.players[
              Game.instance.getNextPlayer(Game.instance.currentPlayerIndex)
            ]
          );
          collector.stop();
          return message.channel.send("Display embed later can't be bothered");
        }

        let board = Game.instance.boards[Game.instance.currentPlayerIndex];

        if (switchPlayer) {
          // switch to next player
          Game.instance.currentPlayerIndex = Game.instance.getNextPlayer(
            Game.instance.currentPlayerIndex
          );
        }

        message.channel.send(
          `${Game.instance.players[Game.instance.currentPlayerIndex]} you're up`
        );

        Game.updatePlayers(message);

        switchPlayer = false;
      }
    });
  }
});

client.login(token);
