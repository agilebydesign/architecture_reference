# Display and Load Instructions - Increment Exploration

**Navigation:** [📋 Story Map](../map/story-map.txt) | [📊 Increments](../increments/story-map-increments.drawio)




## Stories (2 total)

### 📝 Display Selected Behavior Instructions

**Acceptance Criteria:**  
- WHEN user clicks behavior-item in behavior tree THEN instructions-panel renders behavior's instructions as instruction-item list AND currentBehavior span updates to selected behavior name
- WHEN selected behavior has empty instructions array THEN instructions-panel displays instructions-empty placeholder text BUT does not render instruction-item elements
- WHEN navigateToBehavior completes THEN _postCurrentState sends message including behaviorInstructions array AND client updateInstructionsPanel renders each item from behaviorInstructions into instructions-panel
- WHEN panel initializes with current behavior set THEN instructions-panel populates from BotBehaviorHydrateData with currentBehavior instructions array AND instructions-panel reflects config-loaded instructions
- WHEN user selects different behavior THEN instructions-panel clears previous behavior instructions AND renders new behavior instructions BUT does not mix instructions from different behaviors
- WHEN behavior has multiple instructions THEN instructions-panel displays all instruction strings in their original config order AND each string is a separate instruction-item element


### 📝 Display Selected Action Instructions

**Acceptance Criteria:**  
- WHEN user clicks action-item in behavior tree THEN instructions-panel renders action's merged instructions as instruction-item list AND currentAction span updates to selected action name
- WHEN selected action has empty merged instructions array THEN instructions-panel displays instructions-empty placeholder text BUT does not retain previous action's instruction-item elements
- WHEN navigateToAction completes THEN _postCurrentState sends message including actionInstructions array AND client updateInstructionsPanel replaces instructions-panel content with new action's instruction-item elements
- WHEN Next or Back button navigation changes current action THEN instructions-panel updates to new action's instructions AND previous action instructions are fully replaced BUT do not persist
- WHEN action has merged instructions from base and behavior configs THEN instructions-panel renders the full merged instructions array AND merged list shows base instructions first followed by behavior-specific instructions
- WHEN panel initializes with current action set THEN instructions-panel shows current action's instructions from BotBehaviorHydrateData AND instructions reflect merged action instructions loaded at init time




---


## Source Material

Story map from Shape stage, Discovery refinements

