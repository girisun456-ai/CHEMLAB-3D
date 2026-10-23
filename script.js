let viewer = null;

window.onload = () => {
    const element = document.getElementById('molecule-canvas-container');
    if (element) {
        let config = { backgroundColor: '#0f172a' };
        viewer = $3Dmol.createViewer(element, config);
    }
    
    const searchInput = document.getElementById('molecule-search-input');
    if (searchInput) {
        searchInput.value = 'Water';
        searchUniversalMolecule();
    }
};

async function searchUniversalMolecule() {
    const query = document.getElementById('molecule-search-input').value.trim();
    const infoBox = document.getElementById('molecule-info');
    
    if (!query) {
        alert('Please enter a molecule or salt name!');
        return;
    }

    if (infoBox) infoBox.innerHTML = `<p class="text-yellow-400">Fetching 3D structure for "${query}" from PubChem...</p>`;

    if (!viewer) {
        const element = document.getElementById('molecule-canvas-container');
        viewer = $3Dmol.createViewer(element, { backgroundColor: '#0f172a' });
    }

    viewer.clear();

    try {
        let response = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(query)}/SDF?record_type=3d`);
        
        if (!response.ok) {
            response = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(query)}/SDF`);
        }

        if (!response.ok) {
            throw new Error('Structure not found');
        }

        let sdfData = await response.text();

        viewer.addModel(sdfData, "sdf");
        viewer.setStyle({}, { sphere: { scale: 0.3 }, stick: { radius: 0.15 } });
        viewer.zoomTo();
        viewer.render();

        if (infoBox) {
            infoBox.innerHTML = `
                <h3 class="text-xl font-bold text-emerald-400 capitalize">${query}</h3>
                <p class="text-sm text-slate-300 mt-1">3D Structure loaded successfully from PubChem database.</p>
                <p class="text-xs text-slate-400 mt-1">You can rotate, zoom, and drag the 3D model using your mouse.</p>
            `;
        }

    } catch (error) {
        console.error(error);
        if (infoBox) {
            infoBox.innerHTML = `<p class="text-red-400">Could not load 3D structure for "<b>${query}</b>". Please check the spelling or try another compound name.</p>`;
        }
    }
}

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
