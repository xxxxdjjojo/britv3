
## Pre-existing build error (out of scope for 14-04)

`src/app/(protected)/dashboard/landlord/finance/expenses/ExpenseTrackerClient.tsx` imports from `@/components/ui/alert-dialog` which does not exist. This is unrelated to the tenant screening work in 14-04. Needs `alert-dialog` shadcn component to be added.
