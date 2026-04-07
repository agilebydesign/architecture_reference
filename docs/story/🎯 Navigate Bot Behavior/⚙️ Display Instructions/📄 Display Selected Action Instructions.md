# 📄 Display Selected Action Instructions

**Navigation:** [📄‹ Story Map](../../../../story-map.drawio)

**User:** User
**Path:** [🎯 Navigate Bot Behavior](../..) / [⚙️ Display Instructions](.)  
**Sequential Order:** 2
**Story Type:** user

## Story Description

Display Selected Action Instructions functionality for the mob minion system.

## Acceptance Criteria

### Behavioral Acceptance Criteria

- **When** user clicks action-item in behavior tree
  **then** instructions-panel renders action's merged instructions as instruction-item list
  **and** currentAction span updates to selected action name

- **When** selected action has empty merged instructions array
  **then** instructions-panel displays instructions-empty placeholder text BUT does not retain previous action's instruction-item elements

- **When** navigateToAction completes
  **then** _postCurrentState sends message including actionInstructions array
  **and** client updateInstructionsPanel replaces instructions-panel content with new action's instruction-item elements

- **When** Next or Back button navigation changes current action
  **then** instructions-panel updates to new action's instructions
  **and** previous action instructions are fully replaced BUT do not persist

- **When** action has merged instructions from base and behavior configs
  **then** instructions-panel renders the full merged instructions array
  **and** merged list shows base instructions first followed by behavior-specific instructions

- **When** panel initializes with current action set
  **then** instructions-panel shows current action's instructions from BotBehaviorHydrateData
  **and** instructions reflect merged action instructions loaded at init time

## Scenarios

<a id="scenario-botbehavior-renders-and-completes-merged-action-instructions-display-when-user-selects-action"></a>
### Scenario: [BotBehavior renders and completes merged action instructions display when user selects action](#scenario-botbehavior-renders-and-completes-merged-action-instructions-display-when-user-selects-action) (happy_path)

**Steps:**
```gherkin
Given BotBehavior panel is open with behaviors and actions loaded from BotBehaviorHydrateData
And instructions-panel is present in panel DOM
Given BotBehavior has 'shape' behavior with 'clarify' action loaded
And 'clarify' action has merged instructions from IBaseActionConfig and IBehaviorConfig workflow entry
When user selects 'clarify' action in behavior tree
Then instructions-panel contains instruction-item elements for each merged instruction
And instruction-item elements appear in merged order: base instructions first, then behavior-specific
And currentAction span text is 'clarify'
```


<a id="scenario-botbehavior-shows-empty-state-when-selected-action-has-no-merged-instructions"></a>
### Scenario: [BotBehavior shows empty state when selected action has no merged instructions](#scenario-botbehavior-shows-empty-state-when-selected-action-has-no-merged-instructions) (edge_case)

**Steps:**
```gherkin
Given BotBehavior panel is open with behaviors and actions loaded from BotBehaviorHydrateData
And instructions-panel is present in panel DOM
Given BotBehavior has 'shape' behavior with an action that has empty base instructions and empty behavior instructions
When user selects that action in behavior tree
Then instructions-panel contains instructions-empty placeholder
And instructions-panel contains zero instruction-item elements
```


<a id="scenario-botbehavior-replaces-prior-action-instructions-when-user-navigates-to-different-action"></a>
### Scenario: [BotBehavior replaces prior action instructions when user navigates to different action](#scenario-botbehavior-replaces-prior-action-instructions-when-user-navigates-to-different-action) (edge_case)

**Steps:**
```gherkin
Given BotBehavior panel is open with behaviors and actions loaded from BotBehaviorHydrateData
And instructions-panel is present in panel DOM
Given BotBehavior is at 'shape' behavior with 'clarify' action selected showing its instructions
When user presses Next button to advance to 'strategy' action
Then instructions-panel contains instruction-item elements for 'strategy' action instructions
And instructions-panel contains no instruction-item elements from 'clarify' action
And currentAction span text is 'strategy'
```


<a id="scenario-botbehavior-shows-base-instructions-first-then-behavior-specific-instructions-in-merged-order"></a>
### Scenario: [BotBehavior shows base instructions first then behavior-specific instructions in merged order](#scenario-botbehavior-shows-base-instructions-first-then-behavior-specific-instructions-in-merged-order) (happy_path)

**Steps:**
```gherkin
Given BotBehavior panel is open with behaviors and actions loaded from BotBehaviorHydrateData
And instructions-panel is present in panel DOM
Given BotBehavior has 'shape' behavior with 'clarify' action
And IBaseActionConfig for 'clarify' has instructions ['IMPORTANT: Follow these action instructions specifically', 'Review all provided context']
And 'shape' behavior workflow entry for 'clarify' has instructions ['Gather context for story mapping']
When user selects 'clarify' action in behavior tree
Then first instruction-item text is 'IMPORTANT: Follow these action instructions specifically'
And second instruction-item text is 'Review all provided context'
And third instruction-item text is 'Gather context for story mapping'
And instructions-panel contains exactly three instruction-item elements
```


<a id="scenario-botbehavior-populates-action-instructions-from-botbehaviorhydratedata-on-panel-init"></a>
### Scenario: [BotBehavior populates action instructions from BotBehaviorHydrateData on panel init](#scenario-botbehavior-populates-action-instructions-from-botbehaviorhydratedata-on-panel-init) (happy_path)

**Steps:**
```gherkin
Given BotBehavior panel DOM is loaded with empty instructions-panel
And BotBehaviorHydrateData message is available with allowedBehaviors, behaviorConfigs, and baseActionConfigs
Given BotBehaviorHydrateData contains allowedBehaviors, behaviorConfigs with 'shape', and baseActionConfigs for 'clarify'
When panel receives BotBehaviorHydrateData init message
Then instructions-panel contains instruction-item elements for the current action's merged instructions
And currentAction span text matches the first action in 'shape' behavior workflow
```


---

## Source Reference

**File:** [src/bot_behavior/bot_behavior.ts](../../../../../context/src/bot_behavior/bot_behavior.ts)
