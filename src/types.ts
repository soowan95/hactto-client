export interface AlertState {
  type: "success" | "error";
  text: string;
}

export interface WinningNumber {
  episode: number;
  numbers: number[];
  isDrawn?: boolean;
}

export interface MatchResult {
  rank: number;
  matchCount: number;
  bonusMatch: boolean;
  matchedNumbers: number[];
  winningNumbers: number[];
}

export interface HistoryItem {
  id: string;
  episode: number;
  algorithm: string;
  numbers: number[];
  matchResult: MatchResult | null;
  createdAt?: string;
}
