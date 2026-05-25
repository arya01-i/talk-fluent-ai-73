import { createFileRoute } from "@tanstack/react-router";
import { MessageList, TextComposer, useTutor } from "@/components/chat-engine";

export const Route = createFileRoute("/app/learn/text")({
  head: () => ({ meta: [{ title: "Text chat — Anya" }] }),
  component: TextChatPage,
});

function TextChatPage() {
  const { messages, send, busy } = useTutor("text");
  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full">
      <div className="px-4 pt-4 pb-2 border-b">
        <h1 className="font-semibold text-lg">Text chat with Anya</h1>
        <p className="text-xs text-muted-foreground">Type freely. Anya replies in your target language with a translation hint.</p>
      </div>
      <MessageList messages={messages} busy={busy} />
      <TextComposer onSend={send} busy={busy} />
    </div>
  );
}