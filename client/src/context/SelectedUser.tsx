import React from "react";
import { createContext, useState }  from "react";

interface User {
  _id: string;
  name: string;
  email: string;
}

interface ContextType {
  selectedUser: User | null;
  setSelectedUser: (user: User) => void;
}

const SelectedUserContext = createContext<ContextType | null>(null);
export default SelectedUserContext;

export const SelectedUserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  return (
    <SelectedUserContext.Provider value={{ selectedUser, setSelectedUser }}>
      {children}
    </SelectedUserContext.Provider>
  );
};