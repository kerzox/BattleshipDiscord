const { SlashCommandBuilder } = require("discord.js");
const { startGame } = require("../../battleship.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("board")
    .setDescription("Generates a debug board"),
  async execute(interaction) {
    const message = await interaction;
    message.reply(`Staring a new game of battleship!`);
    startGame(10, 10, message, [message.user]);
  },
};
