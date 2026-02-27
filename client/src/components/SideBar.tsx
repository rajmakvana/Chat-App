import React, { useContext, useState, type Dispatch, type SetStateAction } from "react";
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
  allGroups : AllGroup[];
  setAllGroups : Dispatch<SetStateAction<AllGroup[]>>;
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

  const handleUserClick = (user: AllUser ) => {
    setSelectedUser(user);
    navigate(`/chat/${user._id}`);
  };

  const handleGroupClick = (group : AllGroup) => {
    setSelectedGroup(group);
    navigate(`/chat/${group._id}`);
  }


  const {user} =  useContext(AuthContext)!;
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleCreateGroup = async (groupName: string, members: string[]) => {
    try {
      const response = await api.post("/group/create", {
        groupName: groupName,
        members: [...members , user?.userId],
      });
      // console.log(response.data);
      setAllGroups((prev) => [...prev , response.data] );
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="w-80 bg-gray-800 text-white h-screen">
      <div className="p-5 border-b border-gray-700">
        <h2 className="text-xl font-bold">Chat App</h2>
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
                <span>{user.name}</span>

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
              </li>
            );
          })}
        </ul>

        <h2 className="text-2xl mt-3">All Groups </h2>

        <ul className="space-y-2 mt-3">
          {allGroups.map((groups) => {
            // const isOnline = onlineUsers.includes(groups._id);
            return (
              <li
                key={groups._id}
                onClick={() => handleGroupClick(groups)}
                className="p-3 rounded cursor-pointer flex justify-between items-center bg-gray-700 hover:bg-gray-600"
              >
                <span>{groups.name}</span>
{/* 
                {allGroups.length > 0 && (
                  <span className="ml-2 bg-red-500 text-xs rounded-full px-2 py-0.5">
                    {user.unreadCount}{" "}
                    {user.lastMessage ? `: ${user.lastMessage.message}` : ""}
                  </span>
                )} */}

                {/* <CiUnread onClick={(e) => handleUnread(e, user._id)} /> */}

                {/* <span className="text-sm">
                  {isOnline ? "🟢 Online" : "⚫ Offline"}
                </span> */}
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
