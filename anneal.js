const screen = document.getElementById("screen");
const sizeSlider = document.getElementById("size");
const sizeDisplay = document.getElementById("sizeDisplay");
const freqSlider = document.getElementById("freq");
const freqDisplay = document.getElementById("freqDisplay");
const tempSlider = document.getElementById("temp");
const tempDisplay = document.getElementById("tempDisplay");
const fieldSlider = document.getElementById("field");
const fieldDisplay = document.getElementById("fieldDisplay");
const interSlider = document.getElementById("inter");
const interDisplay = document.getElementById("interDisplay");
const neighsSlider = document.getElementById("neighs");
const neighsDisplay = document.getElementById("neighsDisplay");


let x = 0;
const a = 1664525;
const c = 1013904223;
const m = 2 ** 32
function rng() {
    x = (a * x + c) % m;
    return x / m;
}


const screenEdge = 600;
screen.width = screenEdge;
screen.height = screenEdge;


const maxTemp = 10;
const minFreq = 0.02;
const Cmax = 100;
const Rmax = 100;
let temp;
let field;
let inter;
let freq;
let neighs;
let R, C;
function updater() {
    temp = maxTemp * tempSlider.value / 1000;
    tempDisplay.innerHTML = temp;

    field = (fieldSlider.value - 50) / 50;
    fieldDisplay.innerHTML = field;

    inter = interSlider.value;
    interDisplay.innerHTML = inter;

    freq = minFreq * 2 ** (10 * (1 - freqSlider.value / 100));
    freqDisplay.innerHTML = (1 / freq).toFixed(2);

    C = 4 * (3 + (sizeSlider.value * 2));
    if (neighsSlider.value == 0) {
        neighs = 3;
        R = C / 2;
    } else if (neighsSlider.value == 1) {
        neighs = 4;
        R = C;
    } else {
        neighs = 6;
        R = C;
    }
    neighsDisplay.innerHTML = neighs;
    sizeDisplay.innerHTML = C;
    pixelSize = screenEdge / C;
}
tempSlider.oninput = updater;
fieldSlider.oninput = updater;
interSlider.oninput = updater;
freqSlider.oninput = updater;
neighsSlider.oninput = updater;
sizeSlider.oninput = updater;
updater();


const context = screen.getContext("2d");
function frameValue(value, minLimit, maxLimit) {
    return Math.max(Math.min(value, maxLimit), minLimit);
}


function drawFilledPath(path, color) {
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(
        frameValue(path[0][0], 0, screenEdge),
        frameValue(path[0][1], 0, screenEdge),
    );
    for (let i = 1; i < path.length; i++) {
        context.lineTo(
            frameValue(path[i][0], 0, screenEdge),
            frameValue(path[i][1], 0, screenEdge),
        );
    }
    context.closePath();
    context.fill();
}


function drawTriangle(i, j, color) {
    let x0 = j * pixelSize;
    let y0 = i * 2 * pixelSize;
    let path = [
        [x0, (i + (i + j + 1) % 2) * 2 * pixelSize],
        [x0 - pixelSize, (i + (i + j) % 2) * 2 * pixelSize],
        [x0 + pixelSize, (i + (i + j) % 2) * 2 * pixelSize],
    ];
    drawFilledPath(path, color);
}


function drawRectangle(i, j, color) {
    context.fillStyle = color;
    context.fillRect(
        Math.floor(j * pixelSize),
        Math.floor(i * pixelSize),
        Math.ceil(pixelSize),
        Math.ceil(pixelSize),
    );
}


function drawHexagon(i, j, color) {
    let x0 = (j + 0.5 * (i % 2)) * pixelSize;
    let y0 = i * pixelSize;
    let path = [
        [x0, y0 + pixelSize * 2 / 3],
        [x0 - pixelSize / 2, y0 + pixelSize / 3],
        [x0 - pixelSize / 2, y0 - pixelSize / 3],
        [x0, y0 - pixelSize * 2 / 3],
        [x0 + pixelSize / 2, y0 - pixelSize / 3],
        [x0 + pixelSize / 2, y0 + pixelSize / 3],
    ];
    drawFilledPath(path, color);
}


// These will be used by the main()-function, in
// case the real values suddenly are altered.
let mainNeighs = neighs;
let mainR = R;
let mainC = C;
let values = [];
for (let i = 0; i < Rmax; i++) {
    values.push([]);
    for (let j = 0; j < Cmax; j++) {
        spin = rng() > 0.5 ? 1 : -1;
        values[i].push(spin);
    }
}


function drawSpin(i, j, spin) {
    let color = spin > 0 ? "#FFFFFF" : "#000000";
    if (mainNeighs == 3) {
        drawTriangle(i, j, color);
        if (j == 0) {
            drawTriangle(i, j + mainC, color);
        }
    } else if (mainNeighs == 4) {
        drawRectangle(i, j, color);
    } else {
        drawHexagon(i, j, color);
        if (i == 0) {
            drawHexagon(mainR, j, color);
        }
        if (j == 0) {
            drawHexagon(i, mainC, color);
        }
        if (i == 0 && j == 0) {
            drawHexagon(mainR, mainC, color);
        }
    }
}


function redraw() {
    for (let i = 0; i < mainR; i++) {
        for (let j = 0; j < mainC; j++) {
            drawSpin(i, j, values[i][j]);
        }
    }
}
redraw();


function getEnergyChange(i, j) {
    let i_next = (mainR + i + 1) % mainR
    let i_prev = (mainR + i - 1) % mainR
    let j_next = (mainC + j + 1) % mainC
    let j_prev = (mainC + j - 1) % mainC

    let center = values[i][j];
    let east = values[i][j_next];
    let west = values[i][j_prev];
    let north = values[i_next][j];
    let south = values[i_prev][j];

    let neighbours = east + west;
    if (mainNeighs == 3) {
        neighbours += ((i + j) % 2 ? north : south);
    } else if (mainNeighs == 4) {
        neighbours += north + south;
    } else { 
        let northern = north + values[i_next][i % 2 ? j_next : j_prev];
        let southern = south + values[i_prev][i % 2 ? j_next : j_prev];
        neighbours += northern + southern;
    }

    let interactiveDelta = 2 * inter * center * neighbours;
    let magneticDelta = 2 * field * center;
    return magneticDelta + interactiveDelta;
}


function somethingHasChanged() {
    return neighs != mainNeighs || C != mainC || R != mainR;
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


async function main() {
    while (true) {
        if (somethingHasChanged()) {
            mainC = C;
            mainR = R;
            mainNeighs = neighs;
            redraw();
        }
        for (let n = 0; n < mainR * mainC * minFreq / freq; n++) {
            let r = Math.floor(rng() * mainR);
            let c = Math.floor(rng() * mainC);
            let energyChange = getEnergyChange(r, c);
            if (Math.log(rng()) * temp < - energyChange) {
                let spin = -values[r][c];
                values[r][c] = spin;
                drawSpin(r, c, spin);
            }
        }
        await sleep(minFreq);
    }
}
main();
