/*
game env 
* board
* direction
* snake
* pellet
* score
* done
* step(direction) --> updates game state by 1 step

ui (will be taken care of in html/css)

*/

const DIRECTION = Object.freeze({
    UP: 1,
    RIGHT: 2,
    DOWN: 3,
    LEFT: 4,
});

const gridHeight = 20;
const gridWidth = 20;




// grid
const grid = [];

const gridContainer = document.querySelector(".grid-container");
for (let row = 0; row < gridHeight; row++) {
    const d = document.createElement("div");
    d.classList.add("grid-row");
    grid.push([]);
    gridContainer.appendChild(d);
}

const gridRows = document.querySelectorAll(".grid-row");
for (let row = 0; row < gridRows.length; row++) {    
    for (let col = 0; col < gridWidth; col++) {
        const d = document.createElement("div");
        d.classList.add("grid-unit-empty");
        grid[row].push(d);
        gridRows[row].appendChild(d);
    }
}


const state = {
    snakeNodes: [[4, 4], [4, 5], [4, 6]],
    snakeDirection: DIRECTION.RIGHT,
    nextKeyDirection: DIRECTION.RIGHT,
    foodNode: [10, 10],
    score: 0,
    done: false,
};


// snake. [tailNode, ..., headNode]
// const state.snakeNodes = [[4, 4], [4, 5], [4, 6]];
// let state.snakeDirection = DIRECTION.RIGHT;
// let state.foodNode = [10, 10];
// let state.score = 0;
// let state.done = false;

for (let i = 0; i < state.snakeNodes.length; i++) {
    const [row, col] = state.snakeNodes[i];
    grid[row][col].classList.remove("grid-unit-empty");
    grid[row][col].classList.add("grid-unit-snake");
    // TODO: use "add/remove" instead of toggle
}

const [foodRow, foodCol] = state.foodNode;
grid[foodRow][foodCol].classList.remove("grid-unit-empty");
grid[foodRow][foodCol].classList.toggle("grid-unit-food");









function step(direction) {
    /*
    Do the full operation of stepping 

    check if nextnodeloc is okay:
    4 possible entered spaces:
    * snake --> lose
    * blank --> good, and remove tail
    * food --> good (don't remove tail)
    * wall (outside grid) --> lose
    

    if okay, then execute the action, updating all variables and updating the DOM grid
    */
    moveDirection = computeMoveDirection(direction)
    const [nextRow, nextCol] = computeNextNodeLoc(moveDirection); 
    if (!withinGrid(nextRow, nextCol)) {
        state.done = true;
    } else {
        const cls = getOne(grid[nextRow][nextCol].classList)
        if (cls == "grid-unit-snake") {
            state.done = true;
        } else if (cls == "grid-unit-empty") {
            const [oldTailRow, oldTailCol] = state.snakeNodes.shift();
            state.snakeNodes.push([nextRow, nextCol]);
            
            // TODO could simplify the grid unit classes to not have to add/remove "empty" every time
            grid[oldTailRow][oldTailCol].classList.remove("grid-unit-snake");
            grid[oldTailRow][oldTailCol].classList.add("grid-unit-empty");

            grid[nextRow][nextCol].classList.remove("grid-unit-empty");
            grid[nextRow][nextCol].classList.add("grid-unit-snake");

            state.snakeDirection = moveDirection;
        } else if (cls == "grid-unit-food") {
            // update snake head , update grid head and food, update foodLoc, and update score
            state.score += 10;

            state.snakeNodes.push([nextRow, nextCol]);
            grid[nextRow][nextCol].classList.remove("grid-unit-food");
            grid[nextRow][nextCol].classList.add("grid-unit-snake");

            // TODO continue here to put in food at random loc.
            const [newFoodRow, newFoodCol] = newFoodNode();
            state.foodNode = [newFoodRow, newFoodCol]
            grid[newFoodRow][newFoodCol].classList.remove("grid-unit-empty");
            grid[newFoodRow][newFoodCol].classList.add("grid-unit-food");

            state.snakeDirection = moveDirection;
        } else {
            throw "An error occurred. An invalid case was reached."
        }
    }
    // if grid[]

}

function computeNextNodeLoc(moveDirection) {
    /* Returns next node location (might be out of bounds), given the direction
    */
    const [headRow, headCol] = state.snakeNodes[state.snakeNodes.length - 1];
    // const headRow = headNodeLoc[0];
    // const headCol = headNodeLoc[1];

    // // movementDirection is same as input direction, except if opposite direction (not allowed)
    // let movementDirection;
    // if (direction != oppositeDirection(state.snakeDirection)) {
    //     movementDirection = direction;
    // } else {
    //     movementDirection = state.snakeDirection;
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
        throw "`movementDirection` is not valid!";
    }
        
}

