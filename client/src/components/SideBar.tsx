import React from "react";
import type { AllUser } from "../pages/Chat";
import { useNavigate } from "react-router-dom";
import SelectedUserContext from "../context/SelectedUser";
import { CiUnread } from "react-icons/ci";

interface SidebarProps {
  allUsers: AllUser[];
  onlineUsers: string[];
  handleUnread : (e: React.MouseEvent<SVGElement>, id : string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ allUsers, onlineUsers , handleUnread  }) => {
  const navigate = useNavigate();

  const { setSelectedUser } = React.useContext(SelectedUserContext)!;

  const handleClick = (user: AllUser) => {
    setSelectedUser(user);
    navigate(`/chat/${user._id}`);
  };

  return (
    <div className="w-80 bg-gray-800 text-white h-screen">
      <div className="p-5 border-b border-gray-700">
        <h2 className="text-xl font-bold">Chat App</h2>
      </div>

      <div className="p-4">
        <ul className="space-y-2">
          {allUsers.map((user) => {
            const isOnline = onlineUsers.includes(user._id);

            return (
              <li
                key={user._id}
                onClick={() => handleClick(user)}
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
                    {user.unreadCount} {user.lastMessage ? `: ${user.lastMessage.message}` : ""}
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
      </div>
    </div>
  );
};

export default Sidebar;
