import React, { useContext, useEffect } from "react";
import api from "../services/api";
import { socket } from "../services/socket";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/SideBar";
import AuthContext from "../context/AuthContext";

export interface AllUser {
  _id: string;
  name: string;
  email: string;
}

const Chat: React.FC = () => {
  const [allUsers, setAllUsers] = React.useState<AllUser[]>([]);
  const [onlineUsers, setOnlineUsers] = React.useState<string[]>([]);

  const { user } = useContext(AuthContext)!;

  // fetch users
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const response = await api.get("/chat/users");
        setAllUsers(response.data.users);
      } catch (error) {
        console.log(error);
      }
    };

    fetchAllUsers();
  }, []);

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
    });

    return () => {
      socket.off("online_users");
      socket.off("receive_message");
      socket.disconnect();
    };
  }, [user]);

  return (
    <div className="h-screen flex bg-gray-100">
      <Sidebar allUsers={allUsers} onlineUsers={onlineUsers} />
      <Outlet />
    </div>
  );
};

export default Chat;
