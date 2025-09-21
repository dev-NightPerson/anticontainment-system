import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FractalStems } from './stems.js';

// --- Unified Labyrinth Generation for a Cube ---
class UnifiedLabyrinthGenerator {
    constructor(size) {
        this.size = size;
        this.grids = Array(6).fill(null).map(() => 
            Array(size).fill(null).map(() => Array(size).fill(1)) // 1 = wall, 0 = path
        );
        this.stack = [];
        this.pathQueues = Array(6).fill(null).map(() => []);
        this.pathContinuity = []; // Stores {face, x, y} for edge crossings
        this.dirtyFaces = new Set(); // Track which faces need redrawing

        this.colors = {
            highWall: '#3a2c13', // Darker top surface for walls
            highWallLight: '#8c6b3a', // Lighter shade for wall sides
            highWallDark: '#2b200e', // Darker shade for wall sides
            lowPath: 'rgba(0, 0, 0, 0)', // Fully transparent path
            floor: '#5a431c' // Darker floor color
        };

        // Adjacency map: [face, edge] -> [adj_face, adj_edge, transform_fn]
        // Edges: 0: top (y=0), 1: right (x=size-1), 2: bottom (y=size-1), 3: left (x=0)
        // Faces: 0:+X, 1:-X, 2:+Y, 3:-Y, 4:+Z, 5:-Z
        const s = this.size - 1;
        this.adjacency = {
            // Face 0 (+X, right)
            '0,0': [2, 1, (x, y) => [s, x]],       // Top -> Top face, right edge
            '0,1': [5, 3, (x, y) => [0, y]],       // Right -> Back face, left edge
            '0,2': [3, 1, (x, y) => [s, s - x]],   // Bottom -> Bottom face, right edge
            '0,3': [4, 1, (x, y) => [s, y]],       // Left -> Front face, right edge
            // Face 1 (-X, left)
            '1,0': [2, 3, (x, y) => [0, s - x]],   // Top -> Top face, left edge
            '1,1': [4, 3, (x, y) => [0, y]],       // Right -> Front face, left edge
            '1,2': [3, 3, (x, y) => [0, x]],       // Bottom -> Bottom face, left edge
            '1,3': [5, 1, (x, y) => [s, y]],       // Left -> Back face, right edge
            // Face 2 (+Y, top)
            '2,0': [5, 0, (x, y) => [x, 0]],       // Top -> Back face, top edge
            '2,1': [0, 0, (x, y) => [y, 0]],       // Right -> Right face, top edge
            '2,2': [4, 0, (x, y) => [x, 0]],       // Bottom -> Front face, top edge
            '2,3': [1, 0, (x, y) => [s - y, 0]],   // Left -> Left face, top edge
            // Face 3 (-Y, bottom)
            '3,0': [4, 2, (x, y) => [x, s]],       // Top -> Front face, bottom edge
            '3,1': [0, 2, (x, y) => [y, s]],       // Right -> Right face, bottom edge
            '3,2': [5, 2, (x, y) => [x, s]],       // Bottom -> Back face, bottom edge
            '3,3': [1, 2, (x, y) => [y, s]],       // Left -> Left face, bottom edge
            // Face 4 (+Z, front)
            '4,0': [2, 2, (x, y) => [x, s]],       // Top -> Top face, bottom edge
            '4,1': [0, 3, (x, y) => [0, y]],       // Right -> Right face, left edge
            '4,2': [3, 0, (x, y) => [x, 0]],       // Bottom -> Bottom face, top edge
            '4,3': [1, 1, (x, y) => [s, y]],       // Left -> Left face, right edge
            // Face 5 (-Z, back)
            '5,0': [2, 0, (x, y) => [x, 0]],       // Top -> Top face, top edge
            '5,1': [1, 3, (x, y) => [0, y]],       // Right -> Left face, left edge
            '5,2': [3, 2, (x, y) => [x, s]],       // Bottom -> Bottom face, bottom edge
            '5,3': [0, 1, (x, y) => [s, y]],       // Left -> Right face, right edge
        };

        this.startCarving();
    }

    startCarving() {
        const startFace = Math.floor(Math.random() * 6);
        const startX = Math.floor(Math.random() * ((this.size - 1) / 2)) * 2 + 1;
        const startY = Math.floor(Math.random() * ((this.size - 1) / 2)) * 2 + 1;
        this.grids[startFace][startY][startX] = 0;
        this.stack.push([startFace, startX, startY]);
        this.pathQueues[startFace].push([startX, startY]);
        this.dirtyFaces.add(startFace);
    }

    fillStep() {
        for (let f = 0; f < 6; f++) {
            if (this.pathQueues[f].length > (this.size * this.size) / 4) {
                const [x, y] = this.pathQueues[f].shift();
                this.grids[f][y][x] = 1; // Turn path back into a wall
                this.dirtyFaces.add(f);
            }
        }
        // Prune old continuity points
        if (this.pathContinuity.length > this.size * 6) {
            this.pathContinuity.splice(0, this.pathContinuity.length - this.size * 6);
        }
    }

    step() {
        if (this.stack.length === 0) {
            this.startCarving();
            return;
        }

        const [cf, cx, cy] = this.stack[this.stack.length - 1];
        const neighbors = [];

        // Local neighbors
        // Push format: [is_local, new_face, new_x, new_y, wall_x, wall_y]
        if (cx > 1 && this.grids[cf][cy][cx - 2] === 1) neighbors.push([true, cf, cx - 2, cy, cx - 1, cy]);
        if (cx < this.size - 2 && this.grids[cf][cy][cx + 2] === 1) neighbors.push([true, cf, cx + 2, cy, cx + 1, cy]);
        if (cy > 1 && this.grids[cf][cy - 2][cx] === 1) neighbors.push([true, cf, cx, cy - 2, cx, cy - 1]);
        if (cy < this.size - 2 && this.grids[cf][cy + 2][cx] === 1) neighbors.push([true, cf, cx, cy + 2, cx, cy + 1]);

        // Edge neighbors
        // Push format: [is_local, new_face, new_x, new_y, wall_face, wall_x, wall_y]
        const checkEdge = (edge, wall_x, wall_y) => {
            const connection = this.adjacency[`${cf},${edge}`];
            if (connection) {
                const [nf, , transform_fn] = connection;
                const [nx, ny] = transform_fn(wall_x, wall_y);
                 // The new cell is one step away from the edge on the new face
                let next_nx = nx, next_ny = ny;
                if (nx === 0) next_nx = 1;
                else if (nx === this.size - 1) next_nx = this.size - 2;
                if (ny === 0) next_ny = 1;
                else if (ny === this.size - 1) next_ny = this.size - 2;

                 if (nf >= 0 && nf < 6 && next_ny >= 0 && next_ny < this.size && next_nx >= 0 && next_nx < this.size && this.grids[nf][next_ny][next_nx] === 1) {
                     neighbors.push([false, nf, next_nx, next_ny, cf, wall_x, wall_y]);
                }
            }
        };
        if (cy === 1) checkEdge(0, cx, 0); // Top edge wall
        if (cx === this.size - 2) checkEdge(1, this.size - 1, cy); // Right edge wall
        if (cy === this.size - 2) checkEdge(2, cx, this.size - 1); // Bottom edge wall
        if (cx === 1) checkEdge(3, 0, cy); // Left edge wall

        if (neighbors.length > 0) {
            const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
            const isLocal = chosen[0];

            if (isLocal) {
                const [, nf, nx, ny, wx, wy] = chosen;
                const wf = nf; // Wall face is same as new face for local
                this.grids[nf][ny][nx] = 0; // Carve path to neighbor
                this.grids[wf][wy][wx] = 0; // Carve wall in between
                
                this.pathQueues[nf].push([nx, ny]);
                this.pathQueues[wf].push([wx, wy]);
                
                this.dirtyFaces.add(nf);
                
                this.stack.push([nf, nx, ny]);
            } else {
                 const [, nf, nx, ny, wf, wx, wy] = chosen;
                 
                 // Carve path on new face
                 this.grids[nf][ny][nx] = 0;
                 this.pathQueues[nf].push([nx, ny]);
                 this.dirtyFaces.add(nf);

                 // Carve wall on current face's edge
                 this.grids[wf][wy][wx] = 0;
                 this.pathQueues[wf].push([wx, wy]);
                 this.dirtyFaces.add(wf);
                 
                 // Also carve the wall on the adjacent face's edge for continuity
                 const edge = this.getEdge(wx, wy);
                 const connection = this.adjacency[`${wf},${edge}`];
                 if (connection) {
                    const transform_fn = connection[2];
                    const [adj_wx, adj_wy] = transform_fn(wx, wy);
                    this.grids[nf][adj_wy][adj_wx] = 0;
                    this.pathQueues[nf].push([adj_wx, adj_wy]);
                    // Store continuity points
                    this.pathContinuity.push({face: wf, x: wx, y: wy});
                    this.pathContinuity.push({face: nf, x: adj_wx, y: adj_wy});
                 }

                 this.stack.push([nf, nx, ny]);
            }

        } else {
            this.stack.pop();
        }
    }
    
    getEdge(x, y) {
        if (y === 0) return 0; // Top
        if (x === this.size - 1) return 1; // Right
        if (y === this.size - 1) return 2; // Bottom
        if (x === 0) return 3; // Left
        return -1; // Should not happen for edge cells
    }

