import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ChatMessage from '../components/chat/ChatMessage';
import ChatRoomItem from '../components/chat/ChatRoomItem';
import TypingIndicator from '../components/chat/TypingIndicator';
import MessageSkeleton from '../components/chat/MessageSkeleton';
import '../styles/chat-animations.css';

interface User {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_picture: string | null;
    is_member: boolean;
}

interface Message {
    id: number;
    sender: User;
    message_type: string;
    content: string;
    file_url: string | null;
    file_name: string | null;
    is_read: boolean;
    created_at: string;
    reactions: any[];
    status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
    tempId?: number;
    drive_file_id?: string;
    drive_view_link?: string;
    drive_download_link?: string;
    file_size?: number;
}

interface ChatRoom {
    id: number;
    other_participant: User;
    last_message: Message | null;
    unread_count: number;
    updated_at: string;
}

const Chat: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);

            if (!parsedUser.is_member) {
                alert('You need member access to use chat');
                navigate('/dashboard');
                return;
            }

            requestNotificationPermission();
            loadChatRooms();
        } else {
            navigate('/login');
        }
    }, [navigate]);

    useEffect(() => {
        if (selectedRoom) {
            loadMessages(selectedRoom.id);
            markAsRead(selectedRoom.id);

            // Poll for new messages every 10 seconds (reduced from 5 to save connections)
            const interval = setInterval(() => {
                loadMessages(selectedRoom.id, true);
            }, 10000);

            return () => clearInterval(interval);
        }
    }, [selectedRoom]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const requestNotificationPermission = () => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    };

    const showNotification = (title: string, body: string) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body,
                icon: '/logo.png',
                badge: '/logo.png'
            });
        }
    };

    const loadChatRooms = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/chat/chatrooms/', {
                headers: { 'Authorization': `Token ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    setChatRooms(data);
                } else if (data.results && Array.isArray(data.results)) {
                    setChatRooms(data.results);
                } else {
                    setChatRooms([]);
                }
            }
        } catch (error) {
            console.error('Error loading chat rooms:', error);
            setChatRooms([]);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (roomId: number, silent = false) => {
        if (!silent) setLoadingMessages(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/chat/messages/?chatroom=${roomId}`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const newMessages = Array.isArray(data) ? data : (data.results || []);

                // Only update if messages changed (avoid unnecessary re-renders)
                if (JSON.stringify(newMessages) !== JSON.stringify(messages)) {
                    setMessages(newMessages);

                    // Show notification for new messages
                    if (silent && newMessages.length > messages.length) {
                        const latestMessage = newMessages[newMessages.length - 1];
                        if (latestMessage.sender.id !== user?.id) {
                            showNotification(
                                `${latestMessage.sender.first_name} ${latestMessage.sender.last_name}`,
                                latestMessage.content
                            );
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            if (!silent) setLoadingMessages(false);
        }
    };

    const markAsRead = async (roomId: number) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/chat/chatrooms/${roomId}/mark_as_read/`, {
                method: 'POST',
                headers: { 'Authorization': `Token ${token}` }
            });
            loadChatRooms();
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const searchMembers = async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/chat/members/?search=${query}`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    setSearchResults(data);
                } else if (data.results && Array.isArray(data.results)) {
                    setSearchResults(data.results);
                } else {
                    setSearchResults([]);
                }
            }
        } catch (error) {
            console.error('Error searching members:', error);
            setSearchResults([]);
        }
    };

    const startChat = async (userId: number) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/chat/chatrooms/get_or_create/', {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user_id: userId })
            });

            if (response.ok) {
                const room = await response.json();
                setSelectedRoom(room);
                setSearchQuery('');
                setSearchResults([]);
                loadChatRooms();
            }
        } catch (error) {
            console.error('Error starting chat:', error);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedRoom || sending) return;

        const messageContent = newMessage.trim();

        // Create temporary message (optimistic update)
        const tempMessage: Message = {
            id: 0,
            tempId: Date.now(),
            sender: user,
            message_type: 'text',
            content: messageContent,
            file_url: null,
            file_name: null,
            is_read: false,
            created_at: new Date().toISOString(),
            reactions: [],
            status: 'sending'
        };

        // Show message immediately
        setMessages(prev => [...prev, tempMessage]);
        setNewMessage('');
        setSending(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/chat/messages/', {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chatroom: selectedRoom.id,
                    message_type: 'text',
                    content: messageContent
                })
            });

            if (response.ok) {
                const realMessage = await response.json();

                // Replace temp message with real one
                setMessages(prev => prev.map(m =>
                    m.tempId === tempMessage.tempId
                        ? { ...realMessage, status: 'sent' }
                        : m
                ));

                loadChatRooms();
            } else {
                // Mark as failed
                setMessages(prev => prev.map(m =>
                    m.tempId === tempMessage.tempId
                        ? { ...m, status: 'failed' }
                        : m
                ));
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => prev.map(m =>
                m.tempId === tempMessage.tempId
                    ? { ...m, status: 'failed' }
                    : m
            ));
        } finally {
            setSending(false);
        }
    };

    const retryMessage = async (message: Message) => {
        if (!selectedRoom) return;

        // Remove failed message
        setMessages(prev => prev.filter(m => m.tempId !== message.tempId));

        // Resend
        setNewMessage(message.content);
        setTimeout(() => sendMessage(), 100);
    };

    const handleTyping = () => {
        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set typing indicator
        setIsTyping(true);

        // Stop typing after 2 seconds
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
        }, 2000);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !selectedRoom) return;

        // Check file size (max 100MB)
        if (file.size > 100 * 1024 * 1024) {
            alert('File size must be less than 100MB');
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('chatroom', selectedRoom.id.toString());

            const token = localStorage.getItem('token');
            const xhr = new XMLHttpRequest();

            // Track upload progress
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const progress = (e.loaded / e.total) * 100;
                    setUploadProgress(progress);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    const message = JSON.parse(xhr.responseText);
                    setMessages(prev => [...prev, message]);
                    loadChatRooms();
                } else {
                    alert('Failed to upload file');
                }
                setUploading(false);
                setUploadProgress(0);
            });

            xhr.addEventListener('error', () => {
                alert('Failed to upload file');
                setUploading(false);
                setUploadProgress(0);
            });

            xhr.open('POST', '/api/chat/upload-file/');
            xhr.setRequestHeader('Authorization', `Token ${token}`);
            xhr.send(formData);

        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload file');
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Navbar />
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading chats...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />
            <div className="max-w-7xl mx-auto py-6 px-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden" style={{ height: 'calc(100vh - 150px)' }}>
                    <div className="flex h-full">
                        {/* Left Sidebar */}
                        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-800">
                            {/* Header */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <span className="text-3xl">💬</span>
                                    <span>Chats</span>
                                </h2>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        searchMembers(e.target.value);
                                    }}
                                    placeholder="Search members..."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>

                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <div className="p-2 border-b border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-800">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 px-3 mb-2 font-medium">Search Results:</p>
                                    {searchResults.map(member => (
                                        <div
                                            key={member.id}
                                            onClick={() => startChat(member.id)}
                                            className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl cursor-pointer transition-all active-press"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                                                {member.first_name?.[0] || member.username[0]}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {member.first_name} {member.last_name}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">@{member.username}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Chat List */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {chatRooms.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        <div className="text-6xl mb-4">💬</div>
                                        <p className="font-medium mb-2">No chats yet</p>
                                        <p className="text-sm">Search for members to start chatting</p>
                                    </div>
                                ) : (
                                    chatRooms.map(room => (
                                        <ChatRoomItem
                                            key={room.id}
                                            room={room}
                                            isSelected={selectedRoom?.id === room.id}
                                            onClick={() => setSelectedRoom(room)}
                                        />
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Right Content */}
                        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
                            {selectedRoom ? (
                                <>
                                    {/* Chat Header */}
                                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                                        {selectedRoom.other_participant.first_name?.[0] || selectedRoom.other_participant.username[0]}
                                                    </div>
                                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white text-lg">
                                                        {selectedRoom.other_participant.first_name} {selectedRoom.other_participant.last_name}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        @{selectedRoom.other_participant.username}
                                                    </p>
                                                </div>
                                            </div>
                                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                                <span className="text-2xl">⋮</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-gray-50 dark:bg-gray-900">
                                        {loadingMessages ? (
                                            <>
                                                <MessageSkeleton />
                                                <MessageSkeleton />
                                                <MessageSkeleton />
                                            </>
                                        ) : (
                                            messages.map((message, index) => (
                                                <ChatMessage
                                                    key={message.id || message.tempId}
                                                    message={message}
                                                    isOwn={message.sender.id === user?.id}
                                                    showAvatar={
                                                        index === 0 ||
                                                        messages[index - 1].sender.id !== message.sender.id
                                                    }
                                                    onRetry={() => retryMessage(message)}
                                                />
                                            ))
                                        )}

                                        {isTyping && (
                                            <TypingIndicator userName={selectedRoom.other_participant.first_name} />
                                        )}

                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Upload Progress */}
                                    {uploading && (
                                        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1">
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="text-blue-600 dark:text-blue-400 font-medium">Uploading...</span>
                                                        <span className="text-blue-600 dark:text-blue-400">{Math.round(uploadProgress)}%</span>
                                                    </div>
                                                    <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                                                        <div
                                                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                                            style={{ width: `${uploadProgress}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Message Input */}
                                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileUpload}
                                                className="hidden"
                                                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
                                            />
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploading}
                                                className="p-3 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all disabled:opacity-50 active-press"
                                                title="Attach file"
                                            >
                                                <span className="text-xl">📎</span>
                                            </button>
                                            <input
                                                type="text"
                                                value={newMessage}
                                                onChange={(e) => {
                                                    setNewMessage(e.target.value);
                                                    handleTyping();
                                                }}
                                                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                                placeholder="Type a message..."
                                                disabled={uploading}
                                                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                                            />
                                            <button
                                                onClick={sendMessage}
                                                disabled={!newMessage.trim() || sending || uploading}
                                                className={`px-6 py-3 rounded-xl text-white font-medium transition-all active-press ${newMessage.trim() && !sending && !uploading
                                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl'
                                                    : 'bg-gray-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                {sending ? '⏱️' : '📤'}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                                    <div className="text-center">
                                        <div className="text-8xl mb-6 animate-bounce">💬</div>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                            Welcome to MedhaBangla Chat
                                        </h3>
                                        <p className="text-gray-500 dark:text-gray-400 max-w-md">
                                            Select a chat from the sidebar or search for members to start a new conversation
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;
