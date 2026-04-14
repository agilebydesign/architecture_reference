# Prompt Log

## 1. Set Workspace

| | |
|---|---|
| **Prompt** | I want to refactor agile_bots into the architecture pattern described in the architecture_reference project.<br><br>Make a plan to transform the workspace domain in agile_bots, into the architecture following the architecture_reference pattern. |
| **Rules** | 1. Don't change anything in agile_bots project, just recreate the workspace domain in the architecture_reference project, following the architecture_reference patterns in the project and as defined in architecture-reference.md<br><br>2. Copy any supporting files you need from agile_bots into the new project, e.g. the story_bot json files.<br><br>3. Any python logic in agile_bots should be converted into Typescript. The new architecture uses JS instead of python, with shared domain logic between the client, server side, and CLI |
| **Mistakes** | - It forgot to add the e2e tests |

## 2. Load behavior/action/status (double-ended tree)

| | |
|---|---|
| **Prompt** | Given the collection of stories in docs/stories, make a plan to implement the new feature in with the new architecture pattern |
| **Rules** | 1. Don't change anything in agile_bots project, just recreate the workspace domain in the architecture_reference project, following the architecture_reference patterns in the project and as defined in architecture-reference.md<br><br>2. Any python logic in agile_bots should be converted into Typescript. The new architecture uses JS instead of python, with shared domain logic between the client, server side, and CLI |
| **Mistakes** | - It forgot to add the e2e tests again, ADD THEM TO RULES<br>- Add e2e tests, they should test the same stories and scenarios as the server/CLI tests<br>&nbsp;&nbsp;- The e2e test for bot behaviors was just checking the DOM, it didn't check the logic of what behaviors/actions are displayed in the UI<br>- The stories / copilot were missing the link between the workspace/bot config, and the behaviors/actions. It started trying to add a 'load bot config' button, when bot config should just be inferred<br>- Test adapter incorrectly implemented domain interface<br>- Forgets to check the e2e tests |

## 3. Navigate tree

| | |
|---|---|
| **Prompt** | Given the collection of stories in docs/stories, make a plan to implement the new feature into the architecture pattern following 'counter-architecture.json' and 'testing-architecture.json' and the features which have already been refactored as an example of the implemented architectural pattern. |
| **Rules** | 1. Don't change anything in agile_bots project, just recreate the workspace domain in the architecture_reference project, following the architecture_reference patterns in the project and as defined in architecture-reference.md<br><br>2. Any python logic in agile_bots should be converted into Typescript. The new architecture uses JS instead of python, with shared domain logic between the client, server side, and CLI<br><br>3. Ensure all interfaces are fully implemented<br><br>4. Ensure the new feature has end to end tests, and that they test the same scenarios as the server/CLI tests.<br><br>5. In the tests, avoid mocking objects/classes unnecessarily. The tests should have access to all domain classes |
| **Mistakes** | - "The E2E test doesn't use registerTests() (it's manually written because it's async). I don't need to add navigation-specific E2E scenarios since the template already has the same base scenarios. The adapter now implements the full interface with proper error messages for async methods."<br>- It didn't add any UI elements to handle navigation<br>- Not using given/when/then language in all tests, only in some of them. Check ALL test files, not just bot_behavior. Also, if a sentence starts with When, it should have Then after the comma. For example this line in bot_behavior_webview.e2e.ts that was changed manually |

## 4. Load instructions

| | |
|---|---|
| **Prompt** | Given the collection of stories in docs/stories, make a plan to implement the new feature into the architecture pattern following 'counter-architecture.json' and 'testing-architecture.json' and the features which have already been refactored as an example of the implemented architectural pattern. |
| **Rules** | 1. Don't change anything in agile_bots project, just recreate the workspace domain in the architecture_reference project, following the architecture_reference patterns in the project and as defined in architecture-reference.md<br><br>2. Any python logic in agile_bots should be converted into Typescript. The new architecture uses JS instead of python, with shared domain logic between the client, server side, and CLI<br><br>3. Ensure all interfaces are fully implemented<br><br>4. Ensure the new feature has end to end tests, and that they test the same scenarios as the server/CLI tests.<br><br>5. In the tests, avoid mocking objects/classes unnecessarily. The tests should have access to all domain classes<br><br>6. Use given/when/then language in tests. If a test statement starts with When, it should have a Then following the comma when necessary<br><br>7. Verify output with architecture scanners<br><br>8. Ensure all UI elements have been added to the HTML files to enable user flow for the given feature |
| **Mistakes** | - The interfaces that it made up were not really logical<br>- TODO: separate Bot and Behaviors. Bot will be a base bot and a story bot, they implement a set of behaviors and instructions<br>- Why is there a BaseActionConfig and an ActionConfig? They don't inherit either |

