# content - Render and Synchronize Configurations

All render and synchronize configurations now use the **story_io** CLI.

## Render Configurations

### DrawIO Rendering (uses story_io CLI)

1. **render_increments_drawio.json**
   - Command: `render-increments`
   - Input: `story_graph_increments.json`
   - Output: `story-map-increments.drawio`
   - Path: `docs/story`

### Markdown Rendering (templates only)

2. **render_increments_md.json**
   - Template: `story-map-increments.md`
   - Path: `docs/story`

3. **render_increments_backlog.json**
   - Template: `story-map-increments-backlog.md`
   - Path: `docs/story`

## Synchronize Configurations

### DrawIO Synchronization (uses story_io CLI)

1. **synchronize_drawio_with_story_graph.json**
   - Command: `synchronize`
   - Type: `increments`
   - DrawIO Input: `story-map.drawio`
   - Original: `story_graph.json`
   - Output: `story-graph-drawio-extracted.json`
   - Report: `story-graph-drawio-extracted-merge-report.json`
   - Path: `docs/story`

## Story IO CLI Commands

All DrawIO operations now use:
- **Renderer**: `story_io`
- **Commands**:
  - `render-outline` - Render outline diagram
  - `render-increments` - Render increments diagram
  - `synchronize` - Sync from DrawIO (auto-detects or specify `type: "outline"` or `type: "increments"`)

## Usage

Configurations are processed by the story bot behavior system and invoke the story_io CLI automatically.

