let boards = [];
let running = false;
let players = [];
let currentPlayerIndex = 0;
let shipConditions = [];

function getNextPlayer(index) {
  if (index == 0) return 1;
  else return 0;
}

module.exports = {
  boards,
  running,
  players,
  currentPlayerIndex,
  shipConditions,
  getNextPlayer,
};
