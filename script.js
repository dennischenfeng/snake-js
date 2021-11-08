const DIRECTION = Object.freeze({
    UP: 1,
    RIGHT: 2,
    DOWN: 3,
    LEFT: 4,
});

const gridSizes = {
    small: [10, 10],
    medium: [20, 20],
    large: [30, 30],
}

// maps speed to sleep_time (milliseconds)
const sleepTimes = {
    1: 300,
    2: 200,
    3: 100,
}

const controlPanel = document.querySelector(".control-panel")
const gridPanel = document.querySelector(".grid-panel")
const endPanel = document.querySelector(".end-panel")
const startButton = document.getElementById("startButton")
const backToMenuButton = document.getElementById("backToMenuButton")

let game = undefined;
let highScoreNormal = 0;
let highScoreCountdown = 0;

startButton.addEventListener("click", onStartButtonClick)
backToMenuButton.addEventListener("click", onBackToMenuButtonClick)

async function onStartButtonClick(e) {
    const gridSizeKey = document.querySelector("input[name='gridSize']:checked").id;
    const gridSize = gridSizes[gridSizeKey];
    const speed = parseInt(document.querySelector("input[name='speed']:checked").id);
    const mode = document.querySelector("input[name='mode']:checked").id;

    game = new Game(gridSize, speed, mode);
    bringToFront("grid-panel");
    await game.play();
    bringToFront("end-panel");
}

async function onBackToMenuButtonClick(e) {
    bringToFront("control-panel");
    game.reset_dom();
}

function bringToFront (panelName) {
    if (panelName == "control-panel") {
        controlPanel.style.zIndex = 2;
        gridPanel.style.zIndex = 0;
        endPanel.style.zIndex = 0;
    } else if (panelName == "grid-panel") {
        controlPanel.style.zIndex = 0;
        gridPanel.style.zIndex = 2;
        endPanel.style.zIndex = 0;
    } else if (panelName == "end-panel") {
        controlPanel.style.zIndex = 0;
        gridPanel.style.zIndex = 1;
        endPanel.style.zIndex = 2;
    } else {
        throw "panelName is not valid!"
    }
}


// Game

function Game(gridSize, speed, mode) {
    this.gridSize = gridSize;
    this.speed = speed;
    this.mode = mode;

    this.sleep_time = sleepTimes[this.speed]
    
    this.grid = [];
    this.snakeNodes = [];
    this.snakeDirection;
    this.nextKeyDirection;
    this.foodNode;
    this.score = 0;
    this.done = false;

    // Add DOM nodes, populate grid
    // const gridPanel = document.querySelector(".grid-panel");
    for (let row = 0; row < this.gridSize[0]; row++) {
        const d = document.createElement("div");
        d.classList.add("grid-row");
        this.grid.push([]);
        gridPanel.appendChild(d);
    }

    const gridRows = document.querySelectorAll(".grid-row");
    for (let row = 0; row < gridRows.length; row++) {    
        for (let col = 0; col < this.gridSize[1]; col++) {
            const d = document.createElement("div");
            d.classList.add("grid-unit-empty");
            this.grid[row].push(d);
            gridRows[row].appendChild(d);
        }
    }

    this.scoreLeft = document.querySelector(".score-left")
    this.scoreRight = document.querySelector(".score-right")

    // Populate attributes with initial values
    this.snakeNodes = [[4, 4], [4, 5], [4, 6]];
    this.snakeDirection = DIRECTION.RIGHT;
    this.nextKeyDirection = DIRECTION.RIGHT;
    this.foodNode = [9, 9];

    // Modify DOM nodes to reflect attributes
    for (let i = 0; i < this.snakeNodes.length; i++) {
        const [row, col] = this.snakeNodes[i];
        this.grid[row][col].classList.remove("grid-unit-empty");
        this.grid[row][col].classList.add("grid-unit-snake");
    }
    
    const [foodRow, foodCol] = this.foodNode;
    this.grid[foodRow][foodCol].classList.remove("grid-unit-empty");
    this.grid[foodRow][foodCol].classList.toggle("grid-unit-food");

    // Enable keyboard arrow keys
    window.addEventListener("keydown", this.keyDown.bind(this));
}

Game.prototype.computeNextNodeLoc = function(moveDirection) {
    /* Returns next node location (might be out of bounds), given the direction
    */
    const [headRow, headCol] = this.snakeNodes[this.snakeNodes.length - 1];
    // const headRow = headNodeLoc[0];
    // const headCol = headNodeLoc[1];

    // // movementDirection is same as input direction, except if opposite direction (not allowed)
    // let movementDirection;
    // if (direction != oppositeDirection(this.snakeDirection)) {
    //     movementDirection = direction;
    // } else {
    //     movementDirection = this.snakeDirection;
    // }

    if (moveDirection == DIRECTION.UP) {
        return [headRow - 1, headCol];
    } else if (moveDirection == DIRECTION.RIGHT) {
        return [headRow, headCol + 1];
    } else if (moveDirection == DIRECTION.DOWN) {
        return [headRow + 1, headCol];
    } else if (moveDirection == DIRECTION.LEFT) {
        return [headRow, headCol - 1];
    } else {
        throw "`moveDirection` is not valid!";
    }
}

