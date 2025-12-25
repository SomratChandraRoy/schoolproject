// Replace your sendMessage function with this optimized version

const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || sending) return;

    const messageContent = newMessage.trim();

    // Create temporary message that appears instantly
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
        status: 'sending'  // Shows clock icon ⏱️
    };

    // Show message IMMEDIATELY (optimistic update)
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');  // Clear input immediately
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

            // Replace temp message with real one from server
            setMessages(prev => prev.map(m =>
                m.tempId === tempMessage.tempId
                    ? { ...realMessage, status: 'sent' }  // Shows checkmark ✓
                    : m
            ));

            loadChatRooms();  // Update chat list
        } else {
            // Mark message as failed
            setMessages(prev => prev.map(m =>
                m.tempId === tempMessage.tempId
                    ? { ...m, status: 'failed' }  // Shows warning ⚠️
                    : m
            ));
            alert('Failed to send message. Tap to retry.');
        }
    } catch (error) {
        console.error('Error sending message:', error);

        // Mark message as failed
        setMessages(prev => prev.map(m =>
            m.tempId === tempMessage.tempId
                ? { ...m, status: 'failed' }
                : m
        ));
        alert('Failed to send message. Check your connection.');
    } finally {
        setSending(false);
    }
};

// Add this helper component for status icons
const MessageStatusIcon = ({ status }: { status?: 'sending' | 'sent' | 'failed' }) => {
    if (!status) return null;

    switch (status) {
        case 'sending':
            return <span className="text-xs ml-1 opacity-70">⏱️</span>;
        case 'sent':
            return <span className="text-xs ml-1 opacity-70">✓</span>;
        case 'failed':
            return <span className="text-xs ml-1 text-red-300">⚠️</span>;
        default:
            return null;
    }
};

// Update your message display to show status
<div className={`max-w-xs lg:max-w-md ${message.sender.id === user?.id
        ? 'bg-blue-500 text-white'
        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
    } rounded-lg p-3`}>
    <p className="break-words">{message.content}</p>
    <div className="flex items-center justify-between mt-1">
        <p className={`text-xs ${message.sender.id === user?.id
                ? 'text-blue-100'
                : 'text-gray-500 dark:text-gray-400'
            }`}>
            {formatTime(message.created_at)}
        </p>
        {message.sender.id === user?.id && (
            <MessageStatusIcon status={message.status} />
        )}
    </div>
</div>
