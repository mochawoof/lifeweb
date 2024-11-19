let canvas = document.querySelector("#canvas");
let ctx = canvas.getContext("2d");

assetLoader.loadImages([
    "res/ui.png"
], () => {
    draw();
});

function draw() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(assetLoader.get("res/ui.png"), 0, 0);
}

document.onresize = draw;