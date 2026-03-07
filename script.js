

const bootLogs = [
    "INITIALIZING VOR7REX_OS v2.8...",
    "LOADING KERNEL MODULES...",
    "MOUNTING 3D_GEOMETRY_ENGINE...",
    "CHECKING V_RAM... OK",
    "ESTABLISHING NEURAL_LINK...",
    "DECRYPTING SHAPE_DATABASE...",
    "INJECTING GLITCH_PROTOCOLS...",
    "CORE_SYNC: STABLE",
    "READY TO DEPLOY."
];

function runBootSequence() {
    const logContainer = document.getElementById("boot-log");
    const bar = document.getElementById("boot-bar");
    const perc = document.getElementById("boot-percentage");
    const screen = document.getElementById("boot-screen");
    
    let progress = 0;
    let logIndex = 0;

    const interval = setInterval(() => {
        progress += Math.random() * 3;
        if (progress > 100) progress = 100;

        bar.style.width = `${progress}%`;
        perc.innerText = `${Math.floor(progress)}%`;

        if (progress > (logIndex + 1) * (100 / bootLogs.length) && logIndex < bootLogs.length) {
            const line = document.createElement("div");
            line.innerText = `> ${bootLogs[logIndex]}`;
            logContainer.prepend(line);
            logIndex++;
        }

        if (progress === 100) {
            clearInterval(interval);
            setTimeout(() => {
                screen.classList.add("flash-out");
            }, 500);
        }
    }, 50);
}

window.onload = runBootSequence;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const glitchTargets = document.querySelectorAll(".glitch-target");

