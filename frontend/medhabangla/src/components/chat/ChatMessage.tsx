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
  message_type: string;
  content: string;
  file_url: string | null;
  file_name: string | null;
  file_size?: number;
  is_read: boolean;
  created_at: string;
  drive_download_link?: string | null;
  drive_view_link?: string | null;
  status?: "sending" | "sent" | "delivered" | "read" | "failed";
  tempId?: number;
}

interface ChatMessageProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  onRetry?: () => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isOwn,
  showAvatar,
  onRetry,
}) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = () => {
    if (!isOwn || !message.status) return null;

    switch (message.status) {
      case "sending":
        return <span className="text-xs ml-1 opacity-70">◷</span>;
      case "sent":
        return <span className="text-xs ml-1 opacity-70">✓</span>;
      case "delivered":
        return <span className="text-xs ml-1 opacity-70">✓✓</span>;
      case "read":
        return <span className="text-xs ml-1 text-sky-300">✓✓</span>;
      case "failed":
        return (
          <button
            onClick={onRetry}
            className="text-xs ml-1 text-red-300 hover:text-red-200"
            title="Tap to retry">
            ⚠️
          </button>
        );
      default:
        return null;
    }
  };

  const formatFileSize = (size?: number) => {
    if (!size || size <= 0) {
      return "";
    }

    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderMessageBody = () => {
    const downloadHref =
      message.drive_download_link ||
      message.drive_view_link ||
      message.file_url;

    if (message.message_type === "image" && message.file_url) {
      return (
        <div className="space-y-2">
          <a
            href={downloadHref || message.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-xl border border-white/20">
            <img
              src={message.file_url}
              alt={message.file_name || "Image"}
              className="max-h-80 w-full object-cover"
              loading="lazy"
            />
          </a>
          {message.content && (
            <p className="break-words whitespace-pre-wrap text-sm leading-relaxed">
              {message.content}
            </p>
          )}
        </div>
      );
    }

    if (message.message_type === "video" && message.file_url) {
      return (
        <div className="space-y-2">
          <video
            className="max-h-80 w-full rounded-xl border border-white/20"
            controls
            preload="metadata"
            src={message.file_url}
          />
          {message.content && (
            <p className="break-words whitespace-pre-wrap text-sm leading-relaxed">
              {message.content}
            </p>
          )}
        </div>
      );
    }

    if (
      (message.message_type === "file" || message.message_type === "voice") &&
      downloadHref
    ) {
      return (
        <a
          href={downloadHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl border border-white/20 bg-black/10 px-3 py-2 transition hover:bg-black/20">
          <span className="text-lg">📎</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {message.file_name || "Attachment"}
            </p>
            {message.file_size ? (
              <p className="text-xs opacity-80">
                {formatFileSize(message.file_size)}
              </p>
            ) : null}
          </div>
        </a>
      );
    }

    return (
      <p className="break-words whitespace-pre-wrap text-sm leading-relaxed">
        {message.content}
      </p>
    );
  };

  return (
    <div
      className={`flex items-end gap-2 mb-4 animate-fadeIn ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      {showAvatar && !isOwn && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-white text-sm font-semibold shadow-md">
          {message.sender.first_name?.[0] || message.sender.username[0]}
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={`group relative max-w-[82%] md:max-w-[72%] ${isOwn ? "ml-auto" : "mr-auto"}`}>
        {/* Message Content */}
        <div
          className={`relative rounded-2xl px-4 py-2 shadow-sm ${
            isOwn
              ? "rounded-br-sm border border-emerald-200/70 bg-[#DCF8C6] text-slate-900 dark:border-emerald-700/60 dark:bg-emerald-800 dark:text-emerald-50"
              : "rounded-bl-sm border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          }`}>
          {/* Sender Name (for received messages) */}
          {!isOwn && (
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1">
              {message.sender.first_name} {message.sender.last_name}
            </p>
          )}

          {renderMessageBody()}

          {/* Time and Status */}
          <div
            className={`flex items-center justify-end gap-1 mt-1 ${
              isOwn
                ? "text-emerald-900/60 dark:text-emerald-100/75"
                : "text-slate-500 dark:text-slate-400"
            }`}>
            <span className="text-xs opacity-75">
              {formatTime(message.created_at)}
            </span>
            {getStatusIcon()}
          </div>
        </div>

        {/* Hover Actions */}
        <div className="absolute -top-8 right-0 hidden gap-1 rounded-lg bg-white px-2 py-1 shadow-lg transition-opacity duration-200 group-hover:opacity-100 dark:bg-slate-800 md:flex md:opacity-0">
          <button
            className="text-gray-600 dark:text-gray-300 hover:text-emerald-500 text-sm"
            title="Reply">
            ↩️
          </button>
          <button
            className="text-gray-600 dark:text-gray-300 hover:text-yellow-500 text-sm"
            title="React">
            😊
          </button>
          <button
            className="text-gray-600 dark:text-gray-300 hover:text-red-500 text-sm"
            title="Delete">
            🗑️
          </button>
        </div>
      </div>

      {/* Spacer for own messages */}
      {showAvatar && isOwn && <div className="w-8"></div>}
    </div>
  );
};

export default ChatMessage;
