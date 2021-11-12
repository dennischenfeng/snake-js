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
const highScoreSpan = document.getElementById("high-score")
// const highScoreNormalSpan = document.getElementById("high-score-normal")
// const highScoreCountdownSpan = document.getElementById("high-score-countdown")
const scoreDiv = document.getElementById("score-div")
const countdownDiv = document.getElementById("countdown-div")
const startButton = document.getElementById("startButton")
const backToMenuButton = document.getElementById("backToMenuButton")
const radioButtons = document.querySelectorAll('input[type=radio]')

let game = undefined;
let highScores = {};
// populate initial values for highScores
["small", "medium", "large"].forEach((gridSizeKey) => {
    [1, 2, 3].forEach((speed) => {
        ["normal", "countdown"].forEach((mode) => {
            key = `${gridSizeKey},${speed},${mode}`;
            highScores[key] = 0;
        });
    });
}); 


startButton.addEventListener("click", onStartButtonClick)
backToMenuButton.addEventListener("click", onBackToMenuButtonClick)
radioButtons.forEach((b) => {
    b.addEventListener("click", onRadioButtonClick);
})

async function onStartButtonClick(e) {
    const gridSizeKey = document.querySelector("input[name='gridSize']:checked").id;
    const gridSize = gridSizes[gridSizeKey];
    const speed = parseInt(document.querySelector("input[name='speed']:checked").id);
    const mode = document.querySelector("input[name='mode']:checked").id
    const countdown = (mode === "countdown" ? true : false);

    game = new Game(gridSize, speed, countdown);
    bringToFront("grid-panel");
    const score = await game.play();
    
    key = `${gridSizeKey},${speed},${mode}`;
    highScores[key] = Math.max(score, highScores[key]);

    highScoreSpan.textContent = highScores[key];

    bringToFront("end-panel");
}

async function onBackToMenuButtonClick(e) {
    bringToFront("control-panel");
    game.reset_dom();
}

async function onRadioButtonClick(e) {
    const gridSizeKey = document.querySelector("input[name='gridSize']:checked").id;
    const gridSize = gridSizes[gridSizeKey];
    const speed = parseInt(document.querySelector("input[name='speed']:checked").id);
    const mode = document.querySelector("input[name='mode']:checked").id

    const highScore = highScores[`${gridSizeKey},${speed},${mode}`];
    highScoreSpan.textContent = highScore;
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

function Game(gridSize, speed, countdown = false, countdownDuration = 60e3) {
    this.gridSize = gridSize;
    this.speed = speed;
    // this.mode = mode;
    this.countdown = countdown;
    this.countdownDuration = countdownDuration;

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

    if (this.countdown) {
        this.startCountdown()
    }

    while (i < 1000) {
        await sleep(this.sleep_time);
        this.step(this.nextKeyDirection);
        scoreDiv.textContent = `${this.score}`;
        if (this.done) {
            window.removeEventListener("keydown", this.keyDown);
            break;
        }

        i++;
    }
    return this.score;
}

Game.prototype.reset_dom = function () {
    gridPanel.textContent = "";
    scoreDiv.textContent = "N/A";
    countdownDiv.textContent = "N/A";
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

Game.prototype.startCountdown = function() {
    startTime = Date.now()
    s = setInterval(() => {
        if (!this.done) {
            timeLeft = this.countdownDuration - (Date.now() - startTime)
            timeLeftSeconds = Math.max(Math.ceil(timeLeft / 1000), 0)

            timeLeftMinutesPart = Math.floor(timeLeftSeconds / 60)
            timeLeftSecondsPart = Math.floor(timeLeftSeconds % 60)

            countdownDiv.textContent = `Countdown: ${timeLeftMinutesPart}:${timeLeftSecondsPart}`

            if (timeLeft < 0) {
                this.done = true;
            }
        } else {
            clearInterval(s);
        }
    }, 100)
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
