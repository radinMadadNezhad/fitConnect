// Types for FitConnect Marketplace

export interface Coach {
    id: string;
    name: string;
    avatar: string;
    gallery: string[];
    bio: string;
    tagline: string;
    specialties: string[];
    certifications: string[];
    location: string;
    languages: string[];
    rating: number;
    reviewCount: number;
    sessionsCompleted: number;
    responseTime: string;
    startingRate: number;
    packages: Package[];
    availability: AvailabilitySlot[];
    verified: boolean;
}

export interface Package {
    id: string;
    title: string;
    duration: number; // minutes
    price: number;
    type: 'online' | 'in-person';
    description: string;
}

export interface AvailabilitySlot {
    day: string;
    slots: string[];
}

export interface Booking {
    id: string;
    coachId: string;
    coachName: string;
    coachAvatar: string;
    clientId: string;
    clientName: string;
    packageId: string;
    packageTitle: string;
    datetime: string;
    status: 'upcoming' | 'completed' | 'cancelled';
    amount: number;
    platformFee: number;
    payoutAmount: number;
}

export interface Message {
    id: string;
    threadId: string;
    senderId: string;
    content: string;
    timestamp: string;
    status: 'sent' | 'delivered' | 'read';
    type: 'text' | 'offer';
    offer?: Package;
}

export interface Conversation {
    id: string;
    participantId: string;
    participantName: string;
    participantAvatar: string;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
}

export interface Review {
    id: string;
    coachId: string;
    clientName: string;
    clientAvatar: string;
    rating: number;
    comment: string;
    date: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    avatar: string;
    role: 'client' | 'coach';
}
