# 📄 Update Instructions on Workflow Navigation

**Navigation:** [📄‹ Story Map](../../../../story-map.drawio)

**User:** User
**Path:** [🎯 Navigate Bot Behavior](../..) / [⚙️ Display Instructions](.)  
**Sequential Order:** 4
**Story Type:** user

## Story Description

Update Instructions on Workflow Navigation functionality for the mob minion system.

## Acceptance Criteria

### Behavioral Acceptance Criteria

- **When** user presses Next button
  **then** instructions-panel updates to the next action's merged instructions
  **and** previous action's instructions are fully replaced

- **When** user presses Back button
  **then** instructions-panel updates to the previous action's merged instructions
  **and** current action's instructions are fully replaced

- **When** user presses Next on the last action of a behavior
  **then** panel advances to the next behavior's first action
  **and** instructions-panel updates to show the new behavior's instructions
  **and** the new action's merged instructions

- **When** user presses Back on the first action of a behavior
  **then** panel returns to the previous behavior's last action
  **and** instructions-panel updates to show the previous behavior's instructions
  **and** that action's merged instructions

- **When** navigation skips an action with executionSetting 'skip'
  **then** instructions-panel jumps to the next non-skipped action's instructions
  **and** skipped action's instructions are never displayed

## Scenarios

<a id="scenario-botbehavior-updates-instructions-when-user-presses-next-to-advance-to-next-action"></a>
### Scenario: [BotBehavior updates instructions when user presses Next to advance to next action](#scenario-botbehavior-updates-instructions-when-user-presses-next-to-advance-to-next-action) (happy_path)

**Steps:**
```gherkin
Given BotBehavior panel is open with behaviors and actions loaded from BotBehaviorHydrateData
And instructions-panel is present in panel DOM
Given BotBehavior is at 'shape' behavior with 'clarify' action selected
And instructions-panel shows 'clarify' action instructions
When user presses Next button
Then instructions-panel shows 'strategy' action instructions
And instructions-panel contains no instruction-item elements from 'clarify' action
And currentAction span text is 'strategy'
```


<a id="scenario-botbehavior-updates-instructions-when-user-presses-back-to-return-to-previous-action"></a>
### Scenario: [BotBehavior updates instructions when user presses Back to return to previous action](#scenario-botbehavior-updates-instructions-when-user-presses-back-to-return-to-previous-action) (happy_path)

**Steps:**
```gherkin
Given BotBehavior panel is open with behaviors and actions loaded from BotBehaviorHydrateData
And instructions-panel is present in panel DOM
Given BotBehavior is at 'shape' behavior with 'strategy' action selected
And instructions-panel shows 'strategy' action instructions
When user presses Back button
Then instructions-panel shows 'clarify' action instructions
And instructions-panel contains no instruction-item elements from 'strategy' action
And currentAction span text is 'clarify'
```


<a id="scenario-botbehavior-updates-both-behavior-and-action-instructions-when-next-crosses-behavior-boundary"></a>
### Scenario: [BotBehavior updates both behavior and action instructions when Next crosses behavior boundary](#scenario-botbehavior-updates-both-behavior-and-action-instructions-when-next-crosses-behavior-boundary) (edge_case)

**Steps:**
```gherkin
Given BotBehavior panel is open with multiple behaviors loaded from BotBehaviorHydrateData
And instructions-panel is present in panel DOM
Given BotBehavior is at 'shape' behavior on its last action
And instructions-panel shows that action's instructions
When user presses Next button
Then currentBehavior advances to the next behavior
And instructions-panel shows the new behavior's first action instructions
And instructions-panel contains no instruction-item elements from the previous behavior's actions
```


<a id="scenario-botbehavior-updates-both-behavior-and-action-instructions-when-back-crosses-behavior-boundary"></a>
### Scenario: [BotBehavior updates both behavior and action instructions when Back crosses behavior boundary](#scenario-botbehavior-updates-both-behavior-and-action-instructions-when-back-crosses-behavior-boundary) (edge_case)

**Steps:**
```gherkin
Given BotBehavior panel is open with multiple behaviors loaded from BotBehaviorHydrateData
And instructions-panel is present in panel DOM
Given BotBehavior is at second behavior on its first action
And instructions-panel shows that action's instructions
When user presses Back button
Then currentBehavior returns to the previous behavior
And instructions-panel shows the previous behavior's last action instructions
And instructions-panel contains no instruction-item elements from the second behavior
```


<a id="scenario-botbehavior-skips-action-with-skip-execution-setting-and-shows-next-non-skipped-action-instructions"></a>
### Scenario: [BotBehavior skips action with skip execution setting and shows next non-skipped action instructions](#scenario-botbehavior-skips-action-with-skip-execution-setting-and-shows-next-non-skipped-action-instructions) (edge_case)

**Steps:**
```gherkin
Given BotBehavior panel is open with behaviors and actions loaded from BotBehaviorHydrateData
And one action in the workflow has executionSetting 'skip'
Given BotBehavior is at 'shape' behavior with 'clarify' action selected
And the next action 'render' has executionSetting 'skip'
When user presses Next button
Then instructions-panel skips 'render' action entirely
And instructions-panel shows the action after 'render' in the workflow
And 'render' action instructions are never displayed
```


---

## Source Reference

**File:** [src/bot_behavior/view/bot_behavior_client.ts](../../../../../context/src/bot_behavior/view/bot_behavior_client.ts)
