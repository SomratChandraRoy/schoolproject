import React from "react";

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  profile_picture: string | null;
}

interface Message {
  id: number;
  sender: User;
  content: string;
  message_type?: string;
  file_name?: string | null;
  created_at: string;
}

interface ChatRoom {
  id: number;
  other_participant: User;
  last_message: Message | null;
  unread_count: number;
  updated_at: string;
}

interface ChatRoomItemProps {
  room: ChatRoom;
  isSelected: boolean;
  onClick: () => void;
}

const ChatRoomItem: React.FC<ChatRoomItemProps> = ({
  room,
  isSelected,
  onClick,
}) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-3 border-b border-slate-200/80 p-3.5 transition-all duration-200 dark:border-slate-700/70 ${
        isSelected
          ? "border-l-4 border-l-emerald-500 bg-emerald-50/75 dark:bg-emerald-900/20"
          : "hover:bg-slate-100 dark:hover:bg-slate-800/60"
      }`}>
      {/* Avatar with Online Status */}
      <div className="relative flex-shrink-0">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-base font-semibold text-white shadow-md">
          {room.other_participant.first_name?.[0] ||
            room.other_participant.username[0]}
        </div>
        {/* Online indicator (you can add online status logic) */}
        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-slate-900"></div>
      </div>

      {/* Chat Info */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <h3
            className={`font-semibold truncate ${
              isSelected
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-slate-800 dark:text-slate-100"
            }`}>
            {room.other_participant.first_name}{" "}
            {room.other_participant.last_name}
          </h3>
          <span className="ml-2 flex-shrink-0 text-xs text-slate-500 dark:text-slate-400">
            {room.last_message && formatTime(room.last_message.created_at)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <p
            className={`text-sm truncate ${
              room.unread_count > 0
                ? "font-medium text-slate-900 dark:text-slate-100"
                : "text-slate-500 dark:text-slate-400"
            }`}>
            {room.last_message
              ? room.last_message.message_type &&
                room.last_message.message_type !== "text"
                ? `📎 ${room.last_message.file_name || room.last_message.message_type}`
                : room.last_message.content || "Sent a message"
              : "No messages yet"}
          </p>

          {/* Unread Badge */}
          {room.unread_count > 0 && (
            <div className="ml-2 flex-shrink-0">
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-emerald-600 text-white text-xs font-bold rounded-full animate-pulse">
                {room.unread_count > 99 ? "99+" : room.unread_count}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatRoomItem;
