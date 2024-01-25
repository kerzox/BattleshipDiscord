const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const Game = require("../../battleship.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("endgame")
    .setDescription("Ends a game thats currently in progress"),
  async execute(interaction) {
    if (!Game.instance.running) {
      await interaction.reply("No game is currently running");
    } else {

      const message = await interaction.reply({
        content: `${interaction.user} has ended the game`,
        fetchReply: true,
      });

      

      Game.endGame();

    }
  },
};
