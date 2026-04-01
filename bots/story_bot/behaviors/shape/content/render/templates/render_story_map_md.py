"""
Render story graph JSON to markdown format.
"""
import json
from pathlib import Path
import sys


def render_story(story, indent_level, is_first_in_group, group_type):
    """Render a single story as markdown list item"""
    indent = "  " * indent_level
    users = story.get('users', [])
    user = users[0] if users else ""
    story_name = story['name']

    if user:
        story_text = f"{user} --> {story_name}"
    else:
        story_text = story_name

    if is_first_in_group:
        line = f"{indent}- {story_text}"
    else:
        connector = "or" if group_type == "or" else ("opt" if group_type == "opt" else "and")
        line = f"{indent}- {connector} {story_text}"

    return line


def render_story_group(group, indent_level, is_first_group):
    """Render a story group"""
    indent = "  " * indent_level
    group_type = group.get('type', 'and')
    lines = []

    if not is_first_group and group.get('connector'):
        lines.append(f"{indent[:-2]}- {group['connector']}")

    stories = group.get('stories', [])
    for idx, story in enumerate(stories):
        lines.append(render_story(story, indent_level, is_first_in_group=(idx == 0), group_type=group_type))

    return lines


def render_sub_epic(sub_epic, indent_level):
    """Recursively render sub-epic with markdown headers"""
    indent = "  " * indent_level
    header_level = indent_level + 2
    lines = [f"{'#' * header_level} {sub_epic['name']}", ""]

    story_groups = sub_epic.get('story_groups', [])
    if story_groups:
        for idx, group in enumerate(story_groups):
            lines.extend(render_story_group(group, indent_level + 1, is_first_group=(idx == 0)))

    direct_stories = sub_epic.get('stories', [])
    if direct_stories and not story_groups:
        default_group = {'type': 'and', 'connector': None, 'stories': direct_stories}
        lines.extend(render_story_group(default_group, indent_level + 1, is_first_group=True))

    for nested in sub_epic.get('sub_epics', []):
        lines.extend(render_sub_epic(nested, indent_level + 1))

    return lines


def render_story_graph_to_markdown(story_graph_path, output_path):
    """
    Render story graph JSON to markdown format.

    Args:
        story_graph_path: Path to story-graph.json
        output_path: Path to output .md file
    """
    with open(story_graph_path) as f:
        data = json.load(f)

    output = []

    for epic in data.get('epics', []):
        output.append(f"# {epic['name']}")
        output.append("")

        for sub_epic in epic.get('sub_epics', []):
            output.extend(render_sub_epic(sub_epic, 1))

        output.append("")
        output.append("---")
        output.append("")

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(output))

    print(f"Rendered {len(output)} lines to {output_path}")
    return output_path


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python render_story_map_md.py <story-graph.json> <output.md>")
        sys.exit(1)

    story_graph_path = sys.argv[1]
    output_path = sys.argv[2]

    render_story_graph_to_markdown(story_graph_path, output_path)
