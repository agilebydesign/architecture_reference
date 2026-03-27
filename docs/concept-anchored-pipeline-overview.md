# Concept-Anchored Pipeline: Process Overview

A standalone overview of the pipeline that transforms raw source material into a validated object-oriented domain model and interaction tree. This document is shareable with readers who have no prior context.

---

## Overview

The concept-anchored pipeline takes unstructured or semi-structured source material (rulebooks, specifications, documentation) and produces:

1. **A domain model**  concepts with properties, operations, relationships, and inheritance
2. **An interaction tree**  epics, sub-epics, stories, steps, and scenarios that describe user flows
3. **Full traceability**  every concept, behavior, and step links back to evidence and to each other

The pipeline alternates between **code phases** (chunking, extraction, indexing) and **AI phases** (hypothesis, structure, behavior, variation). Human checkpoints verify framing, coverage, and quality at key stages.

**Guided extraction:** AI configures extraction parameters (weights, patterns, grammar rules); code runs evidence-signal extraction across the corpus; AI synthesizes concepts from those signals. Extraction is guided by these concepts. Evidence speaks first; concepts follow. See [Appendix B: Evidence-Signal Extraction](#appendix-b-evidence-signal-extraction) for the full design.

**Core idea:** Concepts are the anchor. Every artifact is organized by concepts; their relationships, behaviors, and linked stories are in one place. The domain model and interaction tree live in a single structured JSON file, so they cannot diverge.

---

## Design Principles

1. **Guided extraction** — Evidence speaks first; concepts follow. AI configured extraction parameters guide scripted, deterministic evidence-signal extraction of concepts and evidence
2. **Concepts are the anchor**  every artifact is organized by concept; inspect any concept to see its properties, relationships, behaviors, and linked stories
3. **Behaviors are first-class**  because they cross multiple concepts, they get their own registry linked back to concepts
4. **Interaction tree is first-class**  because stories cross concepts, the tree is a peer structure linked to concepts and behaviors
5. **One artifact from modeling onward**  domain model and interaction tree are sections of the same JSON, co-versioned
6. **Structured JSON is the source of truth**  markdown is a rendered view, not the working format between phases
7. **Guided extraction** — Evidence speaks first; concepts follow. The pipeline does *not* ask the AI to guess concepts from chunks. Instead: (a) AI configures extraction parameters

---

## The Artifact: `solution_model.json`

From Phase 5 onward, every phase reads and writes a single structured file. The shape:

```json
{
  "concepts": [
    {
      "summary": "The entity that performs actions in combat (player or NPC).",
      "id": "Character",
      "module": "Core",
      "kind": "aggregate_root",
      "inherits": null,
      "properties": [],
      "operations": [],
      "relationships": [{"type": "owns", "target": "AbilityScore", "cardinality": "1..*"}],
      "behavior_refs": ["beh_activate"],
      "story_refs": ["story_resolve_attack"],
      "evidence_refs": ["act_0042", "rel_0012", "st_0001", "dec_0001"]
    },
    {
      "summary": "A power or ability that can be activated and resolved.",
      "id": "Attack",
      "module": "Core",
      "kind": "entity",
      "inherits": null,
      "properties": [],
      "operations": [],
      "relationships": [],
      "behavior_refs": ["beh_activate"],
      "story_refs": ["story_resolve_attack"],
      "evidence_refs": ["st_0022", "dec_0001"]
    },
    {
      "summary": "The outcome applied when an attack hits (damage, weakening, afflicting, etc.).",
      "id": "Effect",
      "module": "Core",
      "kind": "entity",
      "inherits": null,
      "properties": [],
      "operations": [],
      "relationships": [],
      "behavior_refs": ["beh_activate"],
      "story_refs": ["story_resolve_attack"],
      "evidence_refs": []
    }
  ],
  "behaviors": [
    {
      "id": "beh_activate",
      "name": "activate",
      "owner": "Character",
      "collaborators": ["Attack", "Effect"],
      "linked_steps": ["step_activate_attack"],
      "story_refs": ["story_resolve_attack"],
      "evidence_refs": ["act_0042", "dec_0001"]
    }
  ],
  "interaction_tree": {
    "epics": [{
        "name": "Combat Resolution",
      "sub_epics": [{
            "name": "Attack Flow",
        "stories": [{
                "id": "story_resolve_attack",
                "name": "Resolve Attack",
                "actors": ["Player", "Gamemaster"],
          "steps": [{
                    "id": "step_activate_attack",
                    "name": "User activates attack",
                    "linked_behaviors": ["beh_activate"],
                    "trigger": "Player",
            "response": "Character"
          }],
          "scenarios": [{"id": "scenario_attack_hits", "name": "Attack hits", "step_refs": ["step_activate_attack"]}]
        }]
      }]
    }]
  },
  "evidence_refs": {
    "actions": {
      "act_0042": {
        "subject": "Character",
        "predicate": "activates",
        "object": "Attack",
        "raw": "The character activates an attack from their character sheet when they choose to use a power or weapon."
      }
    },
    "decisions": {
      "dec_0001": {
        "trigger": "when",
        "condition": "the attack check exceeds the target's defense, the effect is applied",
        "raw": "When the attack check exceeds the target's defense, the effect is applied to the target."
      }
    },
    "states": {
      "st_0001": {
        "entity": "Character",
        "state_description": "The character has an active attack in progress.",
        "raw": "The character has an active attack in progress until it is resolved."
      },
      "st_0022": {
        "entity": "Attack",
        "state_description": "The attack has been resolved as a hit or miss.",
        "raw": "The attack has been resolved as a hit or miss based on the check result."
      },
      "st_0012": {
        "entity": "Effect",
        "state_description": "The effect has been applied to the target.",
        "raw": "The effect has been applied to the target and may modify their condition or resistance."
      }
    },
    "relationships": {
      "rel_0012": {
        "from_entity": "Character",
        "type": "owns",
        "to_entity": "AbilityScore",
        "raw": "The character owns ability scores that contribute modifiers to checks."
      }
    }
  }
}
```

**Sections at a glance:**

- **concepts**  Concepts organized by modules. Each concept has a summary, properties, operations, relationships, and examples. Each concept links to behaviors and stories; it references evidence that supports it.
- **behaviors**  Cross-concept interactions (e.g. activate power effect, resolve hit). Stored separately because they involve multiple concepts; each behavior has an owner, collaborators, linked steps, and evidence. behaviors *eventually* are mapped to a top level operation on a single concept.
- **interaction_tree**  Epics, sub-epics, stories, steps, and scenarios. Stories are the primary flow; steps link to behaviors; scenarios group steps for variation (e.g. hit vs miss).
- **evidence_refs**  Full evidence registry: actions, decisions, states, and relationships keyed by ID. Concepts and behaviors reference these IDs; the registry holds the full extracted content (subject, predicate, raw text, etc.).

**Why this shape:**

- **Concepts** anchor everything. Inspect one concept and see its properties, operations, relationships, linked behaviors, and linked stories.
- **Behaviors** are separate because they genuinely cross concepts. A behavior like "activate" involves Character and Attack  storing it prematurely inside one concept distorts it.
- **Interaction tree** is separate because stories cross concepts. A story goes directly to steps (ordered list). Each step exercises at least one behavior.
- **Scenarios are groupings, not hierarchy.** Scenarios sit alongside steps and have `step_refs`  they group steps for organization (e.g. "Attack hits" vs "Attack misses"). When there are many steps, scenarios slice them. Steps are the primary content; scenarios are optional views.
- **Step â†” behavior is the tight link.** Each step has `linked_behaviors` (at least one). Each behavior has `linked_steps`. A behavior is an interaction that triggers a state change or system response. Selecting an attack from a character sheet to activate it provides trigger context for the `activate` behavior. Opening a power to see details, or selecting a payment type that causes the system to display different payment details  those create reactions and are behaviors.
- **Everything links back.** Concepts point to behaviors and stories. Behaviors point to concepts and steps. Steps point to behaviors. No scattering without cross-references.

---

## Phases at a Glance

1. **Normalize** — Chunk and clean raw source into uniform text segments.
2. **Configure extraction** — AI scans corpus and proposes weights, patterns, and grammar rules for concept extraction. Output: `extraction_config.json`.
3. **Extract Concepts** — Code runs extraction using the config; produces concept signals (term_candidates, definition_candidates, dependency_actions, co-occurrence graph, table vocabularies). Deterministic, fast.
4. **Concept synthesis** — AI merges concept signals from step 3 into a hypothesis. Output: `hypothesis.json` + concept_guidance.
5. **Extract evidence** — Code mines chunks for actions, decisions, states, relationships, and terms, guided by hypothesis. Output: `evidence/*.json` (six files).
6. **Index** — Create the concept-anchored evidence index from the evidence files. Output: `evidence_index.json`.
7. **Structure** — Build first `solution_model.json` from hypothesis + evidence index; assign properties, inheritance, steps; concepts and tree gain structure in parallel.
8. **Behavior** — Assign operations, link behaviors to steps, group steps into scenarios.
9. **Variation** — Split stories by subtype when mechanics differ; add failure modes
10. **Consolidate** — Fix anti-patterns; add examples.
11. **Assess** — Produce consistency, coverage, completeness, and type-field-vs-subtype assessment.
12. **Finalize** — Apply assessment fixes; produce validated model.

---

## Pipeline Table

Every AI phase (5-8, 10) receives the full `solution_model.json` and updates both the domain (concepts, behaviors) and the interaction tree (stories, scenarios, steps) in the same pass. Phase 9 (Assess) produces a cross-cutting report; it does not redo scenario walkthroughs that were already enforced during build.


| #   | Phase            | Actor    | What it does                                                                                                                                                                                         | Output                                                     | Concepts gain                                              | Interaction tree gains                                                             |
| --- | ---------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1   | **Normalize**    | Code     | Chunk and clean raw source into uniform text segments.                                                                                                                                               | `context_chunks.json`                                      |                                                            |                                                                                    |
| 2   | **Hypothesize**  | AI       | Scan chunks to identify candidate concepts, modules, mechanisms, actors, and broad epic areas.                                                                                                       | `hypothesis.json` + interaction tree skeleton (epics only) | concept_guidance (priority_concepts, hierarchy)            | epics only                                                                         |
| 3   | **Extract**      | Code     | Mine chunks for actions, decisions, states, relationships guided by hypothesis.                                                                                                                      | `evidence/*.json` (six files)                              |                                                            |                                                                                    |
| 4   | **Index**        | Code     | Aggregate evidence into a concept-anchored index so each concept knows its actions, states, and relationships.                                                                                       | `evidence_index.json`                                      | evidence collected into concepts                           |                                                                                    |
| 5   | **Structure**    | AI       | Build first `solution_model.json` from hypothesis + evidence index: merge duplicates, refine modules/epics, create stories; assign properties, inheritance, steps; assign actors and pre-conditions. | `solution_model.json` v1                                   | story_refs, evidence_refs, properties, relationships, kind | stories (epics, sub-epics), steps (actors, pre-conditions), empty linked_behaviors |
|     | **Checkpoint 1** | Human    | Verify concept framing and interaction skeleton.                                                                                                                                                     |                                                            |                                                            |                                                                                    |
| 6   | **Behavior**     | AI       | Assign operations to concepts by decision ownership; link each behavior to the step(s) that exercise it; group steps into scenarios (e.g. hit vs miss). Each step has at least one linked behavior.  | `solution_model.json` v2                                   | operations, behavior_refs                                  | linked_behaviors, when_then, scenarios (step groupings)                            |
|     | **Checkpoint 2** | Human    | Verify behavior ownership and step-to-behavior links.                                                                                                                                                |                                                            |                                                            |                                                                                    |
| 7   | **Variation**    | AI       | Split stories by subtype when mechanics differ (per *Story vs. Scenario* rule); add failure modes. Subtype concepts already exist from Phase 4; Variation does not discover them.                    | `solution_model.json` v3                                   | (unchanged subtypes already exist)                         | subtype stories, failure-mode scenarios                                            |
| 8   | **Consolidate**  | AI       | Detect anemia, over-centralization, orphans; fix anti-patterns; add examples to stories.                                                                                                             | `solution_model.json` v4                                   | examples                                                   | examples on steps                                                                  |
|     | **Checkpoint 3** | Human    | Verify model quality and completeness.                                                                                                                                                               |                                                            |                                                            |                                                                                    |
| 9   | **Assess**       | AI+Human | Produce model assessment: consistency, coverage, completeness, **type field vs subtype** (mechanical difference test). No late "walkthrough" verification happens incrementally in Phases 7-8.       | `assessment.json`                                          |                                                            |                                                                                    |
| 10  | **Finalize**     | AI       | Apply assessment fixes; produce validated model with full traceability.                                                                                                                              | `solution_model.json` final                                | fixes from assessment                                      | fixes from assessment                                                              |


---

---

## Phase Sequence Rationale

**Hypothesis â†’ Extract â†’ Structure â†’ Behavior â†’ Variation â†’ Assess**

This sequence works because each phase depends on what the previous one established:

- **Structure** before **Behavior**: you need to know what exists and how things compose before you can assign who owns which operation
- **Behavior** before **Variation**: you need baseline operations before you can split stories by subtype and add failure modes
- **Variation** before **Assess**: you need the full model including subtype stories and edge cases before assessment is meaningful

Structured JSON flows between phases; each phase reads the previous version, enriches it, and writes the next.

---

## Phase Details

Each phase reads the previous output, enriches it, and writes the next. Outputs and examples appear with their phase.

### Phase 1  Normalize

**What it does:** Chunks and cleans raw source material into uniform text segments suitable for downstream extraction.

**How it works:** Code processes the source (PDF, markdown, HTML, etc.), applies chunking rules (section boundaries, paragraph breaks), and normalizes formatting. Output is `context_chunks.json`  a structured list of text segments with metadata (source, section, position).

### Phase 2  Configure extraction

**What it does:** AI scans the corpus and proposes weights, patterns, and grammar rules for concept extraction. The extractor is configured, not run here.

**Output:** `extraction_config.json` (weights, patterns, grammar rules).

**How it works:** AI analyzes corpus structure (rulebook vs API spec vs narrative) and outputs configuration that code will apply deterministically. Reproducible: same config yields same extraction.

See [Appendix B: Evidence-Signal Extraction](#appendix-b-evidence-signal-extraction) for the full design.

### Phase 3  Extract concepts

**What it does:** Code runs extraction using the config from Phase 2. Produces concept signals: term_candidates, definition_candidates, dependency_actions, co-occurrence graph, table vocabularies.

**Output:** Concept signal files (deterministic, fast).

**How it works:** Code applies the configured weights and patterns across the corpus. No AI guessing; the text speaks first. High-weighted terms and definition patterns surface before any hypothesis exists.

See [Appendix B: Evidence-Signal Extraction](#appendix-b-evidence-signal-extraction) for the twelve evidence-signal techniques.

### Phase 4  Concept synthesis

**What it does:** AI merges concept signals from Phase 3 into a hypothesis. Produces the initial domain hypothesis and interaction tree skeleton (epics only; no stories yet).

**Output:** `hypothesis.json` + concept_guidance (`priority_concepts`, `concept_aliases`, `concept_hierarchy`, `priority_mechanisms`, `priority_actors`, 

**How it works:** AI consolidates the evidence signals into named concepts and hierarchy. Not guessing from chunks; synthesizing from what the extraction surfaced. Subtype discovery happens here; Phase 9 (Variation) works with concepts that already exist.

### Phase 5  Extract evidence

**What it does:** Mines chunks for actions, decisions, states, relationships, and terms, guided by the hypothesis from Phase 4.

**Output:** Six flat files in `evidence/`: `actions.json`, `decisions.json`, `states.json`, `relationships.json`, `terms.json`.

**How it works:** Code (e.g. `evidence_extraction_guided.py`) produces:


| Output               | What it extracts                                                                                  | Research grounding                                                                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `actions.json`       | Subjectâ€“predicateâ€“object triples (e.g. "Effect applies damage", "Character activates Attack") | **Event extraction** (ACE 2005: trigger + arguments); **SVO triple extraction** (textacy, dependency parsing); **Semantic role labeling** (PropBank, FrameNet: agent/theme/patient â†’ performs/receives) |
| `decisions.json`     | Conditionals (if/when/unless + condition)                                                         | **Conditional extraction** (LexNLP `lexnlp.extract.en.conditions`: if, when, unless, until, provided that, etc.)                                                                                          |
| `states.json`        | Entity + state description (state, becomes, transitions to, gains, loses)                         | **Entity state tracking** (ProPara, OpenPI); **VerbNet semantic parsing** for state extraction                                                                                                            |
| `relationships.json` | From-entity, type, to-entity (has, contains, uses, belongs to)                                    | **Relation extraction** (ACE2005, OpenIE, DocRED); binary entityâ€“relationâ€“entity triples                                                                                                              |
| `terms.json`         | Domain term candidates                                                                            | **Terminology extraction** (Wikipedia: noun phrase chunking, termhood/unithood; C-value/NC-value)                                                                                                         |


**Alignment with CRC / OO design:** CRC cards (Beck & Cunningham, OOPSLA'89) use **Class**, **Responsibility** (verb phrases), and **Collaborator**. The buckets map: actions â†’ responsibilities; relationships â†’ collaborators; states â†’ entity attributes. Terminology extraction feeds concept naming. Decisions feed when/how behaviors apply.

### Phase 6  Index

**What it does:** Creates the concept-anchored evidence index from the six evidence files so each concept knows its actions, states, and relationships. This is a core part of the pipeline  it reorganizes flat evidence around concepts so downstream AI phases can look up "what does Concept X do?" in one place.

**Output:** `evidence_index.json`.

**How it works:** Code reads the six evidence files and builds the index. Instead of a flat edge list (e.g. `{"from": "Effect", "relation": "performs", "to": "Checks", "action_id": "act_0003"}`), the index groups evidence *around concepts*:

```json
{
  "concepts": {
    "Character": {
      "term_ids": ["term_0001"],
      "performs": ["act_0042", "act_0043"],
      "receives": ["act_0088"],
      "states": ["st_0001"],
      "decisions": ["dec_0001"],
      "relationships": ["rel_0012", "rel_0013"]
    },
    "Attack": {
      "term_ids": ["term_0022"],
      "performs": [],
      "receives": ["act_0042"],
      "states": ["st_0022"],
      "decisions": ["dec_0001"],
      "relationships": ["rel_0013"]
    },
    "AreaEffectAttack": {
      "term_ids": ["term_0023"],
      "performs": [],
      "receives": ["act_0044"],
      "states": [],
      "relationships": []
    },
    "PerceptionAttack": {
      "term_ids": ["term_0024"],
      "performs": [],
      "receives": [],
      "states": [],
      "relationships": []
    },
    "Effect": {
      "term_ids": ["term_0042"],
      "performs": [],
      "receives": ["act_0088"],
      "states": ["st_0012"],
      "relationships": ["rel_0005"]
    },
    "Attack Effect": {
      "term_ids": ["term_0043"],
      "performs": [],
      "receives": [],
      "states": [],
      "relationships": []
    },
    "Damage Effect": {
      "term_ids": ["term_0044"],
      "performs": ["act_0003"],
      "receives": [],
      "states": [],
      "relationships": []
    },
    "Weakening Effect": {
      "term_ids": ["term_0045"],
      "performs": ["act_0017"],
      "receives": [],
      "states": [],
      "relationships": []
    },
    "Afflicting Effect": {
      "term_ids": ["term_0046"],
      "performs": [],
      "receives": [],
      "states": [],
      "relationships": []
    },
    "Healing Effect": {
      "term_ids": ["term_0047"],
      "performs": [],
      "receives": [],
      "states": [],
      "relationships": []
    },
    "Sensory Effect": {
      "term_ids": ["term_0048"],
      "performs": [],
      "receives": [],
      "states": [],
      "relationships": []
    }
  },
  "registries": {
    "actions": {
      "act_0042": {
        "subject": "Character",
        "predicate": "activates",
        "object": "Attack",
        "raw": "The character activates an attack from their character sheet when they choose to use a power or weapon."
      },
      "act_0043": {
        "subject": "Character",
        "predicate": "resolves",
        "object": "Attack",
        "raw": "The character resolves the attack outcome by rolling the check and comparing the result to the target's defense."
      },
      "act_0003": {
        "subject": "Effect",
        "predicate": "applies",
        "object": "damage",
        "raw": "The effect applies damage to the target when the attack hits and the effect is a damage type."
      },
      "act_0017": {
        "subject": "Effect",
        "predicate": "modifies",
        "object": "resistance",
        "raw": "The effect modifies the target's resistance, adding to or reducing their Toughness for the attack."
      },
      "act_0088": {
        "subject": "Character",
        "predicate": "triggers",
        "object": "Effect",
        "raw": "When the attack resolves, the character's effect receives the trigger and applies to the target."
      },
      "act_0044": {
        "subject": "Character",
        "predicate": "resolves",
        "object": "AreaEffectAttack",
        "raw": "For area effect attacks, targets in the area may attempt a dodge check for half damage."
      }
    },
    "decisions": {
      "dec_0001": {
        "trigger": "when",
        "condition": "the attack check exceeds the target's defense, the effect is applied",
        "raw": "When the attack check exceeds the target's defense, the effect is applied to the target."
      }
    },
    "states": {
      "st_0001": {
        "entity": "Character",
        "state_description": "The character has an active attack in progress.",
        "raw": "The character has an active attack in progress until it is resolved."
      },
      "st_0022": {
        "entity": "Attack",
        "state_description": "The attack has been resolved as a hit or miss.",
        "raw": "The attack has been resolved as a hit or miss based on the check result."
      },
      "st_0012": {
        "entity": "Effect",
        "state_description": "The effect has been applied to the target.",
        "raw": "The effect has been applied to the target and may modify their condition or resistance."
      }
    },
    "relationships": {
      "rel_0012": {
        "from_entity": "Character",
        "type": "owns",
        "to_entity": "AbilityScore",
        "raw": "The character owns ability scores that contribute modifiers to checks."
      },
      "rel_0013": {
        "from_entity": "Character",
        "type": "owns",
        "to_entity": "Attack",
        "raw": "The character owns the attack they activate from their powers or equipment."
      },
      "rel_0005": {
        "from_entity": "Effect",
        "type": "belongs to",
        "to_entity": "Character",
        "raw": "The effect belongs to the attacking character and is applied when their attack resolves."
      }
    }
  }
}
```

Same data, different organization. Registries hold the actual evidence sentences (from extraction `raw`), keyed by ID. The index is keyed by concepts from the hierarchy (Phase 2); subtypes (AreaEffectAttack, PerceptionAttack; Attack Effect, Damage Effect, etc.) get their own entries when rule text distinguishes them.

**Human-readable rendered view:** The index is optimized for AI lookup (IDs only). For human review at Checkpoint 2, render an expanded view that inlines the relevant details for each ID:

```markdown
## Character

**performs**
- act_0042  activates attack from character sheet
- act_0043  resolves attack outcome (hit or miss)

**receives**
- act_0088  receives trigger when attack resolves

**states**
- st_0001  has active attack

**decisions**
- dec_0001  when attack check exceeds target's defense, effect is applied

**relationships**
- rel_0012  owns AbilityScore
- rel_0013  owns Attack

---

## Attack

**receives**
- act_0042  receives activate from Character

**states**
- st_0022  resolved (hit or miss)

**decisions**
- dec_0001  when attack check exceeds target's defense, effect is applied

**relationships**
- rel_0013  belongs to Character

---

## Effect

**receives**
- act_0088  receives trigger from Character when attack resolves

**states**
- st_0012  applied (effect has been applied to target)

**relationships**
- rel_0005  belongs to Character (effect is owned by the attacking character)

---

## Attack Effect

*(parent of damage, weakening, afflicting, healing; inherits from Effect)*

---

## Damage Effect

**performs**
- act_0003  applies damage to target

---

## Weakening Effect

**performs**
- act_0017  modifies target's resistance (reduces Toughness)

---

## Afflicting Effect

*(no evidence in example; rule text would index condition-imposing effects here)*

---

## Healing Effect

*(no evidence in example; rule text would index healing effects here)*

---

## Sensory Effect

*(inherits from Effect; sibling to Attack Effect; senses, concealment, invisibility)*
```

### Phase 7  Structure

**What it does:** Builds first `solution_model.json` from hypothesis + evidence index: merges duplicates, refines modules/epics, creates stories; assigns properties, inheritance, steps; assigns actors and pre-conditions. Concepts and interaction tree gain structure in parallel.

**Output:** `solution_model.json` v1 (concepts, epics, sub-epics, stories; properties, relationships, inheritance, kind; steps with trigger/response, empty linked_behaviors).

**How it works:** AI reads `hypothesis.json` and `evidence_index.json` and produces `solution_model.json` v1. Concepts get `properties`, `relationships`, `inherits`, and `kind` (aggregate_root, entity, etc.). Stories get `steps` with `trigger`, `response`, and empty `linked_behaviors`. Steps are derived from evidence; scenarios come in Phase 8. Phase instructions: "For each property or relationship you add to a concept, verify the concept appears in at least one story. If not, either add a story or flag the concept as structural-only."

**Concepts (AI / JSON)**  properties, relationships, inheritance, kind

```json
"concepts": [
  {"id": "Character", "module": "Core", "kind": "aggregate_root", "inherits": null, "properties": [{"name": "name", "type": "String"}, {"name": "ability_scores", "type": "List<AbilityScore>"}], "operations": [], "invariants": [], "relationships": [{"type": "owns", "target": "AbilityScore", "cardinality": "1..*"}, {"type": "owns", "target": "Attack", "cardinality": "0..*"}], "behavior_refs": [], "story_refs": ["story_resolve_attack"], "evidence_refs": ["act_0042", "rel_0012"]},
  {"id": "Attack", "module": "Core", "kind": "entity", "inherits": null, "properties": [{"name": "targets", "type": "List<Character>"}, {"name": "resolved", "type": "Boolean"}], "operations": [], "invariants": [], "relationships": [{"type": "belongs_to", "target": "Character", "cardinality": "1"}], "behavior_refs": [], "story_refs": ["story_resolve_attack"], "evidence_refs": []},
  {"id": "AreaEffectAttack", "module": "Core", "kind": "entity", "inherits": "Attack", "properties": [{"name": "area", "type": "Area"}, {"name": "dodge_for_half", "type": "Boolean"}], "operations": [], "invariants": [], "relationships": [{"type": "belongs_to", "target": "Character", "cardinality": "1"}], "behavior_refs": [], "story_refs": ["story_resolve_attack"], "evidence_refs": ["act_0044"]},
  {"id": "PerceptionAttack", "module": "Core", "kind": "entity", "inherits": "Attack", "properties": [{"name": "perception_range", "type": "Boolean"}], "operations": [], "invariants": [], "relationships": [{"type": "belongs_to", "target": "Character", "cardinality": "1"}], "behavior_refs": [], "story_refs": ["story_resolve_attack"], "evidence_refs": []},
  {"id": "Effect", "module": "Core", "kind": "entity", "inherits": null, "properties": [{"name": "applied", "type": "Boolean"}], "operations": [], "invariants": [], "relationships": [{"type": "belongs_to", "target": "Character", "cardinality": "1"}], "behavior_refs": [], "story_refs": ["story_resolve_attack"], "evidence_refs": []},
  {"id": "Damage Effect", "module": "Core", "kind": "entity", "inherits": "Attack Effect", "properties": [{"name": "damage_rank", "type": "Integer"}], "operations": [], "invariants": [], "relationships": [{"type": "belongs_to", "target": "Character", "cardinality": "1"}], "behavior_refs": [], "story_refs": ["story_resolve_attack"], "evidence_refs": ["act_0003"]},
  {"id": "Weakening Effect", "module": "Core", "kind": "entity", "inherits": "Attack Effect", "properties": [{"name": "weaken_rank", "type": "Integer"}], "operations": [], "invariants": [], "relationships": [{"type": "belongs_to", "target": "Character", "cardinality": "1"}], "behavior_refs": [], "story_refs": ["story_resolve_attack"], "evidence_refs": ["act_0017"]}
]
```

**Concepts (Markdown)**

```markdown
### Character : aggregate_root
- String name, List<AbilityScore> ability_scores
- owns AbilityScore (1..*), owns Attack (0..*)

### Attack : entity
- List<Character> targets, Boolean resolved
- belongs_to Character (1)

### AreaEffectAttack : entity, inherits Attack
- Area area, Boolean dodge_for_half
- belongs_to Character (1)

### Effect : entity
- Boolean applied
- belongs_to Character (1)

### Damage Effect : entity, inherits Attack Effect
- Integer damage_rank
- belongs_to Character (1)

### Weakening Effect : entity, inherits Attack Effect
- Integer weaken_rank
- belongs_to Character (1)
```

**Interaction tree (AI / JSON)**

```json
"stories": [
  {
    "id": "story_resolve_attack",
    "name": "Resolve Attack",
    "actors": ["Player", "Gamemaster"],
    "steps": [
      {"id": "step_activate_attack", "name": "User activates attack", "linked_behaviors": [], "trigger": "Player", "response": "Character", "when_then": ""},
      {"id": "step_attack_hits", "name": "Attack hits", "linked_behaviors": [], "trigger": "Character", "response": null, "when_then": ""},
      {"id": "step_attack_misses", "name": "Attack misses", "linked_behaviors": [], "trigger": "Character", "response": null, "when_then": ""}
    ],
    "scenarios": []
  }
]
```

**Interaction tree (Markdown)**

```markdown
### Story: Resolve Attack
- Triggering-Actor: Player
- Responding-Actor: Gamemaster

**Steps**
1. User activates attack (Player â†’ Character)
2. Attack hits (Character â†’ ?)
3. Attack misses (Character â†’ ?)
```

### Phase 8  Behavior

**What it does:** Assigns operations to concepts by decision ownership; links each behavior to the step(s) that exercise it; groups steps into scenarios (e.g. hit vs miss). Each step has at least one linked behavior.

**Behavior â†” operation mapping:** Every behavior maps 1:1 to one top-level operation on its owner concept. That operation orchestrates the flow; collaborators supply lower-level operations. The owner's operation is the entry point; the collaborators' operations participate in the realization.

**Output:** `solution_model.json` v2 (operations, behavior_refs, behaviors array; steps with linked_behaviors, when_then; scenarios).

**How it works:** AI reads `solution_model.json` v1 and enriches it. Concepts get `operations` and `behavior_refs`. A new `behaviors` array is populated with `id`, `name`, `owner`, `collaborators`, `linked_steps`. Steps get `linked_behaviors` and `when_then`. Scenarios group steps (e.g. "Attack hits" vs "Attack misses"). Phase instructions: "For each behavior you create, link it to the step(s) that exercise it. Each step must have at least one linked behavior. If no step exists, create one. Verify: owner concept has that operation; collaborators appear in the step flow."

**Example (behaviors array):**

```json
"behaviors": [
  {"id": "beh_activate", "name": "activate", "owner": "Character", "collaborators": ["Attack"], "linked_steps": ["step_activate_attack"]},
  {"id": "beh_resolve_hit", "name": "resolve hit", "owner": "Character", "collaborators": ["Attack", "Effect"], "linked_steps": ["step_attack_hits"]},
  {"id": "beh_resolve_miss", "name": "resolve miss", "owner": "Character", "collaborators": ["Attack"], "linked_steps": ["step_attack_misses"]}
]
```

**Example (interaction tree with linked_behaviors, when_then, scenarios):**

```json
"steps": [
  {
    "id": "step_activate_attack",
    "name": "User activates attack",
    "linked_behaviors": ["beh_activate"],
    "trigger": "Player",
    "response": "Character",
    "when_then": "When user selects attack from character sheet, Character activates that attack"
  },
  {
    "id": "step_attack_hits",
    "name": "Attack hits",
    "linked_behaviors": ["beh_resolve_hit"],
    "trigger": "Character",
    "response": "Effect",
    "when_then": "When attack resolves as hit, Effect applies (e.g. Damage Effect, Weakening Effect, or Afflicting Effect depending on power)"
  },
  {
    "id": "step_attack_misses",
    "name": "Attack misses",
    "linked_behaviors": ["beh_resolve_miss"],
    "trigger": "Character",
    "response": "Character",
    "when_then": "When attack resolves as miss, no effect applied"
  }
],
"scenarios": [
  {"id": "scenario_attack_hits", "name": "Attack hits", "step_refs": ["step_activate_attack", "step_attack_hits"]},
  {"id": "scenario_attack_misses", "name": "Attack misses", "step_refs": ["step_activate_attack", "step_attack_misses"]}
]
```

**Concepts (Markdown)**  with behaviors

```markdown
### Character : aggregate_root
- String name, List<AbilityScore> ability_scores
- owns AbilityScore (1..*), owns Attack (0..*)
- Behaviors: activate, resolve hit, resolve miss

### Attack : entity
- List<Character> targets, Boolean resolved
- belongs_to Character (1)
- Behaviors: (participates in activate, resolve hit, resolve miss)

### Damage Effect : entity, inherits Attack Effect
- Integer damage_rank
- belongs_to Character (1)
- Behaviors: (participates in resolve hit)
```

**Interaction tree (Markdown)**  with linked behaviors

```markdown
### Story: Resolve Attack
- Triggering-Actor: Player
- Responding-Actor: Gamemaster

**Steps**
1. User activates attack (Player â†’ Character) [activate]
2. Attack hits (Character â†’ Effect) [resolve hit]
3. Attack misses (Character â†’ Character) [resolve miss]

**Scenarios**
- Attack hits: step_activate_attack, step_attack_hits
- Attack misses: step_activate_attack, step_attack_misses
```

### Phase 9  Variation

**What it does:** Splits stories by subtype when mechanics differ; adds failure-mode scenarios. Subtype concepts already exist from Phase 4; Phase 9 does not discover them.

**Output:** `solution_model.json` v4 (subtype stories, failure-mode scenarios, parameterized_examples on steps).

**How it works:** AI reads `solution_model.json` v3 and enriches it. For subtypes with different mechanics (AreaEffectAttack, PerceptionAttack, Damage Effect, Weakening Effect, Afflicting Effect), ensures separate stories exist. Adds failure-mode scenarios (e.g. "Melee out of reach", "Area effect hits in area"). Adds `parameterized_examples` to steps for type fields (e.g. "Punch (melee)", "Bow shot (ranged)"). Phase instructions: "For each subtype with different mechanics, ensure a separate story exists. Add failure-mode scenarios where appropriate."

#### Story vs. Scenario: When Subtypes Become Separate Stories

The more types you have for a concept, the less it makes sense to bundle them into one story. **Subtype with different resolution mechanics â†’ different story.** This is the safer default.

**Rule:** When a subtype changes the flow (different mechanics, different steps, different collaborators), give it its own story. Use scenarios only for small variations within the same flow (e.g. hit vs miss).

**Heuristic:**


| Variation type                       | Same story?                         | Example                                                                                                                                 |
| ------------------------------------ | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Type field** (melee vs ranged)     | Yes parameterized examples in steps | Punch (melee), Bow shot (ranged)                                                                                                        |
| **Subtype with different mechanics** | No separate story                   | AreaEffectAttack â†’ "Resolve Area Effect Attack"; PerceptionAttack â†’ "Resolve Perception Attack"                                     |
| **Effect subtype**                   | No separate story                   | Damage Effect â†’ "Apply Damage Effect"; Weakening Effect â†’ "Apply Weakening Effect"; Afflicting Effect â†’ "Apply Afflicting Effect" |


**When to resolve:** Subtype *concepts* must exist from Phase 4 (concept synthesis) and Phase 7 (structure assigns `inherits`). During interaction-tree construction (Phases 7-8, 9), the tree decides whether a subtype is a scenario (same story) or a separate story. Phase 9 splits stories for subtypes that already exist; it does not discover new subtypes.

**How to encode:**

- **Story naming:** Base story "Resolve Attack"; subtype stories "Resolve Area Effect Attack", "Resolve Perception Attack", "Apply Damage Effect", "Apply Weakening Effect", "Apply Afflicting Effect".
- **Story grouping:** Group under a sub-epic (e.g. "Attack Resolution") so the hierarchy is visible.
- **Step reuse:** Shared steps (e.g. "User activates attack") can be referenced by multiple stories; subtype-specific steps live in the subtype story.
- **Concept â†’ story_refs:** Each subtype concept links to its own story, not the base story.

**solution_model.json v4 (AI / JSON)**  subtype stories, failure-mode scenarios, parameterized_examples

```json
{
  "concepts": [
    {"id": "Character", "module": "Core", "kind": "aggregate_root", "inherits": null, "properties": [{"name": "name", "type": "String"}, {"name": "ability_scores", "type": "List<AbilityScore>"}], "operations": [{"name": "activate", "behavior_ref": "beh_activate"}, {"name": "resolve_hit", "behavior_ref": "beh_resolve_hit"}, {"name": "resolve_miss", "behavior_ref": "beh_resolve_miss"}], "invariants": [], "relationships": [{"type": "owns", "target": "AbilityScore", "cardinality": "1..*"}, {"type": "owns", "target": "Attack", "cardinality": "0..*"}], "behavior_refs": ["beh_activate", "beh_resolve_hit", "beh_resolve_miss"], "story_refs": ["story_resolve_attack"], "evidence_refs": []},
    {"id": "Attack", "module": "Core", "kind": "entity", "inherits": null, "properties": [{"name": "targets", "type": "List<Character>"}, {"name": "resolved", "type": "Boolean"}], "operations": [], "invariants": [], "relationships": [{"type": "belongs_to", "target": "Character", "cardinality": "1"}], "behavior_refs": [], "story_refs": ["story_resolve_attack"], "evidence_refs": []},
    {"id": "AreaEffectAttack", "module": "Core", "kind": "entity", "inherits": "Attack", "properties": [{"name": "area", "type": "Area"}, {"name": "dodge_for_half", "type": "Boolean"}], "operations": [], "invariants": [], "relationships": [{"type": "belongs_to", "target": "Character", "cardinality": "1"}], "behavior_refs": [], "story_refs": ["story_resolve_area_effect_attack"], "evidence_refs": []},
    {"id": "PerceptionAttack", "module": "Core", "kind": "entity", "inherits": "Attack", "properties": [{"name": "perception_range", "type": "Boolean"}], "operations": [], "invariants": [], "relationships": [{"type": "belongs_to", "target": "Character", "cardinality": "1"}], "behavior_refs": [], "story_refs": ["story_resolve_perception_attack"], "evidence_refs": []},
    {"id": "Effect", "module": "Core", "kind": "entity", "inherits": null, "properties": [{"name": "applied", "type": "Boolean"}], "operations": [], "invariants": [], "relationships": [{"type": "belongs_to", "target": "Character", "cardinality": "1"}], "behavior_refs": [], "story_refs": ["story_resolve_attack"], "evidence_refs": []},
    {"id": "Damage Effect", "module": "Core", "kind": "entity", "inherits": "Attack Effect", "properties": [{"name": "damage_rank", "type": "Integer"}], "operations": [], "invariants": [], "relationships": [{"type": "belongs_to", "target": "Character", "cardinality": "1"}], "behavior_refs": ["beh_resolve_hit"], "story_refs": ["story_apply_damage_effect"], "evidence_refs": []},
    {"id": "Weakening Effect", "module": "Core", "kind": "entity", "inherits": "Attack Effect", "properties": [{"name": "weaken_rank", "type": "Integer"}], "operations": [], "invariants": [], "relationships": [{"type": "belongs_to", "target": "Character", "cardinality": "1"}], "behavior_refs": ["beh_resolve_hit"], "story_refs": ["story_apply_weakening_effect"], "evidence_refs": []},
    {"id": "Afflicting Effect", "module": "Core", "kind": "entity", "inherits": "Attack Effect", "properties": [{"name": "condition", "type": "String"}], "operations": [], "invariants": [], "relationships": [{"type": "belongs_to", "target": "Character", "cardinality": "1"}], "behavior_refs": ["beh_resolve_hit"], "story_refs": ["story_apply_afflicting_effect"], "evidence_refs": []}
  ],
  "behaviors": [
    {"id": "beh_activate", "name": "activate", "owner": "Character", "collaborators": ["Attack"], "linked_steps": ["step_activate_attack"]},
    {"id": "beh_resolve_hit", "name": "resolve hit", "owner": "Character", "collaborators": ["Attack", "Effect"], "linked_steps": ["step_attack_hits"]},
    {"id": "beh_resolve_miss", "name": "resolve miss", "owner": "Character", "collaborators": ["Attack"], "linked_steps": ["step_attack_misses"]}
  ],
  "interaction_tree": {
    "epics": [{
      "name": "Combat Resolution",
      "sub_epics": [{
        "name": "Attack Flow",
        "stories": [
          {"id": "story_resolve_attack", "name": "Resolve Attack", "actors": ["Player", "Gamemaster"], "steps": [{"id": "step_activate_attack", "name": "User activates attack", "linked_behaviors": ["beh_activate"], "trigger": "Player", "response": "Character", "when_then": "When user selects attack from character sheet, Character activates that attack", "parameterized_examples": ["Punch (melee)", "Bow shot (ranged)"]}, {"id": "step_attack_hits", "name": "Attack hits", "linked_behaviors": ["beh_resolve_hit"], "trigger": "Character", "response": "Effect", "when_then": "When attack resolves as hit, Effect applies (e.g. Damage Effect, Weakening Effect, or Afflicting Effect depending on power)"}, {"id": "step_attack_misses", "name": "Attack misses", "linked_behaviors": ["beh_resolve_miss"], "trigger": "Character", "response": "Character", "when_then": "When attack resolves as miss, no effect applied"}], "scenarios": [{"id": "scenario_attack_hits", "name": "Attack hits", "step_refs": ["step_activate_attack", "step_attack_hits"]}, {"id": "scenario_attack_misses", "name": "Attack misses", "step_refs": ["step_activate_attack", "step_attack_misses"]}, {"id": "scenario_melee_reach", "name": "Melee attack out of reach", "step_refs": ["step_activate_attack", "step_attack_misses"]}]},
          {"id": "story_resolve_area_effect_attack", "name": "Resolve Area Effect Attack", "actors": ["Player", "Gamemaster"], "steps": [{"id": "step_activate_area_attack", "name": "User activates area attack", "linked_behaviors": ["beh_activate"], "trigger": "Player", "response": "Character", "when_then": "When user selects area attack, Character activates it"}, {"id": "step_area_hits", "name": "Area attack hits targets in area", "linked_behaviors": ["beh_resolve_hit"], "trigger": "Character", "response": "Effect", "when_then": "When area resolves, Effect applies to each target; dodge for half"}]},
          {"id": "story_resolve_perception_attack", "name": "Resolve Perception Attack", "actors": ["Player", "Gamemaster"], "steps": [{"id": "step_activate_perception_attack", "name": "User activates perception attack", "linked_behaviors": ["beh_activate"], "trigger": "Player", "response": "Character", "when_then": "When user selects perception attack, Character activates it"}, {"id": "step_perception_hits", "name": "Perception attack hits target in range", "linked_behaviors": ["beh_resolve_hit"], "trigger": "Character", "response": "Effect", "when_then": "When target in perception range, Effect applies; no attack check"}]},
          {"id": "story_apply_damage_effect", "name": "Apply Damage Effect", "actors": ["Player", "Gamemaster"], "steps": [{"id": "step_damage_applies", "name": "Damage Effect applies to target", "linked_behaviors": ["beh_resolve_hit"], "trigger": "Character", "response": "Damage Effect", "when_then": "When attack hits, Damage Effect applies; resistance check  each degree of failure adds damage"}]},
          {"id": "story_apply_weakening_effect", "name": "Apply Weakening Effect", "actors": ["Player", "Gamemaster"], "steps": [{"id": "step_weakening_applies", "name": "Weakening Effect applies to target", "linked_behaviors": ["beh_resolve_hit"], "trigger": "Character", "response": "Weakening Effect", "when_then": "When attack hits, Weakening Effect reduces target resistance"}]},
          {"id": "story_apply_afflicting_effect", "name": "Apply Afflicting Effect", "actors": ["Player", "Gamemaster"], "steps": [{"id": "step_afflicting_applies", "name": "Afflicting Effect applies to target", "linked_behaviors": ["beh_resolve_hit"], "trigger": "Character", "response": "Afflicting Effect", "when_then": "When attack hits, Afflicting Effect imposes condition; resistance check to avoid"}]}
        ]
      }]
    }]
  }
}
```

**solution_model v4 (Markdown)**

```markdown
## Module: Core

### Character : aggregate_root
- String name, List<AbilityScore> ability_scores
- owns AbilityScore (1..*), owns Attack (0..*)
- activate(Attack) â†’ void  beh_activate
- resolve_hit(Attack, Effect) â†’ void  beh_resolve_hit
- resolve_miss(Attack) â†’ void  beh_resolve_miss

### Attack : entity
- List<Character> targets, Boolean resolved
- belongs_to Character (1)
**Variations**
- AreaEffectAttack  separate story
- PerceptionAttack  separate story

### Effect : entity
**Subtypes**
- Damage Effect  separate story
- Weakening Effect  separate story
- Afflicting Effect  separate story

---

# Epic: Combat Resolution

## Sub-Epic: Attack Flow

### Story: Resolve Attack
Triggering-Actor: Player | Responding-Actor: Gamemaster

**Steps**
1. User activates attack  beh_activate
   Examples (type fields): Punch (melee), Bow shot (ranged)
2. Attack hits  beh_resolve_hit
3. Attack misses  beh_resolve_miss

**Scenarios**
- Attack hits, Attack misses, Melee attack out of reach

### Story: Resolve Area Effect Attack
### Story: Resolve Perception Attack
### Story: Apply Damage Effect
### Story: Apply Weakening Effect
### Story: Apply Afflicting Effect
```

### Phase 9  Consolidate

**What it does:** Detects anemia, over-centralization, orphans; fixes anti-patterns; adds examples to stories.

**How it works:** AI reads `solution_model.json` v4 and enriches it. Fixes concepts with no behaviors (anemia), concepts doing too much (over-centralization), concepts with no story_refs (orphans). Adds examples to concepts and steps.

**Example (concepts with examples):**

```markdown
### Character : aggregate_root
- activate(Attack) â†’ void
  Collaborators: Attack
  Interactions: step_activate_attack

**Examples**
| scenario | name | ability_scores |
|----------|------|----------------|
| resolve_attack.player | Fighter | Str 16, Dex 12 |
| resolve_attack.target | Goblin | Str 8, Dex 14 |
```

**Example (interaction tree with examples on steps):**

```markdown
**Steps**
1. User activates attack  beh_activate
   When user selects attack from character sheet, Character activates that attack
   Examples: [Player selects Punch from character sheet]
2. Attack hits  beh_resolve_hit
   When attack resolves as hit, Effect applies (e.g. Damage Effect, Weakening Effect, or Afflicting Effect depending on power)
   Examples: [Punch hits Goblin, Damage Effect applies 5 damage]; [Weakening Touch hits Goblin, Weakening Effect reduces Toughness]; [Paralyzing gaze hits target, Afflicting Effect imposes Vulnerable]
```

### Phase 11  Assess

**What it does:** Produces a cross-cutting model assessment. **It does not redo scenario walkthroughs.**

Verification of stepâ†”behaviorâ†”concept consistency happens incrementally in Phases 7-8. Phase 11 assesses:

1. **Consistency**  Step-behavior-concept traceability: every step has linked behaviors; every behavior has an owner with that operation; collaborators appear in the flow.
2. **Coverage**  Evidence assigned: concepts with evidence_refs; behaviors grounded in evidence. Gaps: evidence not yet assigned to concepts or behaviors.
3. **Completeness**  Orphan concepts (no story_refs), anemia (concepts with no behaviors), over-centralization (one concept doing too much). Phase 10 already fixes anti-patterns; Phase 11 reports any remaining issues.
4. **Type field vs subtype**  For each concept with `inherits`: does it have different mechanics (different behaviors, rules, or resolution) from siblings? If it shares the same operations with only different parameters â†’ flag as possible type-field misclassification (should be parameterized examples in steps, not a hierarchy node). For parameterized examples in steps (e.g. melee vs ranged): if they imply different rules or behaviors â†’ flag as possible subtype misclassification (should be in hierarchy). Per subtype-vs-type-field research: mechanical difference test  does switching variant change which *rules* apply? Yes â†’ subtype; no â†’ type field.
5. **Human sign-off**  Checklist for human review: concept framing, behavior ownership, step-to-behavior links, type-field vs subtype, model quality.

**Output:** `assessment.json` with `consistency`, `coverage`, `completeness`, `type_field_vs_subtype`, and `human_checklist`.

**Example:**

```json
{
  "consistency": {
    "step_behavior_links": "pass",
    "owner_operations": "pass",
    "collaborator_flow": "pass"
  },
  "coverage": {
    "evidence_assigned": 0.92,
    "gaps": ["act_0123 not assigned to any concept", "dec_0045 not linked to behavior"]
  },
  "completeness": {
    "orphans": [],
    "anemia": [],
    "over_centralization": []
  },
  "type_field_vs_subtype": {
    "possible_type_field_misclassified": ["MeleeAttack", "RangedAttack"],
    "possible_subtype_misclassified": [],
    "notes": "MeleeAttack and RangedAttack share same beh_resolve_hit; differ only by range parameter â†’ consider type field on Attack"
  },
  "human_checklist": {
    "concept_framing": "pending",
    "behavior_ownership": "pending",
    "step_behavior_links": "pending",
    "type_field_vs_subtype": "pending",
    "model_quality": "pending"
  }
}
```

### Phase 12  Finalize

**What it does:** Applies assessment fixes; produces validated model with full traceability.

**Output:** `solution_model.json` final (assessment fixes applied, full traceability).

**How it works:** AI reads `solution_model.json` v5 and `assessment.json`, applies fixes from the assessment, and writes the final `solution_model.json`. Human resolves checklist items before sign-off.

**Example (concepts with full traceability):**

```markdown
## Module: Core

### Character : aggregate_root
- String name
- List<AbilityScore> ability_scores
- owns AbilityScore (1..*)
- owns Attack (0..*)
- activate(Attack) â†’ void  beh_activate
- resolve_hit(Attack, Effect) â†’ void  beh_resolve_hit
- resolve_miss(Attack) â†’ void  beh_resolve_miss

Stories: Resolve Attack
```

**Example (interaction tree  validated, examples complete):**

```markdown
# Epic: Combat Resolution

## Sub-Epic: Attack Flow

### Story: Resolve Attack
Triggering-Actor: Player | Responding-Actor: Gamemaster

**Steps**
1. User activates attack  beh_activate
   When user selects attack from character sheet, Character activates that attack
   Examples: [Player selects Punch from character sheet]
2. Attack hits  beh_resolve_hit
   When attack resolves as hit, Effect applies (e.g. Damage Effect, Weakening Effect, or Afflicting Effect depending on power)
   Examples: [Punch hits Goblin, Damage Effect applies 5 damage]; [Weakening Touch hits Goblin, Weakening Effect reduces Toughness]; [Paralyzing gaze hits target, Afflicting Effect imposes Vulnerable]
3. Attack misses  beh_resolve_miss
   When attack resolves as miss, no effect applied
   Examples: [Punch misses, Goblin dodges]

**Scenarios**
- Attack hits | Attack misses | Melee out of reach | Area effect hits in area | Perception attack hits in range
```

---

## References

**CRC / OO design:** Beck, K. & Cunningham, W. (1989). "A Laboratory For Teaching Object-Oriented Thinking." OOPSLA'89. [CRC paper](https://www.cs.unc.edu/~stotts/COMP145/CRC/papers/beck.html). [Wikipedia: CRC card](https://en.wikipedia.org/wiki/Class-responsibility-collaboration_card)

**Event extraction & semantic roles:** ACE (Automatic Content Extraction); PropBank; FrameNet; SVO triple extraction (textacy, dependency parsing).

**Relation extraction:** ACE2005; OpenIE; DocRED; binary entityâ€“relationâ€“entity triples.

**Entity state extraction:** ProPara, OpenPI; VerbNet semantic parsing.

**Conditional extraction:** LexNLP `lexnlp.extract.en.conditions` (if, when, unless, until, provided that, etc.).

**Terminology extraction:** Wikipedia; noun phrase chunking; termhood/unithood; C-value/NC-value.

**Internal docs:** `evidence-signal-extraction-design.md` (evidence-signal techniques, concept triangulation); `subtype-vs-type-field-research.md` (type field vs subtype discrimination, mechanical difference test).

---

## Appendix: Key Changes from Current Pipeline

This appendix is excerpted from `design-concept-anchored-pipeline.md`. It describes how the concept-anchored pipeline differs from the current modeler and what will change.

### Problem

The current pipeline fragments concept identity between extraction and modeling:

- Evidence extraction (Phase 3) produces six flat files with 7,000+ entries
- The evidence graph (Phase 4) derives edges as flat triples (`from â†’ relation â†’ to`)
- AI modeling phases (6â€“12) receive markdown and must reconstruct concept identity from scattered edges and prose

This causes:

- **Scattering**: a concept's actions, states, relationships, and evidence live in separate files with no cross-index
- **Re-parsing**: every AI phase re-reads markdown to understand what the previous phase produced
- **Drift**: domain model and interaction tree are separate markdown files that evolve independently and can diverge

### Phase Sequence Rationale

The change is not the sequence. The change is **what flows between the phases**  concept-anchored structured JSON instead of flat edge lists and markdown.

### Co-Evolution Mechanism

Every AI phase (5-8, 10) receives the full `solution_model.json` and must update both the domain sections (concepts, behaviors) and the interaction tree sections (stories, scenarios, steps) in the same pass.

Phase instructions enforce this:

- Phase 6 (Structure): "For each property or relationship you add to a concept, verify the concept appears in at least one story. If not, either add a story or flag the concept as structural-only. For each story, add steps from evidence  steps are the primary flow; scenarios come in Phase 8."
- Phase 7 (Behavior): "For each behavior you create, link it to the step(s) that exercise it. Each step must have at least one linked behavior. If no step exists, create one. After linking, verify: owner concept has that operation; collaborators appear in the step flow. Group steps into scenarios (e.g. hit vs miss)  scenarios are optional but add clarity when steps form natural paths."
- Phase 9 (Variation): "For each subtype with different mechanics, ensure a separate story exists. Add failure-mode scenarios where appropriate."

**Verification is incremental, not deferred.** Phase 6 verifies conceptâ†”story; Phase 7 verifies stepâ†”behaviorâ†”concept. Phase 9 (Assess) produces a cross-cutting report  it does not redo scenario walkthroughs that were already enforced during build.

**Parallel Detail Progression.** Concepts and the interaction tree evolve in lockstep. Each phase adds comparable detail to both:


| Phase | Concepts gain                                | Interaction tree gains                                      |
| ----- | -------------------------------------------- | ----------------------------------------------------------- |
| 5     | story_refs, evidence_refs                    | stories (epics, sub-epics), empty steps                     |
| 6     | properties, relationships, inheritance, kind | steps (with actors, pre-conditions), empty linked_behaviors |
| 7     | operations, behavior_refs                    | linked_behaviors, when_then, scenarios (step groupings)     |
| 8     | (unchanged subtypes already exist)           | subtype stories, failure-mode scenarios                     |
| 9     | examples                                     | examples on steps                                           |


Scenarios appear in Phase 7 (basic groupings like hit vs miss) and Phase 8 (failure modes, subtype-specific). No phase defers "scenario work" to a later phase  steps and scenarios are built as behaviors are assigned.

### Step â†” behavior distinction

Each step has `linked_behaviors` (at least one). Each behavior has `linked_steps`. The distinction is not UI vs domain  it is whether the user interaction creates a reaction. Selecting an attack from a character sheet to activate it is trigger context for the `activate` behavior; the selection itself does not create a reaction. By contrast, a user opening a power to see details, or selecting a payment type that causes the system to display different payment details  those create reactions and are behaviors. If the interaction triggers a state change or system response, it is a behavior.

### Artifact schema

The design artifact includes fields the overview example omits:

- **Concepts:** `invariants`  constraints that must hold (e.g. "attack must have valid target before resolve")
- **Behaviors:** `preconditions` and `results`  what must hold before the behavior runs and what it establishes after

### Phase 4 (Index) is new

Today `evidence_graph.py` builds a flat edge list:

```json
{"from": "Effect", "relation": "performs", "to": "Checks", "action_id": "act_0003"}
```

The new Phase 4 flips this  it groups evidence *around concepts*:

```json
{
  "concepts": {
    "Effect": {
      "term_ids": ["term_0042"],
      "performs": ["act_0003", "act_0017"],
      "receives": ["act_0088"],
      "states": ["st_0012"],
      "relationships": ["rel_0005"]
    }
  },
  "registries": {
    "actions": {},
    "decisions": {},
    "states": {},
    "relationships": {}
  }
}
```

Same data, different organization. Registries hold the actual evidence sentences (from extraction `raw`), keyed by ID.

**Origin of the evidence buckets.** Phase 3 (Extract) produces six flat files from `evidence_extraction_guided.py`. These buckets are grounded in established NLP and knowledge-extraction research:


| Phase 3 output       | What it extracts                                                                                                                                           | Research grounding                                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `actions.json`       | Subjectâ€“predicateâ€“object triples (e.g. "Effect applies damage", "Effect applies weakening", "Effect applies afflicting", "Character activates Attack") | **Event extraction** (ACE 2005: trigger + arguments); **SVO triple extraction** (textacy, dependency parsing); **Semantic role labeling** (PropBank, FrameNet: agent/theme/patient â†’ performs/receives) |
| `decisions.json`     | Conditionals (if/when/unless + condition)                                                                                                                  | **Conditional extraction** (LexNLP `lexnlp.extract.en.conditions`: if, when, unless, until, provided that, etc.); rule-based pattern matching for legal/contract text                                     |
| `states.json`        | Entity + state description (state, becomes, transitions to, gains, loses)                                                                                  | **Entity state tracking** (ProPara, OpenPI: entity attributes and state changes in procedural text); **VerbNet semantic parsing** for state extraction                                                    |
| `relationships.json` | From-entity, type, to-entity (has, contains, uses, belongs to)                                                                                             | **Relation extraction** (ACE2005: PHYS, ORG-AFF, PER-SOC; OpenIE; DocRED); binary entityâ€“relationâ€“entity triples                                                                                      |
| `terms.json`         | Domain term candidates                                                                                                                                     | **Terminology extraction** (Wikipedia: subtask of IE; noun phrase chunking, termhood/unithood; C-value/NC-value; supports ontology learning)                                                              |


**Removed: `modifiers.json`.** The modifiers bucket (variation descriptions, variation axes) has been deprecated. It was domain-specific, poorly standardized, and never performed well. Future work: research better approaches  see *Subtype vs type-field discrimination* below.

**Subtype vs type-field discrimination.** A major weakness: the system conflates **real subtypes** (inheritance  extra data and behavior) with **type fields** (e.g. red vs blue  same flow, different value). Research is documented in [subtype-vs-type-field-research.md](./subtype-vs-type-field-research.md). Summary:

- **Feature modeling:** Mechanical difference test  does switching variant change which *rules* apply? Yes â†’ subtype; no â†’ type field.
- **Ontology learning:** Taxonomic ("is-a", "such as") vs attribute ("has", "of type") patterns. Inheritance = vertical; attributes = horizontal.
- **DDD heuristics:** Behavior differences â†’ subtype. Same flow, different value â†’ type field.
- **Proposed strategy:** Pattern-based pre-filter + mechanical difference test + behavioral evidence (do variants have different actions/decisions?). See research doc for heuristics table and extraction strategy.

**Alignment with CRC / OO design.** CRC cards (Beck & Cunningham, OOPSLA'89) use **Class**, **Responsibility** (verb phrases), and **Collaborator**. Our buckets map: actions â†’ responsibilities; relationships â†’ collaborators; states â†’ entity attributes. Terminology extraction feeds concept naming. Decisions feed when/how behaviors apply. See References above.

**Human-readable rendered view.** The index is optimized for AI lookup (IDs only). For human review at Checkpoint 2, render an expanded view that inlines the relevant details for each ID. Example:

```markdown
## Effect

**performs**
- act_0003  applies damage to target
- act_0017  modifies target's resistance

**receives**
- act_0088  receives trigger from Character when attack resolves

**states**
- st_0012  applied (effect has been applied to target)

**relationships**
- rel_0005  belongs to Character (effect is owned by the attacking character)
```

Same concept-anchored structure, but each ID is expanded with its human-readable description from the registries. Supports human verification of rule coverage without cross-referencing raw JSON.

### One artifact from Phase 5 onward

Today, domain model lives in `domain.md` and interaction tree lives in `interaction_tree.md`. They are separate files maintained by separate instructions. When Phase 7 assigns an operation to a concept, it must separately remember to update the interaction tree markdown.

With `solution_model.json`, when Phase 7 adds a behavior, it simultaneously links that behavior to the step(s) that exercise it in the same file. Step and behavior cannot diverge.

### Structured JSON throughout

Today, Phases 6â€“12 produce markdown only. Every subsequent phase re-parses prose to understand the model. With structured JSON, each phase reads the previous version, enriches specific sections, and writes the next version. Markdown is rendered from the JSON for human review, not used as the source of truth between phases.

### Fewer phases (11 vs 12)

The current split between `concept_model` and `structural_model` can merge into one "Structure" phase. With concept-anchored evidence from Phase 4, the AI doesn't need a separate pass to "discover" relationships  they're already indexed.