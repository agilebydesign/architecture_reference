# 📄 Display Selected Behavior Instructions

**Navigation:** [📄‹ Story Map](../../../../story-map.drawio)

**User:** User
**Path:** [🎯 Navigate Bot Behavior](../..) / [⚙️ Display Instructions](.)  
**Sequential Order:** 1
**Story Type:** user

## Story Description

Display Selected Behavior Instructions functionality for the mob minion system.

## Acceptance Criteria

### Behavioral Acceptance Criteria

- **When** user clicks behavior-item in behavior tree
  **then** instructions-panel renders behavior's instructions as instruction-item list
  **and** currentBehavior span updates to selected behavior name

- **When** selected behavior has empty instructions array
  **then** instructions-panel displays instructions-empty placeholder text BUT does not render instruction-item elements

- **When** navigateToBehavior completes
  **then** _postCurrentState sends message including behaviorInstructions array
  **and** client updateInstructionsPanel renders each item from behaviorInstructions into instructions-panel

- **When** panel initializes with current behavior set
  **then** instructions-panel populates from BotBehaviorHydrateData with currentBehavior instructions array
  **and** instructions-panel reflects config-loaded instructions

- **When** user selects different behavior
  **then** instructions-panel clears previous behavior instructions
  **and** renders new behavior instructions BUT does not mix instructions from different behaviors

- **When** behavior has multiple instructions
  **then** instructions-panel displays all instruction strings in their original config order
  **and** each string is a separate instruction-item element

## Scenarios

<a id="scenario-botbehavior-renders-and-completes-behavior-instructions-display-when-user-selects-behavior"></a>
### Scenario: [BotBehavior renders and completes behavior instructions display when user selects behavior](#scenario-botbehavior-renders-and-completes-behavior-instructions-display-when-user-selects-behavior) (happy_path)

**Steps:**
```gherkin
Given BotBehavior panel is open with behaviors loaded from BotBehaviorHydrateData
And instructions-panel is present in panel DOM
Given BotBehavior has 'shape' behavior loaded with instructions ['Shape the story map']
When user selects 'shape' behavior in behavior tree
Then instructions-panel contains one instruction-item element
And instruction-item text is 'Shape the story map'
And currentBehavior span text is 'shape'
```


<a id="scenario-botbehavior-shows-empty-state-when-selected-behavior-has-no-instructions"></a>
### Scenario: [BotBehavior shows empty state when selected behavior has no instructions](#scenario-botbehavior-shows-empty-state-when-selected-behavior-has-no-instructions) (edge_case)

**Steps:**
```gherkin
Given BotBehavior panel is open with behaviors loaded from BotBehaviorHydrateData
And instructions-panel is present in panel DOM
Given BotBehavior has 'empty-behavior' behavior loaded with instructions []
When user selects 'empty-behavior' behavior in behavior tree
Then instructions-panel contains instructions-empty placeholder
And instructions-panel contains zero instruction-item elements
```


<a id="scenario-botbehavior-replaces-prior-behavior-instructions-when-user-selects-different-behavior"></a>
### Scenario: [BotBehavior replaces prior behavior instructions when user selects different behavior](#scenario-botbehavior-replaces-prior-behavior-instructions-when-user-selects-different-behavior) (edge_case)

**Steps:**
```gherkin
Given BotBehavior panel is open with behaviors loaded from BotBehaviorHydrateData
And instructions-panel is present in panel DOM
Given BotBehavior has 'shape' and 'prioritization' behaviors loaded
And 'shape' behavior is currently selected showing its instructions
When user selects 'prioritization' behavior in behavior tree
Then instructions-panel contains instruction-item elements for 'prioritization' instructions
And instructions-panel contains no instruction-item elements from 'shape' instructions
```


<a id="scenario-botbehavior-populates-instructions-panel-from-botbehaviorhydratedata-on-panel-init"></a>
### Scenario: [BotBehavior populates instructions-panel from BotBehaviorHydrateData on panel init](#scenario-botbehavior-populates-instructions-panel-from-botbehaviorhydratedata-on-panel-init) (happy_path)

**Steps:**
```gherkin
Given BotBehavior panel DOM is loaded with empty instructions-panel
And BotBehaviorHydrateData message is available with allowedBehaviors and behaviorConfigs
Given BotBehaviorHydrateData contains allowedBehaviors ['shape'] and behaviorConfigs with 'shape' having instructions ['Shape the story map']
When panel receives BotBehaviorHydrateData init message
Then instructions-panel contains one instruction-item with text 'Shape the story map'
And currentBehavior span text is 'shape'
```


<a id="scenario-botbehavior-displays-multiple-behavior-instructions-in-config-order"></a>
### Scenario: [BotBehavior displays multiple behavior instructions in config order](#scenario-botbehavior-displays-multiple-behavior-instructions-in-config-order) (happy_path)

**Steps:**
```gherkin
Given BotBehavior panel is open with behaviors loaded from BotBehaviorHydrateData
And instructions-panel is present in panel DOM
Given BotBehavior has 'multi-behavior' behavior loaded with instructions ['First instruction', 'Second instruction', 'Third instruction']
When user selects 'multi-behavior' behavior in behavior tree
Then instructions-panel contains three instruction-item elements
And first instruction-item text is 'First instruction'
And second instruction-item text is 'Second instruction'
And third instruction-item text is 'Third instruction'
```


---

## Source Reference

**File:** [src/bot_behavior/view/bot_behavior_client.ts](../../../../../context/src/bot_behavior/view/bot_behavior_client.ts)