    drawFace(faceIndex, ctx) {
        const grid = this.grids[faceIndex];
        const cellSize = ctx.canvas.width / this.size;
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        const bctx = bumpContexts[faceIndex];

        // Clear canvases for transparency
        ctx.clearRect(0, 0, width, height);
        if (bctx) bctx.clearRect(0, 0, width, height);

        // --- Draw floor and circuit pattern ONLY on wall areas ---
        ctx.save();
        ctx.beginPath();
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                if (grid[y][x] === 1) { // It's a wall
                    ctx.rect(x * cellSize, y * cellSize, cellSize, cellSize);
                }
            }
        }
        // Clip to walls so everything we paint next only affects wall cells
        ctx.clip();

        // Bronze plate background inside wall regions
        (function drawBronzePlatesInWalls() {
            // Slight dark base
            ctx.fillStyle = '#2d1f0e';
            ctx.fillRect(0, 0, width, height);
            if (bctx) { bctx.fillStyle = 'rgb(128,128,128)'; bctx.fillRect(0,0,width,height); }

            // Plate tiling sized to multiple cells for readability
            const tilesAcross = Math.max(4, Math.floor(width / (cellSize * 2)));
            const plate = width / tilesAcross;
            for (let py = 0; py < height; py += plate) {
                for (let px = 0; px < width; px += plate) {
                    const jitterX = (Math.random() * 2 - 1);
                    const jitterY = (Math.random() * 2 - 1);
                    const x0 = Math.floor(px + jitterX);
                    const y0 = Math.floor(py + jitterY);
                    const w = Math.ceil(plate - 2 + Math.random() * 2);
                    const h = Math.ceil(plate - 2 + Math.random() * 2);

                    // Plate fill with subtle bronze hue variance
                    const hue = 30 + Math.random() * 10;
                    const sat = 50 + Math.random() * 12;
                    const lig = 24 + Math.random() * 8;
                    ctx.fillStyle = `hsl(${hue} ${sat}% ${lig}%)`;
                    ctx.fillRect(x0, y0, w, h);
                    // Bump: darker color -> higher bump (lighter in bump map)
                    // Use nonlinear mapping to boost contrast
                    const nl = Math.min(1, Math.max(0, lig / 100));
                    const bumpValue = Math.round(255 * (1 - Math.pow(nl, 0.6)));
                    if (bctx) { bctx.fillStyle = `rgb(${bumpValue},${bumpValue},${bumpValue})`; bctx.fillRect(x0, y0, w, h); }

                    // Brushed metal strokes
                    ctx.globalAlpha = 0.12;
                    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
                    ctx.lineWidth = 1;
                    const strokes = 3;
                    for (let i = 0; i < strokes; i++) {
                        const sx = x0 + 2 + Math.random() * Math.max(1, (w - 4));
                        ctx.beginPath();
                        ctx.moveTo(sx, y0 + 2);
                        ctx.lineTo(sx, y0 + h - 2);
                        ctx.stroke();
                        if (bctx) {
                            // Light painted stroke should become a slight depression (darker bump)
                            bctx.globalAlpha = 0.12;
                            bctx.strokeStyle = 'rgba(40,40,40,1)';
                            bctx.lineWidth = 1;
                            bctx.beginPath();
                            bctx.moveTo(sx, y0 + 2);
                            bctx.lineTo(sx, y0 + h - 2);
                            bctx.stroke();
                            bctx.globalAlpha = 1.0;
                        }
                    }
                    ctx.globalAlpha = 1.0;

                    // Seam bevel
                    ctx.strokeStyle = '#1b1309';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);
                    if (bctx) {
                        // Dark visual seam should be RAISED in relief -> bright in bump map
                        bctx.strokeStyle = 'rgb(230,230,230)';
                        bctx.lineWidth = 2;
                        bctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);
                    }
                    // Inner highlight
                    ctx.strokeStyle = 'rgba(255,220,150,0.1)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x0 + 2, y0 + 2, w - 4, h - 4);
                    if (bctx) {
                        // Light visual highlight should be LOWERED in relief -> dark in bump map
                        bctx.strokeStyle = 'rgb(30,30,30)';
                        bctx.lineWidth = 1;
                        bctx.strokeRect(x0 + 2, y0 + 2, w - 4, h - 4);
                    }

                    // Rivets at corners
                    const r = Math.max(1.3, plate * 0.06);
                    const corners = [
                        [x0 + 6, y0 + 6],
                        [x0 + w - 6, y0 + 6],
                        [x0 + 6, y0 + h - 6],
                        [x0 + w - 6, y0 + h - 6]
                    ];
                    for (const [cx, cy] of corners) {
                        // Shadow
                        ctx.fillStyle = 'rgba(0,0,0,0.45)';
                        ctx.beginPath(); ctx.arc(cx + 1, cy + 1, r, 0, Math.PI * 2); ctx.fill();
                        // Body
                        ctx.fillStyle = '#5c3f1c';
                        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
                        // Highlight
                        ctx.fillStyle = 'rgba(255,240,210,0.55)';
                        ctx.beginPath(); ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.35, 0, Math.PI * 2); ctx.fill();

                        if (bctx) {
                            // Rivet as raised dome: bright center falloff
                            const grd = bctx.createRadialGradient(cx - r*0.2, cy - r*0.2, r*0.1, cx, cy, r);
                            grd.addColorStop(0, 'rgb(240,240,240)');
                            grd.addColorStop(1, 'rgb(100,100,100)');
                            bctx.fillStyle = grd;
                            bctx.beginPath(); bctx.arc(cx, cy, r, 0, Math.PI * 2); bctx.fill();
                        }
                    }
                }
            }
        })();

        // After background plates are drawn, render any base tone BEHIND the plates
        ctx.save();
        const prevComp = ctx.globalCompositeOperation;
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = this.colors.floor;
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = prevComp;
        ctx.restore();
        // No blur on bump to keep relief crisp

        // --- Simplified Background Circuit Pattern ---
        ctx.strokeStyle = 'rgba(169, 113, 66, 0.4)'; // Faint bronze
        ctx.lineWidth = 1;
        for (let i = 0; i < 20; i++) { // Reduced loop
            ctx.beginPath();
            ctx.moveTo(Math.random() * width, Math.random() * height);
            ctx.lineTo(Math.random() * width, Math.random() * height);
            ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)'; // Faint gold
        ctx.lineWidth = 2; // Reduced width
         for (let i = 0; i < 8; i++) { // Reduced loop
            ctx.beginPath();
            const x1 = Math.random() * width;
            const y1 = Math.random() * height;
            const x2 = (Math.random() > 0.5) ? x1 : Math.random() * width;
            const y2 = (x2 === x1) ? Math.random() * height : y1;
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        ctx.lineWidth = 1;
        ctx.restore(); // Stop clipping
        // --- End of Background Pattern ---


        // Base bump layer already painted above into bctx

        // Draw wall shading
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const cx = x * cellSize;
                const cy = y * cellSize;

                if (grid[y][x] === 1) { // It's a wall, add shading
                    const isPath = (dx, dy) => {
                        const nx = x + dx;
                        const ny = y + dy;
                        return nx >= 0 && nx < this.size && ny >= 0 && ny < this.size && grid[ny][nx] === 0;
                    };
                    
                    const shadeWidth = Math.max(1, cellSize * 0.3); // Proportional shading

                    // Highlights (top, left)
                    if (isPath(0, -1)) { // Path above
                        ctx.fillStyle = this.colors.highWallLight;
                        ctx.fillRect(cx, cy, cellSize, shadeWidth);
                    }
                    if (isPath(-1, 0)) { // Path to the left
                        ctx.fillStyle = this.colors.highWallLight;
                        ctx.fillRect(cx, cy, shadeWidth, cellSize);
                    }

                    // Shadows (bottom, right)
                    if (isPath(0, 1)) { // Path below
                        ctx.fillStyle = this.colors.highWallDark;
                        ctx.fillRect(cx, cy + cellSize - shadeWidth, cellSize, shadeWidth);
                    }
                    if (isPath(1, 0)) { // Path to the right
                        ctx.fillStyle = this.colors.highWallDark;
                        ctx.fillRect(cx + cellSize - shadeWidth, cy, shadeWidth, cellSize);
                    }
                } 
                // No need for an else here, path was drawn before
            }
        }
        
        // Ensure visual continuity at edges (by drawing a path cell)
        for (const point of this.pathContinuity) {
            if (point.face === faceIndex) {
                 // To make paths transparent, we clear these continuity points
                 ctx.clearRect(point.x * cellSize, point.y * cellSize, cellSize, cellSize);
            }
        }
        
        // Update bump texture
        if (bumpTextures[faceIndex]) bumpTextures[faceIndex].needsUpdate = true;
    }
}
class CircuitryCube {
    constructor(size, textureSize = 256) {
        this.size = size;
        this.textureSize = textureSize;
        this.materials = [];
        this.canvases = [];
        this.contexts = [];
        this.lights = []; // array of {face, x, y, size, color, state, onTime, offTime}
        this.laserPool = [];
        this.laserGroup = new THREE.Group();

        for (let i = 0; i < 6; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = this.textureSize;
            canvas.height = this.textureSize;
            const context = canvas.getContext('2d');

            this.canvases.push(canvas);
            this.contexts.push(context);
            this.lights.push([]); // lights per face

            this.drawFace(i); // Initial draw

            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.MeshStandardMaterial({
                map: texture,
                metalness: 0.9,
                roughness: 0.4,
                color: 0xffffff, // Use map for color
                emissive: 0xCCCCCC,
                emissiveMap: texture,
                emissiveIntensity: 4.0,
            });
            this.materials.push(material);
        }

        this.geometry = new THREE.BoxGeometry(size, size, size);
        this.mesh = new THREE.Mesh(this.geometry, this.materials);
        this.mesh.add(this.laserGroup);

        // Create a pool of laser groups (bright core + additive glow) for saber-like look
        const laserCount = LASER_COUNT;
        const coreGeometry = new THREE.CylinderGeometry(0.008, 0.008, 1, LASER_CORE_SEGMENTS);
        coreGeometry.translate(0, 0.5, 0);
        const glowGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1, LASER_GLOW_SEGMENTS);
        glowGeometry.translate(0, 0.5, 0);

        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0xcd7f32, // bronze core
        });
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xcd7f32, // bronze glow
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false,
            opacity: 0.7,
        });

        for (let i = 0; i < laserCount; i++) {
            const group = new THREE.Group();
            const core = new THREE.Mesh(coreGeometry, coreMaterial);
            core.renderOrder = 1;
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            glow.renderOrder = 2;
            group.add(glow);
            group.add(core);
            group.visible = false;
            this.laserPool.push(group);
            this.laserGroup.add(group);
        }
    }

    drawFace(faceIndex) {
        const ctx = this.contexts[faceIndex];
        const size = this.textureSize;
        
        // Base
        ctx.fillStyle = 'black'; // Black
        ctx.fillRect(0, 0, size, size);

        // --- High Detail Circuit Pattern ---
        // Layer 1: Faint, thin background traces
        ctx.strokeStyle = '#a97142';
        ctx.lineWidth = Math.max(1, size / 250);
        ctx.globalAlpha = 0.5;
        for(let i = 0; i < 100; i++) {
            ctx.beginPath();
            const x1 = Math.random() * size;
            const y1 = Math.random() * size;
            ctx.moveTo(x1, y1);
            if (Math.random() > 0.5) { // Orthogonal lines
                 ctx.lineTo(Math.random() > 0.5 ? x1 : Math.random() * size, Math.random() > 0.5 ? y1 : Math.random() * size);
            } else { // Angled lines
                 ctx.lineTo(x1 + (Math.random() - 0.5) * size * 0.1, y1 + (Math.random() - 0.5) * size * 0.1);
            }
            ctx.stroke();
        }
        ctx.globalAlpha = 1.0;

        // Layer 2: Main, brighter traces
        ctx.strokeStyle = '#d4af37'; // Brighter gold/bronze
        ctx.lineWidth = Math.max(1, size / 150);
        for(let i = 0; i < 50; i++) {
            ctx.beginPath();
            const x1 = Math.random() * size;
            const y1 = Math.random() * size;
            const length = Math.random() * size * 0.3;
            ctx.moveTo(x1, y1);
             if (Math.random() > 0.5) {
                 ctx.lineTo(x1 + length * (Math.random() > 0.5 ? 1 : -1), y1);
             } else {
                 ctx.lineTo(x1, y1 + length * (Math.random() > 0.5 ? 1 : -1));
             }
            ctx.stroke();
        }

        // Layer 3: Connection Pads
        ctx.fillStyle = '#b87333';
        for(let i=0; i<100; i++) {
            const padSize = Math.random() * size / 80;
            ctx.fillRect(Math.random() * size, Math.random() * size, padSize, padSize);
        }
        
        // Chips
        ctx.fillStyle = '#2b1b09';
        ctx.strokeStyle = '#e28f38'; // Orange-gold border
        ctx.lineWidth = Math.max(1, size / 100);
        for (let i = 0; i < 5; i++) {
            const chipX = Math.random() * size * 0.8;
            const chipY = Math.random() * size * 0.8;
            const chipW = size * (0.1 + Math.random() * 0.2);
            const chipH = size * (0.1 + Math.random() * 0.2);
            ctx.fillRect(chipX, chipY, chipW, chipH);
            ctx.strokeRect(chipX, chipY, chipW, chipH);
        }

        // Lights - store their positions for blinking
        const lightSize = Math.max(2, size / 35);
        const lightCount = INNER_LIGHT_COUNT;
        if(this.lights[faceIndex].length === 0) { // Only generate lights once
            for (let i = 0; i < lightCount; i++) {
                const lightX = Math.random() * (size - lightSize);
                const lightY = Math.random() * (size - lightSize);
                const color = ['#cd7f32', '#b87333', '#d4af37', '#e28f38'][Math.floor(Math.random()*4)]; // Bronze/gold tones
                this.lights[faceIndex].push({
                    x: lightX,
                    y: lightY,
                    size: lightSize,
                    color: color,
                    state: 'off',
                    offTime: Math.random() * 100 + 20, // Frames to stay off
                    onTime: 0, // Frames to stay on
                    laserMesh: null,
                    initialOnTime: 0
                });
            }
        }
        
        // Draw lights in their current state
        this.lights[faceIndex].forEach(light => {
            const is_on = light.state === 'on';
            
            // Diode casing
            ctx.fillStyle = is_on ? '#222' : '#111';
            ctx.fillRect(light.x, light.y, light.size, light.size);
            
            // Emissive part
            if(is_on) {
                ctx.fillStyle = light.color;
                const innerSize = light.size * 0.6;
                const offset = light.size * 0.2;
                ctx.fillRect(light.x + offset, light.y + offset, innerSize, innerSize);

                // Glow
                ctx.shadowColor = light.color;
                ctx.shadowBlur = 12;
                ctx.fillRect(light.x + offset, light.y + offset, innerSize, innerSize);
                ctx.shadowBlur = 0; // reset
            }

            // Casing border
            ctx.strokeStyle = is_on ? '#444' : '#222';
            ctx.lineWidth = 1;
            ctx.strokeRect(light.x, light.y, light.size, light.size);
        });
    }

    update() {
        let needsRedraw = false;
        for (let i = 0; i < 6; i++) {
            let faceNeedsRedraw = false;
            this.lights[i].forEach(light => {
                if (light.state === 'on') {
                    light.onTime--;
                    if (light.onTime <= 0) {
                        light.state = 'off';
                        light.offTime = Math.random() * 100 + 50;
                        if(light.laserMesh) {
                            light.laserMesh.visible = false;
                            light.laserMesh = null;
                        }
                        faceNeedsRedraw = true;
                    } else if (light.laserMesh) {
                        // Animate laser
                        const progress = 1 - (light.onTime / light.initialOnTime);
                        const maxLaserLength = 0.5;
                        // Sine wave for smooth grow and shrink
                        const scaleY = Math.sin(progress * Math.PI) * maxLaserLength;
                        light.laserMesh.scale.y = scaleY;
                    }

                } else { // state is 'off'
                    light.offTime--;
                    if (light.offTime <= 0) {
                        light.state = 'on';
                        const onTime = Math.random() * 20 + 15;
                        light.onTime = onTime;
                        light.initialOnTime = onTime;

                        // Activate a laser
                        const laser = this.laserPool.find(l => !l.visible);
                        if(laser) {
                            light.laserMesh = laser;
                            laser.visible = true;
                            
                            const halfSize = this.size / 2;
                            const u = (light.x / this.textureSize) - 0.5; // -0.5 to 0.5
                            const v = (light.y / this.textureSize) - 0.5; // -0.5 to 0.5
                           
                            const position = new THREE.Vector3();
                            const lookAtTarget = new THREE.Vector3();

                            switch (i) {
                                case 0: // +X
                                    position.set(halfSize, -v * this.size, u * this.size);
                                    lookAtTarget.set(halfSize + 1, -v * this.size, u * this.size);
                                    break;
                                case 1: // -X
                                    position.set(-halfSize, -v * this.size, -u * this.size);
                                    lookAtTarget.set(-halfSize - 1, -v * this.size, -u * this.size);
                                    break;
                                case 2: // +Y
                                    position.set(-u * this.size, halfSize, v * this.size);
                                    // No rotation needed for Y faces
                                    break;
                                case 3: // -Y
                                    position.set(u * this.size, -halfSize, v * this.size);
                                    lookAtTarget.set(u * this.size, -halfSize - 1, v * this.size);
                                    break;
                                case 4: // +Z
                                    position.set(u * this.size, -v * this.size, halfSize);
                                    lookAtTarget.set(u * this.size, -v * this.size, halfSize + 1);
                                    break;
                                case 5: // -Z
                                    position.set(-u * this.size, -v * this.size, -halfSize);
                                    lookAtTarget.set(-u * this.size, -v * this.size, -halfSize - 1);
                                    break;
                            }

                            laser.position.copy(position);
                            laser.lookAt(lookAtTarget);
                            laser.scale.y = 0;
                        }
                        faceNeedsRedraw = true;
                    }
                }
            });

            if (faceNeedsRedraw) {
                this.drawFace(i);
                this.materials[i].map.needsUpdate = true;
                this.materials[i].emissiveMap.needsUpdate = true;
                needsRedraw = true;
            }
        }
        return needsRedraw;
    }
}

