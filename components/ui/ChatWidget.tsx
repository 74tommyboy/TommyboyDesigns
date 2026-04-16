'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

type Message = { role: 'user' | 'assistant'; content: string }

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm Tommy's Assistant. Ask me anything about our bourbon bottle tags, shipping, or returns.",
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  async function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const userMessage: Message = { role: 'user', content: trimmed }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setIsLoading(true)

    // Add empty assistant message to stream into
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!response.ok || !response.body) throw new Error('Request failed')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        assistantText += chunk
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: assistantText },
        ])
      }
    } catch {
      setMessages(prev => [
        ...prev.slice(0, -1),
        {
          role: 'assistant',
          content: "Sorry, I'm having trouble connecting right now. Please try again or visit our contact page.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="w-[350px] flex flex-col rounded-xl border border-amber-bourbon/20 bg-navy-950 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-navy-900 border-b border-amber-bourbon/20">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-bourbon animate-pulse" />
              <span className="font-bebas text-amber-bourbon tracking-wider text-lg">
                Tommy's Assistant
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-steel-400 hover:text-white transition-colors"
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[380px] min-h-[200px]">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  'max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'ml-auto bg-amber-bourbon text-navy-950 font-medium'
                    : 'bg-navy-800 text-steel-200'
                )}
              >
                {msg.content || (
                  <span className="flex gap-1 items-center h-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-steel-400 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-steel-400 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-steel-400 animate-bounce [animation-delay:300ms]" />
                  </span>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-3 border-t border-amber-bourbon/20 bg-navy-900">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Ask about our tags..."
              className="flex-1 bg-navy-800 text-steel-200 placeholder-steel-500 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-amber-bourbon/50 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="p-2 rounded-lg bg-amber-bourbon text-navy-950 hover:bg-amber-bourbon/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={cn(
          'w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200',
          isOpen
            ? 'bg-navy-800 text-steel-300 hover:bg-navy-700'
            : 'bg-amber-bourbon text-navy-950 hover:bg-amber-bourbon/90'
        )}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  )
}
