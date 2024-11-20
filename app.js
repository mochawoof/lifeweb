let canvas = document.querySelector("#canvas");
let ctx = canvas.getContext("2d");

assetLoader.loadImages([
    "res/ui.png"
], () => {
    draw();
});

let generation = 0;
let frameTime = 0;
let cellSize = 10;
let shouldDrawGrid = true;
let shouldDrawInfo = true;

let isMouseDown = false;
let tool = "brush"; // brush, eraser

let cells = [];
let highlightedCell = [];

function reset() {
    generation = 0;
    cells = [];
    draw();
}

function getCellIndex(cell) {
    for (let i = 0; i < cells.length; i++) {
        let cellCompare = cells[i];
        if (cellCompare[0] == cell[0] && cellCompare[1] == cell[1]) {
            return i;
        }
    }
    return -1;
}

function getNeighbors(cell) {
    return [
        [cell[0] - 1, cell[1] - 1],
        [cell[0], cell[1] - 1],
        [cell[0] + 1, cell[1] - 1],

        [cell[0] - 1, cell[1]],
        [cell[0] + 1, cell[1]],

        [cell[0] - 1, cell[1] + 1],
        [cell[0], cell[1] + 1],
        [cell[0] + 1, cell[1] + 1],
    ];
}

function killCell(cell) {
    let cellIndex = getCellIndex(cell);
    if (cellIndex != -1) {
        cells.splice(cellIndex, 1);
    }
}

function spawnCell(cell) {
    killCell(cell);
    cells.push(cell);
}

function doGeneration() {
    let toKill = [];
    let toSpawn = [];

    for (let i = 0; i < cells.length; i++) {
        let cell = cells[i];
        let neighbors = getNeighbors(cell);

        let aliveNeighbors = 0;
        neighbors.forEach((n) => {
            let cellIndex = getCellIndex(n);
            if (cellIndex != -1) {
                aliveNeighbors++;
            } else {
                // Spawn rule
                let dNeighbors = getNeighbors(n);
                let dAliveNeighbors = 0;
                dNeighbors.forEach((dn) => {
                    let dCellIndex = getCellIndex(dn);
                    if (dCellIndex != -1) {
                        dAliveNeighbors++;
                    }
                });

                if (dAliveNeighbors == 3) {
                    toSpawn.push(n);
                }
            }
        });

        // https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life#Rules
        if (aliveNeighbors < 2) {
            toKill.push(cell);
        } else if (aliveNeighbors > 3) {
            toKill.push(cell);
        }
    }

    // Kill cells
    toKill.forEach((cell) => {
        killCell(cell);
    });
    toSpawn.forEach((cell) => {
        spawnCell(cell);
    });

    generation++;
}

function draw() {
    let drawStart = Date.now();

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw cells
    for (let i = 0; i < cells.length; i++) {
        let cell = cells[i];
        ctx.fillStyle = "#000";
        ctx.fillRect(cell[0] * cellSize, cell[1] * cellSize, cellSize, cellSize);
    }
    
    // Draw highlighted cell
    if (highlightedCell.length == 2) {
        ctx.fillStyle = "#ddd";
        ctx.fillRect(highlightedCell[0] * cellSize, highlightedCell[1] * cellSize, cellSize, cellSize);
    }

    // draw grid
    if (shouldDrawGrid) {
        ctx.fillStyle = "#ddd";
        for (let x = 0; x < canvas.width; x += cellSize) {
            ctx.fillRect(x, 0, 1, canvas.height);
        }
        for (let y = 0; y < canvas.height; y += cellSize) {
            ctx.fillRect(0, y, canvas.width, 1);
        }
    }
    
    // no strenuous draws should be made after frameTime is calculated
    frameTime = Date.now() - drawStart;

    if (shouldDrawInfo) {
        ctx.fillStyle = "#000";
        ctx.font = "14px sans-serif";
        ctx.fillText("Generation " + generation, canvas.width - 200, 14);
        ctx.fillText("Frame time " + frameTime, canvas.width - 200, 14 * 2);
    }
}

document.onmousemove = (e) => {
    highlightedCell = [
        Math.floor(e.offsetX / cellSize),
        Math.floor(e.offsetY / cellSize)
    ];

    // Handle brush
    if (isMouseDown) {
        if (tool == "brush") {
            spawnCell(highlightedCell);
        } else if (tool == "eraser") {
            killCell(highlightedCell);
        }
    }

    draw();
}

document.onmousedown = (e) => {
    isMouseDown = true;
    let cellIndex = getCellIndex(highlightedCell);
    if (cellIndex != -1) {
        tool = "eraser";
        killCell(highlightedCell);
    } else {
        tool = "brush";
        spawnCell(highlightedCell);
    }
    highlightedCell = [];
    draw();
}

document.onmouseup = (e) => {
    isMouseDown = false;
}

document.onresize = draw;