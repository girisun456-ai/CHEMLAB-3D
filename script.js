let scene, camera, renderer, moleculeGroup;

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
    'H': 0xffffff,
    'C': 0x333333,
    'N': 0x3b82f6,
    'O': 0xef4444,
    'F': 0x22c55e,
    'Cl': 0x22c55e,
    'Br': 0x991b1b,
    'I': 0x6b21a8,
    'P': 0xf97316,
    'S': 0xeab308,
    'DEFAULT': 0xa855f7
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

window.onload = () => {
    init3D();
    const searchInput = document.getElementById('molecule-search-input');
    if (searchInput) {
        searchInput.value = 'Water';
        searchMolecule();
    }
};