## 5. Bots

| | |
|---|---|
| **Prompt** | Given the collection of stories for instruction display, make a plan to implement this feature as a new domain, into the architecture pattern following 'counter-architecture.json' and 'testing-architecture.json' and the features which have already been refactored as an example of the implemented architectural pattern. |
| **Rules** | 1. Don't change anything in agile_bots project, just recreate the workspace domain in the architecture_reference project, following the architecture_reference patterns in the project and as defined in architecture-reference.md<br><br>2. Any python logic in agile_bots should be converted into Typescript. The new architecture uses JS instead of python, with shared domain logic between the client, server side, and CLI<br><br>3. Ensure all interfaces are fully implemented<br><br>4. Ensure the new feature has end to end tests, and that they test the same scenarios as the server/CLI tests.<br><br>5. In the tests, avoid mocking objects/classes unnecessarily. The tests should have access to all domain classes<br><br>6. Use given/when/then language in tests. If a test statement starts with When, it should have a Then following the comma when necessary<br><br>7. Verify output with architecture scanners<br><br>8. Ensure all UI elements have been added to the HTML files to enable user flow for the given feature |
| **Mistakes** | - The interfaces that it made up were not really logical<br>- TODO: separate Bot and Behaviors. Bot will be a base bot and a story bot, they implement a set of behaviors and instructions<br>- Why is there a BaseActionConfig and an ActionConfig? They don't inherit either<br>- Didn't run e2e tests to verify<br>- Even though behavior interface was implemented on client side, it still wanted to push switch bot behaviors from server to client |

## 6. Instructions

| | |
|---|---|
| **Prompt** | Given the collection of stories for instruction display, make a plan to implement this feature as a new domain, into the architecture pattern following 'architecture-reference.md' and 'testing-architecture.md' and the features which have already been refactored as an example of the implemented architectural pattern.<br><br>Follow these rules during implementation: |
| **Rules** | 1. Don't change anything in agile_bots project, just recreate the workspace domain in the architecture_reference project, following the architecture_reference patterns in the project and as defined in architecture-reference.md<br><br>2. Any python logic in agile_bots should be converted into Typescript. The new architecture uses JS instead of python, with shared domain logic between the client, server side, and CLI<br><br>3. Ensure all interfaces are fully implemented<br><br>4. Ensure the new feature has end to end tests, and that they test the same scenarios as the server/CLI tests.<br><br>5. In the tests, avoid mocking objects/classes unnecessarily. The tests should have access to all domain classes<br><br>6. Use given/when/then language in tests. If a test statement starts with When, it should have a Then following the comma when necessary<br><br>7. Verify output with architecture scanners<br><br>8. Ensure all UI elements have been added to the HTML files to enable user flow for the given feature<br><br>9. Run end to end tests to verify output<br><br>10. Remember that the client, because it implements the same domain interfaces as the server-side, can update itself before going to the server. The server side should still use its own domain interface and push to client. This is fine because there should be no difference between client and server-side, as they both implement the same interfaces |
| **Mistakes** | The extension couldn't load because:<br><br>Found the bug. In the EngineView constructor, `_syncBehaviorsFromBot()` is called before `this.instructions` is set. That method internally calls `_syncInstructionsFromBehavior()`, which accesses `this.instructions.setBehaviorInstructions(...)` — but `this.instructions` is still undefined at that point.<br><br>The bug was an initialization order issue in the EngineView constructor: `_syncBehaviorsFromBot()` was called before `this.instructions` was assigned, so when it internally called `_syncInstructionsFromBehavior()` → `this.instructions.setBehaviorInstructions(...)`, `this.instructions` was still undefined. |