function computeMoveDirection(direction) {
    // movementDirection is same as input direction, except if opposite direction (not allowed)
    if (direction != oppositeDirection(state.snakeDirection)) {
        return direction;
    } else {
        return state.snakeDirection;
    }
}

function oppositeDirection(direction) {
    const dirModifiedIndex = direction - 1;
    return 1 + (dirModifiedIndex + 2) % 4;
}

function withinGrid(row, col) {
    const rowWithinGrid = (row < gridHeight) && (row >= 0)
    const colWithinGrid = (col < gridWidth) && (col >= 0)
    if (rowWithinGrid && colWithinGrid) {
        return true;
    } else {
        return false;
    }
}

function getOne(arr) {
    if (arr.length != 1) {
        throw "`arr` must have exactly one element"
    } else {
        return arr[0];
    }

}

function newFoodNode() {
    // Finds a new food loc. If no empty spaces, return [-1, -1]
    // generate all empty
    const emptyNodes = []
    for (let row = 0; row < gridHeight; row++) {
        for (let col = 0; col < gridWidth; col++) {
            const isSnakeNodes = (searchForArray(state.snakeNodes, [row, col]) >= 0);
            const isFoodNode = ((row == state.foodNode[0]) && (col == state.foodNode[1]));
            if (!isSnakeNodes && !isFoodNode) {
                emptyNodes.push([row, col])
            }
        }
    }

    const [r, c] = emptyNodes[randomInt(0, emptyNodes.length)]
    return [r, c]
}

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


// from https://www.joshwcomeau.com/snippets/javascript/random/
// This random function includes the lower bound, but excludes the upper bound
const randomInt = (min, max) => Math.floor(Math.random() * (max - min)) + min;


window.addEventListener("keydown", keyDown);
textBox = document.querySelector(".text-box")

function keyDown(e) {
    let direction;
    if (e.key == "ArrowUp") {
        direction = DIRECTION.UP;
    } else if (e.key == "ArrowRight") {
        direction = DIRECTION.RIGHT;
    } else if (e.key == "ArrowDown") {
        direction = DIRECTION.DOWN;
    } else if (e.key == "ArrowLeft") {
        direction = DIRECTION.LEFT;
    }
    step(direction);
    textBox.textContent = `Score: ${state.score}`;
    
    if (state.done) {
        textBox.textContent = `Game finished! Final score: ${state.score}`;
        window.removeEventListener("keydown", keyDown);
    }
}


// step(DIRECTION.DOWN)
// step(DIRECTION.DOWN)
// step(DIRECTION.DOWN)
// step(DIRECTION.DOWN)
// step(DIRECTION.DOWN)
// step(DIRECTION.DOWN)
// step(DIRECTION.RIGHT)
// step(DIRECTION.RIGHT)
// step(DIRECTION.RIGHT)
// step(DIRECTION.RIGHT)
// step(DIRECTION.RIGHT)
// step(DIRECTION.RIGHT)
// step(DIRECTION.RIGHT)



// const INIT_SNAKE_LENGTH = 3
// const MIN_BOARD_HEIGHT = 5
// const MIN_BOARD_WIDTH = 5

// const DIRECTION = Object.freeze({
//     UP: 1,
//     DOWN: 2,
//     LEFT: 3,
//     RIGHT: 4,
// })

// function Env (height, width) {
//     // 2D grid of zeros
//     if (height < MIN_BOARD_HEIGHT || width < MIN_BOARD_WIDTH) {
//         error_msg = [
//             `Board height and width must be larger than minima of ${MIN_BOARD_HEIGHT} and `,
//             ` ${MIN_BOARD_WIDTH}, respectively.`,
//         ].join("")
//         throw error_msg
//     }

//     this.board = Array(board_size).fill().map(() => Array(board_size).fill(0));
//     this.direction = DIRECTION.RIGHT
//     this.score = 0
//     this.done = false

//     // snake
//     this.snake = [[0, 2], [0, 1], [0, 0]]

//     // TODO: generate random location for pellet



// }


// function randomInt(min, max) {
//     if (!(Number.isInteger(min) && Number.isInteger(max))) {
//         throw "`min` and `max` must both be integers."
//     }
//     return Math.floor(Math.random() * (max - min + 1) + min)
// }

// board.length = 3;
// board.fill(0);

// console.log("UP" in Direction.)
console.log("Test2!");