let width, height, points = [];
let currentShape = 'sphere';
let visualMode = 1; 
const glitchChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@&*%?{}[])(";

let isHolding = false;
let holdStartTime = 0;
let systemOverload = false;
const OVERLOAD_THRESHOLD = 5000; 

let mouseX = 0, mouseY = 0, autoAngle = 0;
let targetAngleX = 0, targetAngleY = 0, currentAngleX = 0, currentAngleY = 0;
let baseRadius = 250, targetRadius = 250, currentRadius = 250;
const expansionEasing = 0.1, rotationSensitivity = 0.003, easingFactor = 0.05, autoSpeed = 0.01;

let initialPinchDistance = null, isPinching = false;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

function setVisualMode(mode) {
    visualMode = mode;
    document.body.className = `mode-${mode}`;
    applyGlobalGlitch();
}

function applyGlobalGlitch() {
    glitchTargets.forEach(el => {
        const originalHTML = el.innerHTML;
        el.classList.add("glitch-active");
        let iterations = 0;
        const interval = setInterval(() => {
            el.innerHTML = originalHTML.split("").map((char, index) => {
                if (index < iterations || char === "<" || char === ">" || char === "/") return char;
                return glitchChars[Math.floor(Math.random() * glitchChars.length)];
            }).join("");
            if (iterations >= 12) {
                clearInterval(interval);
                el.innerHTML = originalHTML;
                el.classList.remove("glitch-active");
            }
            iterations += 1;
        }, 30);
    });
}

function switchShape(shape) {
    if (currentShape === shape) return;
    currentShape = shape;
    applyGlobalGlitch();
    generatePoints();
}

function generatePoints() {
    points = [];
    
    if (currentShape === 'sphere') {
        const quantity = 50; 
        for (let i = 0; i <= quantity; i++) {
            const phi = (i / quantity) * Math.PI;
            for (let j = 0; j < quantity; j++) {
                const theta = (j / quantity) * (Math.PI * 2);
                points.push({ nx: Math.sin(phi) * Math.cos(theta), ny: Math.sin(phi) * Math.sin(theta), nz: Math.cos(phi), phi: phi });
            }
        }
    } else if (currentShape === 'cube') {
        const density = 20; const scale = 0.7;
        for (let x = -1; x <= 1; x += 2 / density) {
            for (let y = -1; y <= 1; y += 2 / density) {
                for (let z = -1; z <= 1; z += 2 / density) {
                    if (Math.abs(x) > 0.99 || Math.abs(y) > 0.99 || Math.abs(z) > 0.99) {
                        points.push({ nx: x * scale, ny: y * scale, nz: z * scale, phi: (y + 1) * Math.PI / 2 });
                    }
                }
            }
        }
    } else if (currentShape === 'torus') {
        const mR = 0.7, tR = 0.3;
        for (let i = 0; i < 40; i++) {
            const u = (i / 40) * Math.PI * 2;
            for (let j = 0; j < 40; j++) {
                const v = (j / 40) * Math.PI * 2;
                points.push({ nx: (mR + tR * Math.cos(v)) * Math.cos(u), ny: (mR + tR * Math.cos(v)) * Math.sin(u), nz: tR * Math.sin(v), phi: u });
            }
        }
    } else if (currentShape === 'pyramid') {
        const density = 25; const scale = 0.8;
        const vertices = [{x: 0, y: 1, z: 0}, {x: -1, y: -1, z: 1}, {x: 1, y: -1, z: 1}, {x: 0, y: -1, z: -1}];
        const createFace = (v1, v2, v3) => {
            for (let i = 0; i <= density; i++) {
                for (let j = 0; j <= density - i; j++) {
                    const a = i / density, b = j / density, c = 1 - a - b;
                    points.push({ nx: (a * v1.x + b * v2.x + c * v3.x) * scale, ny: (a * v1.y + b * v2.y + c * v3.y) * scale, nz: (a * v1.z + b * v2.z + c * v3.z) * scale, phi: (a * v1.y + b * v2.y + c * v3.y + 1) * Math.PI / 2 });
                }
            }
        };
        createFace(vertices[0], vertices[1], vertices[2]); createFace(vertices[0], vertices[2], vertices[3]); createFace(vertices[0], vertices[3], vertices[1]); createFace(vertices[1], vertices[2], vertices[3]);
    } else if (currentShape === 'cylinder') {
        const r = 0.6, h = 1.2;
        for (let i = 0; i < 50; i++) {
            const theta = (i / 50) * Math.PI * 2;
            for (let j = 0; j <= 30; j++) {
                const y = (j / 30) * h - (h / 2);
                points.push({ nx: r * Math.cos(theta), ny: y, nz: r * Math.sin(theta), phi: (y / h + 0.5) * Math.PI });
            }
        }
    }else if (currentShape === 'dna') {
        const length = 2.4;         
        const twists = 2.5;         
        const mainRadius = 0.55;    
        const tubeRadius = 0.12;    
        const sliceDensity = 120;   
        const ringDensity = 12;    

        for (let s = 0; s < 2; s++) { 
            const offset = s * Math.PI; 
            
            for (let i = 0; i < sliceDensity; i++) {
                const t = i / sliceDensity;
                const y = t * length - (length / 2);
                const mainAngle = t * Math.PI * 2 * twists + offset;

                
                const cx = Math.cos(mainAngle) * mainRadius;
                const cz = Math.sin(mainAngle) * mainRadius;

               
                for (let j = 0; j < ringDensity; j++) {
                    const subAngle = (j / ringDensity) * Math.PI * 2;
                  
                    const nx = cx + Math.cos(subAngle) * tubeRadius;
                    const nz = cz + Math.sin(subAngle) * tubeRadius;
                    const ny = y + Math.sin(subAngle) * 0.05; 

                    points.push({ nx, ny, nz, phi: mainAngle });
                }

                
                if (s === 0 && i % 12 === 0) {
                    const steps = 18;
                    for (let k = 0; k <= steps; k++) {
                        const lerp = k / steps;
                        const bx = cx * (1 - lerp) + (Math.cos(mainAngle + Math.PI) * mainRadius) * lerp;
                        const bz = cz * (1 - lerp) + (Math.sin(mainAngle + Math.PI) * mainRadius) * lerp;
                        
                        
                        points.push({ nx: bx, ny: y, nz: bz, phi: mainAngle });
                        points.push({ nx: bx, ny: y + 0.015, nz: bz, phi: mainAngle });
                    }
                }
            }
        }
    } else if (currentShape === 'octahedron') {
        const density = 20; const scale = 1.1;
        const vertices = [
            {x: 0, y: 1, z: 0}, {x: 0, y: -1, z: 0}, {x: 1, y: 0, z: 0},
            {x: -1, y: 0, z: 0}, {x: 0, y: 0, z: 1}, {x: 0, y: 0, z: -1}
        ];
        const createTriangle = (v1, v2, v3) => {
            for (let i = 0; i <= density; i++) {
                for (let j = 0; j <= density - i; j++) {
                    const a = i / density, b = j / density, c = 1 - a - b;
                    points.push({ nx: (a * v1.x + b * v2.x + c * v3.x) * scale, ny: (a * v1.y + b * v2.y + c * v3.y) * scale, nz: (a * v1.z + b * v2.z + c * v3.z) * scale, phi: (a * v1.y + b * v2.y + c * v3.y + 1) * Math.PI / 2 });
                }
            }
        };
        createTriangle(vertices[0], vertices[2], vertices[4]); createTriangle(vertices[0], vertices[4], vertices[3]);
        createTriangle(vertices[0], vertices[3], vertices[5]); createTriangle(vertices[0], vertices[5], vertices[2]);
        createTriangle(vertices[1], vertices[2], vertices[4]); createTriangle(vertices[1], vertices[4], vertices[3]);
        createTriangle(vertices[1], vertices[3], vertices[5]); createTriangle(vertices[1], vertices[5], vertices[2]);
    }
}generatePoints();

function updateExtraUI(time) {
    if (!document.querySelector(".glitch-active")) {
        let stress = isHolding && !systemOverload ? ((OVERLOAD_THRESHOLD - (Date.now() - holdStartTime))/1000).toFixed(1) + "s" : "---";
        document.getElementById("ui-top-right").innerHTML = `ROT_X: ${currentAngleX.toFixed(4)}<br>ROT_Y: ${currentAngleY.toFixed(4)}<br>STRESS: ${stress}`;
        document.getElementById("ui-bottom-left").innerHTML = `STATUS: ${systemOverload ? 'BUFFER_OVERFLOW' : 'STABLE'}<br>BG_COLOR: ${visualMode === 1 ? 'DARK' : 'LIGHT'}`;
        document.getElementById("ui-bottom-right").innerHTML = `UPTIME: ${(time / 1000).toFixed(1)}s<br>[ ENGINE_V2.8 ]`;
    }
}

function startHold() { isHolding = true; holdStartTime = Date.now(); targetRadius = 450; }
function endHold() { isHolding = false; systemOverload = false; targetRadius = baseRadius; }
function handleMove(x, y) { mouseX = x - width / 2; mouseY = y - height / 2; targetAngleY = mouseX * rotationSensitivity; targetAngleX = -mouseY * rotationSensitivity; }

window.addEventListener('mousedown', startHold);
window.addEventListener('mouseup', endHold);
window.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY));
window.addEventListener('wheel', (e) => { if (e.ctrlKey) { e.preventDefault(); baseRadius *= (1 - e.deltaY * 0.005); targetRadius = baseRadius; } }, { passive: false });
window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) { isPinching = false; startHold(); handleMove(e.touches[0].clientX, e.touches[0].clientY); }
    else if (e.touches.length === 2) { isPinching = true; initialPinchDistance = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }
}, { passive: false });
window.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && !isPinching) handleMove(e.touches[0].clientX, e.touches[0].clientY);
    else if (e.touches.length === 2) {
        const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        baseRadius *= (d / initialPinchDistance); targetRadius = baseRadius; initialPinchDistance = d;
    }
}, { passive: false });
window.addEventListener('touchend', endHold);