// --- Particle Texture Animator ---
class ParticleTextureAnimator {
    constructor(size = 64) {
        this.size = size;
        this.canvas = document.createElement('canvas');
        this.canvas.width = size;
        this.canvas.height = size;
        this.context = this.canvas.getContext('2d');
        this.texture = new THREE.CanvasTexture(this.canvas);
        this.texture.minFilter = THREE.LinearFilter;
        this.texture.magFilter = THREE.NearestFilter;

        this.lights = [];
        const lightCount = 10;
        const lightSize = Math.max(2, size / 15);
        for (let i = 0; i < lightCount; i++) {
            this.lights.push({
                x: Math.random() * (size - lightSize),
                y: Math.random() * (size - lightSize),
                size: lightSize,
                color: ['#cd7f32', '#b87333', '#d4af37'][Math.floor(Math.random() * 3)],
                state: 'off',
                offTime: Math.random() * 100 + 20,
                onTime: 0,
            });
        }
        this.draw();
    }

    draw() {
        const ctx = this.context;
        const size = this.size;

        // Base
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, size, size);

        // Traces
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = Math.max(1, size / 32);
        for (let i = 0; i < 15; i++) {
            ctx.beginPath();
            const x1 = Math.random() * size;
            const y1 = Math.random() * size;
            ctx.moveTo(x1, y1);
            ctx.lineTo(
                (Math.random() > 0.5) ? x1 : Math.random() * size,
                (Math.random() > 0.5) ? y1 : Math.random() * size
            );
            ctx.stroke();
        }

        // Pads
        ctx.fillStyle = '#b87333';
        for (let i = 0; i < 20; i++) {
            const padSize = Math.random() * size / 20;
            ctx.fillRect(Math.random() * size, Math.random() * size, padSize, padSize);
        }

        // Lights
        this.lights.forEach(light => {
            if (light.state === 'on') {
                ctx.fillStyle = light.color;
                ctx.shadowColor = light.color;
                ctx.shadowBlur = 8;
                ctx.fillRect(light.x, light.y, light.size, light.size);
                ctx.shadowBlur = 0;
            }
        });

        this.texture.needsUpdate = true;
    }

    update() {
        let needsRedraw = false;
        this.lights.forEach(light => {
            if (light.state === 'on') {
                light.onTime--;
                if (light.onTime <= 0) {
                    light.state = 'off';
                    light.offTime = Math.random() * 100 + 50;
                    needsRedraw = true;
                }
            } else { // off
                light.offTime--;
                if (light.offTime <= 0) {
                    light.state = 'on';
                    light.onTime = Math.random() * 20 + 15;
                    needsRedraw = true;
                }
            }
        });

        if (needsRedraw) {
            this.draw();
        }
        return needsRedraw;
    }
}

// --- Center Circuit Texture Animator (bronze circuitry) ---
class CenterCircuitAnimator {
    constructor(size = 128) {
        this.size = size;
        this.canvas = document.createElement('canvas');
        this.canvas.width = size;
        this.canvas.height = size;
        this.ctx = this.canvas.getContext('2d');
        this.texture = new THREE.CanvasTexture(this.canvas);
        // Use smoother filtering to avoid pixelated edges
        this.texture.generateMipmaps = true;
        this.texture.minFilter = THREE.LinearMipmapLinearFilter;
        this.texture.magFilter = THREE.LinearFilter;
        this.texture.anisotropy = 8;

        this.nodes = [];
        for (let i = 0; i < 12; i++) {
            this.nodes.push({
                x: Math.random() * size,
                y: Math.random() * size,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                r: Math.random() * (size * 0.01) + (size * 0.01),
                color: ['#cd7f32', '#b87333', '#d4af37'][Math.floor(Math.random() * 3)]
            });
        }
        this.draw();
    }

    draw() {
        const ctx = this.ctx;
        const s = this.size;
        ctx.clearRect(0, 0, s, s);
        ctx.fillStyle = '#0a0804';
        ctx.fillRect(0, 0, s, s);

        ctx.strokeStyle = '#8c6b3a';
        ctx.lineWidth = Math.max(1, s / 256);
        ctx.globalAlpha = 0.6;
        for (let i = 0; i < 30; i++) {
            ctx.beginPath();
            const x1 = Math.random() * s;
            const y1 = Math.random() * s;
            ctx.moveTo(x1, y1);
            if (Math.random() > 0.5) {
                ctx.lineTo(Math.random() > 0.5 ? x1 : Math.random() * s, y1);
            } else {
                ctx.lineTo(x1, Math.random() > 0.5 ? y1 : Math.random() * s);
            }
            ctx.stroke();
        }
        ctx.globalAlpha = 1.0;

        for (const n of this.nodes) {
            ctx.fillStyle = n.color;
            ctx.shadowColor = n.color;
            ctx.shadowBlur = s * 0.05;
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = Math.max(1, s / 180);
        ctx.globalAlpha = 0.8;
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const a = this.nodes[i], b = this.nodes[j];
                const dx = b.x - a.x, dy = b.y - a.y;
                const d2 = dx * dx + dy * dy;
                if (d2 < (s * 0.25) * (s * 0.25)) {
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    if (Math.random() > 0.5) {
                        ctx.lineTo(b.x, a.y);
                        ctx.lineTo(b.x, b.y);
                    } else {
                        ctx.lineTo(a.x, b.y);
                        ctx.lineTo(b.x, b.y);
                    }
                    ctx.stroke();
                }
            }
        }
        ctx.globalAlpha = 1.0;
        // Create a central viewing window by clearing alpha in the middle
        const w = Math.floor(s * 0.34);
        const h = Math.floor(s * 0.34);
        const x = Math.floor((s - w) / 2);
        const y = Math.floor((s - h) / 2);
        ctx.clearRect(x, y, w, h);

        this.texture.needsUpdate = true;
    }

    update() {
        const s = this.size;
        for (const n of this.nodes) {
            n.x += n.vx; n.y += n.vy;
            if (n.x < 0 || n.x > s) n.vx *= -1;
            if (n.y < 0 || n.y > s) n.vy *= -1;
        }
        this.draw();
    }
}

function createCenterCircuitCube() {
    // Use a higher-resolution texture so the circuitry appears sharper
    centerCircuitAnimator = new CenterCircuitAnimator(1024);
    const geo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
    const mat = new THREE.MeshStandardMaterial({
        map: centerCircuitAnimator.texture,
        emissiveMap: centerCircuitAnimator.texture,
        emissive: 0xcd7f32,
        emissiveIntensity: 1.6,
        metalness: 0.75,
        roughness: 0.35,
        color: 0xffffff,
        alphaTest: 0.01, // discard fully transparent pixels in the texture window
        transparent: true,
        side: THREE.DoubleSide // render backfaces so the tiny cube is visible from inside
    });
    centerCube = new THREE.Mesh(geo, mat);
    centerCube.position.set(0, 0, 0);
    scene.add(centerCube);
}

// Add thin bronze frames around the alphaTest windows on each face of the tiny cube
function createCenterWindowFrames() {
    if (!centerCube) return;
    if (centerWindowFrames) {
        centerCube.remove(centerWindowFrames);
        centerWindowFrames = null;
    }
    const cubeSize = 0.14; // must match center cube geometry
    const half = cubeSize / 2;
    const windowFrac = 0.34; // must match CenterCircuitAnimator window fraction
    const winSize = cubeSize * windowFrac;
    const halfWin = winSize / 2;
    const frameThickness = 0.004; // thin frame bar thickness on face plane
    const frameDepth = 0.006; // extrusion depth outward
    const faceOffset = half + frameDepth / 2 + 0.0005; // slightly above surface

    const frameMat = new THREE.MeshStandardMaterial({
        color: 0xcd7f32,
        metalness: 0.85,
        roughness: 0.35,
        emissive: 0x3b210e,
        emissiveIntensity: 0.2
    });

    // Geometries: horizontal bars (width = winSize, height = thickness), vertical bars (width = thickness, height = winSize)
    const horizGeo = new THREE.BoxGeometry(winSize, frameThickness, frameDepth);
    const vertGeo = new THREE.BoxGeometry(frameThickness, winSize, frameDepth);

    centerWindowFrames = new THREE.Group();

    // Helper to build a face frame in +Z local orientation, then rotate/translate
    function buildFace(normal) {
        const g = new THREE.Group();
        const top = new THREE.Mesh(horizGeo, frameMat);
        top.position.set(0, halfWin + frameThickness / 2, 0);
        const bottom = top.clone(); bottom.position.y = -top.position.y;
        const left = new THREE.Mesh(vertGeo, frameMat);
        left.position.set(-halfWin - frameThickness / 2, 0, 0);
        const right = left.clone(); right.position.x = -left.position.x;
        g.add(top, bottom, left, right);

        // Orient to face normal and place outward
        const n = normal.clone().normalize();
        // Rotate: align group's +Z to n
        const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1), n);
        g.quaternion.copy(quat);
        g.position.copy(n.multiplyScalar(faceOffset));
        return g;
    }

    centerWindowFrames.add(
        buildFace(new THREE.Vector3( 1, 0, 0)), // +X
        buildFace(new THREE.Vector3(-1, 0, 0)), // -X
        buildFace(new THREE.Vector3( 0, 1, 0)), // +Y
        buildFace(new THREE.Vector3( 0,-1, 0)), // -Y
        buildFace(new THREE.Vector3( 0, 0, 1)), // +Z
        buildFace(new THREE.Vector3( 0, 0,-1))  // -Z
    );

    centerCube.add(centerWindowFrames);
}

function createCenterTethers(max = centerTetherMax) {
    const positions = new Float32Array(max * 2 * 3);
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    const mat = new THREE.LineBasicMaterial({
        color: 0xcd7f32,
        transparent: true,
        opacity: 0.9,
        depthTest: true
    });
    centerTethers = new THREE.LineSegments(geom, mat);
    centerTethers.frustumCulled = false;
    scene.add(centerTethers);
}

function shouldShowCenterTethers() {
    // Show only when the camera is strictly inside the big cube's bounds (axis-aligned check)
    const half = (typeof CUBE_SIZE === 'number') ? (CUBE_SIZE / 2) : 0.9;
    const margin = 0.03; // small margin so we must be clearly inside
    const x = camera.position.x;
    const y = camera.position.y;
    const z = camera.position.z;
    return (Math.abs(x) < (half - margin)) && (Math.abs(y) < (half - margin)) && (Math.abs(z) < (half - margin));
}

function updateCenterTethers() {
    if (!innerCube || !centerCube || !centerTethers) return;
    // Toggle visibility based on camera proximity so lines are only seen when zoomed inside
    centerTethers.visible = shouldShowCenterTethers();
    if (!centerTethers.visible) return;
    const positions = centerTethers.geometry.attributes.position.array;
    const center = new THREE.Vector3();
    centerCube.getWorldPosition(center);

    // Prefer laserPool; fall back to laserGroup.children
    const lasers = Array.isArray(innerCube.laserPool) && innerCube.laserPool.length
        ? innerCube.laserPool
        : (innerCube.laserGroup && innerCube.laserGroup.children) || [];

    let lineIndex = 0;
    let count = 0;
    for (let i = 0; i < lasers.length; i++) {
        const laser = lasers[i];
        if (!laser) continue;
        const lp = new THREE.Vector3();
        laser.getWorldPosition(lp);
        positions[lineIndex++] = center.x;
        positions[lineIndex++] = center.y;
        positions[lineIndex++] = center.z;
        positions[lineIndex++] = lp.x;
        positions[lineIndex++] = lp.y;
        positions[lineIndex++] = lp.z;
        count++;
        if (count >= centerTetherMax) break;
    }
    centerTethers.geometry.setDrawRange(0, count * 2);
    centerTethers.geometry.attributes.position.needsUpdate = true;
}

// --- 9102 Inner Cube ---
function create9102Cube() {
    if (!centerCube) return;
    const size = 0.07; // smaller than centerCube (0.14)
    const geo = new THREE.BoxGeometry(size, size, size);
    const loader = new THREE.TextureLoader();

    const imageUrls = [
        'assets/9102-1.png',
        'assets/9102-2.png',
        'assets/9102-3.png',
        'assets/9102-4.png',
        'assets/9102-5.png',
        'assets/9102-6.png'
    ];

    const materials = [];
    for (let i = 0; i < 6; i++) {
        const url = imageUrls[i];
        const tex = loader.load(url, (t) => {
            t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
            t.colorSpace = THREE.SRGBColorSpace;
        });
        materials.push(new THREE.MeshStandardMaterial({
            map: tex,
            emissiveMap: tex,
            emissive: 0x333333,
            emissiveIntensity: 0.6,
            metalness: 0.2,
            roughness: 0.8
        }));
    }

    if (cube9102 && cube9102.parent) {
        cube9102.parent.remove(cube9102);
        try {
            cube9102.geometry?.dispose?.();
            if (Array.isArray(cube9102.material)) cube9102.material.forEach(m => m.dispose?.());
            else cube9102.material?.dispose?.();
        } catch {}
    }

    cube9102 = new THREE.Mesh(geo, materials);
    cube9102.name = 'cube9102';
    cube9102.position.set(0, 0, 0);
    centerCube.add(cube9102);
}

// --- Three.js Scene Setup ---
let scene, camera, renderer, cube, controls, innerCube;
let centerCube, centerCircuitAnimator, centerTethers;
let centerWindowFrames;
let cube9102;
let generator;
const materials = [];
const textures = [];
const contexts = [];
// Bump infrastructure for walls: one canvas/texture per face
const bumpCanvases = [];
const bumpContexts = [];
const bumpTextures = [];
// References to wall materials so we can tweak bumpScale dynamically
let wallMaterialsRef = [];
let wallBackMaterialsRef = [];
let directionalLight;
let pointLight1, pointLight2, pointLight3, pointLight4;
let pLight1Container, pLight2Container, pLight3Container, pLight4Container;
let initialCameraPosition = new THREE.Vector3();
let driftingLights = [];

// Performance-focused tuning (lasers are lowest priority)
const LASER_COUNT = 12;           // fewer lasers to keep tethers active but cheap
const LASER_CORE_SEGMENTS = 8;    // lower segments for cheaper geometry
const LASER_GLOW_SEGMENTS = 10;   // lower segments for cheaper geometry
const INNER_LIGHT_COUNT = 8;      // fewer inner lights, less redraw

