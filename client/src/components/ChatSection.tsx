import React, { useContext, useEffect, useRef, useState } from "react";
import type { AllUser } from "../pages/Chat";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import SelectedUserContext from "../context/SelectedUser";
import SelectedGroupContext from "../context/SelectedGroup";
import AuthContext from "../context/AuthContext";
import { socket } from "../services/socket";
import { FaReply } from "react-icons/fa";
import { IoCloseSharp } from "react-icons/io5";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import FileMessage from "./FileMessage";

interface SeenUser {
  _id: string;
  name: string;
}

export interface Message {
  _id?: string;
  groupId?: string;
  sender: AllUser;
  receiver?: AllUser;
  message: string;
  status: "sent" | "delivered" | "seen";
  read: boolean;
  replyTo?: {
    _id: string;
    message: string;
    sender: AllUser;
  };
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  messageType?: "text" | "file";
  seenBy?: SeenUser[];
  createdAt?: string;
}

const ChatSection: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();

  const { selectedUser } = useContext(SelectedUserContext)!;
  const { selectedGroup } = useContext(SelectedGroupContext)!;
  const { user, logout } = useContext(AuthContext)!;

  const currentUserId = user?.userId || "";

  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isGroupChat = !!selectedGroup && selectedGroup._id === userId;
  const isPrivateChat = !!selectedUser && selectedUser._id === userId;

  // Add Emoji Picker

  const [showPicker, setShowPicker] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setInput((prev) => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  /*
  ============================
  FETCH MESSAGE HISTORY
  ============================
  */

  useEffect(() => {
    if (!userId) return;

    setMessages([]);

    const fetchPrivateMessages = async () => {
      try {
        const res = await api.get(`/chat/messages/${userId}`);
        setMessages(res.data.messages || []);
      } catch (err) {
        console.log(err);
      }
    };

    const fetchGroupMessages = async () => {
      try {
        const res = await api.get(`/group/message/${userId}`);
        setMessages(res.data.messages || res.data || []);
      } catch (err) {
        console.log(err);
      }
    };

    if (isGroupChat) {
      fetchGroupMessages();
    } else if (isPrivateChat) {
      fetchPrivateMessages();
    }
  }, [userId, isGroupChat, isPrivateChat]);

  /*
  ============================
  JOIN / LEAVE GROUP ROOM
  ============================
  */

  useEffect(() => {
    if (!isGroupChat || !userId) return;

    socket.emit("join_group", { groupId: userId });

    socket.emit("mark_group_seen", { groupId: userId });

    return () => {
      socket.emit("leave_group", { groupId: userId });
    };
  }, [userId, isGroupChat]);

  /*
  ============================
  SOCKET LISTENERS
  ============================
  */

  useEffect(() => {
    /*
    PRIVATE MESSAGE RECEIVE
    */
    const handlePrivateMessage = (msg: Message) => {
      if (msg.sender._id === userId || msg.receiver?._id === userId) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    /*
    GROUP MESSAGE RECEIVE
    */
    const handleGroupMessage = (msg: Message) => {
      if (msg.groupId === userId) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    /*
    DELIVERY UPDATE
    */
    const handleDelivered = ({ messageId }: any) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, status: "delivered" } : msg,
        ),
      );
    };

    /*
    PRIVATE SEEN UPDATE
    */
    const handleSeen = ({ seenBy }: any) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.receiver?._id === seenBy
            ? { ...msg, status: "seen", read: true }
            : msg,
        ),
      );
    };

    /*
    GROUP SEEN UPDATE
    */
    const handleGroupSeen = ({ groupId, user }: any) => {
      if (groupId !== userId) return;

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.groupId !== groupId) return msg;

          const alreadySeen = msg.seenBy?.some((u) => u._id === user._id);

          if (alreadySeen) return msg;

          return {
            ...msg,
            seenBy: [...(msg.seenBy || []), user],
          };
        }),
      );
    };

    /*
    TYPING EVENTS
    */
    const handleTyping = ({ senderId }: any) => {
      if (senderId === userId) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = ({ senderId }: any) => {
      if (senderId === userId) {
        setIsTyping(false);
      }
    };

    socket.on("receive_message", handlePrivateMessage);
    socket.on("receive_group_message", handleGroupMessage);
    socket.on("message_delivered", handleDelivered);
    socket.on("messages_seen", handleSeen);
    socket.on("group_seen_update", handleGroupSeen);
    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);

    return () => {
      socket.off("receive_message", handlePrivateMessage);
      socket.off("receive_group_message", handleGroupMessage);
      socket.off("message_delivered", handleDelivered);
      socket.off("messages_seen", handleSeen);
      socket.off("group_seen_update", handleGroupSeen);
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
    };
  }, [userId]);

  /*
  ============================
  SEND MESSAGE
  ============================
  */

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    if (isGroupChat) {
      socket.emit("send_group_message", {
        groupId: userId,
        message: input,
        replyTo: replyMessage?._id || null,
      });
    } else if (isPrivateChat) {
      socket.emit("send_message", {
        receiverId: userId,
        message: input,
        replyTo: replyMessage?._id || null,
      });
    }

    setInput("");
    setReplyMessage(null);
  };

  // Typing event

  let typingTimeout: any;

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);

    socket.emit("typing", { receiverId: userId });

    clearTimeout(typingTimeout);

    typingTimeout = setTimeout(() => {
      socket.emit("stop_typing", {
        receiverId: userId,
      });
    }, 1000);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const chatName = isPrivateChat
    ? selectedUser?.name
    : isGroupChat
      ? selectedGroup?.name
      : "";

  // share files..

  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUser) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("receiverId", selectedUser._id);

    try {
      await api.post("/chat/send-file", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    socket.on("receive_new_message", (message: Message) => {
      console.log("evet receive...", message);
      setMessages((prev) => [...prev, message]);
    });
    return () => {
      socket.off("receive_new_message");
    };
  }, []);

  return (
    <div className="bg-gray-600 h-full w-full flex flex-col">
      {/* HEADER */}

      <div className="px-6 py-3 bg-gray-800 flex justify-between">
        <div>
          <h2 className="text-white text-xl">{chatName}</h2>

          {isTyping && <p className="text-gray-300 text-sm">Typing...</p>}
        </div>

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-1 rounded"
        >
          Logout
        </button>
      </div>

      {/* MESSAGES */}

      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`flex flex-col mb-2 ${
              msg.sender._id === currentUserId ? "items-end" : "items-start"
            }`}
          >
            {msg.replyTo && (
              <div className="bg-gray-200 px-2 py-1 rounded text-xs">
                <b>{msg.replyTo.sender.name}</b>
                <p>{msg.replyTo.message}</p>
              </div>
            )}

            <div className="bg-white px-3 py-2 rounded flex gap-2">
              <p>{msg.message}</p>

              <button
                onClick={() => setReplyMessage(msg)}
                className="text-gray-400 hover:text-blue-500 text-xs"
              >
                <FaReply />
              </button>
            </div>

            {msg.messageType === "file" && <FileMessage message={msg} />}

            <span className="text-xs text-gray-400 mt-1">
              {msg.createdAt &&
                new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
            </span>

            {/* GROUP SENDER NAME */}
            {isGroupChat && msg.sender._id !== currentUserId && (
              <span className="text-xs text-gray-300">
                By {msg.sender.name}
              </span>
            )}

            {/* GROUP SEEN */}
            {isGroupChat &&
              msg.sender._id === currentUserId &&
              (msg.seenBy ?? []).length > 0 && (
                <span className="text-xs text-gray-300">
                  Seen by: {(msg.seenBy ?? []).map((u) => u.name).join(", ")}
                </span>
              )}

            {/* PRIVATE STATUS */}
            {isPrivateChat && msg.sender._id === currentUserId && (
              <span className="text-xs text-gray-300">{msg.status}</span>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}

      <form onSubmit={sendMessage} className="p-3 bg-white flex flex-col gap-2">
        {replyMessage && (
          <div className="bg-gray-100 p-2 rounded flex justify-between items-center mb-2">
            <div>
              <p className="text-xs text-gray-500">
                Replying to {replyMessage.sender.name}
              </p>

              <p className="text-sm truncate max-w-xs">
                {replyMessage.message}
              </p>
            </div>

            <button
              onClick={() => setReplyMessage(null)}
              className="text-red-500 text-xs"
            >
              <IoCloseSharp size={"24px"} />
            </button>
          </div>
        )}

        <div className="flex gap-3">
          <input
            value={input}
            onChange={handleTyping}
            className="flex-1 border px-3 py-2 rounded"
            placeholder="Type message..."
          />

          <input type="file" ref={fileRef} hidden onChange={handleFileChange} />

          <button onClick={() => fileRef.current?.click()}>📎 File</button>

          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            className="text-xl"
          >
            😊
          </button>

          {showPicker && (
            <div className="absolute bottom-15 right-0 z-50">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          )}

          <button className="bg-blue-500 text-white px-4 rounded">Send</button>
        </div>
      </form>
    </div>
  );
};

export default ChatSection;
