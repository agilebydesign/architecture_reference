// test/instructions/instructions.test.ts — Domain + Server domain tests
import { describe } from "vitest";
import { Instructions } from "../../src/instructions/instructions.js";
import { InstructionsServer } from "../../src/instructions/instructions_server.js";
import { InstructionsTest } from "./instructions_test.js";
import type { IInstructions } from "../../src/instructions/instructions.js";

/**
 * Domain layer tests.
 * createInstructions() returns a plain Instructions — no persistence, no view.
 */
export class DomainInstructionsTest extends InstructionsTest {
  protected createInstructions(): IInstructions {
    return new Instructions();
  }
}

describe("Instructions", () => {
  new DomainInstructionsTest().registerTests();
});

/**
 * Server domain tests.
 * InstructionsServer has no independent persistence, but follows the pattern.
 */
describe("InstructionsServer", () => {
  class ServerInstructionsTest extends InstructionsTest {
    protected createInstructions(): IInstructions {
      return new InstructionsServer();
    }
  }

  new ServerInstructionsTest().registerTests();
});
