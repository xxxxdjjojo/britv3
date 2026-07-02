"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, RotateCcw } from "lucide-react";
import { RENTERS_RIGHTS_TREES } from "@/content/renters-rights";
import type { OutcomeNode, RoleTree, TreeNode } from "@/content/renters-rights";
import { trackToolCompleted, trackToolStarted } from "@/lib/analytics/influence-events";
import { ShareBar } from "@/components/trust/ShareBar";

const TOOL_KEY = "renters_rights_checker";

const ROLE_OPTIONS: ReadonlyArray<{ role: RoleTree["role"]; label: string; blurb: string }> = [
  { role: "tenant", label: "I'm a tenant", blurb: "Check your rights under the new rules" },
  { role: "landlord", label: "I'm a landlord", blurb: "Check your duties and deadlines" },
  { role: "letting_agent", label: "I'm a letting agent", blurb: "Check your agency's compliance" },
];

type CheckerState = {
  role: RoleTree["role"] | null;
  nodeId: string | null;
  history: ReadonlyArray<string>;
};

const INITIAL_STATE: CheckerState = { role: null, nodeId: null, history: [] };

function findNode(tree: RoleTree, id: string | null): TreeNode | null {
  return tree.nodes.find((n) => n.id === id) ?? null;
}

/**
 * Interactive Renters' Rights Checker. The flow is driven entirely by the
 * versioned content trees in `src/content/renters-rights/` — no branching
 * logic lives in this component.
 */
export function RentersRightsChecker() {
  const [state, setState] = useState<CheckerState>(INITIAL_STATE);

  const tree = state.role ? RENTERS_RIGHTS_TREES[state.role] : null;
  const node = useMemo(
    () => (tree ? findNode(tree, state.nodeId) : null),
    [tree, state.nodeId],
  );

  function handleRolePick(role: RoleTree["role"]) {
    trackToolStarted(TOOL_KEY);
    setState({ role, nodeId: RENTERS_RIGHTS_TREES[role].start, history: [] });
  }

  function handleAnswer(next: string) {
    if (!tree || !state.nodeId) return;
    const nextNode = findNode(tree, next);
    if (!nextNode) return;
    if (nextNode.kind === "outcome") {
      trackToolCompleted(TOOL_KEY, { role: tree.role, outcome: nextNode.id });
    }
    setState({
      role: state.role,
      nodeId: next,
      history: [...state.history, state.nodeId],
    });
  }

  function handleBack() {
    if (state.history.length === 0) {
      setState(INITIAL_STATE);
      return;
    }
    setState({
      role: state.role,
      nodeId: state.history[state.history.length - 1],
      history: state.history.slice(0, -1),
    });
  }

  function handleRestart() {
    setState(INITIAL_STATE);
  }

  if (!tree || !node) {
    return (
      <section aria-label="Choose your role" className="space-y-4">
        <h2 className="font-heading text-xl font-bold text-neutral-900 dark:text-white">
          Who are you checking for?
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {ROLE_OPTIONS.map(({ role, label, blurb }) => (
            <button
              key={role}
              type="button"
              onClick={() => handleRolePick(role)}
              className="rounded-xl border-2 border-neutral-200 p-5 text-left transition-colors hover:border-brand-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary dark:border-neutral-700"
            >
              <span className="block font-heading font-bold text-neutral-900 dark:text-white">
                {label}
              </span>
              <span className="mt-1 block text-sm text-neutral-600 dark:text-neutral-400">
                {blurb}
              </span>
            </button>
          ))}
        </div>
      </section>
    );
  }

  if (node.kind === "question") {
    const questionNumber = state.history.length + 1;
    return (
      <section aria-label="Your rights questions" className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
            Question {questionNumber}
          </p>
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1 text-sm font-medium text-neutral-600 transition-colors hover:text-brand-primary dark:text-neutral-400"
          >
            <ArrowLeft className="size-4" aria-hidden /> Back
          </button>
        </div>
        <h2 className="font-heading text-xl font-bold text-neutral-900 dark:text-white">
          {node.question}
        </h2>
        {node.help ? (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{node.help}</p>
        ) : null}
        <div className="flex flex-col gap-3">
          {node.answers.map((answer) => (
            <button
              key={answer.label}
              type="button"
              onClick={() => handleAnswer(answer.next)}
              className="rounded-xl border-2 border-neutral-200 px-5 py-4 text-left text-sm font-medium text-neutral-900 transition-colors hover:border-brand-primary hover:bg-brand-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary dark:border-neutral-700 dark:text-white"
            >
              {answer.label}
            </button>
          ))}
        </div>
      </section>
    );
  }

  return <OutcomeScreen role={tree.role} outcome={node} onRestart={handleRestart} onBack={handleBack} />;
}

function OutcomeScreen({
  role,
  outcome,
  onRestart,
  onBack,
}: Readonly<{
  role: RoleTree["role"];
  outcome: OutcomeNode;
  onRestart: () => void;
  onBack: () => void;
}>) {
  return (
    <section aria-label="Your result" className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
          Your result
        </p>
        <h2 className="mt-2 font-heading text-2xl font-bold text-neutral-900 dark:text-white">
          {outcome.title}
        </h2>
      </div>

      <div className="space-y-4">
        {outcome.body.map((paragraph) => (
          <p
            key={paragraph.slice(0, 40)}
            className="leading-relaxed text-neutral-700 dark:text-neutral-300"
          >
            {paragraph}
          </p>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-muted p-5">
        <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
          Why: cited grounds
        </h3>
        <ul className="mt-3 space-y-2">
          {outcome.citations.map((citation) => (
            <li key={citation.url + citation.section} className="text-sm">
              <a
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-brand-primary underline underline-offset-2 hover:text-brand-primary-dark"
              >
                {citation.instrument}, {citation.section}
                <ExternalLink className="size-3.5 shrink-0" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </div>

      <ShareBar title="Renters' Rights Checker — know where you stand" toolKey={TOOL_KEY} />

      <div className="rounded-xl border border-brand-primary/30 bg-brand-primary/5 p-5">
        {role === "letting_agent" ? (
          <>
            <h3 className="font-heading font-bold text-neutral-900 dark:text-white">
              Get deadline reminders
            </h3>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              The Agent Briefing tracks Renters&apos; Rights Act commencement dates and
              compliance deadlines for letting agents.
            </p>
            <Link
              href="/agent-briefing"
              className="mt-3 inline-flex items-center rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-primary-dark"
            >
              Get deadline reminders
            </Link>
          </>
        ) : (
          <>
            <h3 className="font-heading font-bold text-neutral-900 dark:text-white">
              Stay on top of the changes
            </h3>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              We publish plain-English updates as each part of the Renters&apos; Rights Act
              comes into force. Subscribe to the TrueDeed newsletter on our blog.
            </p>
            <Link
              href="/blog"
              className="mt-3 inline-flex items-center rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-primary-dark"
            >
              Subscribe on the blog
            </Link>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-brand-primary px-4 py-2 text-sm font-medium text-brand-primary transition-colors hover:bg-brand-primary/10"
        >
          <ArrowLeft className="size-4" aria-hidden /> Back
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex items-center gap-2 rounded-full border border-brand-primary px-4 py-2 text-sm font-medium text-brand-primary transition-colors hover:bg-brand-primary/10"
        >
          <RotateCcw className="size-4" aria-hidden /> Start again
        </button>
      </div>
    </section>
  );
}
