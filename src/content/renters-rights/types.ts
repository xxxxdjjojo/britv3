/**
 * Renters' Rights Checker — versioned decision-tree content types.
 *
 * The checker UI is driven entirely by this data so a housing solicitor can
 * review or diff the content (questions, outcomes, citations) without reading
 * any component logic. Every outcome must carry at least one citation — this
 * is enforced by `renters-rights-tree.test.ts`.
 */

export type Citation = {
  instrument: string;
  section: string;
  url: string;
};

export type OutcomeNode = {
  id: string;
  kind: "outcome";
  title: string;
  body: ReadonlyArray<string>;
  /** Minimum 1 — enforced via test. */
  citations: ReadonlyArray<Citation>;
};

export type QuestionNode = {
  id: string;
  kind: "question";
  question: string;
  help?: string;
  answers: ReadonlyArray<{ label: string; next: string }>;
};

export type TreeNode = QuestionNode | OutcomeNode;

export type RoleTree = {
  role: "tenant" | "landlord" | "letting_agent";
  version: number;
  checkedDate: string;
  start: string;
  nodes: ReadonlyArray<TreeNode>;
};
