import * as THREE from 'three';

// Generate subtle plant-like texture and bump for stems (hairy/bark feel)
function createStemMaps(size = 256) {
    // Albedo/color texture (subtle fibrous streaks with Y nodes)
    const c1 = document.createElement('canvas');
    c1.width = c1.height = size;
    const ctx = c1.getContext('2d');
    // base green gradient (higher contrast)
    const g = ctx.createLinearGradient(0, 0, 0, size);
    g.addColorStop(0, '#1f6f46');
    g.addColorStop(0.5, '#33b06f');
    g.addColorStop(1, '#1e6a43');
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
    // longitudinal fibers
    ctx.globalAlpha = 0.25;
    for (let i = 0; i < 220; i++) {
        const x = Math.random() * size;
        const w = Math.random() * 1.6 + 0.3;
        ctx.fillStyle = Math.random() > 0.5 ? '#175a3a' : '#49c480';
        ctx.fillRect(x, 0, w, size);
    }
    ctx.globalAlpha = 0.6;
    // sprinkle darker freckles
    for (let i = 0; i < 500; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = Math.random() * 1.2 + 0.2;
        ctx.fillStyle = 'rgba(20,50,30,0.5)';
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 0.9;
    // faint Y-shaped nodes along the height
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    for (let y = 20; y < size; y += Math.floor(size / 8)) {
        const cx = size * 0.5 + (Math.random() - 0.5) * size * 0.1;
        const span = size * 0.18;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, y);
        ctx.lineTo(cx - span * 0.5, y - span * 0.35);
        ctx.moveTo(cx, y);
        ctx.lineTo(cx + span * 0.5, y - span * 0.35);
        ctx.stroke();
    }
    const colorTex = new THREE.CanvasTexture(c1);
    colorTex.colorSpace = THREE.SRGBColorSpace;
    colorTex.wrapS = colorTex.wrapT = THREE.RepeatWrapping;
    colorTex.repeat.set(1, 6); // stretch along length
    colorTex.minFilter = THREE.LinearMipmapLinearFilter;
    colorTex.anisotropy = 8;
    colorTex.needsUpdate = true;

    // Bump map (grayscale): strong fibers and nodes
    const c2 = document.createElement('canvas');
    c2.width = c2.height = size;
    const bctx = c2.getContext('2d');
    bctx.fillStyle = '#808080'; // neutral 50%
    bctx.fillRect(0, 0, size, size);
    bctx.globalAlpha = 0.9;
    for (let i = 0; i < 260; i++) {
        const x = Math.random() * size;
        const w = Math.random() * 1.8 + 0.4;
        bctx.fillStyle = '#a8a8a8';
        bctx.fillRect(x, 0, w, size);
        bctx.fillStyle = '#5c5c5c';
        bctx.fillRect(x + w * 0.6, 0, w * 0.4, size);
    }
    bctx.globalAlpha = 0.9;
    bctx.strokeStyle = '#c5c5c5';
    for (let y = 24; y < size; y += Math.floor(size / 8)) {
        const cx = size * 0.5 + (Math.random() - 0.5) * size * 0.08;
        const span = size * 0.2;
        bctx.lineWidth = 2;
        bctx.beginPath();
        bctx.moveTo(cx, y);
        bctx.lineTo(cx - span * 0.55, y - span * 0.35);
        bctx.moveTo(cx, y);
        bctx.lineTo(cx + span * 0.55, y - span * 0.35);
        bctx.stroke();
    }
    const bumpTex = new THREE.CanvasTexture(c2);
    bumpTex.wrapS = bumpTex.wrapT = THREE.RepeatWrapping;
    bumpTex.repeat.set(1, 6);
    bumpTex.minFilter = THREE.LinearMipmapLinearFilter;
    bumpTex.anisotropy = 8;
    bumpTex.needsUpdate = true;

    return { map: colorTex, bump: bumpTex };
}

