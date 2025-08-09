# Mermaid Land

Interactive Mermaid flowchart playground in the browser. Type Mermaid code on the left, see the diagram on the right with zoom/pan, hover highlights, and click-to-inspect nodes.

• Runs fully client‑side (no sign-in, no server).
• Powered by Mermaid 11 and D3.js.

## Live

Visit the site on GitHub Pages (link in this repository’s About/Pages settings). The URL typically looks like:
https://haroldjcastillo.github.io/mermaid-land/

## What you can do

- Edit Mermaid code and see instant preview.
- Pan and zoom the diagram (mouse drag to pan, mouse wheel/pinch to zoom).
- Use controls to set translate X/Y and scale; “Fit to View” recenters and scales automatically.
- Hover nodes to highlight them.
- Click a node to see its ID and label in a small modal.

## How to use

1) Open the site URL (or open `index.html` locally in a browser).
2) Paste or type Mermaid code in the left textarea (e.g., flowchart TD ...).
3) Adjust view using the sliders or the “Fit to View” button.
4) Click nodes to inspect basic info.

Tips
- Keep resource paths relative so the app works under a repo subpath on Pages.
- The preview auto-renders shortly after you stop typing.

## Requirements

- A modern browser (Chrome, Edge, Firefox, Safari). No installation needed.

## Tech

- Mermaid 11 (CDN ESM)
- D3.js v7 (zoom/pan and interactivity)
- Tailwind CSS (browser build) for layout
- Optional icons via @iconify-json/logos

## Limitations

- The click modal shows only node ID and label; it doesn’t edit the diagram.
- Very large diagrams may be slower to render/zoom depending on your device.

## License

MIT. See repository for details.
