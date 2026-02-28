import React, { useContext, useEffect, useState } from "react";
import api from "../services/api";
import { socket } from "../services/socket";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/SideBar";
import AuthContext from "../context/AuthContext";
import SelectedUserContext from "../context/SelectedUser";

/** ===============================
 * INTERFACES
 =============================== */

export interface AllUser {
  _id: string;
  name: string;
  email: string;
  profileImage: string;
  unreadCount: number;
  lastMessage?: {
    _id: string;
    message: string;
  };
}

export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface AllGroup {
  _id: string;
  name: string;
  members: User[];
  groupImage: string;
  pinnedBy: string[];
  createdAt? : Date | undefined;
  updatedAt? : Date | undefined;
}

/** ===============================
 * MAIN COMPONENT
 =============================== */

const Chat: React.FC = () => {
  /** ===============================
   * STATE
   =============================== */

  const [allUsers, setAllUsers] = useState<AllUser[]>([]);
  const [allGroups, setAllGroups] = useState<AllGroup[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  const { user } = useContext(AuthContext)!;
  const { selectedUser } = useContext(SelectedUserContext)!;

  /** ===============================
   * INITIAL DATA FETCH
   =============================== */

  useEffect(() => {
    fetchUsers();
    fetchGroups();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/chat/users");

      setAllUsers(res.data.users);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get("/group");

      setAllGroups(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  /** ===============================
   * SOCKET CONNECTION
   =============================== */

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("token");

    if (!token) return;

    socket.auth = { token };

    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, [user]);

  /** ===============================
   * ONLINE USERS LISTENER
   =============================== */

  useEffect(() => {
    socket.on("online_users", (users: string[]) => {
      setOnlineUsers(users);
    });

    const handleProfileChange = (data: any) => {
      setAllUsers((prev) =>
        prev.map((user) =>
          user._id === data.user._id
            ? { ...user, profileImage: data.user.profileImage }
            : user,
        ),
      );
    };

    const handleGroupChange = (data: any) => {
      setAllGroups((prev) =>
        prev.map((group) =>
          group._id === data.group._id ? data.group : group,
        ),
      );
    };

    const handlePinUpdate = (data: any) => {
      setAllGroups((prevGroups) =>
        prevGroups.map((group) =>
          group._id === data.groupId
            ? { ...group, pinnedBy: data.pinnedBy }
            : group,
        ),
      );
    };

    socket.on("group_pin_updated", handlePinUpdate);

    socket.on("profile_change", handleProfileChange);
    socket.on("group_profile_change", handleGroupChange);

    return () => {
      socket.off("online_users");
      socket.off("profile_change", handleProfileChange);
      socket.off("group_pin_updated", handlePinUpdate);
    };
  }, []);

  /** ===============================
   * RECEIVE PRIVATE MESSAGE
   * Handles:
   * - last message update
   * - unread count
   =============================== */

  useEffect(() => {
    socket.on("receive_message", (message) => {
      setAllUsers((prevUsers) =>
        prevUsers.map((u) => {
          // if message belongs to this user
          if (u._id === message.sender._id) {
            const isOpen = selectedUser?._id === message.sender._id;

            return {
              ...u,

              lastMessage: {
                _id: message._id,
                message: message.message,
              },

              unreadCount: isOpen ? 0 : u.unreadCount + 1,
            };
          }

          return u;
        }),
      );
    });

    return () => {
      socket.off("receive_message");
    };
  }, [selectedUser]);

  /** ===============================
   * MESSAGE SEEN EVENT FROM SERVER
   * reset unread when backend confirms seen
   =============================== */

  useEffect(() => {
    socket.on("messages_seen", ({ seenBy }) => {
      setAllUsers((prevUsers) =>
        prevUsers.map((u) =>
          u._id === seenBy
            ? {
                ...u,
                unreadCount: 0,
              }
            : u,
        ),
      );
    });

    return () => {
      socket.off("messages_seen");
    };
  }, []);

  /** ===============================
   * RESET UNREAD WHEN CHAT OPENED
   =============================== */

  useEffect(() => {
    if (!selectedUser) return;

    // reset UI instantly
    setAllUsers((prevUsers) =>
      prevUsers.map((u) =>
        u._id === selectedUser._id
          ? {
              ...u,
              unreadCount: 0,
            }
          : u,
      ),
    );

    // notify backend
    socket.emit("mark_seen", {
      senderId: selectedUser._id,
    });
  }, [selectedUser]);

  /** ===============================
   * MANUAL UNREAD RESET (ICON CLICK)
   =============================== */

  const handleUnread = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();

    // reset UI immediately
    setAllUsers((prevUsers) =>
      prevUsers.map((u) =>
        u._id === userId
          ? {
              ...u,
              unreadCount: 0,
            }
          : u,
      ),
    );

    // notify backend
    socket.emit("mark_seen", {
      senderId: userId,
    });
  };

  /** ===============================
   * RENDER
   =============================== */

  return (
    <div className="h-screen flex bg-gray-100">
      <Sidebar
        allUsers={allUsers}
        allGroups={allGroups}
        onlineUsers={onlineUsers}
        handleUnread={handleUnread}
        setAllGroups={setAllGroups}
      />

      <Outlet />
    </div>
  );
};

export default Chat;
