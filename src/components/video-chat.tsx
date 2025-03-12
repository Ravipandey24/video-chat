"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

interface VideoChatProps {
  videoId: number | string;
}

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  createdAt?: Date;
}

export default function VideoChat({ videoId }: VideoChatProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isInputEmpty, setIsInputEmpty] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [previousMessages, setPreviousMessages] = useState<Message[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Fetch previous messages from the database
  useEffect(() => {
    const fetchPreviousMessages = async () => {
      try {
        setIsLoadingHistory(true);
        const response = await fetch(`/api/messages?videoId=${videoId}`);

        if (!response.ok) {
          throw new Error("Failed to load conversation history");
        }

        const data = await response.json();
        setPreviousMessages(data);
      } catch (error) {
        console.error("Error loading messages:", error);
        toast.error("Failed to load conversation history");
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchPreviousMessages();
  }, [videoId]);

  // When previous messages are loaded, add them to the messages state
  useEffect(() => {
    if (previousMessages.length > 0 && messages.length === 0) {
      setMessages(previousMessages);
    }
  }, [previousMessages, messages.length]);

  // Track input emptiness
  useEffect(() => {
    setIsInputEmpty(!input.trim());
  }, [input]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current && viewportRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        setShowScrollButton(false);
      }, 100);
    }
  }, [messages]);

  // Add scroll detection to show scroll button
  useEffect(() => {
    const checkScroll = () => {
      if (!viewportRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight <= 100;
      setShowScrollButton(!isNearBottom);
    };

    const scrollContainer = viewportRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", checkScroll);

      // Initial check
      checkScroll();

      return () => {
        scrollContainer.removeEventListener("scroll", checkScroll);
      };
    }
  }, []);

  // Focus the input when the component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Custom handleSubmit function that sends a message and processes the streaming response
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isInputEmpty || isLoading) return;

    const userMessage = input.trim();

    // Optimistically add user message to the UI
    const userMessageObj: Message = {
      id: Date.now().toString(),
      content: userMessage,
      role: "user",
    };

    setMessages((prevMessages) => [...prevMessages, userMessageObj]);
    setInput("");
    setError(null);
    setIsLoading(true);

    // Create a message ID that will be used for both loading and actual response
    const assistantMessageId = `msg_${Date.now()}`;

    try {
      // Create a message structure that the API expects
      const requestBody = {
        videoId,
        messages: [...messages, userMessageObj].map((msg) => ({
          content: msg.content,
          role: msg.role,
          id: msg.id,
        })),
      };

      // Fetch with streaming response
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Process the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let responseText = "";

      // Add an empty assistant message that we'll update incrementally
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          content: "",
          role: "assistant",
        },
      ]);

      let firstChunkReceived = false;

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Decode the chunk
        const chunkText = decoder.decode(value, { stream: true });

        // Set isLoading to false once we start receiving content
        if (!firstChunkReceived) {
          setIsLoading(false);
          firstChunkReceived = true;
        }

        // Process the SSE data
        const lines = chunkText
          .split("\n")
          .filter((line) => line.trim() !== "");

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;

          const data = line.slice(5).trim();

          // Handle [DONE] marker
          if (data === "[DONE]") continue;

          try {
            // Parse the JSON data
            const parsedData = JSON.parse(data);

            // Extract content if available
            if (parsedData.choices?.[0]?.delta?.content) {
              const contentDelta = parsedData.choices[0].delta.content;
              responseText += contentDelta;

              // Update the assistant message with the new content
              setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: responseText }
                    : msg
                )
              );
            }
          } catch (e) {
            console.error("Failed to parse chunk:", data, e);
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setError(
        error instanceof Error ? error : new Error("Unknown error occurred")
      );
      toast.error("Failed to send message", {
        description: "Please try again or refresh the page.",
      });

      // Remove the empty assistant message if there was an error
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.id !== assistantMessageId)
      );
    } finally {
      // Keep this to ensure isLoading is always reset,
      // even if there were no chunks received
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter without Shift
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form && !isInputEmpty && !isLoading) {
        form.dispatchEvent(
          new Event("submit", { cancelable: true, bubbles: true })
        );
      }
    }
  };

  // Create initials for avatar fallback
  const getUserInitials = () => {
    if (!session?.user?.name) return "U";
    return session.user.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      setShowScrollButton(false);
    }
  };

  // Welcome message only shown when there are no previous messages
  const welcomeMessage =
    "Ask me anything about what's happening in this video.";

  return (
    <div className="flex flex-col h-full rounded-lg border bg-background">
      {/* Chat header */}
      <div className="px-4 py-3 flex items-center border-b">
        <Avatar className="h-7 w-7 mr-2">
          <AvatarFallback className="bg-primary/10 text-primary">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
          <AvatarImage src="/ai-avatar.png" alt="AI Assistant" />
        </Avatar>
        <h3 className="text-sm font-medium">Video Assistant</h3>
      </div>

      {/* Messages container */}
      <ScrollArea ref={viewportRef} className="h-[calc(100vh-40rem)]">
        <div className="px-4 py-5 space-y-6">
          {/* Loading indicator for history */}
          {isLoadingHistory && (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Loading conversation...
              </span>
            </div>
          )}

          {/* AI welcome message - only show if no messages */}
          {!isLoadingHistory && messages.length === 0 && (
            <div className="flex items-start gap-3.5">
              <Avatar className="h-8 w-8 mt-0.5 border">
                <AvatarFallback className="bg-primary/10 text-primary">
                  AI
                </AvatarFallback>
                <AvatarImage src="/ai-avatar.png" alt="AI Assistant" />
              </Avatar>
              <div className="rounded-lg bg-muted p-4 text-sm">
                {welcomeMessage}
              </div>
            </div>
          )}

          {/* Chat messages */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-3.5",
                message.role === "user" ? "justify-end" : ""
              )}
            >
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8 mt-0.5 border">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    AI
                  </AvatarFallback>
                  <AvatarImage src="/ai-avatar.png" alt="AI Assistant" />
                </Avatar>
              )}

              <div
                className={cn(
                  "rounded-lg p-4 text-sm max-w-[85%]",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {message.content ||
                  (isLoading && message === messages[messages.length - 1] ? (
                    <div className="flex gap-1.5 items-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40 animate-pulse"></div>
                      <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40 animate-pulse delay-300"></div>
                      <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40 animate-pulse delay-500"></div>
                    </div>
                  ) : (
                    message.content
                  ))}
              </div>

              {message.role === "user" && (
                <Avatar className="h-8 w-8 mt-0.5 border">
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  <AvatarImage
                    src={session?.user?.image || ""}
                    alt={session?.user?.name || "User"}
                  />
                </Avatar>
              )}
            </div>
          ))}

          {/* Loading indicator for current message */}
          {isLoading && (
            <div className="flex items-start gap-3.5">
              <Avatar className="h-8 w-8 mt-0.5 border">
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </AvatarFallback>
                <AvatarImage src="/ai-avatar.png" alt="AI Assistant" />
              </Avatar>
              <div className="rounded-lg bg-muted p-4 text-sm">
                <div className="flex gap-1.5 items-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40 animate-pulse"></div>
                  <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40 animate-pulse delay-300"></div>
                  <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40 animate-pulse delay-500"></div>
                </div>
              </div>
            </div>
          )}

          {/* Invisible element for scrolling to bottom */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <Button
          onClick={scrollToBottom}
          size="icon"
          variant="outline"
          className="absolute bottom-[100px] right-6 rounded-full h-10 w-10 shadow-md border bg-background/90 backdrop-blur-sm z-10"
        >
          <ArrowDown className="h-4 w-4" />
          <span className="sr-only">Scroll to bottom</span>
        </Button>
      )}

      {/* Input form */}
      <div className="p-4 pt-3 border-t bg-background/95 backdrop-blur">
        {error && (
          <div className="mb-3 text-sm text-red-500 bg-red-50 p-3 rounded-md">
            Error: {error.message}. Please try again.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask about the video..."
              className="min-h-[60px] resize-none pr-12 py-3 bg-background"
              maxLength={500}
              disabled={isLoading || isLoadingHistory}
            />
            <div className="absolute right-3 bottom-3">
              <Button
                type="submit"
                size="icon"
                disabled={isInputEmpty || isLoading || isLoadingHistory}
                className={cn(
                  "h-7 w-7 rounded-full bg-primary",
                  isInputEmpty || isLoading || isLoadingHistory
                    ? "opacity-50"
                    : ""
                )}
              >
                <Send className="h-3.5 w-3.5" />
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </div>

          <div className="text-xs text-center text-muted-foreground">
            <p>AI responses are generated based on the video content</p>
          </div>
        </form>
      </div>
    </div>
  );
}
