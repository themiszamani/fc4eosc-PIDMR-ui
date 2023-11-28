import { useContext, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import Keycloak from "keycloak-js";
import KeycloakConfig from "../keycloak.json";

export function ProtectedRoute({ adminMode = false }: { adminMode: boolean }) {
  const {
    authenticated,
    setAuthenticated,
    setUserid,
    setKeycloak,
    setAdmin,
    admin,
  } = useContext(AuthContext)!;

  const navigate = useNavigate();
  // this is needed to get the correct keycloak roles assigned to the backend service
  const PIDMR_API_KEYCLOAK_SERVICE_NAME = import.meta.env
    .VITE_PIDMR_API_KEYCLOAK_SERVICE_NAME;

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
          // try checking if the user has the admin role in the specific client
          const resourceAccess = keycloakInstance.tokenParsed?.resource_access;
          let isAdmin = false;
          // check if the user has the admin role using the backend service name in the resource access dictionary
          if (resourceAccess) {
            console.log(resourceAccess, PIDMR_API_KEYCLOAK_SERVICE_NAME);
            isAdmin =
              resourceAccess[PIDMR_API_KEYCLOAK_SERVICE_NAME].roles.includes(
                "admin",
              );
          }
          if (adminMode && !isAdmin) {
            console.log("this is admin mode and you are not admin");
            // navigate somerwhere else this view becomes empty because its only for admins
            navigate("/");
          }
          setAdmin(isAdmin);
        }
      } catch (error) {
        console.error("Failed to initialize Keycloak:", error);
      }
    };

    initializeKeycloak();
  }, [
    authenticated,
    setAuthenticated,
    setKeycloak,
    setUserid,
    setAdmin,
    adminMode,
    navigate,
    PIDMR_API_KEYCLOAK_SERVICE_NAME,
  ]);

  // if view is meant for admins and you are an admin get the view
  if (adminMode && authenticated && admin) return <Outlet />;
  // if view is meant for logged in users (but not admins) and you are authenticated get the view
  else if (!adminMode && authenticated) return <Outlet />;

  // render empty page
  return null;
}
