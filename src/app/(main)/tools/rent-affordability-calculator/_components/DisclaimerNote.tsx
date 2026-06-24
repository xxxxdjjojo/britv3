import { Info } from "lucide-react";

export function DisclaimerNote() {
  return (
    <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3">
      <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <p className="text-xs text-muted-foreground">
        This is a guidance tool. Net income is estimated at roughly 78% of gross; actual tax and
        National Insurance vary by personal circumstances. It does not guarantee landlord or
        referencing approval — individual lender and agent criteria may differ.
      </p>
    </div>
  );
}
