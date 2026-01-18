'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
    Send,
    Paperclip,
    MoreVertical,
    Phone,
    Video,
    Check,
    CheckCheck,
    Clock,
    DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/layout';
import { conversations, messages, coaches, currentUser } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export default function MessagesPage() {
    const [selectedConversation, setSelectedConversation] = useState(conversations[0]);
    const [messageInput, setMessageInput] = useState('');
    const [showMobileList, setShowMobileList] = useState(true);

    const conversationMessages = messages[selectedConversation.id] || [];
    const otherParticipant = coaches.find((c) => c.id === selectedConversation.participantId);

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'sent':
                return <Check className="h-3 w-3 text-muted-foreground" />;
            case 'delivered':
                return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
            case 'read':
                return <CheckCheck className="h-3 w-3 text-primary" />;
            default:
                return null;
        }
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
                        <div
                            className={cn(
                                'w-full border-r md:w-80 md:block',
                                !showMobileList && 'hidden md:block'
                            )}
                        >
                            <div className="border-b p-4">
                                <Input placeholder="Search conversations..." />
                            </div>
                            <ScrollArea className="h-[calc(100%-60px)]">
                                {conversations.map((conv) => (
                                    <button
                                        key={conv.id}
                                        onClick={() => {
                                            setSelectedConversation(conv);
                                            setShowMobileList(false);
                                        }}
                                        className={cn(
                                            'flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50',
                                            selectedConversation.id === conv.id && 'bg-muted'
                                        )}
                                    >
                                        <div className="relative">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={conv.participantAvatar} />
                                                <AvatarFallback>
                                                    {conv.participantName.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            {conv.unreadCount > 0 && (
                                                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                                                    {conv.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="truncate font-semibold">
                                                    {conv.participantName}
                                                </p>
                                                <span className="shrink-0 text-xs text-muted-foreground">
                                                    {formatDate(conv.lastMessageTime)}
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
                        <div
                            className={cn(
                                'flex flex-1 flex-col',
                                showMobileList && 'hidden md:flex'
                            )}
                        >
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
                                        <AvatarImage src={selectedConversation.participantAvatar} />
                                        <AvatarFallback>
                                            {selectedConversation.participantName.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">
                                            {selectedConversation.participantName}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {otherParticipant?.responseTime || 'Online'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon">
                                        <Phone className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon">
                                        <Video className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Messages */}
                            <ScrollArea className="flex-1 p-4">
                                <div className="space-y-4">
                                    {conversationMessages.map((message, index) => {
                                        const isOwn = message.senderId === currentUser.id;
                                        const showDate =
                                            index === 0 ||
                                            formatDate(message.timestamp) !==
                                            formatDate(conversationMessages[index - 1].timestamp);

                                        return (
                                            <div key={message.id}>
                                                {showDate && (
                                                    <div className="my-4 flex items-center justify-center">
                                                        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                                                            {formatDate(message.timestamp)}
                                                        </span>
                                                    </div>
                                                )}
                                                <div
                                                    className={cn(
                                                        'flex',
                                                        isOwn ? 'justify-end' : 'justify-start'
                                                    )}
                                                >
                                                    <div
                                                        className={cn(
                                                            'max-w-[75%] rounded-2xl px-4 py-2.5',
                                                            isOwn
                                                                ? 'bg-primary text-primary-foreground'
                                                                : 'bg-muted'
                                                        )}
                                                    >
                                                        <p className="text-sm">{message.content}</p>
                                                        <div
                                                            className={cn(
                                                                'mt-1 flex items-center justify-end gap-1 text-xs',
                                                                isOwn
                                                                    ? 'text-primary-foreground/70'
                                                                    : 'text-muted-foreground'
                                                            )}
                                                        >
                                                            <span>{formatTime(message.timestamp)}</span>
                                                            {isOwn && getStatusIcon(message.status)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </ScrollArea>

                            {/* Offer Card Example (would appear in messages) */}
                            {selectedConversation.id === 'conv2' && (
                                <div className="border-t p-4">
                                    <Card className="rounded-xl bg-accent/50 p-4">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <DollarSign className="h-4 w-4 text-primary" />
                                            Special Offer from Emma
                                        </div>
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            Private Yoga - 75 min @ $95
                                        </p>
                                        <div className="mt-3 flex gap-2">
                                            <Button size="sm" className="rounded-lg">
                                                Accept
                                            </Button>
                                            <Button size="sm" variant="outline" className="rounded-lg">
                                                Decline
                                            </Button>
                                        </div>
                                    </Card>
                                </div>
                            )}

                            {/* Message Input */}
                            <div className="border-t p-4">
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" className="shrink-0">
                                        <Paperclip className="h-5 w-5" />
                                    </Button>
                                    <Input
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1"
                                    />
                                    <Button size="icon" className="shrink-0 rounded-xl" disabled={!messageInput}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
