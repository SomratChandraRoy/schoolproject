import React, { useEffect, useMemo, useState } from "react";
import voiceConversationService, {
  VoiceMessage,
  ConversationSummary,
} from "../services/voiceConversationService";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "./ui/conversation";
import { Message, MessageAvatar, MessageContent } from "./ui/message";
import { BarVisualizer } from "./ui/bar-visualizer";

interface AIVoiceConversationProps {
  isFloating?: boolean;
  onClose?: () => void;
}

type Mode = "tutor" | "exam" | "quiz" | "general";

const modeLabels: Record<Mode, string> = {
  tutor: "Tutor",
  exam: "Exam",
  quiz: "Quiz",
  general: "General",
};

const AIVoiceConversation: React.FC<AIVoiceConversationProps> = ({
  isFloating = false,
  onClose,
}) => {
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [mode, setMode] = useState<Mode>("tutor");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<ConversationSummary[]>([]);
  const [error, setError] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState(!isFloating);

  useEffect(() => {
    if (!showHistory) return;
    void loadHistory();
  }, [showHistory]);

  const statusText = useMemo(() => {
    if (isRecording) return "Listening...";
    if (isProcessing) return "Thinking...";
    return `Mode: ${modeLabels[mode]}`;
  }, [isRecording, isProcessing, mode]);

  const loadHistory = async () => {
    try {
      const items = await voiceConversationService.getPastConversations();
      setHistory(items);
      setError("");
    } catch {
      setError("Failed to load voice conversation history.");
    }
  };

  const handleModeChange = (nextMode: Mode) => {
    setMode(nextMode);
    voiceConversationService.clearHistory();
    setMessages([]);
    setError("");
  };

  const handleStartRecording = async () => {
    setError("");
    try {
      setIsRecording(true);
      await voiceConversationService.startRecording();
    } catch {
      setError("Microphone access failed. Please allow mic permission.");
      setIsRecording(false);
    }
  };

  const handleStopRecording = async () => {
    setError("");
    try {
      setIsRecording(false);
      setIsProcessing(true);
      const audioBlob = await voiceConversationService.stopRecording();
      const response = await voiceConversationService.sendVoiceMessage(
        audioBlob,
        mode,
      );

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-voice-user`,
          role: "user",
          text: "Voice message sent",
          timestamp: new Date(),
          type: "voice",
        },
        response,
      ]);

      if (response.audioUrl) {
        await voiceConversationService.playAudio(response.audioUrl);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Voice input failed.";
      setError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendText = async () => {
    const message = textInput.trim();
    if (!message) return;

    setIsProcessing(true);
    setError("");

    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-user`,
        role: "user",
        text: message,
        timestamp: new Date(),
        type: "text",
      },
    ]);
    setTextInput("");

    try {
      const response = await voiceConversationService.sendTextMessage(
        message,
        mode,
      );
      setMessages((prev) => [...prev, response]);

      if (response.audioUrl) {
        await voiceConversationService.playAudio(response.audioUrl);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Message send failed.";
      setError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadConversation = async (conversationId: string) => {
    setError("");
    try {
      const loaded =
        await voiceConversationService.loadConversation(conversationId);
      setMessages(loaded);
      setShowHistory(false);
    } catch {
      setError("Could not load that conversation.");
    }
  };

  const handleSaveConversation = async () => {
    setError("");
    try {
      await voiceConversationService.saveConversationSummary();
    } catch {
      setError("Could not save conversation summary.");
    }
  };

  const handleCloseFloating = () => {
    if (onClose) {
      onClose();
      return;
    }
    setIsExpanded(false);
  };

  if (isFloating && !isExpanded) {
    return (
      <Button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-4 right-4 z-40"
        size="icon-lg"
        title="Open voice tutor">
        Mic
      </Button>
    );
  }

  return (
    <Card
      className={
        isFloating
          ? "fixed bottom-4 right-4 z-40 h-[80vh] w-[min(96vw,28rem)]"
          : "w-full"
      }>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>AI Voice Conversation</CardTitle>
            <p className="text-xs text-muted-foreground">{statusText}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="xs"
              variant={showHistory ? "default" : "outline"}
              onClick={() => setShowHistory((p) => !p)}>
              History
            </Button>
            {isFloating && (
              <Button size="xs" variant="outline" onClick={handleCloseFloating}>
                Close
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 pb-3">
        <div className="flex flex-wrap gap-2 pt-2">
          {(["tutor", "exam", "quiz", "general"] as Mode[]).map((m) => (
            <Button
              key={m}
              size="xs"
              variant={mode === m ? "default" : "outline"}
              onClick={() => handleModeChange(m)}>
              {modeLabels[m]}
            </Button>
          ))}
        </div>

        {showHistory ? (
          <div className="space-y-2 overflow-y-auto">
            {history.length === 0 ? (
              <ConversationEmptyState
                title="No previous sessions"
                description="Your saved voice sessions will appear here."
              />
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => void handleLoadConversation(item.id)}
                  className="w-full rounded-lg border border-border p-3 text-left hover:bg-muted">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.messageCount} messages
                  </p>
                </button>
              ))
            )}
          </div>
        ) : (
          <>
            <Conversation className="min-h-[18rem] rounded-lg border">
              <ConversationContent>
                {messages.length === 0 ? (
                  <ConversationEmptyState
                    title="Start speaking"
                    description="Use mic or text input to begin the conversation."
                  />
                ) : (
                  messages.map((msg) => (
                    <Message
                      key={msg.id}
                      from={msg.role === "user" ? "user" : "assistant"}>
                      <MessageAvatar
                        name={msg.role === "user" ? "You" : "AI"}
                        src={msg.role === "user" ? "👤" : "🤖"}
                      />
                      <MessageContent>
                        {msg.text}
                        {msg.audioUrl && msg.role === "assistant" && (
                          <div className="mt-2">
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() =>
                                void voiceConversationService.playAudio(
                                  msg.audioUrl!,
                                )
                              }>
                              Play voice
                            </Button>
                          </div>
                        )}
                      </MessageContent>
                    </Message>
                  ))
                )}

                {isProcessing && (
                  <Message from="assistant">
                    <MessageAvatar name="AI" src="🤖" />
                    <BarVisualizer isActive animating barCount={7} />
                  </Message>
                )}
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>

            {error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}

            <div className="flex items-end gap-2">
              <Textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                disabled={isRecording || isProcessing}
                placeholder="Type your question..."
                className="min-h-10"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSendText();
                  }
                }}
              />
              <Button
                variant={isRecording ? "destructive" : "outline"}
                size="icon"
                onClick={() =>
                  isRecording
                    ? void handleStopRecording()
                    : void handleStartRecording()
                }
                disabled={isProcessing}>
                {isRecording ? "Stop" : "Mic"}
              </Button>
              <Button
                size="icon"
                onClick={() => void handleSendText()}
                disabled={isProcessing || !textInput.trim()}>
                Send
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                size="xs"
                variant="outline"
                onClick={() => void handleSaveConversation()}>
                Save summary
              </Button>
              <Button
                size="xs"
                variant="destructive"
                onClick={() => {
                  voiceConversationService.clearHistory();
                  setMessages([]);
                  setError("");
                }}>
                Clear
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AIVoiceConversation;
