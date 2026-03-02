import React, {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import { useNavigate } from "react-router-dom";
import { socket } from "../services/socket";
import api from "../services/api";

import AuthContext from "../context/AuthContext";
import SelectedUserContext from "../context/SelectedUser";
import SelectedGroupContext from "../context/SelectedGroup";

import CreateGroupModal from "./CreateGroupModal";

import { BsPinAngle, BsPinAngleFill } from "react-icons/bs";

import type { AllUser, AllGroup } from "../pages/Chat";

interface SidebarProps {
  allUsers: AllUser[];
  onlineUsers: string[];
  allGroups: AllGroup[];

  handleUnread: (e: React.MouseEvent, id: string) => void;

  setAllUsers: Dispatch<SetStateAction<AllUser[]>>;
  setAllGroups: Dispatch<SetStateAction<AllGroup[]>>;
}

const Sidebar: React.FC<SidebarProps> = ({
  allUsers,
  onlineUsers,
  allGroups,
  handleUnread,
  setAllUsers,
  setAllGroups,
}) => {
  const navigate = useNavigate();

  const { user, setUser } = useContext(AuthContext)!;

  const { setSelectedUser } = useContext(SelectedUserContext)!;

  const { setSelectedGroup } = useContext(SelectedGroupContext)!;

  const [isOpen, setIsOpen] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const groupFileRef = useRef<HTMLInputElement>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  /** ===============================
   * SORT USERS
   =============================== */

  const sortedUsers = useMemo(() => {
    return [...allUsers].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });
  }, [allUsers]);

  /** ===============================
   * SORT GROUPS
   =============================== */

  const sortedGroups = useMemo(() => {
    return [...allGroups].sort((a, b) => {
      const aPin = a.pinnedBy?.find((p) => p.userId === user?.userId);

      const bPin = b.pinnedBy?.find((p) => p.userId === user?.userId);

      // pinned first
      if (aPin && !bPin) return -1;
      if (!aPin && bPin) return 1;

      // both pinned → latest pin first
      if (aPin && bPin) {
        return (
          new Date(bPin.pinnedAt).getTime() - new Date(aPin.pinnedAt).getTime()
        );
      }

      // normal groups
      return (
        new Date(b.updatedAt || 0).getTime() -
        new Date(a.updatedAt || 0).getTime()
      );
    });
  }, [allGroups, user]);

  /** ===============================
   * PIN USER SOCKET LISTENER
   =============================== */

  useEffect(() => {
    socket.on("user_pin_updated", ({ pinnedUsers = [] }) => {
      setAllUsers((prev) =>
        prev.map((u) => ({
          ...u,
          pinned: pinnedUsers.includes(u._id),
        })),
      );
    });

    socket.on("group_pin_updated", ({ groupId, pinnedBy }) => {
      setAllGroups((prev) =>
        prev.map((group) =>
          group._id === groupId ? { ...group, pinnedBy } : group,
        ),
      );
    });

    return () => {
      socket.off("group_pin_updated");
      socket.off("user_pin_updated");
    };
  }, []);

  /** ===============================
   * CLICK HANDLERS
   =============================== */

  const openUser = (target: AllUser) => {
    setSelectedUser(target);
    navigate(`/chat/${target._id}`);
  };

  const openGroup = (group: AllGroup) => {
    setSelectedGroup(group);
    navigate(`/chat/${group._id}`);
  };

  const togglePinUser = (e: React.MouseEvent, targetUserId: string) => {
    e.stopPropagation();

    socket.emit("toggle_user_pin", {
      targetUserId,
    });
  };

  const togglePinGroup = (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation();

    socket.emit("toggle_pin_group", {
      groupId,
    });
  };

  /** ===============================
   * PROFILE IMAGE CHANGE
   =============================== */

  const changeProfileImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const formData = new FormData();

    formData.append("profileImage", file);

    const res = await api.post("/auth/profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    setUser(res.data.user);
  };

  const handleGroupFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];

    if (!file || !selectedGroupId) return;

    const formData = new FormData();
    formData.append("profileImage", file);

    try {
      const res = await api.post(
        `/group/groupImage/${selectedGroupId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      const updatedGroup = res.data.group;

      setAllGroups((prev) =>
        prev.map((group) =>
          group._id === updatedGroup._id ? updatedGroup : group,
        ),
      );
    } catch (error) {
      console.log(error);
    }
  };

  const handleCreateGroup = async (groupName: string, members: string[]) => {
    try {
      const response = await api.post("/group/create", {
        groupName: groupName,
        members: [...members, user?.userId],
      });
      // console.log(response.data);
      setAllGroups((prev) => [...prev, response.data]);
    } catch (error) {
      console.log(error);
    }
  };

  const handleGroupImageClick = (groupId: string) => {
    setSelectedGroupId(groupId); // ✅ store correct group id
    groupFileRef.current?.click();
  };

  /** ===============================
   * RENDER
   =============================== */

  return (
    <div className="w-80 bg-gray-900 text-white flex flex-col h-screen">
      {/* HEADER */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold">Chat App</h2>

        <div className="flex items-center gap-3 mt-3">
          <img
            src={
              user?.profileImage
                ? `http://localhost:3000${user.profileImage}`
                : `https://ui-avatars.com/api/?name=${user?.userName}`
            }
            className="w-12 h-12 rounded-full cursor-pointer"
            onClick={() => fileRef.current?.click()}
          />

          <span className="font-medium">{user?.userName}</span>

          <input
            ref={fileRef}
            hidden
            type="file"
            onChange={changeProfileImage}
          />
        </div>
      </div>

      {/* USERS */}
      <div className="flex-1 overflow-y-auto p-3">
        <h3 className="text-gray-400 text-sm mb-2">Chats</h3>

        <div className="space-y-2">
          {sortedUsers.map((u) => {
            const isOnline = onlineUsers.includes(u._id);

            return (
              <div
                key={u._id}
                onClick={() => openUser(u)}
                className="flex items-center justify-between p-3 rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700 transition"
              >
                {/* LEFT */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={
                        u.profileImage
                          ? `http://localhost:3000${u.profileImage}`
                          : `https://ui-avatars.com/api/?name=${u.name}`
                      }
                      className="w-11 h-11 rounded-full"
                    />

                    {/* ONLINE DOT */}
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border border-gray-900 ${
                        isOnline ? "bg-green-500" : "bg-gray-500"
                      }`}
                    />
                  </div>

                  <div>
                    <p className="font-medium">{u.name}</p>

                    <p className="text-xs text-gray-400 truncate w-32">
                      {u.lastMessage?.message || "No messages"}
                    </p>
                  </div>
                </div>

                {/* RIGHT */}
                <div className="flex flex-col items-end gap-1">
                  {/* UNREAD */}
                  {u.unreadCount > 0 && (
                    <span className="bg-green-500 text-xs px-2 py-0.5 rounded-full">
                      {u.unreadCount}
                    </span>
                  )}

                  {/* PIN */}
                  <button
                    onClick={(e) => togglePinUser(e, u._id)}
                    className="text-lg"
                  >
                    {u.pinned ? <BsPinAngleFill /> : <BsPinAngle />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* GROUP SECTION */}
        <h3 className="text-gray-400 text-sm mt-6 mb-2">Groups</h3>

        <div className="space-y-2">
          <input
            type="file"
            ref={groupFileRef}
            hidden
            accept="image/*"
            onChange={handleGroupFileChange}
          />

          {sortedGroups.map((group) => {
            const isPinned = group.pinnedBy?.some(
              (p) => p.userId === user?.userId,
            );

            return (
              <div
                key={group._id}
                onClick={() => openGroup(group)}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-800 hover:bg-gray-700 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={
                      group?.groupImage
                        ? `http://localhost:3000${group?.groupImage}`
                        : `https://ui-avatars.com/api/?name=${group?.name}`
                    }
                    alt="profile"
                    className="w-12 h-12 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation(); // prevent openGroup
                      handleGroupImageClick(group._id);
                    }}
                  />

                  <span>{group.name}</span>
                </div>

                <button onClick={(e) => togglePinGroup(e, group._id)}>
                  {isPinned ? <BsPinAngleFill /> : <BsPinAngle />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* CREATE GROUP */}
      <div className="p-3 border-t border-gray-700">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full bg-green-600 hover:bg-green-700 p-2 rounded-lg font-medium"
        >
          Create Group
        </button>
      </div>

      <CreateGroupModal
        users={allUsers}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onCreateGroup={handleCreateGroup}
      />
    </div>
  );
};

export default Sidebar;
