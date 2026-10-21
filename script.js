let scene, camera, renderer, currentMoleculeGroup;

function init3D() {
    const container = document.getElementById('canvasContainer');
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 8);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    currentMoleculeGroup = new THREE.Group();
    scene.add(currentMoleculeGroup);

    drawWater();

    function animate() {
        requestAnimationFrame(animate);
        if (currentMoleculeGroup) {
            currentMoleculeGroup.rotation.y += 0.01;
            currentMoleculeGroup.rotation.x += 0.005;
        }
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

function clearMolecule() {
    while (currentMoleculeGroup.children.length > 0) {
        const obj = currentMoleculeGroup.children[0];
        currentMoleculeGroup.remove(obj);
    }
}

function drawWater() {
    clearMolecule();
    const oxyGeo = new THREE.SphereGeometry(0.8, 32, 32);
    const oxyMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
    const oxygen = new THREE.Mesh(oxyGeo, oxyMat);
    currentMoleculeGroup.add(oxygen);

    const hydGeo = new THREE.SphereGeometry(0.4, 32, 32);
    const hydMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });

    const h1 = new THREE.Mesh(hydGeo, hydMat);
    h1.position.set(-1.2, -0.8, 0);
    currentMoleculeGroup.add(h1);

    const h2 = new THREE.Mesh(hydGeo, hydMat);
    h2.position.set(1.2, -0.8, 0);
    currentMoleculeGroup.add(h2);
}

document.getElementById('moleculeSelect').addEventListener('change', (e) => {
    const val = e.target.value;
    const formula = document.getElementById('molFormula');
    const geometry = document.getElementById('molGeometry');
    const angle = document.getElementById('molAngle');

    if (val === 'water') {
        drawWater();
        formula.innerText = "H₂O";
        geometry.innerText = "BENT / V-Shaped";
        angle.innerText = "104.5°";
    } else if (val === 'methane') {
        clearMolecule();
        const cGeo = new THREE.SphereGeometry(0.7, 32, 32);
        const cMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
        currentMoleculeGroup.add(new THREE.Mesh(cGeo, cMat));
        
        formula.innerText = "CH₄";
        geometry.innerText = "Tetrahedral";
        angle.innerText = "109.5°";
    } else if (val === 'ammonia') {
        clearMolecule();
        const nGeo = new THREE.SphereGeometry(0.75, 32, 32);
        const nMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });
        currentMoleculeGroup.add(new THREE.Mesh(nGeo, nMat));

        formula.innerText = "NH₃";
        geometry.innerText = "Trigonal Pyramidal";
        angle.innerText = "107°";
    }
});

const elementsData = [
    { symbol: 'H', name: 'Hydrogen', num: 1, type: 'Non-Metal', desc: 'Lightest chemical element with 1 proton and 1 electron.' },
    { symbol: 'He', name: 'Helium', num: 2, type: 'Noble Gas', desc: 'Colorless, odorless, tasteless, non-toxic noble gas.' },
    { symbol: 'Li', name: 'Lithium', num: 3, type: 'Alkali Metal', desc: 'Soft, silvery alkali metal used in rechargeable batteries.' },
    { symbol: 'C', name: 'Carbon', num: 6, type: 'Non-Metal', desc: 'Basis of all known organic life; forms graphite and diamond.' },
    { symbol: 'N', name: 'Nitrogen', num: 7, type: 'Non-Metal', desc: 'Makes up about 78% of Earth\'s atmosphere.' },
    { symbol: 'O', name: 'Oxygen', num: 8, type: 'Non-Metal', desc: 'Essential for aerobic cellular respiration in complex life.' },
    { symbol: 'Fe', name: 'Iron', num: 26, type: 'Transition Metal', desc: 'Transition metal crucial for hemoglobin in blood.' },
    { symbol: 'Co', name: 'Cobalt', num: 27, type: 'Transition Metal', desc: 'Hard, lustrous transition metal used in alloys and complexes.' }
];

function loadPeriodicTable() {
    const grid = document.getElementById('elementGrid');
    elementsData.forEach(elem => {
        const card = document.createElement('div');
        card.className = "element-card bg-slate-900 border border-slate-700 p-3 rounded-xl text-center shadow-md hover:border-teal-400";
        card.innerHTML = `
            <span class="text-xs text-slate-400 block text-left">${elem.num}</span>
            <span class="text-2xl font-extrabold text-teal-400 block my-1">${elem.symbol}</span>
            <span class="text-xs text-slate-300 block truncate">${elem.name}</span>
        `;
        card.onclick = () => {
            document.getElementById('elementDetail').classList.remove('hidden');
            document.getElementById('elemName').innerText = `${elem.name} (${elem.symbol}) - Atomic No: ${elem.num}`;
            document.getElementById('elemDesc').innerText = `${elem.desc} [Type: ${elem.type}]`;
        };
        grid.appendChild(card);
    });
}

function calculateMagneticMoment() {
    const n = parseFloat(document.getElementById('unpairedN').value);
    if (isNaN(n) || n < 0) {
        alert("Please enter a valid number of electrons!");
        return;
    }
    const mu = Math.sqrt(n * (n + 2));
    document.getElementById('magValue').innerText = mu.toFixed(2);
    document.getElementById('calcResult').classList.remove('hidden');
}

window.onload = () => {
    init3D();
    loadPeriodicTable();
};