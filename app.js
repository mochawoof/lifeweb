let canvas = document.querySelector("#canvas");
let ctx = canvas.getContext("2d");

let generation = 0;
let frameTime = 0;
let cellSize = 10;
let shouldDrawGrid = true;
let shouldDrawInfo = true;

let isMouseDown = false;
let tool = "brush"; // brush, eraser

let cells = [];
let highlightedCell = [];

let playFn = -1;
let speed = 1;
let off = [0, 0];

let playPauseButton = document.querySelector("#playPauseButton");

function clamp(n, min, max) {
    if (n < min) {
        return min;
    } else if (n > max) {
        return max;
    } else {
        return n;
    }
}

function zoomOut() {
    cellSize = clamp(cellSize - 5, 2, 50);
    draw();
}

function zoomReset() {
    cellSize = 10;
    draw();
}

function zoomIn() {
    cellSize = clamp(cellSize + 5, 2, 50);
    draw();
}

function picture(withGrid) {
    shouldDrawGrid = withGrid;
    shouldDrawInfo = false;
    draw();
    let url = canvas.toDataURL("image/jpeg");
    let a = document.createElement("a");
    a.href = url;
    a.download = "picture.jpg";
    a.click();

    shouldDrawGrid = true;
    shouldDrawInfo = true;
    draw();
}

function save() {
    let data = JSON.stringify(cells);
    let url = "data:text/plain;," + data;
    let a = document.createElement("a");
    a.href = url;
    a.download = "game.cgl";
    a.click();
}

function load() {
    let input = document.createElement("input");
    input.type = "file";
    input.accept = ".cgl";
    input.oninput = (e) => {
        if (input.files.length > 0) {
            reset();
            let file = input.files[0];
            let reader = new FileReader();
            reader.onload = (t) => {
                let loaded = JSON.parse(reader.result);
                cells = loaded;
                draw();
            }
            reader.readAsText(file);
        }
    }
    input.click();
}

function setSpeed(sp) {
    speed = sp;
    if (playFn != -1) {
        play();
    } else {
        draw();
    }
}

function playPause() {
    if (playPauseButton.classList.contains("play")) {
        play();
    } else {
        pause();
    }
}

function play() {
    pause();
    playPauseButton.classList.remove("play");
    playPauseButton.classList.add("pause");
    playPauseButton.title = "Pause";

    playFn = setInterval(() => {
        doGeneration();
        draw();
    }, 1000 / speed);
}

function pause() {
    playPauseButton.classList.remove("pause");
    playPauseButton.classList.add("play");
    playPauseButton.title = "Play";

    clearInterval(playFn);
    playFn = -1;
}

function reset() {
    pause();
    generation = 0;
    cells = [];
    off = [0, 0];
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
        let x = (cell[0] - off[0]) * cellSize;
        let y = (cell[1] - off[1]) * cellSize;

        // Don't draw if it's outside of the canvas
        if (x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
            ctx.fillStyle = "#000";
            ctx.fillRect(x, y, cellSize, cellSize);
        }
    }

    // Draw highlighted cell
    if (highlightedCell.length == 2 && !isMouseDown) {
        ctx.fillStyle = "#ddd";
        ctx.fillRect((highlightedCell[0] - off[0]) * cellSize, (highlightedCell[1] - off[1]) * cellSize, cellSize, cellSize);
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
        let width = 100;
        ctx.fillText("Generation " + generation, canvas.width - width, 14, width);
        ctx.fillText("Frame time " + frameTime, canvas.width - width, 14 * 2, width);
        ctx.fillText(off[0] + ", " + off[1], canvas.width - width, 14 * 3, width);
        ctx.fillText(speed + "x", canvas.width - width, 14 * 4, width);
    }
}

canvas.onmousemove = (e) => {
    highlightedCell = [
        Math.floor(e.offsetX / cellSize) + off[0],
        Math.floor(e.offsetY / cellSize) + off[1]
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
canvas.addEventListener("touchmove", (e) => {
    isMouseDown = true;
    canvas.onmousemove({
        offsetX: (e.changedTouches[0].clientX),
        offsetY: (e.changedTouches[0].clientY)
    });
    isMouseDown = false;
});

canvas.onmousedown = (e) => {
    isMouseDown = true;
    let cellIndex = getCellIndex(highlightedCell);
    if (cellIndex != -1) {
        tool = "eraser";
        killCell(highlightedCell);
    } else {
        tool = "brush";
        spawnCell(highlightedCell);
    }
    draw();
}

canvas.onmouseup = (e) => {
    isMouseDown = false;
}

canvas.onmouseleave = (e) => {
    isMouseDown = false;
    highlightedCell = [];
    draw();
}

document.onresize = draw;
draw();
