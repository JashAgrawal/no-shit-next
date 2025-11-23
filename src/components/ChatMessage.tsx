import { AgentBadge } from './AgentBadge';
import { RotateCw, Download } from 'lucide-react';
import Markdown from 'react-markdown'
import { Message } from '../stores/chatStore';
import { Button } from '@/components/ui/button';


interface ChatMessageProps {
  message: Message;
  onResend?: (content: string) => void;
  isResending?: boolean;
}

export function ChatMessage({ message, onResend, isResending }: ChatMessageProps) {
  return (
    <div
      className={`font-mono text-sm border-l-2 pl-4 py-2 ${
        message.role === 'user'
          ? 'border-accent text-accent'
          : 'border-primary text-foreground'
      }`}
    >
      <div className="flex items-center gap-2 mb-2 justify-between">
        <div className="flex items-center gap-2">
          <div className="text-xs opacity-60">
            {message.role === 'user' ? '> USER' : message.agentId === 'oracle' ? '> ORACLE' : '> AGENT'}
          </div>
          {message.role === 'assistant' && message.agentId && (
            <AgentBadge agentId={message.agentId} />
          )}
        </div>
        {message.role === 'user' && onResend && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onResend(message.content)}
            disabled={isResending}
            className="h-6 px-2 text-xs opacity-60 hover:opacity-100"
          >
            <RotateCw className={`h-3 w-3 ${isResending ? 'animate-spin' : ''}`} />
            <span className="ml-1">Resend</span>
          </Button>
        )}
      </div>
      <div className="whitespace-pre-wrap">
        <Markdown
          components={{
            img: ({node, ...props}) => (
              <div className="relative group inline-block my-2">
                <img {...props} className="max-w-full rounded-lg border border-border" />
                <a 
                  href={props.src as string} 
                  download="generated-image.png" 
                  className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                  title="Download"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download size={16} />
                </a>
              </div>
            )
          }}
        >
          {message.content}
        </Markdown>
      </div>
    </div>
  );
}
