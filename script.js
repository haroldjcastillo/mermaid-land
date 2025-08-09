import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
// Initialize Mermaid
mermaid.initialize({
    startOnLoad: true,
    securityLevel: 'loose',
    flowchart: { useMaxWidth: true }
});
mermaid.registerIconPacks([
    {
        name: 'logos',
        loader: () =>
            fetch('https://unpkg.com/@iconify-json/logos@1/icons.json').then((res) => res.json()),
    },
]);

// Simple memoized element getter to avoid repeated lookups
const __memo = {};
function el(id) {
    return (__memo[id] ||= document.getElementById(id));
}

function addInteractivity() {
    const svg = d3.select('#mermaid-diagram svg');
    // Select all nodes
    const nodes = svg.selectAll('.node')
        .classed('node', true);

    // Add hover effect with D3.js
    nodes.on('mouseover', function () {
        const nodeElement = d3.select(this);
        nodeElement.select('rect').style('fill', 'lightblue');
        nodeElement.select('polygon').style('fill', 'lightblue');
    })
        .on('mouseout', function () {
            const nodeElement = d3.select(this);
            nodeElement.select('rect').style('fill', ''); // Revert to default
            nodeElement.select('polygon').style('fill', ''); // Revert to default
        })
        .on('click', function () {
            const nodeElement = d3.select(this);
            const nodeId = nodeElement.attr('id').replace('flowchart-', '').replace(/-\d+$/, '');
            const labelElement = nodeElement.select('.nodeLabel');
            const label = labelElement.empty() ? 'Unknown' : labelElement.text();
            // Show modal with metadata only
            el('node-id').textContent = nodeId;
            el('node-label').textContent = label;
            el('overlay').style.display = 'block';
            el('modal').style.display = 'block';
        });
}

function closeModal() {
    el('overlay').style.display = 'none';
    el('modal').style.display = 'none';
}
el('close-btn').onclick = closeModal;
el('overlay').onclick = closeModal;

