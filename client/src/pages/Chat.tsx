import React, { useContext, useEffect } from "react";
import api from "../services/api";
import { socket } from "../services/socket";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/SideBar";
import AuthContext from "../context/AuthContext";
import SelectedUserContext from "../context/SelectedUser";

export interface AllUser {
  _id: string;
  name: string;
  email: string;
  unreadCount: number;
  lastMessage: {
    _id: string;
    message: string;
  };
}

export interface User {
  _id : string,
  name : string,
  email : string
}

export interface AllGroup {
  _id : string
  name : string,
  members : User[]
}

const Chat: React.FC = () => {
  const [allUsers, setAllUsers] = React.useState<AllUser[]>([]);
  const [allGroups , setAllGroups] = React.useState<AllGroup[]>([]);
  const [onlineUsers, setOnlineUsers] = React.useState<string[]>([]);

  const { user } = useContext(AuthContext)!;
  const { selectedUser } = useContext(SelectedUserContext)!;

  useEffect(() => {
    socket.on("receive_lastMessage", (data) => {
      console.log("data first", data);
      setAllUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === data.sender
            ? {
                ...user,
                lastMessage: {
                  message: data.message,
                  _id: data._id,
                },
                unreadCount: 1,
              }
            : user,
        ),
      );
    });
  }, []);

  // fetch users
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const response = await api.get("/chat/users");
        const fetchedUsers = response.data.users;

        setAllUsers((prevUsers) => {
          // first load
          if (prevUsers.length === 0) {
            return fetchedUsers;
          }

          // update only matching users
          return prevUsers.map((prevUser) => {
            const updatedUser = fetchedUsers.find(
              (user: AllUser) => user._id === prevUser._id,
            );

            if (updatedUser && prevUser._id === selectedUser?._id) {
              return {
                ...prevUser,
                unreadCount: updatedUser.unreadCount,
                lastMessage: updatedUser.lastMessage,
              };
            }
            return prevUser;
          });
        });
      } catch (error) {
        console.log(error);
      }
    };

    const getAllGroups = async () => {
      try {
        const response =  await api.get("/group");
        setAllGroups(response.data);
      } catch (error) {
        console.log(error)
      }
    }

    getAllGroups();
    fetchAllUsers();
  }, [selectedUser]);

  // socket connection
  useEffect(() => {
    if (!user) return;

    const authorizedToken = localStorage.getItem("token");

    if (authorizedToken) {
      socket.auth = {
        token: authorizedToken,
      };
      socket.connect();
    }

    socket.off("online_users");
    socket.on("online_users", (data: string[]) => {
      setOnlineUsers(() => [...data]);
    });

    socket.on("receive_message", (message) => {
      console.log("New message:", message);
      setAllUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === message.sender._id
            ? {
                ...user,
                lastMessage: {
                  message: message.message,
                  _id: message._id,
                },
                unreadCount: user.unreadCount + 1,
              }
            : user,
        ),
      );
    });

    return () => {
      socket.off("online_users");
      socket.off("receive_message");
      socket.disconnect();
    };
  }, [user]);

  const handleUnread = (e: React.MouseEvent<SVGElement>, id: string) => {
    e.stopPropagation();
    socket.emit("get_lastMessage", {
      receiverId: id,
    });
  };

  return (
    <div className="h-screen flex bg-gray-100">
      <Sidebar
        allUsers={allUsers}
        onlineUsers={onlineUsers}
        handleUnread={handleUnread}
        allGroups={allGroups}
        setAllGroups={setAllGroups}
      />
      <Outlet />
    </div>
  );
};

export default Chat;
