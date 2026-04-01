"""
Render story graph JSON to text format following template structure.
"""
import json
from pathlib import Path
import sys


def render_story(story, indent_level, is_first_in_group, group_type):
    """Render a single story"""
    indent = "    " * indent_level
    users = story.get('users', [])
    user = users[0] if users else ""
    story_name = story['name']
    
    # Format: Actor --> Story Name or just Story Name if no actor
    if user:
        story_text = f"{user} --> {story_name}"
    else:
        story_text = story_name
    
    # First story in group: no connector
    # Subsequent stories: use group type as connector (and, or, opt)
    if is_first_in_group:
        line = f"{indent}(S) {story_text}"
    else:
        # Use group type as the connector for subsequent stories
        line = f"{indent}{group_type} (S) {story_text}"
    
    return line


def render_story_group(group, indent_level, is_first_group):
    """Render a story group"""
    indent = "    " * indent_level
    group_type = group.get('type', 'and')
    lines = []
    
    # Show group connector if not first group
    if not is_first_group and group.get('connector'):
        lines.append(f"{indent[:-4]}{group['connector']}")
    
    # Render stories in group
    stories = group.get('stories', [])
    for idx, story in enumerate(stories):
        lines.append(render_story(story, indent_level, is_first_in_group=(idx == 0), group_type=group_type))
    
    return lines


def render_sub_epic(sub_epic, indent_level):
    """Recursively render sub-epic"""
    indent = "    " * indent_level
    lines = [f"{indent}(E) {sub_epic['name']}"]
    
    # Render story groups (if present)
    story_groups = sub_epic.get('story_groups', [])
    if story_groups:
        for idx, group in enumerate(story_groups):
            lines.extend(render_story_group(group, indent_level + 1, is_first_group=(idx == 0)))
    
    # Handle sub-epics with stories directly (not in story_groups)
    # Create a default story group with type 'and' for direct stories
    direct_stories = sub_epic.get('stories', [])
    if direct_stories and not story_groups:
        # Create a default story group for direct stories
        default_group = {
            'type': 'and',
            'connector': None,
            'stories': direct_stories
        }
        lines.extend(render_story_group(default_group, indent_level + 1, is_first_group=True))
    
    # Recursively render nested sub-epics
    for nested in sub_epic.get('sub_epics', []):
        lines.extend(render_sub_epic(nested, indent_level + 1))
    
    return lines


def render_story_graph_to_text(story_graph_path, output_path):
    """
    Render story graph JSON to text format.
    
    Args:
        story_graph_path: Path to story-graph.json
        output_path: Path to output .txt file
    """
    with open(story_graph_path) as f:
        data = json.load(f)
    
    output = []
    
    # Render epics
    for epic in data.get('epics', []):
        output.append(f"(E) {epic['name']}")
        
        for sub_epic in epic.get('sub_epics', []):
            output.extend(render_sub_epic(sub_epic, 1))
        
        output.append("")  # Blank line between epics
    
    # Write output
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(output))
    
    print(f"Rendered {len(output)} lines to {output_path}")
    return output_path


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python render_story_map_txt.py <story-graph.json> <output.txt>")
        sys.exit(1)
    
    story_graph_path = sys.argv[1]
    output_path = sys.argv[2]
    
    render_story_graph_to_text(story_graph_path, output_path)