// Performance Mode flag (favor FPS over eye-candy)
let performanceMode = false;

function applyPerformanceMode(on) {
    performanceMode = !!on;
    // Lock pixel ratio to 1.0 in performance mode
    if (renderer) {
        renderer.setPixelRatio(performanceMode ? 1.0 : Math.min(1.5, window.devicePixelRatio || 1));
    }
    // Keep tethers alive: keep laser cores updating for anchor points, hide only glow shells
    if (innerCube && innerCube.laserGroup) {
        innerCube.laserGroup.children.forEach(group => {
            if (group && group.children && group.children.length >= 2) {
                const glow = group.children[0];
                if (glow) glow.visible = !performanceMode;
                // keep core (group.children[1]) always present for tether endpoints
            }
        });
    }
    // Adjust wall bump intensity for cheaper shading
    const frontBump = performanceMode ? 0.18 : 0.7;
    const backBump = performanceMode ? 0.12 : 0.5;
    wallMaterialsRef.forEach(m => { if (m) m.bumpScale = frontBump; });
    wallBackMaterialsRef.forEach(m => { if (m) m.bumpScale = backBump; });
    // Shrink/restore particle budget
    applyParticleBudget();
    // Stems: keep hairs but remove stem textures in performance mode
    if (stems && typeof stems.setPerformanceMode === 'function') {
        stems.setPerformanceMode(performanceMode);
    }
}

// Labyrinth walls
let wallMeshes, wallBackMeshes;
const MAZE_SIZE = 31;
const CUBE_SIZE = 1.75;
const WALL_HEIGHT = 0.15;
const CELL_SIZE = CUBE_SIZE / MAZE_SIZE;
const WALL_DUMMY = new THREE.Object3D();

// Particle background
let particleCubes, particleAnimator;
const PARTICLE_COUNT = 150; // Reduced count for performance with meshes
const bounds = 5;
const dummy = new THREE.Object3D(); // Used for instanced mesh updates
let velocities, angularVelocities;
let tetherLines;
let centerTetherMax = 100; // capacity for laser tethers

let lastUpdateTime = 0;
/* add stems handle */
let stems;
const updateInterval = 70; // ms between labyrinth updates (slightly slower to save CPU)
// Dynamic particle pool size (shrinks in performance mode)
let particleActiveCount = 0;

// --- Video Background ---
let youtubePlayer;
let playlist = [];
let currentPlaylistIndex = 0;
let isMuted = true;
let currentVolume = 50;
let youtubeReady = false, pendingStart = false;
let userStoppedYoutube = false;
let lastPlayedSource = null; // 'youtube' | 'local'
// Interstellar background mode
let interstellarGroup = null;
let flashPool = [];
let debugSphere = null;
let interstellarActive = false;
let boundaryGlobe = null;
let BOUNDARY_RADIUS = 1000; // large, contains entire scene, but reachable so reflections are observable
let youtubeWatchdogId = null;
let ytLastTime = 0;
let ytLastTs = 0;
let ytLastState = null;
let ytLastStateTs = 0;
const YT_DEBUG = true;

// --- YouTube playlist persistence (localStorage) ---
const LS_KEYS = {
    playlist: 'yt_playlist_urls',
    index: 'yt_playlist_index'
};

function loadPlaylistFromStorage() {
    try {
        const raw = localStorage.getItem(LS_KEYS.playlist);
        if (!raw) return false;
        const ids = JSON.parse(raw);
        if (!Array.isArray(ids) || !ids.length) return false;
        playlist = ids.map(id => ({ id, title: `YouTube Video: ${id}` }));
        const savedIndex = parseInt(localStorage.getItem(LS_KEYS.index) || '0', 10);
        if (!Number.isNaN(savedIndex)) {
            currentPlaylistIndex = Math.max(0, Math.min(savedIndex, playlist.length - 1));
        }
        return true;
    } catch { return false; }
}

function savePlaylistToStorage() {
    try {
        const ids = playlist.map(v => v.id);
        localStorage.setItem(LS_KEYS.playlist, JSON.stringify(ids));
        localStorage.setItem(LS_KEYS.index, String(currentPlaylistIndex));
    } catch {}
}

function setupVideoBackground() {
    const uiTrigger = document.getElementById('ui-trigger');
    const openModalBtn = document.getElementById('open-modal-btn');
    const videoModal = document.getElementById('video-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const localVideoPlayer = document.getElementById('local-video-player');
    const videoFileInput = document.getElementById('video-file-input');
    const youtubeUrlInput = document.getElementById('youtube-url-input');
    const addYoutubeBtn = document.getElementById('add-youtube-btn');
    // Background source radios
    const sourceYoutube = document.getElementById('source-youtube');
    const sourceLocal = document.getElementById('source-local');
    const sourceInterstellar = document.getElementById('source-interstellar');
    const playlistEl = document.getElementById('playlist');
    const stopVideoBtn = document.getElementById('stop-video-btn');
    const muteBtn = document.getElementById('mute-btn');
    const volumeSlider = document.getElementById('volume-slider');

    // Disable YouTube controls until player is ready
    youtubeUrlInput.disabled = false;
    addYoutubeBtn.disabled = false;
    youtubeUrlInput.placeholder = "Enter YouTube URL";

    // Show/hide open modal button
    uiTrigger.addEventListener('mouseenter', () => openModalBtn.classList.remove('hidden'));
    uiTrigger.addEventListener('mouseleave', () => openModalBtn.classList.add('hidden'));

    // Modal open/close
    openModalBtn.addEventListener('click', () => videoModal.classList.remove('hidden'));
    closeModalBtn.addEventListener('click', () => videoModal.classList.add('hidden'));

    // Local video
    videoFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            stopAllVideo();
            const url = URL.createObjectURL(file);
            localVideoPlayer.src = url;
            localVideoPlayer.classList.remove('hidden');
            if (youtubePlayer) document.getElementById('youtube-player').classList.add('hidden');
            localVideoPlayer.play();
            updateMuteState();
            lastPlayedSource = 'local';
        }
    });

    // YouTube
    function createYouTubePlayer() {
        if (youtubePlayer) return; // prevent double init
        if (!(window.YT && YT.Player)) return; // API not ready
        const playerEl = document.getElementById('youtube-player');
        playerEl.classList.add('hidden'); // Initially hide it
        youtubePlayer = new YT.Player('youtube-player', {
            height: '100%',
            width: '100%',
            playerVars: {
                'autoplay': 1,
                'controls': 0,
                'showinfo': 0,
                'rel': 0,
                'loop': 0, // We handle looping via API
                'playlist': '',
                'modestbranding': 1,
                'playsinline': 1,
                'origin': window.location.origin
            },
            host: 'https://www.youtube.com',
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange,
                'onError': onPlayerError
            }
        });

        // Start watchdog once we have a player
        if (!youtubeWatchdogId) {
            youtubeWatchdogId = setInterval(() => {
                try {
                    const ytVisible = !document.getElementById('youtube-player').classList.contains('hidden');
                    if (!ytVisible || userStoppedYoutube || !youtubeReady) return;
                    const state = youtubePlayer.getPlayerState?.();
                    const now = performance.now();
                    const curTime = youtubePlayer.getCurrentTime?.() || 0;
                    const duration = youtubePlayer.getDuration?.() || 0;
                    // If we're effectively at the end but state didn't fire ENDED yet, advance
                    if (duration > 0 && (duration - curTime) <= 0.25 && state !== YT.PlayerState.ENDED) {
                        if (YT_DEBUG) console.debug('[YT WD] Near end (', curTime, '/', duration, ') -> next');
                        playNextInPlaylist();
                        return;
                    }
                    // If stuck UNSTARTED/CUED for >5s since last state change, try a seek/play nudge
                    if ((state === YT.PlayerState.UNSTARTED || state === YT.PlayerState.CUED) && (now - ytLastStateTs > 5000)) {
                        if (YT_DEBUG) console.debug('[YT WD] Stuck state', state, '-> seek/play');
                        try { youtubePlayer.seekTo(curTime + 0.1, true); } catch {}
                        try { youtubePlayer.playVideo(); } catch {}
                        ytLastStateTs = now;
                    }
                    if (state === YT.PlayerState.PLAYING) {
                        // Track progress; if stuck for > 7s, nudge
                        if (Math.abs(curTime - ytLastTime) > 0.15) {
                            ytLastTime = curTime;
                            ytLastTs = now;
                        } else if (now - ytLastTs > 7000) {
                            // Seek a tiny bit forward and resume
                            if (YT_DEBUG) console.debug('[YT WD] No progress -> seek/play');
                            try { youtubePlayer.seekTo(curTime + 0.05, true); } catch {}
                            try { youtubePlayer.playVideo(); } catch {}
                            ytLastTs = now;
                        }
                    } else if (state !== YT.PlayerState.ENDED) {
                        // If not playing and not ended, try to keep it playing
                        if (YT_DEBUG) console.debug('[YT WD] State', state, '-> play');
                        youtubePlayer.playVideo?.();
                    }
                } catch {}
            }, 4000);
        }
    }

    // Register callback for when API loads
    window.onYouTubeIframeAPIReady = function() {
        createYouTubePlayer();
    };

    // Also attempt immediate creation in case API already loaded
    createYouTubePlayer();

    function onPlayerReady(event) {
        youtubeReady = true;
        // Ensure controls are enabled once ready
        youtubeUrlInput.disabled = false;
        addYoutubeBtn.disabled = false;
        youtubePlayer.setVolume(currentVolume);
        if (playlist.length > 0 && (pendingStart || !document.getElementById('youtube-player').classList.contains('hidden'))) {
            pendingStart = false;
            startYoutubePlayback();
        }
    }

    function onPlayerStateChange(event) {
        if (YT_DEBUG) console.debug('[YT] state', event.data, 'time=', youtubePlayer.getCurrentTime?.());
        if (event.data === YT.PlayerState.ENDED) {
            // Advance and loop
            if (YT_DEBUG) console.debug('[YT] ENDED -> next');
            playNextInPlaylist();
            return;
        }
        if (event.data === YT.PlayerState.PLAYING) {
            userStoppedYoutube = false;
            ytLastTime = youtubePlayer.getCurrentTime?.() || 0;
            ytLastTs = performance.now();
        }
        // track last state change time
        ytLastState = event.data;
        ytLastStateTs = performance.now();
        if (event.data === YT.PlayerState.PAUSED) {
            // If paused but not by user action, resume or advance if essentially finished
            if (!userStoppedYoutube) {
                const cur = youtubePlayer.getCurrentTime?.() || 0;
                const dur = youtubePlayer.getDuration?.() || 0;
                if (dur > 0 && (dur - cur) <= 0.4) {
                    if (YT_DEBUG) console.debug('[YT] PAUSED near end -> next');
                    playNextInPlaylist();
                } else {
                    if (YT_DEBUG) console.debug('[YT] PAUSED -> play');
                    try { youtubePlayer.playVideo(); } catch {}
                }
            }
            return;
        }
        if (event.data === YT.PlayerState.CUED) {
            // Ensure cued videos actually start
            if (YT_DEBUG) console.debug('[YT] CUED -> play');
            try { youtubePlayer.playVideo(); } catch {}
            return;
        }
        if (event.data === YT.PlayerState.UNSTARTED || event.data === YT.PlayerState.BUFFERING) {
            // Nudge playback when stuck
            if (!userStoppedYoutube) {
                if (YT_DEBUG) console.debug('[YT] Nudge play from state', event.data);
                try { youtubePlayer.playVideo(); } catch {}
            }
            return;
        }
    }

    function onPlayerError(e) {
        // Skip to next on error
        playNextInPlaylist();
    }
    
    function playNextInPlaylist() {
        if (playlist.length > 0) {
            currentPlaylistIndex = (currentPlaylistIndex + 1) % playlist.length;
            try { youtubePlayer.mute(); } catch {}
            youtubePlayer.loadVideoById(playlist[currentPlaylistIndex].id);
            try { youtubePlayer.playVideo(); } catch {}
            savePlaylistToStorage();
        }
    }
    
    addYoutubeBtn.addEventListener('click', () => {
        const url = youtubeUrlInput.value.trim();
        const videoId = getYouTubeID(url);
        if (videoId) {
            const title = `YouTube Video: ${videoId}`; // Could fetch title later if needed
            playlist.push({ id: videoId, title: title });
            renderPlaylist();
            savePlaylistToStorage();
            if (playlist.length === 1) { // If it's the first video added
                startYoutubePlayback();
            }
            youtubeUrlInput.value = '';
        } else {
            // Silently ignore invalid or playlist-only URLs
            return;
        }
    });

    function getYouTubeID(url) {
        const input = (url || '').trim();
        if (!input) return null;
        // Accept a raw 11-char video ID
        if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
        let str = input;
        try {
            if (!/^https?:\/\//i.test(str)) str = 'https://' + str;
            const u = new URL(str);
            const host = u.hostname.replace(/^www\./i, '').toLowerCase();
            // If there is a direct v param anywhere, prefer that
            const vParam = u.searchParams.get('v');
            if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) return vParam;
            // youtu.be/<id>
            if (host === 'youtu.be') {
                const id = u.pathname.split('/').filter(Boolean)[0] || '';
                if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
            }
            // youtube.com/shorts/<id>, /embed/<id>, /live/<id>
            if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com') || host.endsWith('m.youtube.com') || host.endsWith('music.youtube.com')) {
                const parts = u.pathname.split('/').filter(Boolean);
                if (parts.length >= 2) {
                    const tag = parts[0].toLowerCase();
                    const candidate = parts[1];
                    if ((tag === 'shorts' || tag === 'embed' || tag === 'live') && /^[a-zA-Z0-9_-]{11}$/.test(candidate)) {
                        return candidate;
                    }
                }
            }
        } catch {}
        // Fallback regex (watch, embed, shorts, youtu.be)
        const fallback = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:music\.)?(?:youtube(?:-nocookie)?\.com\/(?:.*[?&]v=|(?:shorts|embed|live)\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const m = input.match(fallback);
        return m ? m[1] : null;
    }

    function startYoutubePlayback() {
        if (!playlist.length) return;
        if (!youtubeReady) {
            pendingStart = true;
            // Prepare UI for YouTube without stopping YouTube instance
            localVideoPlayer.pause();
            localVideoPlayer.classList.add('hidden');
            return;
        }
        // Do NOT stop YouTube here; just ensure local is hidden/paused
        localVideoPlayer.pause();
        localVideoPlayer.classList.add('hidden');
        userStoppedYoutube = false;
        currentPlaylistIndex = Math.max(0, Math.min(currentPlaylistIndex, playlist.length - 1));
        document.getElementById('youtube-player').classList.remove('hidden');
        try { youtubePlayer.mute(); } catch {}
        youtubePlayer.loadVideoById(playlist[currentPlaylistIndex].id);
        try { youtubePlayer.playVideo(); } catch {}
        updateMuteState();
        lastPlayedSource = 'youtube';
        savePlaylistToStorage();
    }

    function playYoutubeAt(index) {
        if (index < 0 || index >= playlist.length) return;
        currentPlaylistIndex = index;
        startYoutubePlayback();
        savePlaylistToStorage();
    }
    
    function renderPlaylist() {
        playlistEl.innerHTML = '';
        playlist.forEach((video, index) => {
            const li = document.createElement('li');
            const titleSpan = document.createElement('span');
            titleSpan.textContent = video.title;
            li.dataset.index = index;
            li.draggable = true;
            li.style.display = 'flex';
            li.style.gap = '8px';
            li.style.alignItems = 'center';

            const playBtn = document.createElement('button');
            playBtn.textContent = 'Play';
            playBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                playYoutubeAt(index);
                sourceYoutube.checked = true;
            });

            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Remove';
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removePlaylistItem(index);
            });
            
            li.appendChild(titleSpan);
            li.appendChild(playBtn);
            li.appendChild(removeBtn);
            playlistEl.appendChild(li);
        });
        // Persist after any re-render just in case indices changed
        savePlaylistToStorage();
    }
    
    function removePlaylistItem(index) {
        const isCurrentVideo = index === currentPlaylistIndex;
        playlist.splice(index, 1);
        
        if (playlist.length === 0) {
            stopAllVideo();
        } else if (isCurrentVideo) {
            currentPlaylistIndex = Math.max(0, index - 1);
            startYoutubePlayback();
        } else if (index < currentPlaylistIndex) {
            currentPlaylistIndex--;
        }
        
        renderPlaylist();
        savePlaylistToStorage();
    }
    
    // Playlist Drag and Drop
    let dragStartIndex;
    playlistEl.addEventListener('dragstart', (e) => {
        dragStartIndex = +e.target.dataset.index;
        e.target.classList.add('dragging');
    });
    playlistEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(playlistEl, e.clientY);
        const draggable = document.querySelector('.dragging');
        if (afterElement == null) {
            playlistEl.appendChild(draggable);
        } else {
            playlistEl.insertBefore(draggable, afterElement);
        }
    });
     playlistEl.addEventListener('dragend', (e) => {
        e.target.classList.remove('dragging');
        const dropIndex = Array.from(playlistEl.children).indexOf(e.target);
        if (dropIndex !== -1) {
            const [movedItem] = playlist.splice(dragStartIndex, 1);
            playlist.splice(dropIndex, 0, movedItem);
            
            // update current playing index if needed
            if(dragStartIndex === currentPlaylistIndex) {
                currentPlaylistIndex = dropIndex;
            } else if (dragStartIndex < currentPlaylistIndex && dropIndex >= currentPlaylistIndex) {
                currentPlaylistIndex--;
            } else if (dragStartIndex > currentPlaylistIndex && dropIndex <= currentPlaylistIndex) {
                currentPlaylistIndex++;
            }
            renderPlaylist();
            savePlaylistToStorage();
        }
    });

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }


    // Controls
    stopVideoBtn.addEventListener('click', () => {
        const ytHidden = document.getElementById('youtube-player').classList.contains('hidden');
        const localHidden = localVideoPlayer.classList.contains('hidden');
        // If nothing is visible, resume last
        if (ytHidden && localHidden) {
            resumeLastVideo();
        } else {
            stopAllVideo();
        }
    });
    
    function stopAllVideo() {
        userStoppedYoutube = true;
        localVideoPlayer.pause();
        localVideoPlayer.classList.add('hidden');
        if (youtubePlayer && youtubePlayer.stopVideo) {
            youtubePlayer.stopVideo();
            document.getElementById('youtube-player').classList.add('hidden');
        }
    }

    muteBtn.addEventListener('click', () => {
        isMuted = !isMuted;
        updateMuteState();
    });

    volumeSlider.addEventListener('input', (e) => {
        currentVolume = e.target.value;
        localVideoPlayer.volume = currentVolume / 100;
        if (youtubePlayer && youtubePlayer.setVolume) {
            youtubePlayer.setVolume(currentVolume);
        }
    });

    function updateMuteState() {
        localVideoPlayer.muted = isMuted;
        if (youtubePlayer) {
            if (isMuted) {
                youtubePlayer.mute();
            } else {
                youtubePlayer.unMute();
            }
        }
        muteBtn.textContent = isMuted ? 'Unmute' : 'Mute';
    }

    function resumeLastVideo() {
        if (lastPlayedSource === 'youtube' && playlist.length > 0) {
            startYoutubePlayback();
        } else if (lastPlayedSource === 'local' && localVideoPlayer.src) {
            document.getElementById('youtube-player').classList.add('hidden');
            localVideoPlayer.classList.remove('hidden');
            localVideoPlayer.play();
            updateMuteState();
        }
    }

    // Resume playback when tab becomes visible again (if not user-stopped)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            const ytVisible = !document.getElementById('youtube-player').classList.contains('hidden');
            if (ytVisible && youtubePlayer && !userStoppedYoutube) {
                try { youtubePlayer.playVideo(); } catch {}
            } else if (!ytVisible && !localVideoPlayer.classList.contains('hidden')) {
                try { localVideoPlayer.play(); } catch {}
            }
        }
    });

    // Source switching
    function applySourceSelection() {
        // Stop interstellar unless explicitly requested
        if (typeof stopInterstellar === 'function') stopInterstellar();
        if (sourceYoutube && sourceYoutube.checked) {
            // Show video container for video modes
            const vc = document.getElementById('video-background-container');
            vc && vc.classList.remove('hidden');
            // Prefer YouTube
            if (playlist.length > 0) {
                startYoutubePlayback();
            } else {
                // Hide local if was visible
                localVideoPlayer.classList.add('hidden');
                if (youtubePlayer) document.getElementById('youtube-player').classList.add('hidden');
            }
        } else if (sourceLocal && sourceLocal.checked) {
            // Local video mode
            const vc = document.getElementById('video-background-container');
            vc && vc.classList.remove('hidden');
            document.getElementById('youtube-player').classList.add('hidden');
            if (localVideoPlayer.src) {
                localVideoPlayer.classList.remove('hidden');
                localVideoPlayer.play();
            } else {
                // No local selected; just stop YouTube if any
                if (youtubePlayer) document.getElementById('youtube-player').classList.add('hidden');
            }
        } else if (sourceInterstellar && sourceInterstellar.checked) {
            // Start interstellar mode
            stopAllVideo();
            if (typeof startInterstellar === 'function') startInterstellar();
            lastPlayedSource = 'interstellar';
            // Hide entire video container so canvas is unobstructed
            const vc = document.getElementById('video-background-container');
            vc && vc.classList.add('hidden');
        }
    }

    if (sourceYoutube) sourceYoutube.addEventListener('change', applySourceSelection);
    if (sourceLocal) sourceLocal.addEventListener('change', applySourceSelection);
    if (sourceInterstellar) sourceInterstellar.addEventListener('change', applySourceSelection);

    // Load playlist from storage, or seed with provided default if none
    const hadStorage = loadPlaylistFromStorage();
    if (!hadStorage) {
        const seedUrl = 'https://www.youtube.com/watch?v=IWVJq-4zW24&list=RDIWVJq-4zW24';
        const seedId = getYouTubeID(seedUrl);
        if (seedId) {
            playlist = [{ id: seedId, title: `YouTube Video: ${seedId}` }];
            currentPlaylistIndex = 0;
            savePlaylistToStorage();
        }
    }
    // Render initial playlist UI
    if (typeof renderPlaylist === 'function') {
        try { renderPlaylist(); } catch {}
    }

    // Initialize YouTube API if not already
    function onYouTubeIframeAPIReady() {
        createYouTubePlayer();
    };

    // Also attempt immediate creation in case API already loaded
    createYouTubePlayer();

    function onPlayerReady(event) {
        youtubeReady = true;
        // Ensure controls are enabled once ready
        youtubeUrlInput.disabled = false;
        addYoutubeBtn.disabled = false;
        youtubePlayer.setVolume(currentVolume);
        if (playlist.length > 0 && (pendingStart || !document.getElementById('youtube-player').classList.contains('hidden'))) {
            pendingStart = false;
            startYoutubePlayback();
        }
    }

    // Default selection on first load: prefer YouTube mode
    setTimeout(() => {
        if (sourceYoutube) {
            sourceYoutube.checked = true;
            if (sourceLocal) sourceLocal.checked = false;
            if (sourceInterstellar) sourceInterstellar.checked = false;
        }
        applySourceSelection();
    }, 0);
}

