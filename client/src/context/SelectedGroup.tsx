import React from "react";
import { createContext, useState }  from "react";

interface User {
  _id: string;
  name: string;
  email: string;
}

interface Group{
    _id : string,
    name : string,
    members : User[]
}

interface ContextType {
  selectedGroup: Group | null;
  setSelectedGroup: (group: Group) => void;
}

const SelectedGroupContext = createContext<ContextType | null>(null);
export default SelectedGroupContext;

export const SelectedGroupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  return (
    <SelectedGroupContext.Provider value={{ selectedGroup, setSelectedGroup }}>
      {children}
    </SelectedGroupContext.Provider>
  );
};