import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChatMessage from "../components/chat/ChatMessage";
import ChatRoomItem from "../components/chat/ChatRoomItem";
import TypingIndicator from "../components/chat/TypingIndicator";
import MessageSkeleton from "../components/chat/MessageSkeleton";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "../components/ui/conversation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Message, MessageContent } from "../components/ui/message";
import { Response } from "../components/ui/response";
import { Separator } from "../components/ui/separator";
import { Textarea } from "../components/ui/textarea";
import { cn } from "../lib/utils";
import {
  ArrowLeft,
  Bot,
  Clock3,
  Loader2,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Trash2,
  User2,
} from "lucide-react";
import {
  IconMicrophone,
  IconPaperclip,
  IconPlus,
  IconSearch,
  IconSend,
  IconWaveSine,
} from "@tabler/icons-react";
import { canAccessChat, getBanReason, isUserBanned } from "../utils/roleUtils";
import "../styles/chat-animations.css";

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
  status?: "sending" | "sent" | "delivered" | "read" | "failed";
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

interface AIMessage {
  id: number;
  session: number;
  message: string;
  is_user_message: boolean;
  message_type: string;
  provider_used?: string;
  timestamp: string;
}

interface AIChatSessionSummary {
  session_id: string;
  title: string;
  message_count: number;
  created_at: string;
  updated_at: string;
  last_message_preview: string;
}

interface TypingStatus {
  id: number;
  chatroom: number;
  user: User;
  is_typing: boolean;
  updated_at: string;
}

type WorkspaceMode = "member" | "ai";
type MobileMemberView = "list" | "chat";
type MobileAiView = "history" | "chat";

interface SmartComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  disabled?: boolean;
  onAttach?: (file: File) => void;
  submitLabel?: string;
}

