'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
    Send,
    Paperclip,
    MoreVertical,
    Phone,
    Video,
    Check,
    CheckCheck,
    DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Header } from '@/components/layout';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

interface Message {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
    status?: 'sent' | 'delivered' | 'read';
}

interface Conversation {
    id: string;
    name: string;
    avatar: string | null;
    lastMessage: string;
    time: string;
    unread: number;
    messages?: Message[];
}

export default function MessagesClient() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [showMobileList, setShowMobileList] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);

    // Auto-scroll ref
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch Conversations
    useEffect(() => {
        async function fetchConversations() {
            try {
                const res = await fetch('/api/messages');
                if (res.ok) {
                    const data = await res.json();
                    setConversations(data.conversations || []);
                    if (data.conversations.length > 0 && !selectedConversation) {
                        setSelectedConversation(data.conversations[0]);
                    }
                }
            } catch (error) {
                console.error('Failed to load conversations', error);
            }
        }
        if (user) fetchConversations();
    }, [user]);

    // Fetch Messages when conversation selected
    useEffect(() => {
        if (!selectedConversation) return;
        setMessages(selectedConversation.messages || []);
    }, [selectedConversation]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedConversation) return;

        const optimiosticMessage: Message = {
            id: 'temp-' + Date.now(),
            content: messageInput,
            senderId: user?.id || '',
            createdAt: new Date().toISOString(),
            status: 'sent'
        };

        setMessages(prev => [...prev, optimiosticMessage]);
        setMessageInput('');

        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    threadId: selectedConversation.id,
                    content: optimiosticMessage.content
                })
            });

            if (!res.ok) throw new Error('Failed to send');

            // Success - update with real ID if needed, or just leave it
        } catch (error) {
            toast.error('Failed to send message');
            // Remove optimistic message or show error state
        }
    };

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        const today = new Date();
        if (date.toDateString() === today.toDateString()) return 'Today';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
                    <p className="mt-1 text-muted-foreground">
                        Chat with your coaches and manage bookings
                    </p>
                </div>

                <div className="overflow-hidden rounded-2xl border bg-card shadow-premium">
                    <div className="flex h-[calc(100vh-280px)] min-h-[500px]">
                        {/* Conversation List */}
                        <div className={cn('w-full border-r md:w-80 md:block', !showMobileList && 'hidden md:block')}>
                            <div className="border-b p-4">
                                <Input placeholder="Search conversations..." />
                            </div>
                            <ScrollArea className="h-[calc(100%-60px)]">
                                {conversations.length === 0 && <div className="p-4 text-center text-muted-foreground">No conversations yet</div>}
                                {conversations.map((conv) => (
                                    <button
                                        key={conv.id}
                                        onClick={() => {
                                            setSelectedConversation(conv);
                                            setShowMobileList(false);
                                        }}
                                        className={cn(
                                            'flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50',
                                            selectedConversation?.id === conv.id && 'bg-muted'
                                        )}
                                    >
                                        <div className="relative">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={conv.avatar || undefined} />
                                                <AvatarFallback>{conv.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            {conv.unread > 0 && (
                                                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                                                    {conv.unread}
                                                </span>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="truncate font-semibold">{conv.name}</p>
                                                <span className="shrink-0 text-xs text-muted-foreground">
                                                    {formatDate(conv.time)}
                                                </span>
                                            </div>
                                            <p className="mt-1 truncate text-sm text-muted-foreground">
                                                {conv.lastMessage}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </ScrollArea>
                        </div>

                        {/* Message Thread */}
                        <div className={cn('flex flex-1 flex-col', showMobileList && 'hidden md:flex')}>
                            {selectedConversation ? (
                                <>
                                    {/* Thread Header */}
                                    <div className="flex items-center justify-between border-b p-4">
                                        <div className="flex items-center gap-3">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="md:hidden"
                                                onClick={() => setShowMobileList(true)}
                                            >
                                                ←
                                            </Button>
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={selectedConversation.avatar || undefined} />
                                                <AvatarFallback>{selectedConversation.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold">{selectedConversation.name}</p>
                                                <p className="text-xs text-muted-foreground">Online</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon"><Phone className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon"><Video className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    <ScrollArea className="flex-1 p-4">
                                        <div className="space-y-4" ref={scrollRef}>
                                            {messages.length === 0 && (
                                                <div className="text-center text-muted-foreground py-10">
                                                    Start the conversation!
                                                </div>
                                            )}
                                            {messages.map((message) => {
                                                const isOwn = message.senderId === user?.id;
                                                return (
                                                    <div key={message.id} className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
                                                        <div className={cn(
                                                            'max-w-[75%] rounded-2xl px-4 py-2.5',
                                                            isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                                        )}>
                                                            <p className="text-sm">{message.content}</p>
                                                            <div className={cn(
                                                                'mt-1 flex items-center justify-end gap-1 text-xs',
                                                                isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                                            )}>
                                                                <span>{formatTime(message.createdAt)}</span>
                                                                {isOwn && message.status === 'sent' && <Check className="h-3 w-3" />}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </ScrollArea>

                                    {/* Message Input */}
                                    <div className="border-t p-4">
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="icon" className="shrink-0">
                                                <Paperclip className="h-5 w-5" />
                                            </Button>
                                            <Input
                                                value={messageInput}
                                                onChange={(e) => setMessageInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                                placeholder="Type a message..."
                                                className="flex-1"
                                            />
                                            <Button size="icon" className="shrink-0 rounded-xl" onClick={handleSendMessage} disabled={!messageInput.trim()}>
                                                <Send className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground">
                                    Select a conversation to start messaging
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
