import { PageHeader } from "@/components/shell/PageHeader";
import { AskChat } from "./AskChat";

export default function AIPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Grounded in your archive, nothing else"
        title="Ask"
        description="Answers come only from what you've archived. If it isn't in the database, you'll be told that directly — never a guess, never the open internet."
      />
      <AskChat />
    </div>
  );
}
