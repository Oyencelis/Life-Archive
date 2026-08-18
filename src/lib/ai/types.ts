// Provider-agnostic AI layer — see architecture blueprint §6.
// Any provider (Gemini today, Claude or a local model later) implements
// this one method. Nothing above this interface knows which model answers.

export interface CitedRecord {
  type: string;
  id: string;
  label: string;
  href: string;
}

export interface GroundedContext {
  text: string;
  records: CitedRecord[];
}

export interface AIProvider {
  complete(question: string, context: GroundedContext): Promise<{ text: string }>;
}
