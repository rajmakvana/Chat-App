import React, { use, useContext, useEffect, useRef, useState } from "react";
import type { AllUser } from "../pages/Chat";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import SelectedUserContext from "../context/SelectedUser";
import { socket } from "../services/socket";
import AuthContext from "../context/AuthContext";

interface Message {
  _id?: string;
  sender: AllUser;
  receiver: AllUser;
  message: string;
  createdAt?: string;
  updatedAt?: string;
}

const ChatSection: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { selectedUser } = useContext(SelectedUserContext)!;
  const { user, logout } = useContext(AuthContext)!;
  const currentUserId = user?.userId || "";
  const navigate = useNavigate();

  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const fetchMessages = async () => {
      api
        .get(`/chat/messages/${userId}`)
        .then((response) => {
          console.log(response.data);
          setMessages(response.data.messages);
        })
        .catch((error) => {
          console.log(error);
        });
    };

    fetchMessages();
  }, [userId]);

  useEffect(() => {
    socket.on("receive_message", (newMessage: Message) => {
      console.log(newMessage);
      setMessages((prev) => [...prev, newMessage]);
    });

    socket.on("typing", ({ senderId }) => {
      console.log("typing from:", senderId);

      if (senderId === userId) {
        setIsTyping(true);
      }
    });

    socket.on("stop_typing", ({ senderId }) => {
      if (senderId === userId) {
        setIsTyping(false);
      }
    });

    return () => {
      socket.off("receive_message");
      socket.off("typing");
      socket.off("stop_typing");
    };
  }, [userId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(input);
    if (!input.trim()) return;
    try {
      socket.emit("send_message", {
        receiverId: userId,
        message: input,
      });
      setInput("");
    } catch (error) {
      console.log(error);
    }
  };


  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setInput(e.target.value);
    socket.emit("typing", {
      receiverId: userId,
    });
    stopTypingDebounce();
  };

  let typingTimeout: ReturnType<typeof setTimeout>;

  const stopTypingDebounce = () => {
    clearTimeout(typingTimeout);

    typingTimeout = setTimeout(() => {
      socket.emit("stop_typing", {
        receiverId: userId,
      });
    }, 1000);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="bg-gray-600 h-full flex-1 flex flex-col justify-between ">
      <div className="px-6 py-2  bg-gray-800 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h4 className="text-white text-3xl">
            {selectedUser?.name || userId}
          </h4>
          <p className="text-gray-300">{isTyping ? "Typing..." : " "}</p>
        </div>
        <button
          className="bg-red-500 text-white px-4 py-2 rounded"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto ">
        {messages.length === 0 ? (
          <p className="text-gray-400 text-center mt-10">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-2 flex ${
                msg.sender._id === currentUserId ? "items-end" : "items-start"
              } flex flex-col`}
            >
              <div
                className={`px-4 py-2 rounded-lg max-w-xs ${
                  msg.sender._id === currentUserId
                    ? "bg-green-500 text-white"
                    : "bg-white border"
                }`}
              >
                {msg.message}
              </div>
              <span className="text-gray-400 text-xs ml-2 mt-1">
                {new Date(msg.createdAt || "").toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 bg-white border-t flex gap-2">
        <input
          value={input}
          onChange={handleTyping}
          placeholder="Type message..."
          className="flex-1 border rounded px-3 py-2 outline-none"
        />

        <button
          type="submit"
          className="bg-gray-500 text-white px-6 py-2 rounded"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatSection;
