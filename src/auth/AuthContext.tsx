import React, { createContext, useState } from "react";
import Keycloak from "keycloak-js";

interface AuthContextProps {
  authenticated: boolean;
  setAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  userid: string;
  setUserid: React.Dispatch<React.SetStateAction<string>>;
  keycloak: NullableKeycloak; // Replace 'any' with the appropriate type for your keycloak object
  setKeycloak: React.Dispatch<React.SetStateAction<NullableKeycloak>>;
}

// Create the context
export const AuthContext = createContext<AuthContextProps | null>(null);

type NullableKeycloak = null | Keycloak;

// Create a provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [userid, setUserid] = useState("");
  const [keycloak, setKeycloak] = useState<NullableKeycloak>(null);

  const authContextValue: AuthContextProps = {
    authenticated,
    setAuthenticated,
    userid,
    setUserid,
    keycloak,
    setKeycloak,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}