const SmartComposer: React.FC<SmartComposerProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled = false,
  onAttach,
  submitLabel = "Send",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const syncTextareaHeight = () => {
    if (!textareaRef.current) {
      return;
    }
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  };

  const handleTextareaChange = (nextValue: string) => {
    onChange(nextValue);
    syncTextareaHeight();
    setIsExpanded(nextValue.length > 110 || nextValue.includes("\n"));
  };

  const handleSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!value.trim() || disabled) {
      return;
    }
    onSubmit();
    setIsExpanded(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onAttach) {
      return;
    }
    onAttach(file);
    event.target.value = "";
  };

  return (
    <form className="group/composer w-full" onSubmit={handleSubmit}>
      <input
        ref={fileInputRef}
        type="file"
        className="sr-only"
        onChange={handleFileSelect}
      />

      <div
        className={cn(
          "w-full rounded-3xl border border-slate-200/80 bg-white/95 p-2.5 shadow-[0_16px_34px_rgba(15,23,42,0.08)] backdrop-blur-md transition-[border-radius,box-shadow] duration-200 ease-out dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-[0_14px_34px_rgba(0,0,0,0.3)]",
          isExpanded
            ? "grid [grid-template-columns:1fr] [grid-template-rows:auto_1fr_auto] [grid-template-areas:'header'_'primary'_'footer']"
            : "grid [grid-template-columns:auto_1fr_auto] [grid-template-rows:auto_1fr_auto] [grid-template-areas:'header_header_header'_'leading_primary_trailing'_'._footer_.']",
        )}>
        <div
          className={cn("flex min-h-14 items-center overflow-x-hidden px-1.5", {
            "px-2 py-1 mb-0": isExpanded,
            "-my-2.5": !isExpanded,
          })}
          style={{ gridArea: "primary" }}>
          <div className="max-h-52 flex-1 overflow-auto">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(event) => handleTextareaChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSubmit();
                }
              }}
              disabled={disabled}
              placeholder={placeholder}
              className="min-h-0 resize-none rounded-none border-0 bg-transparent p-0 text-base text-slate-800 placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 dark:text-slate-100 dark:placeholder:text-slate-500"
              rows={1}
            />
          </div>
        </div>

        <div
          className={cn("flex", { hidden: isExpanded })}
          style={{ gridArea: "leading" }}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Add attachments"
                disabled={disabled}>
                <IconPlus className="size-6" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="start"
              className="max-w-xs rounded-2xl p-1.5">
              <DropdownMenuGroup className="space-y-1">
                <DropdownMenuItem
                  className="rounded-md"
                  onClick={() => fileInputRef.current?.click()}>
                  <IconPaperclip size={20} className="opacity-70" />
                  Attach file
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-md">
                  <Sparkles className="size-4 opacity-70" />
                  Smart prompt
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-md">
                  <IconSearch size={20} className="opacity-70" />
                  Quick search
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div
          className="flex items-center gap-2"
          style={{ gridArea: isExpanded ? "footer" : "trailing" }}>
          <div className="ms-auto flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              disabled={disabled}
              aria-label="Record audio message">
              <IconMicrophone className="size-5" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              disabled={disabled}
              aria-label="Audio visualization">
              <IconWaveSine className="size-5" />
            </Button>

            <Button
              type="submit"
              size="icon"
              className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
              disabled={disabled || !value.trim()}
              aria-label={submitLabel}>
              <IconSend className="size-5" />
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("member");

  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [mobileMemberView, setMobileMemberView] =
    useState<MobileMemberView>("list");
  const [mobileAiView, setMobileAiView] = useState<MobileAiView>("history");

  const [aiSessions, setAiSessions] = useState<AIChatSessionSummary[]>([]);
  const [selectedAiSessionId, setSelectedAiSessionId] = useState<string | null>(
    null,
  );
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoadingHistory, setAiLoadingHistory] = useState(false);
  const [aiSending, setAiSending] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [chatProviderLabel, setChatProviderLabel] = useState("auto");

  const memberMessagesEndRef = useRef<HTMLDivElement>(null);
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);
  const memberScrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollMemberRef = useRef(true);
  const searchDebounceRef = useRef<number | null>(null);
  const typingDebounceRef = useRef<number | null>(null);
  const typingStopTimeoutRef = useRef<number | null>(null);
  const typingStateRef = useRef(false);
  const typingRoomRef = useRef<number | null>(null);

  const token = useMemo(() => localStorage.getItem("token"), []);
  const selectedRoomId = selectedRoom?.id ?? null;

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      if (isUserBanned(parsedUser)) {
        const reason = encodeURIComponent(getBanReason(parsedUser));
        navigate(`/contact-admin?reason=${reason}`, { replace: true });
        return;
      }

      if (!canAccessChat(parsedUser)) {
        navigate("/plans", { replace: true });
        return;
      }

      requestNotificationPermission();
      void loadChatRooms();
      void loadAiSessions();
      void loadAiProviderLabel();

      const roomsInterval = setInterval(() => {
        void loadChatRooms();
        void loadAiSessions(true);
      }, 10000);

      return () => clearInterval(roomsInterval);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (!selectedRoomId || workspaceMode !== "member") {
      setMessages([]);
      setOtherUserTyping(false);
      shouldAutoScrollMemberRef.current = true;
      return;
    }

    shouldAutoScrollMemberRef.current = true;

    void loadMessages(selectedRoomId);
    void loadTypingStatuses(selectedRoomId);

    // Avoid unnecessary mark-as-read calls for rooms that already show zero unread.
    if ((selectedRoom?.unread_count ?? 0) > 0) {
      void markAsRead(selectedRoomId);
    }

    const interval = setInterval(() => {
      void loadMessages(selectedRoomId, true);
      void loadTypingStatuses(selectedRoomId);
    }, 5000);

    return () => {
      clearInterval(interval);
      if (typingDebounceRef.current) {
        window.clearTimeout(typingDebounceRef.current);
      }
      if (typingStopTimeoutRef.current) {
        window.clearTimeout(typingStopTimeoutRef.current);
      }
      if (typingStateRef.current && typingRoomRef.current === selectedRoomId) {
        void setTypingState(selectedRoomId, false, true);
      }
      typingStateRef.current = false;
    };
  }, [selectedRoomId, workspaceMode]);

  useEffect(() => {
    if (workspaceMode !== "member") {
      return;
    }

    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    searchDebounceRef.current = window.setTimeout(() => {
      void searchMembers(searchQuery);
    }, 240);

    return () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery, workspaceMode]);

  useEffect(() => {
    if (!selectedAiSessionId) {
      setAiMessages([]);
      return;
    }

    void loadAiHistory(selectedAiSessionId);

    const interval = setInterval(() => {
      void loadAiHistory(selectedAiSessionId, true);
    }, 6000);

    return () => clearInterval(interval);
  }, [selectedAiSessionId]);

  useEffect(() => {
    if (shouldAutoScrollMemberRef.current) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    if (!selectedRoom) {
      setMobileMemberView("list");
    }
  }, [selectedRoom]);

  useEffect(() => {
    if (workspaceMode !== "ai") {
      return;
    }

    setMobileAiView(selectedAiSessionId ? "chat" : "history");
  }, [workspaceMode, selectedAiSessionId]);

  const requestNotificationPermission = () => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  const showNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/logo.png",
        badge: "/logo.png",
      });
    }
  };

  const loadChatRooms = async () => {
    try {
      const response = await fetch("/api/chat/chatrooms/", {
        headers: { Authorization: `Token ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const rooms = Array.isArray(data)
          ? data
          : data.results && Array.isArray(data.results)
            ? data.results
            : [];

        setChatRooms(rooms);

        setSelectedRoom((prevSelected) => {
          if (rooms.length === 0) {
            return null;
          }

          if (!prevSelected) {
            return rooms[0];
          }

          const stillExists = rooms.some((room: ChatRoom) => {
            return room.id === prevSelected.id;
          });

          // Keep previous object reference to avoid retrigger loops when room id is unchanged.
          if (stillExists) {
            return prevSelected;
          }

          return rooms[0];
        });
      }
    } catch (error) {
      console.error("Error loading chat rooms:", error);
      setChatRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (roomId: number, silent = false) => {
    if (!silent) setLoadingMessages(true);

    try {
      const response = await fetch(`/api/chat/messages/?chatroom=${roomId}`, {
        headers: { Authorization: `Token ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const rawMessages = Array.isArray(data) ? data : data.results || [];
        const nextMessages: Message[] = rawMessages.map((message: Message) => {
          if (message.sender.id !== user?.id) {
            return message;
          }

          return {
            ...message,
            status: message.is_read ? "read" : "delivered",
          };
        });

        // Update messages - always update to ensure new messages appear
        setMessages((prevMessages) => {
          if (silent && prevMessages.length > 0) {
            const seenIds = new Set(
              prevMessages
                .map((message) => message.id)
                .filter((id) => Number.isFinite(id) && id > 0),
            );

            const incomingMessage = nextMessages.find(
              (message) =>
                message.id > 0 &&
                !seenIds.has(message.id) &&
                message.sender.id !== user?.id,
            );

            if (incomingMessage) {
              showNotification(
                `${incomingMessage.sender.first_name} ${incomingMessage.sender.last_name}`,
                incomingMessage.content ||
                  incomingMessage.file_name ||
                  "Sent an attachment",
              );
            }
          }

          const unchanged =
            prevMessages.length === nextMessages.length &&
            prevMessages.every((message, index) => {
              const next = nextMessages[index];
              return (
                message.id === next.id &&
                message.is_read === next.is_read &&
                message.content === next.content &&
                message.file_url === next.file_url &&
                message.status === next.status
              );
            });

          return unchanged ? prevMessages : nextMessages;
        });
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  const markAsRead = async (roomId: number) => {
    try {
      await fetch(`/api/chat/chatrooms/${roomId}/mark_as_read/`, {
        method: "POST",
        headers: { Authorization: `Token ${token}` },
      });

      setChatRooms((prevRooms) =>
        prevRooms.map((room) =>
          room.id === roomId ? { ...room, unread_count: 0 } : room,
        ),
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const setTypingState = async (
    roomId: number,
    isTyping: boolean,
    force = false,
  ) => {
    if (
      !force &&
      typingStateRef.current === isTyping &&
      typingRoomRef.current === roomId
    ) {
      return;
    }

    try {
      await fetch("/api/chat/typing/update_status/", {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatroom: roomId,
          is_typing: isTyping,
        }),
      });
      typingStateRef.current = isTyping;
      typingRoomRef.current = roomId;
    } catch (error) {
      console.error("Error updating typing status:", error);
    }
  };

  const loadTypingStatuses = async (roomId: number) => {
    try {
      const response = await fetch(`/api/chat/typing/?chatroom=${roomId}`, {
        headers: { Authorization: `Token ${token}` },
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const statuses: TypingStatus[] = Array.isArray(data)
        ? data
        : data.results && Array.isArray(data.results)
          ? data.results
          : [];

      const otherTyping = statuses.some(
        (statusItem) => statusItem.user.id !== user?.id && statusItem.is_typing,
      );
      setOtherUserTyping(otherTyping);
    } catch (error) {
      console.error("Error loading typing status:", error);
    }
  };

  const handleMemberInputChange = (value: string) => {
    setNewMessage(value);

    if (!selectedRoomId || workspaceMode !== "member") {
      return;
    }

    if (!value.trim()) {
      if (typingDebounceRef.current) {
        window.clearTimeout(typingDebounceRef.current);
      }
      if (typingStopTimeoutRef.current) {
        window.clearTimeout(typingStopTimeoutRef.current);
      }
      void setTypingState(selectedRoomId, false, true);
      return;
    }

    if (typingDebounceRef.current) {
      window.clearTimeout(typingDebounceRef.current);
    }
    typingDebounceRef.current = window.setTimeout(() => {
      void setTypingState(selectedRoomId, true);
    }, 180);

    if (typingStopTimeoutRef.current) {
      window.clearTimeout(typingStopTimeoutRef.current);
    }
    typingStopTimeoutRef.current = window.setTimeout(() => {
      void setTypingState(selectedRoomId, false);
    }, 1400);
  };

  const searchMembers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    try {
      const response = await fetch(
        `/api/chat/members/?search=${encodeURIComponent(query)}`,
        {
          headers: { Authorization: `Token ${token}` },
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setSearchResults(data);
        } else if (data.results && Array.isArray(data.results)) {
          setSearchResults(data.results);
        } else {
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
        setSearchError("Unable to search members right now.");
      }
    } catch (error) {
      console.error("Error searching members:", error);
      setSearchResults([]);
      setSearchError("Unable to search members right now.");
    } finally {
      setSearchLoading(false);
    }
  };

  const startChat = async (userId: number) => {
    try {
      setSearchError(null);
      const response = await fetch("/api/chat/chatrooms/get_or_create/", {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId }),
      });

      if (response.ok) {
        const room = await response.json();
        setSelectedRoom(room);
        setMobileMemberView("chat");
        setSearchQuery("");
        setSearchResults([]);
        void loadChatRooms();
      } else {
        const payload = await response.json().catch(() => null);
        setSearchError(payload?.error || "Unable to open chat with this user.");
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      setSearchError("Unable to open chat with this user.");
    }
  };

  const sendMessage = async (overrideContent?: string) => {
    if (!selectedRoom || sending) return;

    const messageContent = (overrideContent ?? newMessage).trim();
    if (!messageContent) return;

    if (selectedRoomId) {
      void setTypingState(selectedRoomId, false, true);
    }

    // Create temporary message (optimistic update)
    const tempMessage: Message = {
      id: 0,
      tempId: Date.now(),
      sender: user,
      message_type: "text",
      content: messageContent,
      file_url: null,
      file_name: null,
      is_read: false,
      created_at: new Date().toISOString(),
      reactions: [],
      status: "sending",
    };

    // Show message immediately
    setMessages((prev) => [...prev, tempMessage]);
    if (!overrideContent) {
      setNewMessage("");
    }
    setSending(true);

    try {
      const response = await fetch("/api/chat/messages/", {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatroom: selectedRoom.id,
          message_type: "text",
          content: messageContent,
        }),
      });

      if (response.ok) {
        const realMessage = await response.json();
        console.log("Message sent successfully:", realMessage);
        const persistedStatus = realMessage?.is_read ? "read" : "delivered";

        // Replace temp message with real one
        setMessages((prev) =>
          prev.map((m) =>
            m.tempId === tempMessage.tempId
              ? { ...realMessage, status: persistedStatus }
              : m,
          ),
        );

        void loadChatRooms();
      } else {
        const errorData = await response.json();
        console.error("Failed to send message:", response.status, errorData);

        // Mark as failed
        setMessages((prev) =>
          prev.map((m) =>
            m.tempId === tempMessage.tempId ? { ...m, status: "failed" } : m,
          ),
        );

        alert(`Failed to send message: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) =>
        prev.map((m) =>
          m.tempId === tempMessage.tempId ? { ...m, status: "failed" } : m,
        ),
      );
      alert("Network error: Could not send message");
    } finally {
      setSending(false);
    }
  };

  const retryMessage = async (message: Message) => {
    if (!selectedRoom) return;

    // Remove failed message
    setMessages((prev) => prev.filter((m) => m.tempId !== message.tempId));

    // Resend without depending on state update timing
    setTimeout(() => {
      void sendMessage(message.content);
    }, 80);
  };

  const handleFileUpload = async (file: File | null) => {
    if (!file || !selectedRoom) return;

    // Must match backend validation (50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert("File size must be less than 50MB");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("chatroom_id", selectedRoom.id.toString());

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const message = JSON.parse(xhr.responseText);
          setMessages((prev) => [...prev, message]);
          void loadChatRooms();
        } else {
          let errorMessage = "Failed to upload file";
          try {
            const payload = JSON.parse(xhr.responseText);
            if (payload?.error) {
              errorMessage = payload.error;
            }
          } catch {
            // Keep fallback message
          }
          alert(errorMessage);
        }
        setUploading(false);
        setUploadProgress(0);
      });

      xhr.addEventListener("error", () => {
        alert("Failed to upload file");
        setUploading(false);
        setUploadProgress(0);
      });

      xhr.open("POST", "/api/chat/upload-file/");
      xhr.setRequestHeader("Authorization", `Token ${token}`);
      xhr.send(formData);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload file");
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const scrollToBottom = () => {
    memberMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const areAiMessagesEqual = (prev: AIMessage[], next: AIMessage[]) => {
    if (prev.length !== next.length) {
      return false;
    }

    for (let index = 0; index < prev.length; index += 1) {
      const previousMessage = prev[index];
      const nextMessage = next[index];

      if (
        previousMessage.id !== nextMessage.id ||
        previousMessage.message !== nextMessage.message ||
        previousMessage.timestamp !== nextMessage.timestamp ||
        previousMessage.is_user_message !== nextMessage.is_user_message ||
        previousMessage.provider_used !== nextMessage.provider_used
      ) {
        return false;
      }
    }

    return true;
  };

  const handleMemberMessagesScroll = () => {
    const container = memberScrollContainerRef.current;
    if (!container) {
      return;
    }

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldAutoScrollMemberRef.current = distanceFromBottom < 120;
  };

  const loadAiProviderLabel = async () => {
    try {
      const response = await fetch("/api/ai/admin/provider-settings/", {
        headers: { Authorization: `Token ${token}` },
      });
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      setChatProviderLabel(
        data.chat_page_provider || data.general_chat_provider || "auto",
      );
    } catch {
      setChatProviderLabel("auto");
    }
  };

  const loadAiSessions = async (silent = false) => {
    if (!silent) {
      setAiError(null);
    }

    try {
      const response = await fetch("/api/ai/chat/sessions/", {
        headers: { Authorization: `Token ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to load AI chat sessions");
      }

      const data = (await response.json()) as AIChatSessionSummary[];
      const safeSessions = Array.isArray(data) ? data : [];
      setAiSessions(safeSessions);

      if (!selectedAiSessionId && safeSessions.length > 0) {
        setSelectedAiSessionId(safeSessions[0].session_id);
      }
    } catch (error) {
      if (!silent) {
        setAiError(
          error instanceof Error
            ? error.message
            : "Failed to load AI chat sessions",
        );
      }
    }
  };

  const startAiSession = async () => {
    try {
      setAiError(null);
      const response = await fetch("/api/ai/chat/start/", {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to create a new AI chat session");
      }

      const data = await response.json();
      setSelectedAiSessionId(data.session_id);
      setAiMessages([]);
      setAiInput("");
      setMobileAiView("chat");
      void loadAiSessions(true);
    } catch (error) {
      setAiError(
        error instanceof Error
          ? error.message
          : "Failed to create AI chat session",
      );
    }
  };

  const deleteAiSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/ai/chat/session/${sessionId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      if (!response.ok && response.status !== 204) {
        throw new Error("Failed to delete session");
      }

      const remaining = aiSessions.filter(
        (session) => session.session_id !== sessionId,
      );
      setAiSessions(remaining);

      if (selectedAiSessionId === sessionId) {
        setSelectedAiSessionId(
          remaining.length > 0 ? remaining[0].session_id : null,
        );
      }
    } catch (error) {
      setAiError(
        error instanceof Error ? error.message : "Failed to delete session",
      );
    }
  };

  const loadAiHistory = async (sessionId: string, silent = false) => {
    if (!silent) {
      setAiLoadingHistory(true);
    }

    try {
      const response = await fetch(`/api/ai/chat/history/${sessionId}/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load chat history");
      }

      const data = (await response.json()) as AIMessage[];
      const nextAiMessages = Array.isArray(data) ? data : [];
      setAiMessages((prevAiMessages) =>
        areAiMessagesEqual(prevAiMessages, nextAiMessages)
          ? prevAiMessages
          : nextAiMessages,
      );
    } catch (error) {
      if (!silent) {
        setAiError(
          error instanceof Error
            ? error.message
            : "Failed to load chat history",
        );
      }
    } finally {
      if (!silent) {
        setAiLoadingHistory(false);
      }
    }
  };

  const sendAiMessage = async () => {
    const messageContent = aiInput.trim();
    if (!messageContent || aiSending) {
      return;
    }

    setAiError(null);
    setAiSending(true);
    setAiInput("");
    setMobileAiView("chat");

    let targetSessionId = selectedAiSessionId;
    try {
      if (!targetSessionId) {
        const sessionResponse = await fetch("/api/ai/chat/start/", {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
          },
        });

        if (!sessionResponse.ok) {
          throw new Error("Failed to create AI chat session");
        }

        const sessionData = await sessionResponse.json();
        targetSessionId = sessionData.session_id;
        setSelectedAiSessionId(sessionData.session_id);
      }

      const optimisticUserMessage: AIMessage = {
        id: Date.now(),
        session: 0,
        message: messageContent,
        is_user_message: true,
        message_type: "general",
        timestamp: new Date().toISOString(),
      };
      setAiMessages((prev) => [...prev, optimisticUserMessage]);

      const response = await fetch("/api/ai/chat/message/", {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: targetSessionId,
          message: messageContent,
          message_type: "general",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send AI message");
      }

      const assistantMessage: AIMessage = data.ai_message_obj || {
        id: Date.now() + 1,
        session: 0,
        message: data.ai_message || "No response returned",
        is_user_message: false,
        message_type: "general",
        provider_used: data.provider_used || "auto",
        timestamp: new Date().toISOString(),
      };

      setAiMessages((prev) => {
        const cleaned = prev.filter(
          (msg) => msg.id !== optimisticUserMessage.id,
        );
        return [
          ...cleaned,
          data.user_message || optimisticUserMessage,
          assistantMessage,
        ];
      });

      void loadAiSessions(true);
    } catch (error) {
      setAiError(
        error instanceof Error ? error.message : "Failed to send AI message",
      );
      setAiMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          session: 0,
          message:
            "I could not generate a response right now. Please try again in a moment.",
          is_user_message: false,
          message_type: "general",
          provider_used: "fallback",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setAiSending(false);
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const value = new Date(dateString);
    if (Number.isNaN(value.getTime())) {
      return "Unknown";
    }

    const diffMs = Date.now() - value.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return value.toLocaleDateString();
  };

  const openMemberRoom = (room: ChatRoom) => {
    setSelectedRoom(room);
    setMobileMemberView("chat");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
        <div className="flex h-screen items-center justify-center">
          <div className="text-center text-slate-600 dark:text-slate-300">
            <Loader2 className="mx-auto mb-4 h-16 w-16 animate-spin text-emerald-500" />
            <p>Loading chats...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_8%,rgba(59,130,246,0.15),transparent_24%),radial-gradient(circle_at_88%_10%,rgba(14,165,233,0.1),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#edf2ff_55%,#f8fafc_100%)] pb-6 dark:bg-[radial-gradient(circle_at_14%_8%,rgba(59,130,246,0.22),transparent_28%),radial-gradient(circle_at_86%_12%,rgba(14,165,233,0.16),transparent_32%),linear-gradient(180deg,#020617_0%,#0f172a_55%,#020617_100%)]">
      <div className="mx-auto max-w-[1440px] px-3 py-4 sm:px-4 md:px-6">
        <Card className="h-[calc(100dvh-98px)] md:h-[calc(100vh-108px)] border border-slate-200/85 bg-white/95 py-0 text-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/90 dark:text-slate-100 dark:shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          <CardHeader className="border-b border-slate-200 px-4 py-3.5 dark:border-slate-700 md:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl text-slate-900 dark:text-slate-100 md:text-2xl">
                  Communication Hub
                </CardTitle>
                <CardDescription className="mt-1 text-slate-600 dark:text-slate-400">
                  Member conversations and AI assistant in one workspace.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-100/90 p-1.5 dark:border-slate-700 dark:bg-slate-800/80">
                <Button
                  type="button"
                  variant={workspaceMode === "member" ? "default" : "ghost"}
                  className={cn(
                    "h-9 rounded-xl px-4",
                    workspaceMode === "member"
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700/70",
                  )}
                  onClick={() => setWorkspaceMode("member")}>
                  <MessageSquare className="mr-2 size-4" />
                  Member Chat
                </Button>
                <Button
                  type="button"
                  variant={workspaceMode === "ai" ? "default" : "ghost"}
                  className={cn(
                    "h-9 rounded-xl px-4",
                    workspaceMode === "ai"
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700/70",
                  )}
                  onClick={() => setWorkspaceMode("ai")}>
                  <Bot className="mr-2 size-4" />
                  AI Assistant
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="h-[calc(100%-94px)] min-h-0 p-0">
            {workspaceMode === "member" ? (
              <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[360px_1fr]">
                <aside
                  className={cn(
                    "h-full min-h-0 flex-col border-r border-slate-200 bg-slate-50/90 dark:border-slate-700 dark:bg-slate-900/80",
                    selectedRoom && mobileMemberView === "chat"
                      ? "hidden lg:flex"
                      : "flex",
                  )}>
                  <div className="space-y-3 p-4">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
                      <User2 className="size-4" />
                      Member Chats
                    </h2>
                    <div className="relative">
                      <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search members..."
                        className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-emerald-500/70 dark:focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  {searchQuery.trim().length > 0 && (
                    <div className="border-y border-slate-200 bg-slate-100/95 p-2 dark:border-slate-700 dark:bg-slate-900/95">
                      <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Search Results
                      </p>
                      <div className="premium-scrollbar max-h-52 space-y-1 overflow-y-auto">
                        {searchLoading ? (
                          <div className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                            Searching people...
                          </div>
                        ) : searchResults.length > 0 ? (
                          searchResults.map((member) => (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => void startChat(member.id)}
                              className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-left transition-all hover:border-emerald-200 hover:bg-white dark:hover:border-emerald-800/40 dark:hover:bg-slate-800/80">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 font-semibold text-white">
                                {member.first_name?.[0] || member.username[0]}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-100">
                                  {member.first_name} {member.last_name}
                                </p>
                                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                  @{member.username}
                                </p>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            No person found for "{searchQuery.trim()}".
                          </div>
                        )}

                        {searchError && (
                          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                            {searchError}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="premium-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y">
                    {chatRooms.length === 0 ? (
                      <ConversationEmptyState
                        className="text-slate-500 dark:text-slate-400"
                        icon={<MessageSquare className="size-8" />}
                        title="No chats yet"
                        description="Search members and start your first conversation."
                      />
                    ) : (
                      chatRooms.map((room) => (
                        <ChatRoomItem
                          key={room.id}
                          room={room}
                          isSelected={selectedRoom?.id === room.id}
                          onClick={() => openMemberRoom(room)}
                        />
                      ))
                    )}
                  </div>
                </aside>

                <section
                  className={cn(
                    "h-full min-h-0 flex-col bg-slate-100/80 dark:bg-slate-950/70",
                    selectedRoom && mobileMemberView === "chat"
                      ? "flex animate-mobile-pane-in"
                      : "hidden lg:flex",
                  )}>
                  {selectedRoom ? (
                    <>
                      <div className="border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/90 md:px-5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 lg:hidden"
                              onClick={() => setMobileMemberView("list")}
                              aria-label="Back to chat list">
                              <ArrowLeft className="size-4" />
                            </button>
                            <div className="relative">
                              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-bold text-white">
                                {selectedRoom.other_participant
                                  .first_name?.[0] ||
                                  selectedRoom.other_participant.username[0]}
                              </div>
                              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-400 dark:border-slate-900" />
                            </div>
                            <div>
                              <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
                                {selectedRoom.other_participant.first_name}{" "}
                                {selectedRoom.other_participant.last_name}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                @{selectedRoom.other_participant.username}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div
                        ref={memberScrollContainerRef}
                        onScroll={handleMemberMessagesScroll}
                        className="premium-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y bg-[radial-gradient(circle_at_10%_10%,rgba(59,130,246,0.1),transparent_26%),radial-gradient(circle_at_88%_88%,rgba(14,165,233,0.08),transparent_28%),#eef2ff] p-4 dark:bg-[radial-gradient(circle_at_14%_12%,rgba(59,130,246,0.18),transparent_30%),radial-gradient(circle_at_90%_86%,rgba(14,165,233,0.12),transparent_30%),#020617]">
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
                                messages[index - 1].sender.id !==
                                  message.sender.id
                              }
                              onRetry={() => void retryMessage(message)}
                            />
                          ))
                        )}

                        {otherUserTyping && (
                          <TypingIndicator
                            userName={selectedRoom.other_participant.first_name}
                          />
                        )}

                        <div ref={memberMessagesEndRef} />
                      </div>

                      {uploading && (
                        <div className="border-t border-slate-200 bg-white/90 px-4 py-2 dark:border-slate-700 dark:bg-slate-900/90">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="mb-1 flex justify-between text-xs">
                                <span className="font-medium text-slate-700 dark:text-slate-200">
                                  Uploading file...
                                </span>
                                <span className="text-slate-500 dark:text-slate-400">
                                  {Math.round(uploadProgress)}%
                                </span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                                <div
                                  className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="border-t border-slate-200 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-slate-700 dark:bg-slate-900/92 md:px-5 animate-mobile-composer-rise">
                        <SmartComposer
                          value={newMessage}
                          onChange={handleMemberInputChange}
                          onSubmit={sendMessage}
                          onAttach={(file) => void handleFileUpload(file)}
                          disabled={uploading || sending}
                          placeholder="Type a message for your classmate..."
                          submitLabel="Send member message"
                        />
                      </div>
                    </>
                  ) : (
                    <ConversationEmptyState
                      className="h-full text-slate-500 dark:text-slate-400"
                      icon={<MessageSquare className="size-10" />}
                      title="Welcome to SOPAN Chat"
                      description="Select a chat on the left to start messaging."
                    />
                  )}
                </section>
              </div>
            ) : (
              <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[320px_1fr]">
                <aside
                  className={cn(
                    "h-full min-h-0 flex-col border-r border-slate-200 bg-slate-50/90 dark:border-slate-700 dark:bg-slate-900/80",
                    mobileAiView === "chat" ? "hidden lg:flex" : "flex",
                  )}>
                  <div className="space-y-3 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
                        <Clock3 className="size-4" />
                        AI History
                      </h2>
                      <div className="flex items-center gap-2">
                        {selectedAiSessionId && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg border-slate-300 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 lg:hidden"
                            onClick={() => setMobileAiView("chat")}>
                            Open
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
                          onClick={() => void startAiSession()}>
                          <IconPlus className="mr-1 size-4" />
                          New
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      Active provider:{" "}
                      <span className="font-semibold uppercase text-emerald-700 dark:text-emerald-300">
                        {chatProviderLabel}
                      </span>
                    </div>

                    {aiError && (
                      <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200">
                        {aiError}
                      </div>
                    )}
                  </div>

                  <Separator className="bg-slate-200 dark:bg-slate-700" />

                  <div className="premium-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain touch-pan-y px-3 py-3">
                    {aiSessions.length === 0 ? (
                      <ConversationEmptyState
                        className="min-h-40 text-slate-500 dark:text-slate-400"
                        icon={<Bot className="size-8" />}
                        title="No AI history yet"
                        description="Create a new session and your conversations will be saved."
                      />
                    ) : (
                      aiSessions.map((session) => {
                        const isSelected =
                          session.session_id === selectedAiSessionId;
                        return (
                          <Card
                            key={session.session_id}
                            className={cn(
                              "cursor-pointer border border-slate-200 bg-white py-2 transition-all hover:border-emerald-200 hover:bg-emerald-50/40 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-emerald-800/50 dark:hover:bg-slate-700/80",
                              isSelected &&
                                "border-emerald-400/60 bg-emerald-50/60 dark:border-emerald-600/50 dark:bg-emerald-900/20",
                            )}
                            onClick={() => {
                              setSelectedAiSessionId(session.session_id);
                              setMobileAiView("chat");
                            }}>
                            <CardContent className="space-y-2 px-3 py-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <p className="line-clamp-2 text-sm font-medium text-slate-700 dark:text-slate-100">
                                  {session.title}
                                </p>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void deleteAiSession(session.session_id);
                                  }}
                                  className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-500 dark:hover:bg-slate-700"
                                  title="Delete history">
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                              <p className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                                {session.last_message_preview ||
                                  "No messages yet"}
                              </p>
                              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                <span>{session.message_count} msgs</span>
                                <span>
                                  {formatRelativeTime(session.updated_at)}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </aside>

                <section
                  className={cn(
                    "h-full min-h-0 flex-col bg-slate-100/80 dark:bg-slate-950/70",
                    mobileAiView === "chat"
                      ? "flex animate-mobile-pane-in"
                      : "hidden lg:flex",
                  )}>
                  <div className="border-b border-slate-200 bg-white/95 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/90 md:px-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 lg:hidden"
                          onClick={() => setMobileAiView("history")}
                          aria-label="Back to AI history">
                          <ArrowLeft className="size-4" />
                        </button>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                          <Bot className="size-5" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
                            AI Chat Assistant
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Provider routing: {chatProviderLabel}
                          </p>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        onClick={() => {
                          if (selectedAiSessionId) {
                            void loadAiHistory(selectedAiSessionId);
                          }
                        }}>
                        <RefreshCw className="mr-2 size-4" />
                        Refresh
                      </Button>
                    </div>
                  </div>

                  <Conversation className="premium-scrollbar min-h-0 overscroll-contain touch-pan-y bg-[radial-gradient(circle_at_12%_10%,rgba(59,130,246,0.1),transparent_26%),radial-gradient(circle_at_85%_85%,rgba(14,165,233,0.08),transparent_28%),#eef2ff] dark:bg-[radial-gradient(circle_at_12%_10%,rgba(59,130,246,0.2),transparent_30%),radial-gradient(circle_at_86%_84%,rgba(14,165,233,0.14),transparent_30%),#020617]">
                    <ConversationContent className="space-y-3 p-4 md:p-5">
                      {aiLoadingHistory ? (
                        <div className="flex items-center justify-center py-10 text-slate-500 dark:text-slate-400">
                          <Loader2 className="mr-2 size-5 animate-spin" />
                          Loading history...
                        </div>
                      ) : aiMessages.length === 0 ? (
                        <ConversationEmptyState
                          icon={<Sparkles className="size-8" />}
                          title="Ask anything"
                          description="Your AI conversations are saved and can be reopened from history."
                        />
                      ) : (
                        aiMessages.map((message) => {
                          const from = message.is_user_message
                            ? "user"
                            : "assistant";
                          return (
                            <Message key={message.id} from={from}>
                              <MessageContent
                                variant={
                                  message.is_user_message ? "contained" : "flat"
                                }
                                className={cn(
                                  message.is_user_message
                                    ? "max-w-[84%] rounded-2xl rounded-br-sm border border-emerald-200/80 bg-[linear-gradient(135deg,#E6FBF2_0%,#D4F7EA_48%,#BFF0DE_100%)] px-4 py-3 text-emerald-950 shadow-[0_8px_18px_rgba(16,185,129,0.14)] dark:border-emerald-500/45 dark:bg-[linear-gradient(135deg,#0D3B2C_0%,#145840_58%,#1A7754_100%)] dark:text-emerald-50"
                                    : "max-w-[92%] rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100",
                                )}>
                                {message.is_user_message ? (
                                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                    {message.message}
                                  </p>
                                ) : (
                                  <Response className="prose prose-invert max-w-none text-sm leading-relaxed">
                                    {message.message}
                                  </Response>
                                )}

                                <div className="mt-2 flex items-center justify-between gap-3 text-[11px] opacity-80">
                                  <span>
                                    {formatRelativeTime(message.timestamp)}
                                  </span>
                                  {!message.is_user_message && (
                                    <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 uppercase tracking-wide text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                      {message.provider_used || "auto"}
                                    </span>
                                  )}
                                </div>
                              </MessageContent>
                            </Message>
                          );
                        })
                      )}

                      <div ref={aiMessagesEndRef} />
                    </ConversationContent>
                    <ConversationScrollButton />
                  </Conversation>

                  <div className="border-t border-slate-200 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-slate-700 dark:bg-slate-900/92 md:px-5 animate-mobile-composer-rise">
                    <SmartComposer
                      value={aiInput}
                      onChange={setAiInput}
                      onSubmit={sendAiMessage}
                      onAttach={() => {
                        setAiError(
                          "File upload for AI chat will be added in the next iteration.",
                        );
                      }}
                      disabled={aiSending}
                      placeholder="Ask AI about lessons, homework, exam prep, or notes..."
                      submitLabel="Send AI message"
                    />
                  </div>
                </section>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Chat;
