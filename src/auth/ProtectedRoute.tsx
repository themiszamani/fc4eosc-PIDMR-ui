import { useContext, useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import Keycloak from "keycloak-js";
import KeycloakConfig from "../keycloak.json";
import { ProfileResponse } from "../types";

const PIDMR_API = import.meta.env.VITE_PIDMR_API;
const PROFILE_API_ROUTE = `${PIDMR_API}/v1/users/profile`;

function roleMatch(roles: string[], routeRoles: string[]) {
  return roles.some((roleItem) => routeRoles.includes(roleItem));
}

async function getProfile(token: string): Promise<ProfileResponse> {
  try {
    const response = await fetch(PROFILE_API_ROUTE, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data: ProfileResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error during authentication:", error);
    // Handle the error or rethrow it for the calling code to handle
    return { id: "", roles: [] };
  }
}

export function ProtectedRoute({ routeRoles = [] }: { routeRoles: string[] }) {
  const {
    authenticated,
    setAuthenticated,
    setUserid,
    setKeycloak,
    setRoles,
    roles,
  } = useContext(AuthContext)!;

  const navigate = useNavigate();

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

          setKeycloak(keycloakInstance);
          setAuthenticated(authenticated);
          // get token to get user profile

          const profile = await getProfile(keycloakInstance.token || "");
          setUserid(profile.id);
          setRoles(profile.roles);

          if (!roleMatch(profile.roles, routeRoles)) {
            // console.log(routeRoles, profile.roles);
            // console.log("you don't have privileges for this view");
            // navigate somewhere else this view becomes empty because its only for admins
            navigate("/user-role");
          }
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
    navigate,
    routeRoles,
    setRoles,
  ]);

  // if a role matches the route roles
  if (roleMatch(roles, routeRoles)) {
    return <Outlet />;
  }

  return (
    <div style={{ height: "60vh" }} className="d-flex align-items-center">
      <div className="mx-auto text-center">
        <span>You are not allowed to be here</span>
        <br />
        <Link to="/">Return Home</Link>
      </div>
    </div>
  );
}