export class FractalStems {
    constructor(parent) {
        this.group = new THREE.Group();
        parent.add(this.group);
        const bronzeMat = new THREE.MeshStandardMaterial({
            color: 0xcd7f32, metalness: 0.9, roughness: 0.3, emissive: 0x5a3c1a, emissiveIntensity: 1.2
        });
        const seed = new THREE.Mesh(new THREE.BoxGeometry(0.1,0.1,0.1), bronzeMat);
        seed.visible = false; // Hide the static central cube
        this.group.add(seed);
        this.branchGeom = new THREE.CylinderGeometry(0.01,0.01,1,16); this.branchGeom.translate(0,0.5,0);
        const stemMaps = createStemMaps(256);
        this.branchMat = new THREE.MeshStandardMaterial({
            color: 0xffffff, // let the map define green tones
            emissive: 0x123f26,
            emissiveIntensity: 0.2,
            metalness: 0.02,
            roughness: 0.9,
            transparent: true,
            opacity: 1.0,
            map: stemMaps.map,
            bumpMap: stemMaps.bump,
            bumpScale: 0.5
        });
        // Hair primitives (very light) reused across branches
        this.hairGeom = new THREE.CylinderGeometry(0.00035, 0.0006, 0.03, 3);
        this.hairGeom.translate(0, 0.015, 0); // base at origin, grow upward
        this.hairMat = new THREE.MeshStandardMaterial({
            color: 0x9fd8a6,
            metalness: 0.0,
            roughness: 1.0,
            emissive: 0x0a2f1c,
            emissiveIntensity: 0.15
        });
        this.branches = [];
        // scheduling controls
        this.minActive = 4; this.maxActive = 12;
        this.seedInterval = [1500, 3000];
        this.nextSeedTime = performance.now() + 600 + Math.random()*1200;
        this.lastSeedTime = performance.now();
        this.maxDepth = 7; this.delayStep = 700;
        this.maxBranches = 2500; this.seedCooldown = 900;
    }
    randomDir() {
        const v = new THREE.Vector3(Math.random()*2-1, Math.random()*2-1, Math.random()*2-1);
        return v.normalize();
    }
    spawnSeed(now){
        const dir = this.randomDir();
        const startDelay = 300 + Math.random()*1300;
        // Start from a random point inside the small bronze cube
        const origin = new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1
        );
        this.spawnBranch(origin, dir, 0, this.maxDepth, startDelay, this.delayStep + Math.random()*200);
        this.lastSeedTime = now;
    }
    spawnBranch(origin, dir, depth, maxDepth, startDelay, delayStep) {
        const len = 0.18 + Math.random()*0.35;
        const mesh = new THREE.Mesh(this.branchGeom, this.branchMat.clone());
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0), dir);
        mesh.quaternion.copy(q);
        mesh.position.copy(origin);
        const thickness = Math.pow(0.85, depth);
        mesh.scale.set(thickness, 0.0001, thickness);
        this.group.add(mesh);
        // Attach tiny outward/upward hairs to this branch
        const hairs = this.attachHairs(mesh, len, thickness);
        const now = performance.now();

        this.branches.push({
            mesh, hairs, length: len, origin: origin.clone(), dir: dir.clone(), depth,
            start: now + startDelay, growth: 4200 + Math.random()*4200,
            hold: 1200 + Math.random()*1800, fade: 4800 + Math.random()*7200,
            spawnedChildren: false,
            delayStep
        });
    }
    attachHairs(parentMesh, length, thickness) {
        // Count scales with thickness but stays lightweight
        const count = Math.max(12, Math.floor(80 * thickness));
        const inst = new THREE.InstancedMesh(this.hairGeom, this.hairMat, count);
        inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        const dummy = new THREE.Object3D();
        const radius = 0.01 * thickness;
        for (let i = 0; i < count; i++) {
            const ang = Math.random() * Math.PI * 2;
            const y = Math.random() * length; // along stem
            const r = radius * (0.9 + Math.random()*0.4);
            const nx = Math.cos(ang), nz = Math.sin(ang);
            dummy.position.set(r * nx, y, r * nz);
            // Tilt hair outward plus up
            const up = new THREE.Vector3(0,1,0);
            const outward = new THREE.Vector3(nx, 0, nz).multiplyScalar(0.7);
            const dir = up.clone().add(outward).normalize();
            dummy.quaternion.setFromUnitVectors(up, dir);
            const scale = 0.6 + Math.random()*0.8; // vary length slightly
            dummy.scale.setScalar(scale);
            dummy.updateMatrix();
            inst.setMatrixAt(i, dummy.matrix);
        }
        inst.frustumCulled = true;
        parentMesh.add(inst);
        return inst;
    }
    update(now) {
        // schedule new seeds with staggered timing and fade-driven replenishment
        const tStat = this.branches.map(b=>({b, t: now - b.start}));
        const activeCore = tStat.filter(o=>o.t>=0 && o.t<=o.b.growth+o.b.hold).length;
        const fading = tStat.filter(o=>o.t>o.b.growth+o.b.hold && o.t<=o.b.growth+o.b.hold+o.b.fade).length;
        if (this.branches.length < this.maxBranches) {
            if (now >= this.nextSeedTime && activeCore < this.minActive) {
                this.spawnSeed(now);
                const [a,b]=this.seedInterval; this.nextSeedTime = now + a + Math.random()*(b-a);
            } else if (fading>0 && activeCore < Math.floor(this.maxActive*0.7) && (now - this.lastSeedTime) > this.seedCooldown) {
                this.spawnSeed(now);
                this.nextSeedTime = now + this.seedCooldown + Math.random()*this.seedCooldown;
            }
        }
        for (const b of this.branches) {
            const t = now - b.start;
            if (t < 0) { b.mesh.visible = false; continue; }
            b.mesh.visible = true;
            const gEnd = b.growth, hEnd = gEnd + b.hold, fEnd = hEnd + b.fade;
            let growK = 1, fadeK = 0;
            if (t <= gEnd) {
                const k = Math.max(0, Math.min(1, t / gEnd));
                growK = k*k*(3-2*k); // ease-in-out
            }
            if (t > hEnd) {
                const fk = Math.max(0, Math.min(1, (t - hEnd) / b.fade));
                fadeK = fk*fk*(3-2*fk); // ease-in-out
            }
            const curLen = b.length * growK;
            b.mesh.scale.y = curLen;
            b.mesh.material.opacity = 0.95 * (1 - fadeK);
            
            // spawn Y branches when stem reaches full length
            if (b.depth < this.maxDepth && !b.spawnedChildren && growK >= 1.0) {
                const endPoint = b.origin.clone().add(b.dir.clone().multiplyScalar(b.length));
                const axis = this.randomDir(); // Use a fully random axis for more variation
                const angle = 0.6 + Math.random()*0.7; // ~34 to ~74 degrees
                const d1 = b.dir.clone().applyAxisAngle(axis, angle).normalize();
                const d2 = b.dir.clone().applyAxisAngle(axis, -angle).normalize();
                const childDelay = 120 + Math.random()*260;
                this.spawnBranch(endPoint, d1, b.depth+1, this.maxDepth, childDelay, b.delayStep);
                this.spawnBranch(endPoint, d2, b.depth+1, this.maxDepth, childDelay, b.delayStep);
                b.spawnedChildren = true;
            }

            b.__done = (t > fEnd);
        }
        // cleanup finished stems to keep system running forever
        for (let i=this.branches.length-1;i>=0;i--){
            const b=this.branches[i];
            if (b.__done) {
                if (b.hairs) { b.mesh.remove(b.hairs); b.hairs.geometry.dispose?.(); b.hairs.material.dispose?.(); }
                this.group.remove(b.mesh); b.mesh.geometry.dispose?.(); b.mesh.material.dispose?.(); this.branches.splice(i,1);
            }
        }
    }
}