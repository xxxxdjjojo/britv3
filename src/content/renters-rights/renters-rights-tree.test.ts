import { describe, expect, it } from "vitest";
import { RENTERS_RIGHTS_TREES } from "./index";
import type { OutcomeNode, QuestionNode, RoleTree, TreeNode } from "./types";

/**
 * Structural contract for the Renters' Rights Checker content trees.
 *
 * For every role tree: the start node exists, every answer resolves to a real
 * node (no dead ends), every path terminates in an outcome within MAX_STEPS,
 * every outcome carries at least one real citation, and question count stays
 * within the ≤8 budget so the checker never becomes a chore.
 */

const MAX_STEPS = 12;
const MAX_QUESTIONS_PER_ROLE = 8;

const ROLES = Object.keys(RENTERS_RIGHTS_TREES) as ReadonlyArray<RoleTree["role"]>;

function nodeMap(tree: RoleTree): Map<string, TreeNode> {
  return new Map(tree.nodes.map((n) => [n.id, n]));
}

function questions(tree: RoleTree): QuestionNode[] {
  return tree.nodes.filter((n): n is QuestionNode => n.kind === "question");
}

function outcomes(tree: RoleTree): OutcomeNode[] {
  return tree.nodes.filter((n): n is OutcomeNode => n.kind === "outcome");
}

describe.each(ROLES)("renters' rights tree: %s", (role) => {
  const tree = RENTERS_RIGHTS_TREES[role];
  const nodes = nodeMap(tree);

  it("declares role, version and checkedDate", () => {
    expect(tree.role).toBe(role);
    expect(tree.version).toBeGreaterThanOrEqual(1);
    expect(tree.checkedDate).toBeTruthy();
  });

  it("has a start node that exists and is a question", () => {
    const start = nodes.get(tree.start);
    expect(start, `start node ${tree.start} missing`).toBeDefined();
    expect(start?.kind).toBe("question");
  });

  it("has unique node ids", () => {
    expect(nodes.size).toBe(tree.nodes.length);
  });

  it("every answer resolves to an existing node (no dead ends)", () => {
    for (const q of questions(tree)) {
      expect(q.answers.length, `${q.id} has no answers`).toBeGreaterThan(0);
      for (const a of q.answers) {
        expect(
          nodes.has(a.next),
          `${q.id} answer "${a.label}" points at missing node ${a.next}`,
        ).toBe(true);
      }
    }
  });

  it(`every path terminates in an outcome within ${MAX_STEPS} steps (exhaustive walk)`, () => {
    // Depth-first walk of every answer combination from the start node.
    const walk = (id: string, depth: number, path: string[]): void => {
      expect(depth, `path exceeded ${MAX_STEPS} steps: ${[...path, id].join(" → ")}`)
        .toBeLessThanOrEqual(MAX_STEPS);
      const node = nodes.get(id);
      expect(node, `walked to missing node ${id}`).toBeDefined();
      if (!node || node.kind === "outcome") return;
      // Cycle guard: a repeated node on the same path would loop forever.
      expect(path.includes(id), `cycle detected: ${[...path, id].join(" → ")}`).toBe(false);
      for (const a of node.answers) {
        walk(a.next, depth + 1, [...path, id]);
      }
    };
    walk(tree.start, 1, []);
  });

  it("every node is reachable from the start", () => {
    const reached = new Set<string>();
    const visit = (id: string): void => {
      if (reached.has(id)) return;
      reached.add(id);
      const node = nodes.get(id);
      if (node?.kind === "question") node.answers.forEach((a) => visit(a.next));
    };
    visit(tree.start);
    const orphans = tree.nodes.filter((n) => !reached.has(n.id)).map((n) => n.id);
    expect(orphans, `unreachable nodes: ${orphans.join(", ")}`).toEqual([]);
  });

  it(`has at most ${MAX_QUESTIONS_PER_ROLE} question nodes`, () => {
    expect(questions(tree).length).toBeLessThanOrEqual(MAX_QUESTIONS_PER_ROLE);
  });

  it("every outcome has ≥1 citation with non-empty instrument + https url", () => {
    for (const o of outcomes(tree)) {
      expect(o.citations.length, `${o.id} has no citations`).toBeGreaterThanOrEqual(1);
      expect(o.title).toBeTruthy();
      expect(o.body.length, `${o.id} has no body copy`).toBeGreaterThan(0);
      for (const c of o.citations) {
        expect(c.instrument, `${o.id} citation missing instrument`).toBeTruthy();
        expect(c.section, `${o.id} citation missing section`).toBeTruthy();
        expect(c.url, `${o.id} citation url must be https: ${c.url}`).toMatch(/^https:\/\//);
      }
    }
  });
});
