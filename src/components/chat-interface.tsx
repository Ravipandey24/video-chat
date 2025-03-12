'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';

interface ChatInterfaceProps {
  apiEndpoint: string;
  initialMessages?: any[];
  contextData?: Record<string, any>;
  placeholder?: string;
  welcomeMessage?: string;
  aiAvatarSrc?: string;
  maxInputLength?: number;
}

export default function ChatInterface({
  apiEndpoint,
  initialMessages = [],
  contextData = {},
  placeholder = 'Type a message...',
  welcomeMessage = 'Hello! How can I help you?',
  aiAvatarSrc = '/ai-avatar.png',
  maxInputLength = 500,
}: ChatInterfaceProps) {
  const { data: session } = useSession();
  const [isInputEmpty, setIsInputEmpty] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Set up chat with API endpoint
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
  } = useChat({
    api: apiEndpoint,
    body: contextData,
    initialMessages,
    onError: (err) => {
      toast.error('Error', {
        description: err.message || 'Failed to send message. Please try again.',
      });
    },
  });

  // Track input emptiness
  useEffect(() => {
    setIsInputEmpty(!input.trim());
  }, [input]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus the input when the component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Handle form submission
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isInputEmpty || isLoading) return;
    handleSubmit(e);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter without Shift
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form && !isInputEmpty && !isLoading) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }
  };

  // Create initials for avatar fallback
  const getUserInitials = () => {
    if (!session?.user?.name) return 'U';
    return session.user.name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages container */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* AI welcome message */}
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8 mt-1">
              <AvatarFallback className="bg-primary/10 text-primary">AI</AvatarFallback>
              <AvatarImage src={aiAvatarSrc} alt="AI Assistant" />
            </Avatar>
            <div className="rounded-lg bg-muted p-3 text-sm">
              {welcomeMessage}
            </div>
          </div>

          {/* Chat messages */}
          {messages.map(message => (
            <div 
              key={message.id} 
              className={cn(
                "flex items-start gap-3",
                message.role === 'user' ? 'justify-end' : ''
              )}
            >
              {message.role === 'assistant' && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback className="bg-primary/10 text-primary">AI</AvatarFallback>
                  <AvatarImage src={aiAvatarSrc} alt="AI Assistant" />
                </Avatar>
              )}
              
              <div 
                className={cn(
                  "rounded-lg p-3 text-sm",
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                {message.content}
              </div>
              
              {message.role === 'user' && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  <AvatarImage src={session?.user?.image || ''} alt={session?.user?.name || 'User'} />
                </Avatar>
              )}
            </div>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </AvatarFallback>
              </Avatar>
              <div className="rounded-lg bg-muted p-3 text-sm">
                Thinking...
              </div>
            </div>
          )}
          
          {/* Invisible element for scrolling to bottom */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input form */}
      <form onSubmit={onSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="min-h-[60px] resize-none pr-12"
              maxLength={maxInputLength}
              disabled={isLoading}
            />
            <div className="absolute right-3 bottom-3">
              <Button 
                type="submit" 
                size="icon" 
                disabled={isInputEmpty || isLoading}
                className={cn(
                  "h-6 w-6 rounded-full",
                  isInputEmpty || isLoading ? "opacity-50" : ""
                )}
              >
                <Send className="h-3 w-3" />
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}