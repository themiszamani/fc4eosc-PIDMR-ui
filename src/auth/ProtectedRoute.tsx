import { useContext, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import Keycloak from "keycloak-js";
import KeycloakConfig from "../keycloak.json";

export function ProtectedRoute() {
  const { authenticated, setAuthenticated, setUserid, setKeycloak } =
    useContext(AuthContext)!;

  useEffect(() => {
    const initializeKeycloak = async () => {
      const keycloakInstance = new Keycloak(KeycloakConfig);
      try {
        if (!authenticated) {
          const authenticated = await keycloakInstance.init({
            scope: "openid voperson_id",
            onLoad: "login-required",
            checkLoginIframe: false,
            pkceMethod: "S256",
          });
          const { voperson_id } = keycloakInstance.tokenParsed as {
            voperson_id: string;
          };
          setUserid(voperson_id);
          setKeycloak(keycloakInstance);
          setAuthenticated(authenticated);
        }
      } catch (error) {
        console.error("Failed to initialize Keycloak:", error);
      }
    };

    initializeKeycloak();
  }, [authenticated, setAuthenticated, setKeycloak, setUserid]);

  if (authenticated) {
    return <Outlet />;
  } else {
    return <></>;
  }
}