function drawGlitchBackground() {
    const fontSize = 14;
    ctx.font = `${fontSize}px 'Courier New', monospace`;
    ctx.fillStyle = visualMode === 1 ? 'rgba(0, 255, 0, 0.3)' : 'rgba(0, 0, 0, 0.3)';
    for (let i = 0; i < 15; i++) {
        const x = Math.random() * width; const y = Math.random() * height;
        let randomText = "";
        for (let j = 0; j < 20; j++) randomText += glitchChars[Math.floor(Math.random() * glitchChars.length)];
        ctx.fillText(randomText, x, y);
    }
}

function animate(time) {
    if (isHolding && !systemOverload && (Date.now() - holdStartTime > OVERLOAD_THRESHOLD)) {
        systemOverload = true;
        applyGlobalGlitch();
    }
    
    ctx.fillStyle = visualMode === 1 ? 'rgba(0, 0, 0, 0.15)' : 'rgba(245, 245, 247, 0.15)';
    ctx.fillRect(0, 0, width, height);
    if (systemOverload) drawGlitchBackground();
    
    autoAngle += autoSpeed;
    currentAngleX += (targetAngleX - currentAngleX) * easingFactor;
    currentAngleY += (targetAngleY - currentAngleY) * easingFactor;
    currentRadius += (targetRadius - currentRadius) * expansionEasing;
    updateExtraUI(time);

  
    const cycleDuration = currentShape === 'dna' ? 15000 : 10000;
    const phaseDuration = cycleDuration / 2;
    const isPhaseA = (time % cycleDuration) < phaseDuration;

    const waveDivisor = currentShape === 'dna' ? 800 : 2000; 
    const wave = ((time % phaseDuration) / waveDivisor);

    points.forEach(p => {
        let px = p.nx * currentRadius, py = p.ny * currentRadius, pz = p.nz * currentRadius;
        
        if (systemOverload) {
            px += (Math.random() - 0.5) * 10;
            py += (Math.random() - 0.5) * 10;
        }

        const ay = autoAngle + currentAngleY, ax = currentAngleX;
        let x = px * Math.cos(ay) - pz * Math.sin(ay);
        let z = px * Math.sin(ay) + pz * Math.cos(ay);
        let y = py * Math.cos(ax) - z * Math.sin(ax);
        z = py * Math.sin(ax) + z * Math.cos(ax);
        
        const s = 1000 / (1000 + z);
        const finalX = x * s + width / 2;
        const finalY = y * s + height / 2;

        
        const lat = p.phi / Math.PI;
        let r, g, b;

        if (visualMode === 1) {
            const isRed = isPhaseA ? (lat < wave) : (lat >= wave);
            r = isRed ? 255 : 0; g = isRed ? 0 : 255; b = 0;
        } else {
            const isPurple = isPhaseA ? (lat < wave) : (lat >= wave);
            r = isPurple ? 150 : 0; g = 0; b = 255; 
        }

        const op = Math.max(0.1, (currentRadius * 2 - z) / (currentRadius * 4));
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${op})`;
        ctx.beginPath(); 
        ctx.arc(finalX, finalY, 2.5 * s, 0, Math.PI * 2); 
        ctx.fill();
    });
    requestAnimationFrame(animate);}requestAnimationFrame(animate);