// ---------------- Interstellar Background -----------------
function createInterstellar() {
    // Add a debug sphere to visualize impact points
    if (!debugSphere) {
        const sphereGeo = new THREE.SphereGeometry(5.0, 16, 16);
        const sphereMat = new THREE.MeshBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.5 });
        debugSphere = new THREE.Mesh(sphereGeo, sphereMat);
        debugSphere.visible = false;
        scene.add(debugSphere);
    }

    // Initialize a pool of point lights for impact flashes
    for (let i = 0; i < 10; i++) {
        const flash = new THREE.PointLight(0xffffff, 0, 10);
        flash.visible = false;
        flashPool.push(flash);
        scene.add(flash);
    }
    if (interstellarGroup) return interstellarGroup;
    const group = new THREE.Group();
    group.name = 'InterstellarBackground';
    group.frustumCulled = false;
    
    // Helpers: circular sprite + asteroid geometry
    function makeCircleTexture(d = 64) {
        const c = document.createElement('canvas');
        c.width = c.height = d;
        const ctx = c.getContext('2d');
        ctx.clearRect(0,0,d,d);
        const r = d/2;
        const g = ctx.createRadialGradient(r, r, r*0.1, r, r, r);
        g.addColorStop(0, 'rgba(255,255,255,1.0)');
        g.addColorStop(0.7, 'rgba(255,255,255,0.7)');
        g.addColorStop(1, 'rgba(255,255,255,0.0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(r, r, r, 0, Math.PI*2); ctx.fill();
        const tex = new THREE.CanvasTexture(c);
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = true;
        tex.anisotropy = 8;
        return tex;
    }
    function makeAsteroidGeometry(radius = 0.28, detail = 2) {
        const geo = new THREE.IcosahedronGeometry(radius, detail);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const nx = pos.getX(i);
            const ny = pos.getY(i);
            const nz = pos.getZ(i);
            const len = Math.max(0.0001, Math.sqrt(nx*nx+ny*ny+nz*nz));
            const ox = nx/len, oy = ny/len, oz = nz/len;
            const noise = (Math.random()*0.22 - 0.11); // +/-
            pos.setXYZ(i, nx + ox*noise, ny + oy*noise, nz + oz*noise);
        }
        pos.needsUpdate = true;
        geo.computeVertexNormals();
        return geo;
    }

    // Stars are baked into scene.background for realism and to always remain behind the cubes

    // No near star shell; keep background stars static in the background texture

    // Bronze-tinted Oort cloud dust (tiny)
    const dustCount = 2500;
    const dustGeom = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
        const r = 12 + Math.random() * 25;
        const theta = Math.acos(2 * Math.random() - 1);
        const phi = Math.random() * Math.PI * 2;
        dustPos[i * 3 + 0] = r * Math.sin(theta) * Math.cos(phi);
        dustPos[i * 3 + 1] = r * Math.cos(theta);
        dustPos[i * 3 + 2] = r * Math.sin(theta) * Math.sin(phi);
    }
    dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustSprite = makeCircleTexture(64);
    const dustMat = new THREE.PointsMaterial({ color: 0xcd7f32, map: dustSprite, size: 0.012, sizeAttenuation: true, transparent: true, opacity: 0.35, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, alphaTest: 0.01 });
    group.add(new THREE.Points(dustGeom, dustMat));

    // Sun removed per request

    // Boundary globe (initially invisible, toggle from UI)
    function createBoundaryStarTexture(w=1024,h=512){
        const c=document.createElement('canvas'); c.width=w; c.height=h; const ctx=c.getContext('2d');
        // Transparent background; draw only stars with solid cores
        const draw=(x,y,r)=>{ const g=ctx.createRadialGradient(x,y,r*0.1,x,y,r); g.addColorStop(0,'rgba(255,255,255,1.0)'); g.addColorStop(1,'rgba(255,255,255,0.0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); };
        // dense field of small stars (smaller sizes)
        for(let i=0;i<8000;i++){ draw(Math.random()*w,Math.random()*h, Math.random()<0.995?0.35+Math.random()*0.45:0.9+Math.random()*0.6); }
        // a few bright highlights (still small)
        for(let i=0;i<80;i++){ draw(Math.random()*w,Math.random()*h, 1.2+Math.random()*0.8); }
        const tex=new THREE.CanvasTexture(c); tex.generateMipmaps=true; tex.minFilter=THREE.LinearMipmapLinearFilter; tex.magFilter=THREE.LinearFilter; tex.anisotropy=8; return tex;
    }
    if (!boundaryGlobe){
        const geo = new THREE.SphereGeometry(BOUNDARY_RADIUS, 64, 64);
        const mat = new THREE.MeshBasicMaterial({ map: createBoundaryStarTexture(4096,2048), side: THREE.BackSide, transparent: true, opacity: 1.0, depthWrite: false, blending: THREE.NormalBlending, alphaTest: 0.02 });
        boundaryGlobe = new THREE.Mesh(geo, mat);
        boundaryGlobe.name = 'BoundaryGlobe';
        boundaryGlobe.visible = false; // default off
        scene.add(boundaryGlobe);
    }

    // Realistic cratered asteroids with refined physics
    const asteroids = new THREE.Group();
    const baseAsteroidMat = new THREE.MeshStandardMaterial({ color: 0x8b6b3d, metalness: 0.05, roughness: 1.0, transparent: false });
    function makeAsteroidMesh(radius=0.32){
        const geo = new THREE.IcosahedronGeometry(radius, 4); // more faces for smoother base
        const pos = geo.attributes.position;
        // choose crater centers once to avoid artifacts/holes
        const craterCenters = [];
        const craterCount = 24 + Math.floor(Math.random()*12); // more crater centers
        for (let i=0;i<craterCount;i++) craterCenters.push(new THREE.Vector3().randomDirection());
        for(let i=0;i<pos.count;i++){
            const vx = pos.getX(i), vy = pos.getY(i), vz = pos.getZ(i);
            const v = new THREE.Vector3(vx,vy,vz);
            const n = v.clone().normalize();
            // base roughness
            const rx = vx, ry = vy, rz = vz;
            // multi-scale ridges for less round silhouettes
            let d = 0.0;
            d += (Math.sin(rx*2.2)+Math.sin(ry*2.6)+Math.sin(rz*2.1))*0.030;
            d += (Math.sin(rx*4.1)+Math.sin(ry*3.7)+Math.sin(rz*3.9))*0.022;
            d += (Math.sin(rx*7.3)+Math.sin(ry*6.7)+Math.sin(rz*6.1))*0.014;
            // apply crater depressions by angular proximity to crater centers
            for (const c of craterCenters) {
                const dotv = Math.max(-1, Math.min(1, n.dot(c)));
                const ang = Math.acos(dotv); // 0..pi
                const falloff = Math.max(0.0, 1.0 - (ang/0.30));
                if (falloff>0.0) d -= falloff*0.085;
            }
            v.addScaledVector(n, d);
            pos.setXYZ(i, v.x, v.y, v.z);
        }
        pos.needsUpdate = true;
        geo.computeVertexNormals();
        const mat = baseAsteroidMat.clone();
        mat.color.offsetHSL((Math.random()-0.5)*0.03, (Math.random()-0.5)*0.05, (Math.random()-0.5)*0.05);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.userData.radius = radius;
        // opaque only
        return mesh;
    }
    const asteroidObjs = [];
    const AST_COUNT = 18; // +50%
    const halfCube = (typeof CUBE_SIZE === 'number') ? (CUBE_SIZE/2) : 0.9;
    for(let i=0;i<AST_COUNT;i++){
        // Spawn just outside the cube surface so they frequently make contact
        const dir = new THREE.Vector3().randomDirection();
        const dist = halfCube + 0.35 + Math.random()*0.9; // ~1.225 .. 2.025 from center
        const radius = 0.28 + Math.random()*0.18;
        const mesh = makeAsteroidMesh(radius);
        mesh.position.copy(dir.multiplyScalar(dist));
        mesh.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
        const vel = new THREE.Vector3((Math.random()-0.5)*0.05, (Math.random()-0.5)*0.05, (Math.random()-0.5)*0.05); // faster for more impacts
        mesh.userData.vel = vel;
        mesh.userData.lastSplitTs = 0;
        asteroids.add(mesh);
        asteroidObjs.push(mesh);
    }
    group.add(asteroids);

    // expose generator so animate() can create fragments with the same high-quality shape
    group.userData = { dust: true, asteroids, asteroidObjs, makeAsteroidMesh };
    interstellarGroup = group;
    return interstellarGroup;
}

function startInterstellar() {
    interstellarActive = true;
    const g = createInterstellar();
    if (!scene.getObjectByName('InterstellarBackground')) {
        scene.add(g);
    }
    // Set starfield as normal scene background; sun removed
    const starfieldTex = createStarfieldBackgroundTexture(2048, 1024);
    scene.background = starfieldTex;
    // Wire Interstellar options (boundary globe toggle)
    setupInterstellarOptions();
}

function stopInterstellar() {
    interstellarActive = false;
    if (interstellarGroup && interstellarGroup.parent) {
        interstellarGroup.parent.remove(interstellarGroup);
    }
    // Restore transparent background
    scene.background = null;
    if (boundaryGlobe) boundaryGlobe.visible = false;
}

// Wire Interstellar options in modal (global scope)
function setupInterstellarOptions() {
    const chk = document.getElementById('toggle-boundary-globe');
    if (!chk) return;
    // Initialize visibility from checkbox state
    if (boundaryGlobe) boundaryGlobe.visible = !!chk.checked;
    // Bind change handler
    chk.onchange = (e) => {
        const on = !!e.target.checked;
        if (boundaryGlobe) boundaryGlobe.visible = on;
    };
}

function createStarfieldBackgroundTexture(w = 2048, h = 1024) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#000'; ctx.fillRect(0,0,w,h);
    // Round stars
    function drawStar(cx, cy, r, a) {
        const g = ctx.createRadialGradient(cx, cy, r*0.1, cx, cy, r);
        g.addColorStop(0, `rgba(255,255,255,${a})`);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
    }
    const count = 5000;
    for (let i=0;i<count;i++) {
        const x = Math.random()*w;
        const y = Math.random()*h;
        const r = Math.random() < 0.995 ? 0.8 + Math.random()*0.8 : 1.5 + Math.random()*1.5;
        const a = 0.4 + Math.random()*0.6;
        drawStar(x, y, r, a);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 8;
    return tex;
}

function createCircuitTexture(size = 64) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Base
    ctx.fillStyle = '#1a1005'; // Dark bronze/brown
    ctx.fillRect(0, 0, size, size);

    // Traces
    ctx.strokeStyle = '#d4af37'; 
    ctx.lineWidth = Math.max(1, size / 32);
    for (let i = 0; i < 15; i++) {
        ctx.beginPath();
        const x1 = Math.random() * size;
        const y1 = Math.random() * size;
        ctx.moveTo(x1, y1);
        ctx.lineTo(
            (Math.random() > 0.5) ? x1 : Math.random() * size,
            (Math.random() > 0.5) ? y1 : Math.random() * size
        );
        ctx.stroke();
    }
    
    // Pads
    ctx.fillStyle = '#b87333';
    for(let i=0; i<20; i++) {
        const padSize = Math.random() * size / 20;
        ctx.fillRect(Math.random() * size, Math.random() * size, padSize, padSize);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.NearestFilter;
    return texture;
}

function createParticleCubes() {
    particleAnimator = new ParticleTextureAnimator();
    const particleGeometry = new THREE.BoxGeometry(0.04, 0.04, 0.04);
    const particleMaterial = new THREE.MeshStandardMaterial({
        map: particleAnimator.texture,
        emissiveMap: particleAnimator.texture,
        emissive: 0xffffff,
        emissiveIntensity: 1.5,
        metalness: 0.8,
        roughness: 0.4,
    });
    
    particleCubes = new THREE.InstancedMesh(particleGeometry, particleMaterial, PARTICLE_COUNT);
    velocities = [];
    angularVelocities = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const x = (Math.random() - 0.5) * 10;
        const y = (Math.random() - 0.5) * 10;
        const z = (Math.random() - 0.5) * 10;
        dummy.position.set(x, y, z);

        dummy.rotation.x = Math.random() * 2 * Math.PI;
        dummy.rotation.y = Math.random() * 2 * Math.PI;
        dummy.rotation.z = Math.random() * 2 * Math.PI;
        
        dummy.updateMatrix();
        particleCubes.setMatrixAt(i, dummy.matrix);

        velocities.push(new THREE.Vector3(
            (Math.random() - 0.5) * 0.005,
            (Math.random() - 0.5) * 0.005,
            (Math.random() - 0.5) * 0.005
        ));
        
        angularVelocities.push(new THREE.Vector3(
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02
        ));
    }
    
    particleCubes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(particleCubes);
    // Apply current particle budget (performance mode aware)
    applyParticleBudget();
}