// Debounce utility
function debounce(fn, delay) {
    let timer = null;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// D3 zoom integration: one instance that keeps controls + metrics in sync
let zoomBehavior = null;
function initZoom() {
    const svgEl = document.querySelector('#mermaid-diagram svg');
    const gEl = svgEl ? svgEl.querySelector('g') : null;
    if (!svgEl || !gEl) return;
    const svg = d3.select(svgEl);
    zoomBehavior = d3.zoom()
        .scaleExtent([0.1, 5])
        .on('zoom', (event) => {
            // Apply transform to the <g>
            gEl.setAttribute('transform', event.transform.toString());
            // Update metrics (which also syncs controls)
            updateMetrics();
        });
    svg.call(zoomBehavior);
}

// Set SVG to full size and apply custom styles
function setSvgFullSize() {
    const svg = document.querySelector('#mermaid-diagram svg');
    if (svg) {
        svg.style.overflow = 'hidden';
        svg.style.minWidth = '100%';
        svg.style.minHeight = '100%';
        svg.style.touchAction = 'none';
        svg.style.userSelect = 'none';
        svg.style.webkitUserDrag = 'none';
        svg.style.webkitTapHighlightColor = 'rgba(0, 0, 0, 0)';
    }
}

// Render Mermaid diagram from textarea
function renderMermaid() {
    const code = el('mermaid-code').value;
    const diagramDiv = el('mermaid-diagram');
    diagramDiv.innerHTML = `<pre class="mermaid w-full h-full">${code}</pre>`;
    mermaid.contentLoaded(); // Trigger Mermaid to render the new content
    // After render settles, size, fit, add interactivity, and update metrics
    setTimeout(() => {
        setSvgFullSize();
        initZoom();
        fitDiagramToView();
        addInteractivity();
        updateMetrics();
    }, 400);
}

// Single initializer for all DOM-ready work
window.addEventListener('DOMContentLoaded', () => {
    setupControls();
    el('mermaid-code').addEventListener('input', debounce(renderMermaid, 600));
    renderMermaid();
    // Update metrics on resize; optional refit can be triggered manually via Fit button
    window.addEventListener('resize', updateMetrics);
});

// Helpers to access and set the group's transform
function getSvgAndGroup() {
    const svg = document.querySelector('#mermaid-diagram svg');
    const g = svg ? svg.querySelector('g') : null;
    return { svg, g };
}

function setGroupTransform(x, y, scale) {
    const { g } = getSvgAndGroup();
    if (!g) return;
    g.setAttribute('transform', `translate(${x},${y}) scale(${scale})`);
}

function translateAndScale(x, y, scale) {
    // Directly set the transform on the group's transform attribute
    setTransform(x, y, scale);
    updateMetrics();
}

// Unified setter: use zoom if available so internal state stays consistent
function setTransform(x, y, scale) {
    const svgEl = document.querySelector('#mermaid-diagram svg');
    if (svgEl && zoomBehavior) {
        const t = d3.zoomIdentity.translate(x, y).scale(scale);
        d3.select(svgEl).call(zoomBehavior.transform, t);
    } else {
        setGroupTransform(x, y, scale);
    }
}

// Parse a transform string like "translate(x,y) scale(s)" into numbers
function parseTransform(transformStr) {
    const result = { tx: 0, ty: 0, s: 1 };
    if (!transformStr) return result;
    const tMatch = /translate\(([-\d+.eE]+)[, ]+([-\d+.eE]+)\)/.exec(transformStr);
    if (tMatch) {
        result.tx = parseFloat(tMatch[1]);
        result.ty = parseFloat(tMatch[2]);
    }
    const sMatch = /scale\(([-\d+.eE]+)\)/.exec(transformStr);
    if (sMatch) {
        result.s = parseFloat(sMatch[1]);
    }
    return result;
}

// Update the live metrics panel values
function updateMetrics() {
    const { svg, g } = getSvgAndGroup();
    const sx = el('svg-x');
    const sy = el('svg-y');
    const sw = el('svg-w');
    const sh = el('svg-h');
    const gtx = el('g-tx');
    const gty = el('g-ty');
    const gs = el('g-scale');
    const gw = el('g-w');
    const gh = el('g-h');
    if (!sx || !svg) return;
    const rect = svg.getBoundingClientRect();
    sx.textContent = Math.round(rect.left);
    sy.textContent = Math.round(rect.top);
    sw.textContent = Math.round(rect.width);
    sh.textContent = Math.round(rect.height);
    if (g && g.getAttribute) {
        const t = parseTransform(g.getAttribute('transform'));
        gtx.textContent = Number.isFinite(t.tx) ? t.tx.toFixed(2) : '0';
        gty.textContent = Number.isFinite(t.ty) ? t.ty.toFixed(2) : '0';
        gs.textContent = Number.isFinite(t.s) ? t.s.toFixed(3) : '1';
        // Keep the controls synchronized with current transform
        const tx = el('ctrl-tx');
        const ty = el('ctrl-ty');
        const s = el('ctrl-scale');
        const txNum = el('ctrl-tx-num');
        const tyNum = el('ctrl-ty-num');
        const sNum = el('ctrl-scale-num');
        if (tx && ty && s && txNum && tyNum && sNum) {
            tx.value = txNum.value = String(t.tx);
            ty.value = tyNum.value = String(t.ty);
            s.value = sNum.value = String(t.s);
        }
        // Also show group's bounding box size (in local coords after transform reset not applied)
        if (typeof g.getBBox === 'function' && gw && gh) {
            try {
                const bb = g.getBBox();
                gw.textContent = Math.round(bb.width);
                gh.textContent = Math.round(bb.height);
            } catch (_) {
                // ignore when not available
            }
        }
    }
}

// Fit the diagram's <g> into the container with optional padding
function fitDiagramToView(padding = 10) {
    const container = el('mermaid-diagram');
    const { svg, g } = getSvgAndGroup();
    if (!container || !svg || !g) return;

    // Reset transform to measure raw bbox
    setGroupTransform(0, 0, 1);
    // Force a reflow so bbox is up to date
    // eslint-disable-next-line no-unused-expressions
    g.getBBox && g.getBBox();

    const bbox = g.getBBox();
    const cw = container.clientWidth || svg.clientWidth;
    const ch = container.clientHeight || svg.clientHeight;
    if (!bbox || !bbox.width || !bbox.height || !cw || !ch) return;

    const scaleX = (cw - 2 * padding) / bbox.width;
    const scaleY = (ch - 2 * padding) / bbox.height;
    const scale = Math.max(0.0001, Math.min(scaleX, scaleY));
    const tx = (cw - bbox.width * scale) / 2 - bbox.x * scale;
    const ty = (ch - bbox.height * scale) / 2 - bbox.y * scale;

    svg.removeAttribute('viewBox');

    // Apply via unified setter
    setTransform(tx, ty, scale);

    updateMetrics();
}

// Controls wiring for translate and scale
function setupControls() {
    const tx = document.getElementById('ctrl-tx');
    const ty = document.getElementById('ctrl-ty');
    const s = document.getElementById('ctrl-scale');
    const txNum = document.getElementById('ctrl-tx-num');
    const tyNum = document.getElementById('ctrl-ty-num');
    const sNum = document.getElementById('ctrl-scale-num');
    const btnFit = document.getElementById('btn-fit');

    if (!tx || !ty || !s) return;

    // Sync range and number inputs
    const sync = (range, number) => {
        range.addEventListener('input', () => { number.value = range.value; apply(); });
        number.addEventListener('input', () => { range.value = number.value; apply(); });
    };

    function apply() {
        const x = parseFloat(tx.value) || 0;
        const y = parseFloat(ty.value) || 0;
        const scale = parseFloat(s.value) || 1;
        translateAndScale(x, y, scale);
    }

    sync(tx, txNum);
    sync(ty, tyNum);
    sync(s, sNum);

    btnFit && btnFit.addEventListener('click', () => {
        fitDiagramToView();
    });

}