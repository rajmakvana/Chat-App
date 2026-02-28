import React, { createContext, useState } from "react";

export interface User {
    userId: string;
    userName: string;
    userEmail: string;
    profileImage?: string;
}

export interface LoginCredential {
    user: User;
    token: string;
}

export interface AuthContextValue {
    user: User | null;
    authUser: (credential: LoginCredential) => Promise<void>;
    logout: () => void;
    setUser : React.Dispatch<React.SetStateAction<User | null>>
}

const AuthContext = createContext<AuthContextValue | null>(null);
export default AuthContext;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    // const [user, setUser] = useState<User | null>(null);

    // useEffect(() => {
    //     const storedUser = localStorage.getItem("user");
    //     console.log(storedUser)
    //     if (storedUser) {
    //         setUser(JSON.parse(storedUser));
    //     }
    // }, []);

    const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("user");

    return storedUser ? JSON.parse(storedUser) : null;
});

    const authUser = async (credential: LoginCredential) => {

        localStorage.setItem("token", credential.token);
        localStorage.setItem("user", JSON.stringify(credential.user));

        setUser(credential.user);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    };

    const value: AuthContextValue = {
        user,
        authUser,
        logout,
        setUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};