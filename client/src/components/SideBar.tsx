import React, {
  useContext,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { AllGroup, AllUser } from "../pages/Chat";
import { useNavigate } from "react-router-dom";
import SelectedUserContext from "../context/SelectedUser";
import { CiUnread } from "react-icons/ci";
import CreateGroupModal from "./CreateGroupModal";
import api from "../services/api";
import AuthContext from "../context/AuthContext";
import SelectedGroupContext from "../context/SelectedGroup";

interface SidebarProps {
  allUsers: AllUser[];
  onlineUsers: string[];
  handleUnread: (e: React.MouseEvent<SVGElement>, id: string) => void;
  allGroups: AllGroup[];
  setAllGroups: Dispatch<SetStateAction<AllGroup[]>>;
}

const Sidebar: React.FC<SidebarProps> = ({
  allUsers,
  onlineUsers,
  handleUnread,
  allGroups,
  setAllGroups,
}) => {
  const navigate = useNavigate();

  const { setSelectedUser } = React.useContext(SelectedUserContext)!;
  const { setSelectedGroup } = React.useContext(SelectedGroupContext)!;

  const handleUserClick = (user: AllUser) => {
    setSelectedUser(user);
    navigate(`/chat/${user._id}`);
  };

  const handleGroupClick = (group: AllGroup) => {
    setSelectedGroup(group);
    navigate(`/chat/${group._id}`);
  };

  const { user, setUser } = useContext(AuthContext)!;
  const [isOpen, setIsOpen] = useState<boolean>(false);

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

  // profile Image handling

  const fileRef = useRef<HTMLInputElement>(null);
  const groupFileRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    fileRef.current?.click();
  };
  const handleGroupImageClick = () => {
    groupFileRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profileImage", file);

    try {
      const res = await api.post("/auth/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setUser(res.data.user);
    } catch (error) {
      console.log(error);
    }
  };

  const handleGroupFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    groupId: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profileImage", file);

    try {
      const res = await api.post(`/group/groupImage/${groupId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const updatedGroup = res.data.group;
      setAllGroups((prev) =>
        prev.map((group) =>
          group._id === updatedGroup._id ? updatedGroup : group,
        ),
      );
      console.log(res.data.group);
    } catch (error) {
      console.log(error);
    }
  };

  const togglePinGroup = async (groupId: string) => {
    try {
      await api.patch(`/group/${groupId}/pin`);
    } catch (error) {
      console.log(error);
    }
  };

  const sortedGroups = [...allGroups].sort((a, b) => {
    const aPinned = a.pinnedBy.includes(user?.userId || "");
    const bPinned = b.pinnedBy.includes(user?.userId || "");

    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;

    return (
      new Date(b.updatedAt || 0).getTime() -
      new Date(a.updatedAt || 0).getTime()
    );
  });

  return (
    <div className="w-80 bg-gray-800 text-white h-screen">
      <div className="p-5 border-b border-gray-700">
        <h2 className="text-xl font-bold">Chat App</h2>

        <div className="flex items-center gap-3 cursor-pointer">
          <img
            src={
              user?.profileImage
                ? `http://localhost:3000${user.profileImage}`
                : `https://ui-avatars.com/api/?name=${user?.userName}`
            }
            alt="profile"
            className="w-12 h-12 rounded-full mt-2"
            onClick={handleImageClick}
          />

          <span>{user?.userName}</span>

          {/* hidden input */}
          <input
            type="file"
            ref={fileRef}
            hidden
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
      </div>

      <div className="p-4 flex flex-col justify-between">
        <ul className="space-y-2">
          {allUsers.map((user) => {
            const isOnline = onlineUsers.includes(user._id);

            return (
              <li
                key={user._id}
                onClick={() => handleUserClick(user)}
                className={`
            p-3 rounded cursor-pointer flex justify-between items-center
            ${
              isOnline
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-700 hover:bg-gray-600"
            }
          `}
              >
                {/* LEFT SECTION: Profile Image + Name */}
                <div className="flex items-center gap-3">
                  <img
                    src={
                      user?.profileImage
                        ? `http://localhost:3000${user.profileImage}`
                        : `https://ui-avatars.com/api/?name=${user?.name}`
                    }
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover border border-gray-400"
                  />

                  <span>{user.name}</span>
                </div>

                {/* RIGHT SECTION */}
                <div className="flex items-center gap-3">
                  {user.unreadCount > 0 && (
                    <span className="ml-2 bg-red-500 text-xs rounded-full px-2 py-0.5">
                      {user.unreadCount}{" "}
                      {user.lastMessage ? `: ${user.lastMessage.message}` : ""}
                    </span>
                  )}

                  <CiUnread onClick={(e) => handleUnread(e, user._id)} />

                  <span className="text-sm">
                    {isOnline ? "🟢 Online" : "⚫ Offline"}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>

        <h2 className="text-2xl mt-3">All Groups </h2>

        <ul className="space-y-2 mt-3">
          {sortedGroups.map((groups) => {

            const isPinned = groups.pinnedBy.includes(user?.userId || "");

            return (
              <li
                key={groups._id}
                onClick={() => handleGroupClick(groups)}
                className="p-3 rounded cursor-pointer flex justify-between items-center bg-gray-700 hover:bg-gray-600"
              >
                <div className="flex items-center gap-3 cursor-pointer">
                  <img
                    src={
                      groups?.groupImage
                        ? `http://localhost:3000${groups?.groupImage}`
                        : `https://ui-avatars.com/api/?name=${groups?.name}`
                    }
                    alt="profile"
                    className="w-12 h-12 rounded-full mt-2"
                    onClick={handleGroupImageClick}
                  />

                  <div>
                    <h3>{groups.name}</h3>
                  </div>

                  <button
                    onClick={() => togglePinGroup(groups._id)}
                    className={`px-3 py-1 rounded text-white ${
                      isPinned ? "bg-red-500" : "bg-blue-500"
                    }`}
                  >
                    {isPinned ? "Unpin" : "Pin"}
                  </button>

                  {/* hidden input */}
                  <input
                    type="file"
                    ref={groupFileRef}
                    hidden
                    accept="image/*"
                    onChange={(e) =>
                      handleGroupFileChange(e, groups._id.toString())
                    }
                  />
                </div>
              </li>
            );
          })}
        </ul>

        <button
          onClick={() => setIsOpen(true)}
          className="bg-green-500 text-white px-4 py-2 rounded mt-5"
        >
          Create Group
        </button>

        <CreateGroupModal
          users={allUsers}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onCreateGroup={handleCreateGroup}
        />
      </div>
    </div>
  );
};

export default Sidebar;
