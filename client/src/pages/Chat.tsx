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
  pinned?: boolean;
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

interface PinnedUser {
  userId: string;
  pinnedAt: Date;
}

export interface AllGroup {
  _id: string;
  name: string;
  members: User[];
  groupImage: string;
  pinnedBy: PinnedUser[];
  createdAt?: Date;
  updatedAt?: Date;
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
   * FETCH USERS
   =============================== */

  const fetchUsers = async () => {
    try {
      const res = await api.get("/chat/users");

      const users = res.data.users || [];
      const pinnedUsers = res.data.pinnedUsers || [];

      const formattedUsers = users.map((u: any) => ({
        ...u,
        pinned: pinnedUsers.includes(u._id), // ✅ correct check
        unreadCount: u.unreadCount || 0,
      }));

      setAllUsers(formattedUsers);
    } catch (error) {
      console.log("Fetch users error:", error);
    }
  };

  /** ===============================
   * FETCH GROUPS
   =============================== */ 

  const fetchGroups = async () => {
    try {
      const res = await api.get("/group");

      setAllGroups(res.data || []);
    } catch (error) {
      console.log("Fetch groups error:", error);
    }
  };

  /** ===============================
   * INITIAL LOAD
   =============================== */

  useEffect(() => {
    fetchUsers();
    fetchGroups();
  }, []);

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
   * ONLINE / OFFLINE HANDLING
   =============================== */

  useEffect(() => {
    socket.on("online_users", (users: string[]) => {
      setOnlineUsers(users);
    });

    socket.on("user_online", (userId: string) => {
      setOnlineUsers((prev) =>
        prev.includes(userId) ? prev : [...prev, userId],
      );
    });

    socket.on("user_offline", (userId: string) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    return () => {
      socket.off("online_users");
      socket.off("user_online");
      socket.off("user_offline");
    };
  }, []);

  /** ===============================
   * PROFILE CHANGE
   =============================== */

  useEffect(() => {
    const handleProfileChange = (data: any) => {
      setAllUsers((prev) =>
        prev.map((u) =>
          u._id === data.user._id
            ? { ...u, profileImage: data.user.profileImage }
            : u,
        ),
      );
    };

    socket.on("profile_change", handleProfileChange);

    return () => {
      socket.off("profile_change", handleProfileChange);
    };
  }, []);

  /** ===============================
   * GROUP PIN UPDATE
   =============================== */

  useEffect(() => {
    const handleGroupPin = (data: any) => {
      setAllGroups((prev) =>
        prev.map((group) =>
          group._id === data.groupId
            ? { ...group, pinnedBy: data.pinnedBy }
            : group,
        ),
      );
    };

    socket.on("group_pin_updated", handleGroupPin);

    return () => {
      socket.off("group_pin_updated", handleGroupPin);
    };
  }, []);

  /** ===============================
   * RECEIVE MESSAGE
   =============================== */

  useEffect(() => {
    socket.on("receive_message", (message: any) => {
      const senderId = message.sender._id;

      setAllUsers((prev) =>
        prev.map((u) => {
          if (u._id !== senderId) return u;

          const isOpen = selectedUser?._id === senderId;

          return {
            ...u,

            lastMessage: {
              _id: message._id,
              message: message.message || message.fileName || "File",
            },

            unreadCount: isOpen ? 0 : u.unreadCount + 1,
          };
        }),
      );
    });

    return () => {
      socket.off("receive_message");
    };
  }, [selectedUser]);

  /** ===============================
   * MESSAGE SEEN EVENT
   =============================== */

  useEffect(() => {
    socket.on("messages_seen", ({ seenBy }) => {
      setAllUsers((prev) =>
        prev.map((u) => (u._id === seenBy ? { ...u, unreadCount: 0 } : u)),
      );
    });

    return () => {
      socket.off("messages_seen");
    };
  }, []);

  /** ===============================
   * MARK SEEN WHEN OPEN CHAT
   =============================== */

  useEffect(() => {
    if (!selectedUser) return;

    setAllUsers((prev) =>
      prev.map((u) =>
        u._id === selectedUser._id ? { ...u, unreadCount: 0 } : u,
      ),
    );

    socket.emit("mark_seen", {
      senderId: selectedUser._id,
    });
  }, [selectedUser]);

  /** ===============================
   * MANUAL UNREAD RESET
   =============================== */

  const handleUnread = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();

    setAllUsers((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, unreadCount: 0 } : u)),
    );

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
        setAllUsers={setAllUsers}
      />

      <Outlet />
    </div>
  );
};

export default Chat;
