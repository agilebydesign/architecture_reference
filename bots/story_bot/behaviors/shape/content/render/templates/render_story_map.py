#!/usr/bin/env python3
"""
Render story-graph-new.json to story-map.txt format using template.
"""

import json
import sys
from pathlib import Path

def format_actor(users):
    """Format users array into actor string"""
    if not users:
        return ""
    if len(users) == 1:
        return f"{users[0]} --> "
    # Multiple users - join with comma
    return f"{', '.join(users)} --> "

def find_story_by_name_in_all(stories_list, name, visited=None):
    """Find a story by name across all stories (avoiding circular references)"""
    if visited is None:
        visited = set()
    
    if name in visited:
        return None  # Circular reference detected
    
    visited.add(name)
    
    # Simple linear search
    for story in stories_list:
        if story['name'] == name:
            return story
    
    return None

def render_story(story, indent_level, is_first_in_sequence=False, all_stories_in_context=None, rendered_stories=None):
    """Render a single story"""
    if rendered_stories is None:
        rendered_stories = set()
    
    # Prevent rendering the same story twice (circular references)
    story_name = story['name']
    if story_name in rendered_stories:
        return []  # Already rendered
    
    rendered_stories.add(story_name)
    
    indent = "    " * indent_level
    connector = story.get('workflow_connector')
    if connector is None:
        connector_str = "" if is_first_in_sequence else "and "
    else:
        connector_str = "" if is_first_in_sequence else f"{connector} "
    
    actor = format_actor(story.get('users', []))
    
    lines = [f"{indent}{connector_str}(S) {actor}{story_name}"]
    
    # Handle workflow_children (nested stories)
    workflow_children_names = story.get('workflow_children', [])
    if workflow_children_names and all_stories_in_context:
        # Find and render nested stories
        nested_stories = []
        for child_name in workflow_children_names:
            child_story = find_story_by_name_in_all(all_stories_in_context, child_name)
            if child_story and child_story['name'] not in rendered_stories:
                nested_stories.append(child_story)
        
        if nested_stories:
            # Render nested stories with increased indent
            for j, nested in enumerate(nested_stories):
                nested_lines = render_story(nested, indent_level + 1, j == 0, all_stories_in_context, rendered_stories)
                lines.extend(nested_lines)
    
    return lines

def render_stories_with_workflow(stories, indent_level, all_stories_in_context, rendered_stories=None):
    """Render stories handling workflow_children"""
    if rendered_stories is None:
        rendered_stories = set()
    
    lines = []
    for i, story in enumerate(stories):
        is_first = (i == 0)
        story_lines = render_story(story, indent_level, is_first, all_stories_in_context, rendered_stories)
        lines.extend(story_lines)
    
    return lines

def collect_all_stories_in_epic(epic):
    """Collect all stories from an epic and its sub-epics recursively"""
    all_stories = []
    
    # Add direct stories (legacy format)
    all_stories.extend(epic.get('stories', []))
    
    # Add stories from story_groups (new format)
    for story_group in epic.get('story_groups', []):
        all_stories.extend(story_group.get('stories', []))
    
    # Add stories from sub-epics
    for sub_epic in epic.get('sub_epics', []):
        all_stories.extend(collect_all_stories_in_epic(sub_epic))
    
    return all_stories

def render_sub_epic(sub_epic, indent_level, is_first_in_sequence=False, all_stories_in_epic=None):
    """Render a sub-epic"""
    indent = "    " * indent_level
    connector = sub_epic.get('workflow_connector')
    if connector is None:
        connector_str = "" if is_first_in_sequence else "and "
    else:
        connector_str = "" if is_first_in_sequence else f"{connector} "
    
    lines = [f"{indent}{connector_str}(E) {sub_epic['name']}"]
    
    # Render nested sub-epics
    nested_sub_epics = sub_epic.get('sub_epics', [])
    if nested_sub_epics:
        for i, nested in enumerate(nested_sub_epics):
            nested_lines = render_sub_epic(nested, indent_level + 1, i == 0, all_stories_in_epic)
            lines.extend(nested_lines)
    
    # Render stories from story_groups (new format) or direct stories (legacy format)
    stories = []
    # Collect stories from story_groups
    for story_group in sub_epic.get('story_groups', []):
        stories.extend(story_group.get('stories', []))
    # Add direct stories (legacy format)
    if not stories:
        stories = sub_epic.get('stories', [])
    
    if stories:
        # Use all stories in epic for workflow_children lookup
        story_lines = render_stories_with_workflow(stories, indent_level + 1, all_stories_in_epic or stories, set())
        lines.extend(story_lines)
    
    return lines

def render_epic(epic, indent_level, is_first_in_sequence=False):
    """Render an epic"""
    indent = "    " * indent_level
    connector = epic.get('workflow_connector')
    if connector is None:
        connector_str = "" if is_first_in_sequence else "and "
    else:
        connector_str = "" if is_first_in_sequence else f"{connector} "
    
    lines = [f"{indent}{connector_str}(E) {epic['name']}"]
    
    # Collect all stories in this epic for workflow_children lookup
    all_stories_in_epic = collect_all_stories_in_epic(epic)
    
    # Render sub-epics
    sub_epics = epic.get('sub_epics', [])
    if sub_epics:
        for i, sub_epic in enumerate(sub_epics):
            sub_epic_lines = render_sub_epic(sub_epic, indent_level + 1, i == 0, all_stories_in_epic)
            lines.extend(sub_epic_lines)
    
    # Render direct stories (if any) - check both story_groups and direct stories
    stories = []
    # Collect stories from story_groups
    for story_group in epic.get('story_groups', []):
        stories.extend(story_group.get('stories', []))
    # Add direct stories (legacy format)
    if not stories:
        stories = epic.get('stories', [])
    
    if stories:
        story_lines = render_stories_with_workflow(stories, indent_level + 1, all_stories_in_epic or stories, set())
        lines.extend(story_lines)
    
    return lines

def render_story_graph(story_graph):
    """Render entire story graph"""
    lines = []
    
    epics = story_graph.get('epics', [])
    for i, epic in enumerate(epics):
        epic_lines = render_epic(epic, 0, i == 0)
        lines.extend(epic_lines)
    
    return "\n".join(lines)

def main():
    """
    Render story graph to story map text.
    
    Usage:
      python render_story_map.py <input_story_graph.json> <output_story_map.txt>
    
    If no args provided, falls back to legacy locations under templates/stories/.
    """
    base_dir = Path(__file__).parent / "stories"
    
    if len(sys.argv) >= 3:
        input_path = Path(sys.argv[1])
        output_path = Path(sys.argv[2])
    else:
        input_path = base_dir / "story-graph-new.json"
        output_path = base_dir / "story-map-rendered.txt"
    
    print(f"Loading {input_path}...")
    with open(input_path, 'r', encoding='utf-8') as f:
        story_graph = json.load(f)
    
    print("Rendering to story-map format...")
    output = render_story_graph(story_graph)
    
    print(f"Saving to {output_path}...")
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(output)
    
    print("Done!")

if __name__ == "__main__":
    main()

