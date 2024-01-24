const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const instance = require("./game.js");

function gridInputToIndices(gridInput) {
  const regex = /^([A-Ja-j])(10|[1-9])$/;
  const match = gridInput.match(regex);

  console.log(gridInput);

  if (!match) {
    console.error("Invalid grid input format");
    return null;
  }

  const [, letters, numbers] = match;
  const columnIndex = letters.toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
  const rowIndex = parseInt(numbers) - 1;

  return { row: rowIndex, col: columnIndex };
}

const shipSizeDictionary = {
  A: 5, // Aircraft Carrier
  B: 4, // Battleship
  D: 3, // Destroyer
  S: 3, // Submarine
  P: 2, // Patrol Boat
};

const shipAbvDictionary = {
  A: "🇦",
  B: "🇧",
  D: "🇩",
  S: "🇸",
  P: "🇵",
};

function copyGrid(original) {
  return original.map((innerArray) => [...innerArray]);
}

// function createGrid(rows, columns) {
//   return Array.from({ length: rows }, () => Array(columns).fill("0"));
// }

// Function to create and return a 10x10 grid
function createGrid() {
  const grid = [];
  for (let i = 0; i < 10; i++) {
    const row = [];
    for (let j = 0; j < 10; j++) {
      row.push("⬜"); // Using a white square emoji as a placeholder
    }
    grid.push(row);
  }
  return grid;
}

function displayGrid(grid) {
  let output = "⬜🇦 🇧 🇨 🇩 🇪 🇫 🇬 🇭 🇮 🇯\n"; // Column headers

  for (let i = 0; i < grid.length; i++) {
    output += `${i + 1}`.padStart(2, "0");

    for (let j = 0; j < grid[i].length; j++) {
      output += ` ${grid[i][j]} `;
    }

    output += "\n";
  }

  console.log(output);
  return output;
}

function isValidPosition(grid, position) {
  if (position.x < 0 || position.x > grid.length - 1) return false;
  if (position.y < 0 || position.y > grid[0].length - 1) return false;

  return grid[position.x][position.y] == "⬜";
}

// Function to create an embed with the 10x10 grid
function createGridEmbed(player, grid) {
  const embed = new EmbedBuilder()
    .setColor("#3498db") // Set the color of the embed (you can change this)
    .setTitle(`${player.tag}'s Board`)
    .setDescription(displayGrid(grid));
  //   //   // Add rows with row number and grid data
  //   for (let i = 0; i < grid.length; i++) {
  //     const rowLabel = `${i + 1}`.padStart(2, "0"); // Pad single-digit numbers with a leading zero
  //     embed.addFields({
  //       name: grid[i].join(" "),
  //       value: "",
  //       inline: false,
  //     });
  //   }

  return embed;
}

function sendPlayersBoard(player, grid) {
  player
    .send({
      embeds: [createGridEmbed(player, grid)],
    })
    .then(() => {
      // Do something after the DM is sent successfully
      console.log(`Private message sent to ${player.tag}`);
    })
    .catch((error) => {
      // Handle any errors that may occur while sending the DM
      console.error(`Error sending private message to ${player.tag}: ${error}`);
    });
}

function randomPositionOnGrid(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  return {
    x: Math.floor(Math.random() * rows),
    y: Math.floor(Math.random() * cols),
  };
}

const moveInDirection = {
  left: (x, y) => ({ x: x - 1, y }),
  up: (x, y) => ({ x, y: y - 1 }),
  right: (x, y) => ({ x: x + 1, y }),
  down: (x, y) => ({ x, y: y + 1 }),
};

function getNeighbouring({ x, y }, grid) {
  /*

  2d grid can only have 

    --, 01, --
    10, 11, 12
    --, 21, --

  */

  return Object.keys(moveInDirection).map((direction) => {
    const moveResult = moveInDirection[direction](x, y);
    return { direction, result: moveResult };
  });
}

//https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function placeShips(grid) {
  /*

    Choose a random position on the 2d grid.
    Loop over ships that has yet to be placed on the board
    From that position find a directly connected neighbour (left, up, right, down)
    Check if the ship can fit in the neighbouring position if it can continue along the same axis.
    On failure repeat untill we find a valid position.
   */
  let remainingShips = ["A", "B", "D", "S", "P"];
  let modifiedGrid = copyGrid(grid);

  while (remainingShips.length > 0) {
    const ship = remainingShips.shift();
    while (true) {
      let valid = false;
      let tempGrid = copyGrid(modifiedGrid);
      const randomPosition = randomPositionOnGrid(grid);

      if (!isValidPosition(tempGrid, randomPosition)) {
        console.log("Invalid position trying again");
        continue;
      }

      const neighbouring = shuffleArray(["left", "right", "up", "down"]);

      for (let i = 0; i < neighbouring.length; i++) {
        const direction = neighbouring[0];
        let position = randomPosition;
        let steps = shipSizeDictionary[ship];
        let count = 0;

        for (let step = 0; step < steps; step++) {
          position = moveInDirection[direction](position.x, position.y);
          if (!isValidPosition(tempGrid, position)) {
            tempGrid = copyGrid(modifiedGrid);
            continue;
          }
          console.log(position.x, position.y);
          tempGrid[position.x][position.y] = shipAbvDictionary[ship];
          count++;
        }

        if (count >= shipSizeDictionary[ship]) {
          valid = true;
          //displayGrid(tempGrid);
          break;
        }
      }

      if (valid) {
        modifiedGrid = copyGrid(tempGrid);
        break;
      }
    }
  }

  return modifiedGrid;
}

function attemptHit(cell, targetBoard, targetPlayer, shootingPlayer) {
  // cell is a white space meaning no ship
  if (cell == "⬜") {
    return false;
  }

  return true;
}

function startGame(rows, columns, interaction, currentPlayers) {
  /*

    Build the grid.
    Add the ships randomly.
    send both players their battleship board.
    wait for reply from player 1
    check for hit on player 2 from player 1
    check for win condition
    wait for reply from player 2
    check for hit on player 1 from player 2
    check for win condition

    game end (player wins)
        send message game is over and user.tag has won
        end game

  */

  currentPlayers.forEach((element) => {
    const grid = createGrid();
    let modifiedGrid = placeShips(grid);
    displayGrid(modifiedGrid);
    sendPlayersBoard(element, modifiedGrid);
    instance.boards.push(modifiedGrid);
  });

  instance.running = true;
  (instance.players = currentPlayers),
    (instance.currentPlayerIndex = 0),
    interaction.channel.send(`Message when you want to start`);
}

function endGame() {}

module.exports = {
  startGame,
  endGame,
  instance,
  gridInputToIndices,
  attemptHit,
};
