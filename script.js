let scene, camera, renderer, moleculeGroup;

// Initialize Three.js Scene
function init3D() {
    const container = document.getElementById('molecule-canvas-container');
    if (!container) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);

    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 10;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 10, 10);
    scene.add(dirLight);

    moleculeGroup = new THREE.Group();
    scene.add(moleculeGroup);

    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    renderer.domElement.addEventListener('mousedown', () => { isDragging = true; });

    renderer.domElement.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaMove = {
                x: e.clientX - previousMousePosition.x,
                y: e.clientY - previousMousePosition.y
            };
            moleculeGroup.rotation.y += deltaMove.x * 0.01;
            moleculeGroup.rotation.x += deltaMove.y * 0.01;
        }
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => { isDragging = false; });

    window.addEventListener('resize', () => {
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    if (moleculeGroup) {
        moleculeGroup.rotation.y += 0.003;
    }
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

const atomColors = {
    'H': 0xffffff, 'C': 0x333333, 'N': 0x3b82f6, 'O': 0xef4444, 'F': 0x22c55e,
    'Cl': 0x22c55e, 'Br': 0x991b1b, 'I': 0x6b21a8, 'P': 0xf97316, 'S': 0xeab308,
    'Mn': 0x9333ea, 'Ba': 0x00c853, 'DEFAULT': 0xa855f7
};

async function searchMolecule() {
    const query = document.getElementById('molecule-search-input').value.trim();
    const infoBox = document.getElementById('molecule-info');
    
    if (!query) {
        alert('Please enter a molecule name!');
        return;
    }

    if (infoBox) infoBox.innerHTML = '<p class="text-yellow-400">Loading 3D structure from PubChem...</p>';

    try {
        const response = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(query)}/SDF?record_type=3d`);
        
        if (!response.ok) {
            throw new Error('Molecule 3D structure not found.');
        }

        const sdfText = await response.text();
        parseAndRenderSDF(sdfText, query);

    } catch (error) {
        console.error(error);
        if (infoBox) {
            infoBox.innerHTML = `<p class="text-red-400">Error: Could not load "${query}". Try searching with common chemical names like <b>aspirin</b>, <b>caffeine</b>, <b>glucose</b>, or <b>benzene</b>.</p>`;
        }
    }
}

function parseAndRenderSDF(sdfText, name) {
    while (moleculeGroup.children.length > 0) {
        moleculeGroup.children.pop();
    }

    const lines = sdfText.split('\n');
    if (lines.length < 10) return;

    const countsLine = lines[3];
    const numAtoms = parseInt(countsLine.substring(0, 3).trim());
    const numBonds = parseInt(countsLine.substring(3, 6).trim());

    const atoms = [];
    let lineIdx = 4;

    for (let i = 0; i < numAtoms; i++) {
        const line = lines[lineIdx];
        const x = parseFloat(line.substring(0, 10).trim());
        const y = parseFloat(line.substring(10, 20).trim());
        const z = parseFloat(line.substring(20, 30).trim());
        const symbol = line.substring(31, 34).trim();

        atoms.push({ x, y, z, symbol });
        lineIdx++;
    }

    let centerX = 0, centerY = 0, centerZ = 0;
    atoms.forEach(a => { centerX += a.x; centerY += a.y; centerZ += a.z; });
    centerX /= numAtoms; centerY /= numAtoms; centerZ /= numAtoms;

    atoms.forEach(atom => {
        const color = atomColors[atom.symbol] || atomColors['DEFAULT'];
        const radius = atom.symbol === 'H' ? 0.35 : 0.55;

        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const material = new THREE.MeshPhongMaterial({ color: color, shininess: 90 });
        const sphere = new THREE.Mesh(geometry, material);

        sphere.position.set(atom.x - centerX, atom.y - centerY, atom.z - centerZ);
        moleculeGroup.add(sphere);
    });

    for (let i = 0; i < numBonds; i++) {
        const line = lines[lineIdx];
        const atom1Idx = parseInt(line.substring(0, 3).trim()) - 1;
        const atom2Idx = parseInt(line.substring(3, 6).trim()) - 1;

        if (atoms[atom1Idx] && atoms[atom2Idx]) {
            createBond(
                atoms[atom1Idx].x - centerX, atoms[atom1Idx].y - centerY, atoms[atom1Idx].z - centerZ,
                atoms[atom2Idx].x - centerX, atoms[atom2Idx].y - centerY, atoms[atom2Idx].z - centerZ
            );
        }
        lineIdx++;
    }

    const infoBox = document.getElementById('molecule-info');
    if (infoBox) {
        infoBox.innerHTML = `
            <h3 class="text-xl font-bold text-green-400 capitalize">${name}</h3>
            <p class="text-sm text-gray-300 mt-1">Total Atoms: <b>${numAtoms}</b> | Bonds: <b>${numBonds}</b></p>
            <p class="text-xs text-gray-400 mt-1">3D Structure fetched live from PubChem Database.</p>
        `;
    }
}

function createBond(x1, y1, z1, x2, y2, z2) {
    const start = new THREE.Vector3(x1, y1, z1);
    const end = new THREE.Vector3(x2, y2, z2);
    const distance = start.distanceTo(end);

    const geometry = new THREE.CylinderGeometry(0.12, 0.12, distance, 16);
    const material = new THREE.MeshPhongMaterial({ color: 0x94a3b8 });
    const cylinder = new THREE.Mesh(geometry, material);

    const orientation = new THREE.Matrix4();
    orientation.lookAt(start, end, new THREE.Object3D().up);
    orientation.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));

    cylinder.applyMatrix4(orientation);
    cylinder.position.copy(start.clone().add(end).multiplyScalar(0.5));

    moleculeGroup.add(cylinder);
}

// --- ALL 118 ELEMENTS MOLAR MASS DATABASE ---
const elementWeights = {
    H: 1.008, He: 4.0026, Li: 6.94, Be: 9.0122, B: 10.81, C: 12.011, N: 14.007, O: 15.999, F: 18.998, Ne: 20.180,
    Na: 22.990, Mg: 24.305, Al: 26.982, Si: 28.085, P: 30.974, S: 32.06, Cl: 35.45, Ar: 39.948, K: 39.098, Ca: 40.078,
    Sc: 44.956, Ti: 47.867, V: 50.942, Cr: 51.996, Mn: 54.938, Fe: 55.845, Co: 58.933, Ni: 58.693, Cu: 63.546, Zn: 65.38,
    Ga: 69.723, Ge: 72.63, As: 74.922, Se: 78.971, Br: 79.904, Kr: 83.798, Rb: 85.468, Sr: 87.62, Y: 88.906, Zr: 91.224,
    Nb: 92.906, Mo: 95.95, Tc: 98, Ru: 101.07, Rh: 102.91, Pd: 106.42, Ag: 107.87, Cd: 112.41, In: 114.82, Sn: 118.71,
    Sb: 121.76, Te: 127.60, I: 126.90, Xe: 131.29, Cs: 132.91, Ba: 137.33, La: 138.91, Ce: 140.12, Pr: 140.91, Nd: 144.24,
    Pm: 145, Sm: 150.36, Eu: 151.96, Gd: 157.25, Tb: 158.93, Dy: 162.50, Ho: 164.93, Er: 167.26, Tm: 168.93, Yb: 173.05,
    Lu: 174.97, Hf: 178.49, Ta: 180.95, W: 183.84, Re: 186.21, Os: 190.23, Ir: 192.22, Pt: 195.08, Au: 196.97, Hg: 200.59,
    Tl: 204.38, Pb: 207.2, Bi: 208.98, Po: 209, At: 210, Rn: 222, Fr: 223, Ra: 226, Ac: 227, Th: 232.04,
    Pa: 231.04, U: 238.03, Np: 237, Pu: 244, Am: 243, Cm: 247, Bk: 247, Cf: 251, Es: 252, Fm: 257,
    Md: 258, No: 259, Lr: 266, Rf: 267, Db: 268, Sg: 269, Bh: 270, Hs: 277, Mt: 278, Ds: 281,
    Rg: 282, Cn: 285, Nh: 286, Fl: 289, Mc: 290, Lv: 293, Ts: 294, Og: 294
};

function calculateMolarMass() {
    const formula = document.getElementById('formula-input').value.trim();
    const resultBox = document.getElementById('calc-result');
    if (!formula) return;

    const regex = /([A-Z][a-z]*)(\d*)/g;
    let match;
    let totalMass = 0;
    let details = [];

    while ((match = regex.exec(formula)) !== null) {
        const elem = match[1];
        const count = match[2] ? parseInt(match[2]) : 1;

        if (elementWeights[elem]) {
            const mass = elementWeights[elem] * count;
            totalMass += mass;
            details.push(`${elem} (${elementWeights[elem]} × ${count}) = ${mass.toFixed(2)} g/mol`);
        } else {
            resultBox.classList.remove('hidden');
            resultBox.innerHTML = `<p class="text-red-400">Unknown element: <b>${elem}</b>. Please check spelling (case-sensitive).</p>`;
            return;
        }
    }

    if (totalMass > 0) {
        resultBox.classList.remove('hidden');
        resultBox.innerHTML = `
            <h3 class="text-lg font-bold text-emerald-400">Molar Mass: ${totalMass.toFixed(3)} g/mol</h3>
            <ul class="text-xs text-slate-300 mt-2 space-y-1">${details.map(d => `<li>• ${d}</li>`).join('')}</ul>
        `;
    }
}

window.onload = () => {
    init3D();
    const searchInput = document.getElementById('molecule-search-input');
    if (searchInput) {
        searchInput.value = 'Water';
        searchMolecule();
    }
};
