import type { RoleTree } from "./types";
import { TENANT_TREE } from "./tenant";
import { LANDLORD_TREE } from "./landlord";
import { LETTING_AGENT_TREE } from "./letting-agent";

export type { Citation, OutcomeNode, QuestionNode, RoleTree, TreeNode } from "./types";

/** All Renters' Rights Checker decision trees, keyed by role. */
export const RENTERS_RIGHTS_TREES: Readonly<Record<RoleTree["role"], RoleTree>> = {
  tenant: TENANT_TREE,
  landlord: LANDLORD_TREE,
  letting_agent: LETTING_AGENT_TREE,
};
