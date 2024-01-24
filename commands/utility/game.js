const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const { startGame } = require("../../battleship.js");

const exampleEmbed = new EmbedBuilder()
  .setColor(0x0099ff)
  .setTitle("Battleship Game")
  .setAuthor({ name: "kerzox" })
  .setDescription("Classic battleship in discord messages")
  .addFields({
    name: "React to this to play",
    value: "The First two people to react will play",
    inline: false,
  })
  .setTimestamp()
  .setFooter({ text: "Made by kerzox" });

module.exports = {
  data: new SlashCommandBuilder()
    .setName("newgame")
    .setDescription("Starts a new game of battleship"),
  async execute(interaction) {
    const message = await interaction.reply({
      embeds: [exampleEmbed],
      fetchReply: true,
    });

    const collectorFilter = (reaction, user) => {
      return user.id === interaction.user.id;
    };

    let stop = false;

    message
      .awaitReactions({
        max: 2,
        time: 10_000,
        errors: ["time"],
      })
      .then((collected) => {
        const reaction = collected.first();
        if (collected.size == 2) {
          message.reply("Starting game");

          let currentPlayers = [];

          collected.forEach((reaction) => {
            reaction.users.cache.forEach((user) => {
              currentPlayers.push(user);
            });
          });

          console.log(currentPlayers);

          startGame(10, 10, message, currentPlayers);
        }
      })
      .catch((collected) => {
        if (collected.size != 2)
          message.reply("Not enough players to start a game");
      });
  },
};