Game.prototype.computeMoveDirection = function(direction) {
    // movementDirection is same as input direction, except if opposite direction (not allowed)
    if (direction != oppositeDirection(this.snakeDirection)) {
        return direction;
    } else {
        return this.snakeDirection;
    }
}

Game.prototype.isWithinGrid = function(row, col) {
    const rowWithinGrid = (row < this.gridSize[0]) && (row >= 0)
    const colWithinGrid = (col < this.gridSize[1]) && (col >= 0)
    if (rowWithinGrid && colWithinGrid) {
        return true;
    } else {
        return false;
    }
}

Game.prototype.newFoodNode = function() {
    // Finds a new food loc. If no empty spaces, return [-1, -1]
    // generate all empty
    const emptyNodes = []
    for (let row = 0; row < this.gridSize[0]; row++) {
        for (let col = 0; col < this.gridSize[1]; col++) {
            const isSnakeNodes = (searchForArray(this.snakeNodes, [row, col]) >= 0);
            const isFoodNode = ((row == this.foodNode[0]) && (col == this.foodNode[1]));
            if (!isSnakeNodes && !isFoodNode) {
                emptyNodes.push([row, col])
            }
        }
    }

    const [r, c] = emptyNodes[randomInt(0, emptyNodes.length)]
    return [r, c]
}

Game.prototype.step = function(dir) {
    moveDir = this.computeMoveDirection(dir)
    const [nextRow, nextCol] = this.computeNextNodeLoc(moveDir); 
    if (!this.isWithinGrid(nextRow, nextCol)) {
        this.done = true;
    } else {
        const cls = getOne(this.grid[nextRow][nextCol].classList)
        if (cls == "grid-unit-snake") {
            this.done = true;
        } else if (cls == "grid-unit-empty") {
            const [oldTailRow, oldTailCol] = this.snakeNodes.shift();
            this.snakeNodes.push([nextRow, nextCol]);
            
            // TODO could simplify the grid unit classes to not have to add/remove "empty" every time
            this.grid[oldTailRow][oldTailCol].classList.remove("grid-unit-snake");
            this.grid[oldTailRow][oldTailCol].classList.add("grid-unit-empty");

            this.grid[nextRow][nextCol].classList.remove("grid-unit-empty");
            this.grid[nextRow][nextCol].classList.add("grid-unit-snake");

            this.snakeDirection = moveDir;
        } else if (cls == "grid-unit-food") {
            // update snake head , update grid head and food, update foodLoc, and update score
            this.score += 10;

            this.snakeNodes.push([nextRow, nextCol]);
            this.grid[nextRow][nextCol].classList.remove("grid-unit-food");
            this.grid[nextRow][nextCol].classList.add("grid-unit-snake");

            // TODO continue here to put in food at random loc.
            const [newFoodRow, newFoodCol] = this.newFoodNode();
            this.foodNode = [newFoodRow, newFoodCol]
            this.grid[newFoodRow][newFoodCol].classList.remove("grid-unit-empty");
            this.grid[newFoodRow][newFoodCol].classList.add("grid-unit-food");

            this.snakeDirection = moveDir;
        } else {
            throw "An error occurred. An invalid case was reached."
        }
    }
}

Game.prototype.play = async function() {
    let i = 0
    while (i < 1000) {
        await sleep(this.sleep_time);
        this.step(this.nextKeyDirection);
        this.scoreLeft.textContent = `Score: ${this.score}`;
        if (this.done) {
            this.scoreLeft.textContent = `Game finished! Final score: ${this.score}`;
            window.removeEventListener("keydown", this.keyDown);
            break;
        }

        i++;
    }
}

Game.prototype.reset_dom = function () {
    gridPanel.textContent = "";
}

Game.prototype.keyDown = async function(e) {
    if (e.key == "ArrowUp") {
        this.nextKeyDirection = DIRECTION.UP;
    } else if (e.key == "ArrowRight") {
        this.nextKeyDirection = DIRECTION.RIGHT;
    } else if (e.key == "ArrowDown") {
        this.nextKeyDirection = DIRECTION.DOWN;
    } else if (e.key == "ArrowLeft") {
        this.nextKeyDirection = DIRECTION.LEFT;
    }
}


// Utility functions

// https://stackoverflow.com/questions/19543514/check-whether-an-array-exists-in-an-array-of-arrays
function searchForArray(haystack, needle) {
    let i, j, current;
    for (i = 0; i < haystack.length; ++i) {
        if (needle.length === haystack[i].length) {
            current = haystack[i];
            for (j = 0; j < needle.length && needle[j] === current[j]; ++j);
            if (j === needle.length)
                return i;
        }
    }
    return -1;
}

function getOne(arr) {
    if (arr.length != 1) {
        throw "`arr` must have exactly one element"
    } else {
        return arr[0];
    }
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function oppositeDirection(direction) {
    const dirModifiedIndex = direction - 1;
    return 1 + (dirModifiedIndex + 2) % 4;
}

// from https://www.joshwcomeau.com/snippets/javascript/random/
// This random function includes the lower bound, but excludes the upper bound
const randomInt = (min, max) => Math.floor(Math.random() * (max - min)) + min;