function createTetherLines() {
    // An estimate of max connections, can be adjusted.
    // Each connection needs 2 vertices, each vertex has 3 coordinates (x, y, z).
    const maxConnections = PARTICLE_COUNT * 2;
    const positions = new Float32Array(maxConnections * 2 * 3);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));

    const material = new THREE.LineBasicMaterial({
        color: 0xff9933, // brighter bronze
        linewidth: 1, // Note: this is not supported by all GPUs
        transparent: true,
        opacity: 0.6,
    });

    tetherLines = new THREE.LineSegments(geometry, material);
    scene.add(tetherLines);
}

function updateTetherLines(particlePositions, time) {
    if (!tetherLines) return;

    const positions = tetherLines.geometry.attributes.position.array;
    let lineIndex = 0;
    let connections = 0;
    const connectionDistance = 1.8; // How close particles need to be to connect
    const maxConnections = 60; // Hard cap on connections to prevent visual clutter

    const N = particlePositions.length; // respect active particle budget
    for (let i = 0; i < N; i++) {
        // Optimization: check a subset of other particles to avoid N^2
        for (let j = i + 1; j < Math.min(i + 15, N); j++) {
            const p1 = particlePositions[i];
            const p2 = particlePositions[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dz = p1.z - p2.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < connectionDistance && connections < maxConnections) {
                const vec = p2.clone().sub(p1); // Vector from p1 to p2
                const segments = 4; // Number of segments in the energy stream
                let lastPoint = p1.clone();

                for (let k = 1; k <= segments; k++) {
                    const progress = k / segments;
                    let currentPoint = p1.clone().lerp(p2, progress);

                    // Add displacement, but not at the very end
                    if (k < segments) {
                        // Calculate a random perpendicular offset
                        const randomVec = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
                        const perpendicular = new THREE.Vector3().crossVectors(vec, randomVec).normalize();
                        
                        // The displacement is larger in the middle of the line
                        const amplitude = Math.sin(progress * Math.PI) * 0.15;
                        
                        // Add a time-based flutter to the amplitude
                        const flutter = Math.sin(time * 0.05 + i * 0.5) * 0.5 + 0.5; // Varies 0 to 1
                        const finalAmplitude = amplitude * flutter;
                        
                        currentPoint.add(perpendicular.multiplyScalar(finalAmplitude));
                    }
                    
                    positions[lineIndex++] = lastPoint.x;
                    positions[lineIndex++] = lastPoint.y;
                    positions[lineIndex++] = lastPoint.z;

                    positions[lineIndex++] = currentPoint.x;
                    positions[lineIndex++] = currentPoint.y;
                    positions[lineIndex++] = currentPoint.z;

                    lastPoint = currentPoint;
                }
                connections++;
            }
             if (connections >= maxConnections) break;
        }
         if (connections >= maxConnections) break;
    }

    // Important: set the draw range to only draw active lines
    // Each connection now has multiple segments
    const segmentsPerConnection = 4;
    tetherLines.geometry.setDrawRange(0, connections * segmentsPerConnection * 2);
    tetherLines.geometry.attributes.position.needsUpdate = true;
}

function updateParticleCubes(time) {
    if (!particleCubes) return;

    if (particleAnimator) {
        particleAnimator.update();
    }
    
    const particlePositions = [];

    const limit = particleActiveCount || PARTICLE_COUNT;
    for (let i = 0; i < limit; i++) {
        particleCubes.getMatrixAt(i, dummy.matrix);
        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

        // Update position
        dummy.position.add(velocities[i]);
        
        // Boundary check (wrap around)
        if (dummy.position.x > bounds) dummy.position.x = -bounds;
        if (dummy.position.x < -bounds) dummy.position.x = bounds;
        if (dummy.position.y > bounds) dummy.position.y = -bounds;
        if (dummy.position.y < -bounds) dummy.position.y = bounds;
        if (dummy.position.z > bounds) dummy.position.z = -bounds;
        if (dummy.position.z < -bounds) dummy.position.z = bounds;

        // Update rotation
        dummy.rotation.x += angularVelocities[i].x;
        dummy.rotation.y += angularVelocities[i].y;
        dummy.rotation.z += angularVelocities[i].z;

        dummy.updateMatrix();
        particleCubes.setMatrixAt(i, dummy.matrix);
        particlePositions.push(dummy.position.clone());
    }
    particleCubes.instanceMatrix.needsUpdate = true;
    if (particleCubes.count !== limit) particleCubes.count = limit;
    updateTetherLines(particlePositions, time);
}

function applyParticleBudget() {
    const desired = performanceMode ? Math.max(50, Math.floor(PARTICLE_COUNT * 0.5)) : PARTICLE_COUNT;
    particleActiveCount = desired;
    if (particleCubes) {
        particleCubes.count = desired;
        particleCubes.instanceMatrix.needsUpdate = true;
    }
}

