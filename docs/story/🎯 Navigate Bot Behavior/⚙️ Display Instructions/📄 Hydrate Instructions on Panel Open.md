# 📄 Hydrate Instructions on Panel Open

**Navigation:** [📄‹ Story Map](../../../../story-map.drawio)

**User:** User
**Path:** [🎯 Navigate Bot Behavior](../..) / [⚙️ Display Instructions](.)  
**Sequential Order:** 3
**Story Type:** user

## Story Description

Hydrate Instructions on Panel Open functionality for the mob minion system.

## Acceptance Criteria

### Behavioral Acceptance Criteria

- **When** user opens BotBehavior panel for the first time
  **then** instructions-panel immediately displays instructions for the current behavior
  **and** instructions for the current action WITHOUT requiring any click

- **When** user re-opens a previously closed BotBehavior panel
  **then** instructions-panel restores instructions for the last-active behavior and action from hydration data
  **and** panel does not show stale instructions from the previous session

- **When** BotBehaviorHydrateData message arrives with allowedBehaviors and behaviorConfigs
  **then** panel loads behaviors and actions from hydration data
  **and** instructions-panel populates from the resulting currentBehavior.instructions and currentAction.instructions

- **When** panel opens but hydration data contains no behaviors
  **then** instructions-panel displays instructions-empty placeholder
  **and** does not render any instruction-item elements

## Scenarios

<a id="scenario-botbehavior-shows-behavior-and-action-instructions-immediately-when-panel-opens"></a>
### Scenario: [BotBehavior shows behavior and action instructions immediately when panel opens](#scenario-botbehavior-shows-behavior-and-action-instructions-immediately-when-panel-opens) (happy_path)

**Steps:**
```gherkin
Given BotBehavior panel DOM is loaded with empty instructions-panel
And BotBehaviorHydrateData message is available with allowedBehaviors, behaviorConfigs, and baseActionConfigs
Given BotBehaviorHydrateData contains allowedBehaviors ['shape'] with behaviorConfigs and baseActionConfigs
When panel receives BotBehaviorHydrateData init message
Then instructions-panel contains instruction-item elements for current behavior instructions
And instructions-panel contains instruction-item elements for current action's merged instructions
And user did not click any behavior or action
```


<a id="scenario-botbehavior-restores-instructions-when-panel-is-re-opened-after-close"></a>
### Scenario: [BotBehavior restores instructions when panel is re-opened after close](#scenario-botbehavior-restores-instructions-when-panel-is-re-opened-after-close) (happy_path)

**Steps:**
```gherkin
Given BotBehavior panel was previously open showing instructions for 'shape' behavior and 'clarify' action
And panel was closed by user
Given BotBehavior panel was previously open with 'shape' behavior selected
And panel was closed and is now re-opened
When panel receives fresh BotBehaviorHydrateData init message
Then instructions-panel shows current behavior and action instructions from the new hydration data
And instructions do not contain stale content from the previous panel session
```


<a id="scenario-botbehavior-shows-empty-instructions-when-panel-opens-with-no-behaviors-configured"></a>
### Scenario: [BotBehavior shows empty instructions when panel opens with no behaviors configured](#scenario-botbehavior-shows-empty-instructions-when-panel-opens-with-no-behaviors-configured) (edge_case)

**Steps:**
```gherkin
Given BotBehavior panel DOM is loaded with empty instructions-panel
And BotBehaviorHydrateData message contains no allowedBehaviors
Given BotBehaviorHydrateData contains empty allowedBehaviors []
When panel receives BotBehaviorHydrateData init message
Then instructions-panel displays instructions-empty placeholder
And instructions-panel contains zero instruction-item elements
```


---

## Source Reference

**File:** [src/bot_behavior/view/bot_behavior_client.ts](../../../../../context/src/bot_behavior/view/bot_behavior_client.ts)
