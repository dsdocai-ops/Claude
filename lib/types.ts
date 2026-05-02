export interface PublicRoastResult {
  score: number;
  headline_feedback: string;
}

export interface RoastResult extends PublicRoastResult {
  value_prop_feedback: string;
  ux_issues: string[];
  trust_issues: string[];
  cta_feedback: string;
  improvements: string[];
  rewritten_headline: string;
}

export function isFullResult(r: PublicRoastResult | RoastResult): r is RoastResult {
  return "rewritten_headline" in r;
}