function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = null;

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 20000);
    camera.position.z = 2.5;

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Clamp pixel ratio for performance while keeping clarity
    const maxDevicePixelRatio = 1.5;
    renderer.setPixelRatio(Math.min(maxDevicePixelRatio, window.devicePixelRatio || 1));
    document.body.appendChild(renderer.domElement);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    // Lighting
    // All lights are now bronze/gold tones to create rich reflections.
    const ambientLight = new THREE.AmbientLight(0xcd7f32, 0.8); // Low-intensity bronze ambient light
    scene.add(ambientLight);

    directionalLight = new THREE.DirectionalLight(0xcd7f32, 1.5);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    
    // Add multiple orbiting point lights for more dynamic lighting from various angles
    pLight1Container = new THREE.Object3D();
    scene.add(pLight1Container);
    pointLight1 = new THREE.PointLight(0xf0e68c, 4.0, 20); // Bright gold light
    pointLight1.position.set(3, 2, 2);
    pLight1Container.add(pointLight1);
    
    pLight2Container = new THREE.Object3D();
    scene.add(pLight2Container);
    pointLight2 = new THREE.PointLight(0xb87333, 5.0, 18); // Copper/bronze light
    pointLight2.position.set(-2, -2, -2.5);
    pLight2Container.add(pointLight2);

    pLight3Container = new THREE.Object3D();
    scene.add(pLight3Container);
    pointLight3 = new THREE.PointLight(0xcd7f32, 5.0, 20); // Standard bronze light
    pointLight3.position.set(0, 3, 0);
    pLight3Container.add(pointLight3);
    
    pLight4Container = new THREE.Object3D();
    scene.add(pLight4Container);
    pointLight4 = new THREE.PointLight(0xd2b48c, 4.0, 18); // Lighter tan/bronze light
    pointLight4.position.set(1, -2, -2);
    pLight4Container.add(pointLight4);

    // Drifting lights attached to the camera
    const driftLight1 = new THREE.PointLight(0xcd7f32, 3.5, 12);
    driftLight1.position.set(0.5, 0.5, 1.5);
    camera.add(driftLight1);
    driftingLights.push(driftLight1);

    const driftLight2 = new THREE.PointLight(0xb87333, 3.0, 12);
    driftLight2.position.set(-0.5, -0.5, 1.5);
    camera.add(driftLight2);
    driftingLights.push(driftLight2);

    const driftLight3 = new THREE.PointLight(0xf0e68c, 2.5, 12);
    driftLight3.position.set(0, 0, 1.5);
    camera.add(driftLight3);
    driftingLights.push(driftLight3);
    
    // Spotlight from camera's perspective
    const cameraSpotlight = new THREE.SpotLight(0xffe4b5, 6.0, 30, Math.PI / 3, 0.5, 2);
    camera.add(cameraSpotlight); // Add as a child of the camera
    // Since the spotlight is a child of the camera and both look down their local -Z axis, no target is needed.
    
    scene.add(camera); // Add camera to scene to make sure its children (lights) are processed

    // Video Background Setup
    setupVideoBackground();
    
    // Particle background
    createParticleCubes();
    createTetherLines();

    // Cube
    const geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
    
    // Create a separate back-facing geometry
    const backGeometry = geometry.clone();
    const pos = backGeometry.attributes.position;
    const normals = backGeometry.attributes.normal;
    const uvs = backGeometry.attributes.uv;
    const indices = backGeometry.index.array;
    
    // Invert faces for back geometry
    for (let i = 0; i < indices.length; i += 3) {
        [indices[i], indices[i + 1]] = [indices[i + 1], indices[i]];
    }
     for (let i = 0; i < normals.count; i++) {
        normals.setXYZ(i, -normals.getX(i), -normals.getY(i), -normals.getZ(i));
    }
    backGeometry.index.needsUpdate = true;
    backGeometry.attributes.normal.needsUpdate = true;


    const textureSize = 512; // Reduced texture resolution
    generator = new UnifiedLabyrinthGenerator(MAZE_SIZE);
    
    const backMaterials = [];

    for (let i = 0; i < 6; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = textureSize;
        canvas.height = textureSize;
        const ctx = canvas.getContext('2d');
        contexts.push(ctx);

        // Bump resources per face
        const bCanvas = document.createElement('canvas');
        bCanvas.width = textureSize;
        bCanvas.height = textureSize;
        const bctx = bCanvas.getContext('2d');
        bumpCanvases.push(bCanvas);
        bumpContexts.push(bctx);

        // Procedural bronze plate + rivet pattern for the OUTER faces
        (function drawBronzePlates(c) {
            const size = c.width;
            // Base bronze
            ctx.fillStyle = '#3b2a12';
            ctx.fillRect(0, 0, size, size);
            // Large vignette for depth
            const rad = ctx.createRadialGradient(size*0.5, size*0.5, size*0.1, size*0.5, size*0.5, size*0.7);
            rad.addColorStop(0, 'rgba(0,0,0,0)');
            rad.addColorStop(1, 'rgba(0,0,0,0.22)');
            ctx.fillStyle = rad; ctx.fillRect(0,0,size,size);

            // Plate grid with slight randomization per tile
            const tiles = 6; // number of plates across
            const cell = size / tiles;
            for (let y=0; y<tiles; y++) {
                for (let x=0; x<tiles; x++) {
                    const px = Math.floor(x*cell + Math.random()*2-1);
                    const py = Math.floor(y*cell + Math.random()*2-1);
                    const w = Math.ceil(cell - 2 + Math.random()*2);
                    const h = Math.ceil(cell - 2 + Math.random()*2);

                    // Subtle plate color variation
                    const hue = 30 + Math.random()*8; // bronze-ish
                    const sat = 55 + Math.random()*10;
                    const light = 28 + Math.random()*6;
                    ctx.fillStyle = `hsl(${hue} ${sat}% ${light}%)`;
                    ctx.fillRect(px, py, w, h);

                    // Brushed strokes inside plate
                    ctx.globalAlpha = 0.12;
                    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
                    ctx.lineWidth = 1;
                    for (let i=0;i<4;i++) {
                        const sx = px + 2 + Math.random()*(w-4);
                        ctx.beginPath();
                        ctx.moveTo(sx, py+2);
                        ctx.lineTo(sx, py+h-2);
                        ctx.stroke();
                    }
                    ctx.globalAlpha = 1.0;

                    // Seams / bevel
                    ctx.strokeStyle = '#1f150a';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(px+0.5, py+0.5, w-1, h-1);
                    // Light edge highlight
                    ctx.strokeStyle = 'rgba(255,220,150,0.12)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(px+2, py+2, w-4, h-4);

                    // Rivets at plate corners
                    const r = Math.max(1.5, cell*0.07);
                    const corners = [
                        [px+6, py+6],
                        [px+w-6, py+6],
                        [px+6, py+h-6],
                        [px+w-6, py+h-6],
                    ];
                    for (const [cx, cy] of corners) {
                        // Shadow
                        ctx.fillStyle = 'rgba(0,0,0,0.45)';
                        ctx.beginPath(); ctx.arc(cx+1, cy+1, r, 0, Math.PI*2); ctx.fill();
                        // Body
                        ctx.fillStyle = '#5c3f1c';
                        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
                        // Highlight
                        ctx.fillStyle = 'rgba(255,240,210,0.6)';
                        ctx.beginPath(); ctx.arc(cx-r*0.3, cy-r*0.3, r*0.35, 0, Math.PI*2); ctx.fill();
                    }
                }
            }
        })(canvas);

        const texture = new THREE.CanvasTexture(canvas);
        textures.push(texture);
        const btex = new THREE.CanvasTexture(bCanvas);
        btex.minFilter = THREE.LinearFilter;
        btex.magFilter = THREE.NearestFilter;
        bumpTextures.push(btex);

        const material = new THREE.MeshStandardMaterial({
            color: 0xcd7f32, // Bronze color
            map: texture,
            metalness: 0.8,
            roughness: 0.3,
            transparent: true,
            opacity: 1.0,
        });
        materials.push(material);

        const backMaterial = material.clone();
        backMaterial.opacity = 0.25;
        backMaterials.push(backMaterial);
    }

    cube = new THREE.Mesh(geometry, materials);
    scene.add(cube);
    
    const backCube = new THREE.Mesh(backGeometry, backMaterials);
    cube.add(backCube);

    // Initial draw so the bronze plates are visible immediately
    if (generator && contexts && textures && contexts.length === 6 && textures.length === 6) {
        for (let f = 0; f < 6; f++) {
            generator.drawFace(f, contexts[f]);
            textures[f].needsUpdate = true;
            if (bumpTextures[f]) bumpTextures[f].needsUpdate = true;
        }
    }

    createLabyrinthWalls();

    // Inner Cube (higher-res textures for less pixelation)
    innerCube = new CircuitryCube(1.7, 1024);
    cube.add(innerCube.mesh); // Add as a child to the labyrinth cube
    /* add fractal stems inside the inner cube */
    stems = new FractalStems(innerCube.mesh);

    // Store initial camera position for reset
    camera.position.clone(initialCameraPosition);

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    animate();
}

function createLabyrinthWalls() {
    const wallGeometry = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, CELL_SIZE);
    
    const wallBackGeometry = wallGeometry.clone();
    const indices = wallBackGeometry.index.array;
    for (let i = 0; i < indices.length; i += 3) {
        [indices[i], indices[i + 1]] = [indices[i + 1], indices[i]];
    }
    const normals = wallBackGeometry.attributes.normal;
    for (let i = 0; i < normals.count; i++) {
        normals.setXYZ(i, -normals.getX(i), -normals.getY(i), -normals.getZ(i));
    }
    wallBackGeometry.index.needsUpdate = true;
    wallBackGeometry.attributes.normal.needsUpdate = true;

    // Create per-face materials that use the face canvas textures so walls show the plate texture
    const wallMaterials = [];
    const wallBackMaterials = [];
    for (let i = 0; i < 6; i++) {
        const wm = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            map: textures[i],
            metalness: 0.85,
            roughness: 0.35,
            bumpMap: bumpTextures[i],
            bumpScale: 0.7
        });
        wallMaterials.push(wm);

        const wbm = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            map: textures[i],
            metalness: 0.85,
            roughness: 0.35,
            bumpMap: bumpTextures[i],
            bumpScale: 0.5,
            transparent: true,
            opacity: 0.25
        });
        wallBackMaterials.push(wbm);
    }

    // keep refs for live tuning
    wallMaterialsRef = wallMaterials;
    wallBackMaterialsRef = wallBackMaterials;

    const maxWallsPerFace = MAZE_SIZE * MAZE_SIZE;
    wallMeshes = [];
    wallBackMeshes = [];
    for (let i = 0; i < 6; i++) {
        const instancedMesh = new THREE.InstancedMesh(wallGeometry, wallMaterials[i], maxWallsPerFace);
        instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        cube.add(instancedMesh);
        wallMeshes.push(instancedMesh);

        const instancedBackMesh = new THREE.InstancedMesh(wallBackGeometry, wallBackMaterials[i], maxWallsPerFace);
        instancedBackMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        cube.add(instancedBackMesh);
        wallBackMeshes.push(instancedBackMesh);
    }

    // After building the labyrinth cube, compute its local-space AABB extents for robust collisions
    try {
        const inv = new THREE.Matrix4().copy(cube.matrixWorld).invert();
        const bbWorld = new THREE.Box3().setFromObject(cube);
        // Transform world AABB corners into cube-local and rebuild a local AABB
        const corners = [
            new THREE.Vector3(bbWorld.min.x, bbWorld.min.y, bbWorld.min.z),
            new THREE.Vector3(bbWorld.min.x, bbWorld.min.y, bbWorld.max.z),
            new THREE.Vector3(bbWorld.min.x, bbWorld.max.y, bbWorld.min.z),
            new THREE.Vector3(bbWorld.min.x, bbWorld.max.y, bbWorld.max.z),
            new THREE.Vector3(bbWorld.max.x, bbWorld.min.y, bbWorld.min.z),
            new THREE.Vector3(bbWorld.max.x, bbWorld.min.y, bbWorld.max.z),
            new THREE.Vector3(bbWorld.max.x, bbWorld.max.y, bbWorld.min.z),
            new THREE.Vector3(bbWorld.max.x, bbWorld.max.y, bbWorld.max.z),
        ];
        const bbLocal = new THREE.Box3();
        for (const c of corners) { c.applyMatrix4(inv); bbLocal.expandByPoint(c); }
        const extents = bbLocal.getSize(new THREE.Vector3()).multiplyScalar(0.5);
        cube.userData = cube.userData || {};
        cube.userData.localExtents = extents;
    } catch {}
}

function updateLabyrinthWalls() {
    if (!wallMeshes || !generator || !wallBackMeshes) return;

    const halfCubeSize = CUBE_SIZE / 2;
    const halfWallHeight = WALL_HEIGHT / 2;
    const gridCenter = (MAZE_SIZE - 1) / 2;

    for (let face = 0; face < 6; face++) {
        const mesh = wallMeshes[face];
        const backMesh = wallBackMeshes[face];
        let count = 0;
        const grid = generator.grids[face];

        for (let gy = 0; gy < MAZE_SIZE; gy++) {
            for (let gx = 0; gx < MAZE_SIZE; gx++) {
                if (grid[gy][gx] === 1) { // It's a wall
                    const u = (gx - gridCenter) * CELL_SIZE;
                    const v = (gy - gridCenter) * CELL_SIZE;
                    
                    let position = new THREE.Vector3();
                    let quaternion = new THREE.Quaternion();

                    switch (face) {
                        case 0: // +X
                            position.set(halfCubeSize + halfWallHeight, -v, u);
                            quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
                            break;
                        case 1: // -X
                            position.set(-halfCubeSize - halfWallHeight, -v, -u);
                            quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 2);
                            break;
                        case 2: // +Y
                            position.set(-u, halfCubeSize + halfWallHeight, v);
                            // No rotation needed for Y faces
                            break;
                        case 3: // -Y
                            position.set(u, -halfCubeSize - halfWallHeight, v);
                            quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
                            break;
                        case 4: // +Z
                            position.set(u, -v, halfCubeSize + halfWallHeight);
                            quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
                            break;
                        case 5: // -Z
                            position.set(-u, -v, -halfCubeSize - halfWallHeight);
                             quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
                            break;
                    }
                    
                    WALL_DUMMY.position.copy(position);
                    WALL_DUMMY.quaternion.copy(quaternion);
                    WALL_DUMMY.updateMatrix();
                    mesh.setMatrixAt(count, WALL_DUMMY.matrix);
                    backMesh.setMatrixAt(count, WALL_DUMMY.matrix);
                    count++;
                }
            }
        }
        mesh.count = count;
        mesh.instanceMatrix.needsUpdate = true;
        backMesh.count = count;
        backMesh.instanceMatrix.needsUpdate = true;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    // resize post targets if present
    if (window.mainRT) {
        window.mainRT.setSize(window.innerWidth, window.innerHeight);
        if (window.compMat) {
            window.compMat.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
        }
    }
}

