let boards = [];
let running = false;
let players = [];
let currentPlayerIndex = 0;
let shipConditions = [];
let onFirstMessage = true;

function getNextPlayer(index) {
  if (index == 0) return 1;
  else return 0;
}

function clear() {
  boards = [];
  running = false;
  players = [];
  currentPlayerIndex = 0;
  shipConditions = [];
  onFirstMessage = true;
}

module.exports = {
  boards,
  running,
  players,
  currentPlayerIndex,
  shipConditions,
  getNextPlayer,
  clear,
  onFirstMessage,
};
