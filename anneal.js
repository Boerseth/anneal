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


let neighs;
const Cmax = 100;
const Rmax = 100;
let R, C;
function updater() {
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
neighsSlider.oninput = updater;
sizeSlider.oninput = updater;
updater();


// Based on std of collection of all possible energies, it
// seems like critial temperature is sqrt(number of neighs)
const maxTemp = 10;
let temp;
tempSlider.oninput = function() {
	temp = maxTemp * tempSlider.value / 1000;
	tempDisplay.innerHTML = temp;
}
tempSlider.oninput();


let field;
fieldSlider.oninput = function() {
	field = (fieldSlider.value - 50) / 50;
	fieldDisplay.innerHTML = field;
}
fieldSlider.oninput();


let inter;
interSlider.oninput = function() {
	inter = interSlider.value;
	interDisplay.innerHTML = inter;
}
interSlider.oninput();


const minFreq = 0.02;
let freq;
freqSlider.oninput = function() {
	freq = minFreq * 2 ** (10 * (1 - freqSlider.value / 100));
	freqDisplay.innerHTML = (1 / freq).toFixed(2);
}
freqSlider.oninput();


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
    let path = []
    for (let k of [0, 1, 2]) {
        path.push(
            [
                (j - 1 + k) * pixelSize,
                (i + (i + j + k) % 2) * 2 * pixelSize,
            ],
        );
    }
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
    x0 = (j + 0.5 * (i % 2)) * pixelSize;
    y0 = i * pixelSize;
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
            if (j == 0) {
                drawHexagon(mainR, mainC, color);
            }
        }
        if (j == 0) {
            drawHexagon(i, mainC, color);
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

    let magneticDelta = 2 * field * center;
    let interactiveDelta;
    if (mainNeighs == 3) {
        interactiveDelte = 2 * inter * center * (
            east + west + ((i + j) % 2 ? north : south)
        );
    } else if (mainNeighs == 4) {
        interactiveDelte = 2 * inter * center * (
            east + west + north + south
        );
    } else { 
        let northEast = values[i_next][j_next];
        let northWest = values[i_next][j_prev];
        let northern = north + (i % 2 == 0 ? northWest : northEast);
        let southEast = values[i_prev][j_next];
        let southWest = values[i_prev][j_prev];
        let southern = south + (i % 2 == 0 ? southWest : southEast);
        interactiveDelte = 2 * inter * center * (
            east + west + northern + southern
        );
    }
    return magneticDelta + interactiveDelte;
}


function somethingHasChanged() {
    if (neighs != mainNeighs) {
        return true;
    } else if (mainC != C) {
        return true;
    } else if (mainR != R) {
        return true;
    }
    return false;
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
