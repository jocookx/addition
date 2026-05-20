export type SearchIntent =
  | "troubleshooting"
  | "create_workflow"
  | "learning"
  | "command_reference"
  | "interoperability"
  | "exploring";

export type ConfidenceBand = "high" | "medium" | "low";

export type MatchReason =
  | "exact_command_name"
  | "exact_title"
  | "synonym_match"
  | "problem_phrase"
  | "intent_type"
  | "software_match"
  | "tag_match"
  | "keyword_match"
  | "transcript_match";

export type ClarificationOption = {
  label:     string;
  value:     string;
  routes_to: string; // problem slug
};

export type ClarificationQuestion = {
  question: string;
  field:    string;
  options:  ClarificationOption[];
};

export type SearchResultItem = {
  id:          string;
  type:        "command" | "combo" | "course" | "fix" | "problem";
  title:       string;
  software:    string;
  description: string;
  tags:        string[];
  score:       number;
  matchReasons: MatchReason[];
  // Extra fields per type
  estimatedMinutes?: number;
  relatedCommands?:  string[];
  problemSolved?:    string;
};

export type SearchResponse = {
  query:          string;
  normalisedQuery: string;
  intent:         SearchIntent;
  confidence:     ConfidenceBand;
  confidenceScore: number;
  results:        SearchResultItem[];
  fixes:          SearchResultItem[];
  problems:       SearchResultItem[];
  needsClarification: boolean;
  clarificationQuestions: ClarificationQuestion[];
  logId:          string | null;
  total:          number;
};
