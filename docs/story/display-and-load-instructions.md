# Display and Load Instructions

**Epic:** Navigate Bot Behavior → **Sub-epic:** Display Instructions

---

## User Flow

The panel currently shows which behavior and action is selected, and lets the user navigate between them. It does not show the contents of the instructions for the current step.

The goal of this feature is to surface instruction content in the panel so the user can read what to do without leaving VS Code.

**Flow:**

1. User opens the panel — the `instructions-panel` area populates immediately with the current behavior's and action's instructions, loaded from `BotBehaviorHydrateData` on init.
2. User clicks a **behavior** in the tree — the panel displays that behavior's instructions. The `currentBehavior` label updates.
3. User clicks an **action** under that behavior — the panel replaces the instructions content with the action's merged instructions (base config instructions first, then behavior-specific additions). The `currentAction` label updates.
4. User presses **Next** or **Back** — the panel updates instructions to match the newly current action or behavior.
5. If a behavior or action has no instructions configured, the panel shows a placeholder message instead of a blank area.
6. Switching to a different behavior or action always fully replaces the displayed instructions — no content from the previous selection leaks through.

**Key elements:**
- `instructions-panel` — the new DOM section added to `BotBehavior.html`
- `instruction-item` — each instruction string rendered as a list item
- `instructions-empty` — placeholder shown when the instructions array is empty
- `_postCurrentState()` — extended to include `behaviorInstructions` and `actionInstructions` in the server → client message
- `BotBehaviorHydrateData` — carries initial instructions when the panel opens

---

## Stories

### 📝 Story 1 — Display Selected Behavior Instructions

> User selects a behavior in the panel tree and sees its instructions displayed.

#### Acceptance Criteria

1. **WHEN** user clicks `behavior-item` in behavior tree  
   **THEN** `instructions-panel` renders behavior's instructions as `instruction-item` list  
   **AND** `currentBehavior` span updates to selected behavior name

2. **WHEN** selected behavior has empty instructions array  
   **THEN** `instructions-panel` displays `instructions-empty` placeholder text  
   **BUT** does not render `instruction-item` elements

3. **WHEN** `navigateToBehavior` completes  
   **THEN** `_postCurrentState` sends message including `behaviorInstructions` array  
   **AND** client `updateInstructionsPanel` renders each item from `behaviorInstructions` into `instructions-panel`

4. **WHEN** panel initializes with current behavior set  
   **THEN** `instructions-panel` populates from `BotBehaviorHydrateData` with `currentBehavior` instructions array  
   **AND** `instructions-panel` reflects config-loaded instructions

5. **WHEN** user selects different behavior  
   **THEN** `instructions-panel` clears previous behavior instructions  
   **AND** renders new behavior instructions  
   **BUT** does not mix instructions from different behaviors

6. **WHEN** behavior has multiple instructions  
   **THEN** `instructions-panel` displays all instruction strings in their original config order  
   **AND** each string is a separate `instruction-item` element

#### Scenarios

_To be defined in specification_scenarios phase._

---

### 📝 Story 2 — Display Selected Action Instructions

> User selects an action in the panel tree and sees its merged instructions displayed.

#### Acceptance Criteria

1. **WHEN** user clicks `action-item` in behavior tree  
   **THEN** `instructions-panel` renders action's merged instructions as `instruction-item` list  
   **AND** `currentAction` span updates to selected action name

2. **WHEN** selected action has empty merged instructions array  
   **THEN** `instructions-panel` displays `instructions-empty` placeholder text  
   **BUT** does not retain previous action's `instruction-item` elements

3. **WHEN** `navigateToAction` completes  
   **THEN** `_postCurrentState` sends message including `actionInstructions` array  
   **AND** client `updateInstructionsPanel` replaces `instructions-panel` content with new action's `instruction-item` elements

4. **WHEN** Next or Back button navigation changes current action  
   **THEN** `instructions-panel` updates to new action's instructions  
   **AND** previous action instructions are fully replaced  
   **BUT** do not persist

5. **WHEN** action has merged instructions from base and behavior configs  
   **THEN** `instructions-panel` renders the full merged instructions array  
   **AND** merged list shows base instructions first followed by behavior-specific instructions

6. **WHEN** panel initializes with current action set  
   **THEN** `instructions-panel` shows current action's instructions from `BotBehaviorHydrateData`  
   **AND** instructions reflect merged action instructions loaded at init time

#### Scenarios

_To be defined in specification_scenarios phase._
