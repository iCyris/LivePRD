import { useMemo, useState } from "react";
import { Copy, MessageSquareMore, RefreshCcw, Send, WandSparkles } from "lucide-react";

import { Button } from "./ui/button.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card.jsx";

const starterPrompts = [
  "目标：减少超时后的流失，并保留购物车与地址信息。",
  "流程：用户提交支付后超时，停留在当前页，看到恢复说明，再次发起支付。",
  "异常：如果二次重试仍失败，需要明确告诉用户什么时候改成联系客服。",
  "验收：超时后不跳首页，文案说明已保留哪些信息，主按钮可以重试支付。",
];

export function AuthorStudio({
  document,
  session,
  onSendMessage,
  onDraftChange,
  onResetDraft,
  onCopyMarkdown,
}) {
  const [composer, setComposer] = useState("");
  const draftStats = useMemo(() => {
    const lineCount = session.draftMarkdown.split("\n").length;
    const messageCount = session.messages.length;
    return { lineCount, messageCount };
  }, [session]);

  const submit = () => {
    if (!composer.trim()) {
      return;
    }

    onSendMessage(composer.trim());
    setComposer("");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquareMore className="h-4 w-4" />
            Author Studio
          </CardTitle>
          <CardDescription>
            聊需求、补边界、改验收，中间预览会直接跟着工作草稿刷新。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{document.meta.title}</span>
              <span>{draftStats.lineCount} lines</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {draftStats.messageCount} conversation messages in this local session
            </div>
          </div>

          <div className="space-y-3">
            {session.messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-lg border px-3 py-2 text-sm leading-6 ${
                  message.role === "assistant"
                    ? "bg-muted/40 text-muted-foreground"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {message.content}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {starterPrompts.map((prompt) => (
              <Button
                key={prompt}
                className="h-auto whitespace-normal px-3 py-2 text-left text-xs"
                onClick={() => setComposer(prompt)}
                type="button"
                variant="outline"
              >
                {prompt}
              </Button>
            ))}
          </div>

          <div className="space-y-3">
            <textarea
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
              onChange={(event) => setComposer(event.target.value)}
              placeholder="比如：目标：这次需求要让用户在支付超时后继续停留在 checkout，并保留购物车和地址信息。"
              value={composer}
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={submit} type="button">
                <Send className="h-4 w-4" />
                发送并写入草稿
              </Button>
              <Button onClick={onResetDraft} type="button" variant="outline">
                <RefreshCcw className="h-4 w-4" />
                重置工作草稿
              </Button>
              <Button onClick={onCopyMarkdown} type="button" variant="secondary">
                <Copy className="h-4 w-4" />
                复制 Markdown
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WandSparkles className="h-4 w-4" />
            Working Draft
          </CardTitle>
          <CardDescription>
            这里是当前本地工作稿。你既可以聊天驱动它，也可以直接手改。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            className="flex min-h-[420px] w-full rounded-md border border-input bg-background px-3 py-3 font-mono text-xs leading-6 shadow-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
            onChange={(event) => onDraftChange(event.target.value)}
            value={session.draftMarkdown}
          />
        </CardContent>
      </Card>
    </div>
  );
}