function updateLabyrinths() {
    // Slower generation and continuous evolution
    const stepsPerFrame = 1; // Fewer steps per frame for performance
    generator.dirtyFaces.clear();

    for(let i = 0; i < stepsPerFrame; i++){
        generator.step();
    }
    generator.fillStep();

    let labyrinthMeshNeedsUpdate = false;
    for (const faceIndex of generator.dirtyFaces) {
        generator.drawFace(faceIndex, contexts[faceIndex]);
        textures[faceIndex].needsUpdate = true;
        labyrinthMeshNeedsUpdate = true;
    }
    if (labyrinthMeshNeedsUpdate) {
        updateLabyrinthWalls();
    }
}

function animate(time) {
    requestAnimationFrame(animate);
    
    // Update all 6 labyrinth textures at a fixed interval
    const now = time || performance.now();
    if (now - lastUpdateTime > updateInterval * 1.2) { // mildly increase labyrinth update interval
        updateLabyrinths();
        lastUpdateTime = now;
    }

    updateParticleCubes(now);

    // Update center circuitry and tethers
    if (centerCircuitAnimator) centerCircuitAnimator.update();
    if (!centerTethers) createCenterTethers();
    if (centerTethers) updateCenterTethers(now);

    // Spin the 9102 inner cube continuously
    if (cube9102) {
        cube9102.rotation.x += 0.012;
        cube9102.rotation.y += 0.017;
        cube9102.rotation.z += 0.009;
    }

    // Update inner cube lights
    if(innerCube) {
        innerCube.update();
        if (particleCubes) {
            particleCubes.rotation.copy(innerCube.mesh.rotation);
        }
    }
    /* update growing stems */
    if (stems) stems.update(time || performance.now());
    
    // Animate point lights
    if(pLight1Container) pLight1Container.rotation.y += 0.005;
    if(pLight2Container) pLight2Container.rotation.x -= 0.008;
    if(pLight3Container) pLight3Container.rotation.z += 0.006;
    if(pLight4Container) {
        pLight4Container.rotation.y -= 0.003;
        pLight4Container.rotation.x += 0.004;
    }

    // Animate drifting lights
    if (driftingLights.length > 0) {
        const t = now * 0.0002;
        driftingLights[0].position.x = Math.sin(t * 0.7 + 1) * 0.8;
        driftingLights[0].position.y = Math.cos(t * 0.5 + 1) * 0.8;
        driftingLights[0].position.z = Math.cos(t * 0.3 + 1) * 0.5 + 1.2;

        driftingLights[1].position.x = Math.sin(t * 0.3 - 1) * 0.9;
        driftingLights[1].position.y = Math.cos(t * 0.8 - 1) * 0.9;
        driftingLights[1].position.z = Math.sin(t * 0.6 - 1) * 0.5 + 1.2;

        driftingLights[2].position.x = Math.cos(t * 0.6) * 0.7;
        driftingLights[2].position.y = Math.sin(t * 0.4) * 0.7;
        driftingLights[2].position.z = Math.cos(t * 0.9) * 0.5 + 1.2;
    }

    // Update light position to match camera position
    if (directionalLight) {
        directionalLight.position.copy(camera.position);
    }

    // Interstellar background animation & physics
    if (interstellarActive && interstellarGroup) {
        const { sun3D, asteroids, asteroidObjs } = interstellarGroup.userData || {};
        // Animate sun shader time
        if (sun3D?.userData?.sunMesh?.material) {
            sun3D.userData.sunMesh.material.uniforms.uTime.value = now * 0.0015;
        }
        if (sun3D?.userData?.corona?.material) {
            sun3D.userData.corona.material.uniforms.uTime.value = now * 0.0015;
        }
        // Sun self-spin (not orbiting around the cubes)
        if (sun3D) {
            sun3D.rotation.y += 0.0005;
        }

        // Animate debug sphere
        if (debugSphere && debugSphere.visible) {
            if (debugSphere.userData.lifetime > 0) {
                debugSphere.userData.lifetime--;
            } else {
                debugSphere.visible = false;
            }
        }

        // Animate impact flashes
        for (const flash of flashPool) {
            if (flash.visible && flash.userData.lifetime > 0) {
                flash.userData.lifetime--;
                flash.intensity *= 0.85; // Fade out
                if (flash.userData.lifetime <= 0) {
                    flash.visible = false;
                }
            }
        }
        // Asteroid physics
        if (asteroids && Array.isArray(asteroidObjs)) {
            const maxCount = 36;
            const raycaster = new THREE.Raycaster();

            for (let i = asteroidObjs.length - 1; i >= 0; i--) {
                const m = asteroidObjs[i];
                const ud = m.userData || {};
                const v = ud.vel;
                if (!v) continue;

                // Spin
                m.rotation.x += 0.002 + (ud.radius || 0.2) * 0.001;
                m.rotation.y += 0.0015;

                const r = ud.radius || 0.25;
                const prevPos = m.position.clone();
                const nextPos = m.position.clone().add(v);
                const rayDir = v.clone().normalize();
                const rayLen = v.length();

                let collisionHandled = false;
                if (typeof cube !== 'undefined' && cube && rayLen > 0) {
                    raycaster.set(prevPos, rayDir);
                    raycaster.far = rayLen + r;
                    const intersects = raycaster.intersectObject(cube, true);

                    if (intersects.length > 0 && intersects[0].distance <= rayLen + r) {
                        const hit = intersects[0];
                        const normal = hit.face.normal.clone();

                        // Move the impact point significantly outside the surface to prevent visual penetration
                        const impactPoint = hit.point.clone().addScaledVector(normal, 1.5);
                        m.position.copy(impactPoint);

                        const currentGeneration = ud.generation || 1;

                        // On impact, split unless the asteroid is 6th generation or older.
                        if (currentGeneration < 6 && asteroidObjs.length < maxCount) {
                            // --- TRIGGER FLASH ---
                            const flash = flashPool.find(f => !f.visible);
                            if (flash) {
                                flash.position.copy(impactPoint);
                                flash.intensity = 200; // Bright flash
                                flash.userData.lifetime = 15; // Frames to live
                                flash.visible = true;
                            }
                            // --- DEBUG VISUALIZER ---
                            if (debugSphere) {
                                debugSphere.position.copy(impactPoint);
                                debugSphere.visible = true;
                                debugSphere.userData.lifetime = 30; // Show for 30 frames
                            }

                            // --- SPLIT LOGIC ---
                            const mk = interstellarGroup.userData?.makeAsteroidMesh;
                            const mat = m.material;
                            const newRad = r * 0.55;
                            const m1 = mk ? mk(newRad) : new THREE.Mesh(new THREE.IcosahedronGeometry(newRad, 5), mat);
                            const m2 = mk ? mk(newRad) : new THREE.Mesh(new THREE.IcosahedronGeometry(newRad, 5), mat);
                            if (!mk) { m1.material = mat; m2.material = mat; }

                            m1.position.copy(impactPoint);
                            m2.position.copy(impactPoint);

                            const baseSpeed = v.length();
                            const reflectedVel = v.clone().reflect(normal);
                            const v1 = reflectedVel.clone().addScaledVector(normal, 0.2).setLength(baseSpeed * 0.6);
                            const v2 = reflectedVel.clone().addScaledVector(normal, 0.2).setLength(baseSpeed * 0.6);
                            const randomVec = new THREE.Vector3().randomDirection().multiplyScalar(0.015);
                            v1.add(randomVec);
                            v2.sub(randomVec);

                            m1.userData = { radius: newRad, vel: v1, lastSplitTs: now, generation: currentGeneration + 1 };
                            m2.userData = { radius: newRad, vel: v2, lastSplitTs: now, generation: currentGeneration + 1 };

                            asteroids.add(m1, m2);
                            asteroidObjs.push(m1, m2);
                        } else if (currentGeneration >= 6) {
                            // --- POPULATION REPLACEMENT LOGIC ---
                            const spawnAsteroid = interstellarGroup.userData?.spawnAsteroid;
                            if (spawnAsteroid) {
                                spawnAsteroid(true); // Spawn one new large asteroid at the boundary
                            }
                        }
                        // Always remove the original asteroid on impact.
                        asteroids.remove(m);
                        asteroidObjs.splice(i, 1);
                        collisionHandled = true;
                    }
                }

                if (!collisionHandled) {
                    m.position.copy(nextPos);
                }

                // Boundary globe reflect
                const R = m.position.length();
                if (R + r > BOUNDARY_RADIUS) {
                    const n = m.position.clone().normalize();
                    const speed = v.length();
                    const vn = n.clone().multiplyScalar(v.dot(n));
                    const vt = v.clone().sub(vn);
                    v.copy(vt.sub(vn));
                    if (v.length() > 1e-6) v.setLength(speed);
                    m.position.copy(n.multiplyScalar(BOUNDARY_RADIUS - r - 0.02));
                }
            }
            // Simple collision detection & splitting
            for (let i = 0; i < asteroidObjs.length; i++) {
                const a = asteroidObjs[i]; const ua = a.userData; if (!ua) continue;
                for (let j = i+1; j < asteroidObjs.length; j++) {
                    const b = asteroidObjs[j]; const ub = b.userData; if (!ub) continue;
                    const dist = a.position.distanceTo(b.position);
                    const sumR = (ua.radius||0.25) + (ub.radius||0.25);
                    if (dist < sumR) {
                        // Separate a bit
                        const n = b.position.clone().sub(a.position).normalize();
                        a.position.addScaledVector(n, -0.02);
                        b.position.addScaledVector(n, 0.02);
                        // Split larger one if budget allows
                        if (asteroidObjs.length < maxCount) {
                            const target = (ua.radius > ub.radius) ? a : b;
                            const ut = target.userData; const rad = ut.radius || 0.25;
                            if (rad > 0.18 && (now - (ut.lastSplitTs||0) > 800)) {
                                ut.lastSplitTs = now;
                                // remove target
                                asteroids.remove(target);
                                const idx = asteroidObjs.indexOf(target);
                                if (idx >= 0) asteroidObjs.splice(idx,1);
                                // create two fragments using the high-quality generator
                                const newRad = rad * 0.68;
                                if (newRad >= 0.14) {
                                    const mk = interstellarGroup.userData?.makeAsteroidMesh;
                                    const baseMat = asteroids.children[0]?.material || new THREE.MeshStandardMaterial({color:0x8b6b3d, metalness:0.1, roughness:0.95});
                                    const m1 = mk ? mk(newRad) : new THREE.Mesh(new THREE.IcosahedronGeometry(newRad,3), baseMat);
                                    const m2 = mk ? mk(newRad) : new THREE.Mesh(new THREE.IcosahedronGeometry(newRad,3), baseMat);
                                    if (!mk) { m1.material = baseMat; m2.material = baseMat; }
                                    m1.position.copy(target.position); m2.position.copy(target.position);
                                    const dir = new THREE.Vector3().randomDirection();
                                    const base = ut.vel ? ut.vel.clone() : new THREE.Vector3();
                                    m1.userData = { radius: newRad, vel: base.clone().addScaledVector(dir, 0.02), lastSplitTs: now };
                                    m2.userData = { radius: newRad, vel: base.clone().addScaledVector(dir, -0.02), lastSplitTs: now };
                                    asteroids.add(m1); asteroids.add(m2);
                                    asteroidObjs.push(m1, m2);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Adaptive resolution scaling to maintain frame rate (disabled in performance mode)
    if (!performanceMode) {
        if (!animate.frameCount) animate.frameCount = 0;
        animate.frameCount++;
        const checkWindow = 750; // ms
        if (now - animate.lastFpsCheck > checkWindow) {
            const fps = (animate.frameCount * 1000) / (now - animate.lastFpsCheck);
            animate.frameCount = 0;
            animate.lastFpsCheck = now;
            const targetFps = 60;
            const currentDpr = renderer.getPixelRatio();
            let desiredDpr = currentDpr;
            if (fps < targetFps * 0.85) desiredDpr = Math.max(1.0, currentDpr - 0.1);
            else if (fps > targetFps * 1.05) desiredDpr = Math.min(1.5, currentDpr + 0.05);
            if (Math.abs(desiredDpr - currentDpr) > 0.01) {
                renderer.setPixelRatio(desiredDpr);
            }
        }
    }

    controls.update();
    // Depth-aware composite pipeline when Interstellar is active
    if (interstellarActive && window.sunScene && window.mainRT && window.compScene && window.compMat && window.compCam) {
        renderer.autoClear = false;
        renderer.clear();
        // 1) Render sun + starfield to screen
        renderer.render(window.sunScene, camera);
        // 2) Render main scene to RT with depth
        renderer.setRenderTarget(window.mainRT);
        renderer.clear(true, true, true);
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);
        // 3) Composite only where depth indicates geometry
        window.compMat.uniforms.tColor.value = window.mainRT.texture;
        window.compMat.uniforms.tDepth.value = window.mainRT.depthTexture;
        renderer.render(window.compScene, window.compCam);
    } else {
        controls.update();
        renderer.render(scene, camera);
    }
}

init();
// Tiny center cube with animated circuitry and bronze energy theme
createCenterCircuitCube();
createCenterWindowFrames();
create9102Cube();
createCenterTethers();
setupVideoBackground();

// Hook up Performance Mode toggle in settings modal
function setupPerformanceToggle() {
    const el = document.getElementById('performance-toggle');
    if (!el) return;
    // Apply current checkbox state
    applyPerformanceMode(!!el.checked);
    el.addEventListener('change', (e) => {
        const on = !!e.target.checked;
        applyPerformanceMode(on);
    });
}

setupPerformanceToggle();