import { useState, useEffect, useContext } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { AuthContext } from "./auth";
import {
  FaCheck,
  FaCog,
  FaEdit,
  FaExclamationTriangle,
  FaIdCard,
  FaInfoCircle,
  FaPlusCircle,
  FaTrashAlt,
  FaUser,
} from "react-icons/fa";
import { ApiResponse, Provider } from "./types";
import { DeleteModal } from "./DeleteModal";
import { Alert, Button } from "react-bootstrap";
import toast from "react-hot-toast";
import { StatusModal } from "./StatusModal";

// API endpoint declared in env variable
const PIDMR_API = import.meta.env.VITE_PIDMR_API;
const PROVIDERS_ADMIN_API_ROUTE = `${PIDMR_API}/v1/admin/providers`;

interface DeleteModalConfig {
  show: boolean;
  title: string;
  message: string;
  itemId: string;
  itemName: string;
}

interface StatusModalConfig {
  show: boolean;
  itemId: string;
  itemName: string;
  status: string;
}

// Component to render a simple info page about Managed PIDs
function ManagedPids() {
  const { roles, userid } = useContext(AuthContext)!;
  const admin = roles.includes("admin");
  const providerAdmin = roles.includes("provider_admin");

  // provider data from backend
  const [data, setData] = useState<ApiResponse | null>(null);
  // small trigger to refetch data when deleting items
  const [triggerFetch, setTriggerFetch] = useState(true);
  // router urlparams for pagination
  const [searchParams] = useSearchParams();
  // navigate to change on pagination
  const navigate = useNavigate();

  const { keycloak } = useContext(AuthContext)!;

  const [deleteModalConfig, setDeleteModalConfig] = useState<DeleteModalConfig>(
    {
      show: false,
      title: "Delete PID Provider",
      message: "Are you sure you want to delete the following PID Provider?",
      itemId: "",
      itemName: "",
    },
  );

  const [statusModalConfig, setStatusModalConfig] = useState<StatusModalConfig>(
    {
      show: false,
      status: "",
      itemId: "",
      itemName: "",
    },
  );

  const handleDeleteOpenModal = (item: Provider) => {
    setDeleteModalConfig({
      ...deleteModalConfig,
      show: true,
      itemId: item.id.toString(),
      itemName: item.name,
    });
  };

  const handleApproveOpenModal = (item: Provider) => {
    setStatusModalConfig({
      ...statusModalConfig,
      show: true,
      status: item.status || "",
      itemId: item.id.toString(),
      itemName: item.name,
    });
  };

  const handleStatusConfirmed = async (id: string, status: string) => {
    if (keycloak) {
      const url = PROVIDERS_ADMIN_API_ROUTE + "/" + id + "/update-status";
      try {
        const response = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${keycloak.token}`,
          },
          body: JSON.stringify({ status: status }),
        });

        if (response.ok) {
          setStatusModalConfig({
            ...statusModalConfig,
            show: false,
            status: "",
            itemId: "",
            itemName: "",
          });
          // refresh data
          toast.success("Provider status changed!");
          setTriggerFetch(true);
        } else {
          response.json().then((data) => {
            toast.error(
              <div>
                <strong>{`Error trying to change status for Provider:`}</strong>
                <br />
                <span>{data.message}</span>
              </div>,
            );
          });
        }
      } catch (error: unknown) {
        console.error("Error:", error);
      }
    }
  };

  const handleDeleteConfirmed = async (id: string) => {
    if (keycloak) {
      const url = PROVIDERS_ADMIN_API_ROUTE + "/" + id;
      try {
        const response = await fetch(url, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${keycloak.token}`,
          },
        });

        if (response.ok) {
          setDeleteModalConfig({
            ...deleteModalConfig,
            show: false,
            itemId: "",
            itemName: "",
          });
          // refresh data
          toast.success("Provider deleted!");
          setTriggerFetch(true);
        } else {
          response.json().then((data) => {
            toast.error(
              <div>
                <strong>{`Error trying to delete Provider:`}</strong>
                <br />
                <span>{data.message}</span>
              </div>,
            );
          });
        }
      } catch (error: unknown) {
        console.error("Error:", error);
      }
    }
  };

  function handleChangeSize(evt: { target: { value: string } }) {
    // navigate to the same page but with new url parameter for size and go to first page
    navigate("./?size=" + evt.target.value + "&page=1");
  }

  useEffect(() => {
    // parse the page & size url params
    let page = parseInt(searchParams.get("page") || "");
    let size = parseInt(searchParams.get("size") || "");

    // if no page given assume first
    if (!page) {
      page = 1;
    }

    // if no size given or size too big assume 20 and start at first page
    if (!size || size > 100) {
      size = 20;
      page = 1;
    }

    // fetch the data from the api
    const fetchData = async () => {
      if (keycloak) {
        try {
          const response = await fetch(
            PROVIDERS_ADMIN_API_ROUTE + "?size=" + size + "&page=" + page,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${keycloak.token}`,
              },
            },
          );
          const json = await response.json();
          setData(json);
        } catch (error) {
          console.log(error);
        }
      }
    };
    fetchData();
    setTriggerFetch(false);
  }, [searchParams, triggerFetch, keycloak]);

  // prepare the list of supported providers
  const providers: React.ReactNode[] = [];

  // prep the page navigation element
  let pageNav = null;
  // prep the element that holds the page next, prev controls
  let pageFlip = null;

  const pageSize = parseInt(searchParams.get("size") || "");

  // if data is fetched and content exists do
  if (data && data.content) {
    // for each provider in data prepare its view
    for (const item of data.content) {
      // prep the supported modes element for the provider
      const actions = [];
      for (const actionItem of item.resolution_modes) {
        actions.push(
          <span
            className="badge badge-small bg-secondary mx-1"
            key={actionItem.mode}
          >
            {actionItem.name}
          </span>,
        );
      }
      // push to the provider list the element view of a provider
      // the provider is rendered as a card with
      // provider name and prefix in the card-header
      // provider description in the card-body
      // provider supported modes in the card-footer

      const disableControls =
        !admin && providerAdmin && item.status === "APPROVED";

      providers.push(
        <li key={item.type} className="m-4">
          <div
            className="card"
            style={{
              border: "1px dashed black",
              backgroundColor:
                item.status && item.status === "PENDING" ? "#fff7e0" : "",
            }}
          >
            <div className="card-header">
              <div className="d-flex justify-content-between">
                <div>
                  <span
                    style={{ color: "black", border: "1px black solid" }}
                    className="badge badge-small bg-warning"
                  >
                    {item.type}
                  </span>
                  <strong style={{ marginLeft: "0.6rem" }}>{item.name}</strong>
                </div>
                {(admin || providerAdmin) && (
                  <div>
                    <Button
                      className="me-2 mb-1 border-black"
                      size="sm"
                      variant={
                        item.status === "APPROVED" ? "success" : "warning"
                      }
                      onClick={() => {
                        handleApproveOpenModal(item);
                      }}
                      disabled={providerAdmin}
                    >
                      {item.status && item.status === "APPROVED" ? (
                        <FaCheck />
                      ) : (
                        <FaCog />
                      )}{" "}
                      {item.status}
                    </Button>
                    <Link
                      to={`/managed-pids/view/${item.id}`}
                      className="btn me-2 btn-sm mb-1 btn-outline-dark"
                    >
                      <FaInfoCircle /> Details
                    </Link>
                    {!disableControls ? (
                      <Link
                        to={`/managed-pids/edit/${item.id}`}
                        className="btn btn-sm mb-1 btn-outline-dark"
                      >
                        <FaEdit /> Edit
                      </Link>
                    ) : (
                      <span className="btn btn-sm mb-1 btn-outline-dark disabled">
                        <FaEdit /> Edit
                      </span>
                    )}
                    <Button
                      className="ms-2 mb-1"
                      size="sm"
                      variant="outline-danger"
                      onClick={() => {
                        handleDeleteOpenModal(item);
                      }}
                      disabled={disableControls}
                    >
                      <FaTrashAlt /> Delete
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="card-body">{item.description}</div>
            {actions.length > 0 && (
              <div className="card-footer">
                <div
                  className={`d-flex ${
                    admin && item.user_id
                      ? "justify-content-between"
                      : "justify-content-end"
                  }`}
                >
                  {admin && item.user_id && (
                    <div>
                      <small className="text-secondary me-2">
                        created by:{" "}
                      </small>
                      <strong className="badge bg-secondary">
                        <FaUser className="me-1" />
                        {item.user_id}
                      </strong>
                    </div>
                  )}
                  <div>
                    <small className="text-secondary mx-2">modes:</small>
                    {actions}
                  </div>
                </div>
              </div>
            )}
          </div>
        </li>,
      );
    }

    // if links exist render the page flip element
    if (data.links && data.links.length > 0) {
      const start = (data.number_of_page - 1) * pageSize;
      const end = start + data.content.length;

      pageFlip = (
        <div className="d-flex justify-content-between">
          <div>
            {start > 0 && (
              <>
                <Link
                  className="btn btn-primary btn-sm mx-2"
                  to={"./?size=" + pageSize + "&page=1"}
                >
                  First
                </Link>
                <Link
                  className="btn  btn-primary btn-sm mx-2"
                  to={
                    "./?size=" + pageSize + "&page=" + (data.number_of_page - 1)
                  }
                >
                  ← Prev
                </Link>
              </>
            )}
            <span className="mx-4">
              <strong>{start + 1}</strong> to <strong>{end}</strong> out of{" "}
              <strong>{data.total_elements}</strong>
            </span>
            {end < data.total_elements && (
              <>
                <Link
                  to={
                    "./?size=" + pageSize + "&page=" + (data.number_of_page + 1)
                  }
                  className="btn  btn-primary btn-sm mx-2"
                >
                  Next →
                </Link>
                <Link
                  to={"./?size=" + pageSize + "&page=" + data.total_pages}
                  className="btn  btn-primary btn-sm mx-2"
                >
                  Last
                </Link>
              </>
            )}
          </div>
        </div>
      );
    }

    // here render the page navigation footer
    pageNav = (
      <div className="d-flex justify-content-between">
        <DeleteModal
          show={deleteModalConfig.show}
          title={deleteModalConfig.title}
          message={deleteModalConfig.message}
          itemId={deleteModalConfig.itemId}
          itemName={deleteModalConfig.itemName}
          onHide={() => {
            setDeleteModalConfig({ ...deleteModalConfig, show: false });
          }}
          onDelete={() => {
            handleDeleteConfirmed(deleteModalConfig.itemId);
          }}
        />
        <StatusModal
          show={statusModalConfig.show}
          itemId={statusModalConfig.itemId}
          itemName={statusModalConfig.itemName}
          status={statusModalConfig.status}
          onHide={() => {
            setStatusModalConfig({ ...statusModalConfig, show: false });
          }}
          onAction={() => {
            if (statusModalConfig.status === "APPROVED") {
              handleStatusConfirmed(statusModalConfig.itemId, "PENDING");
            } else {
              handleStatusConfirmed(statusModalConfig.itemId, "APPROVED");
            }
          }}
        />

        {/* This is the optional element to flip between pages */}
        {pageFlip}
        {/* This is the element to select page size */}
        <div>
          <span className="mx-1">results per page: </span>
          <select
            name="per-page"
            value={searchParams.get("size") || "20"}
            id="per-page"
            onChange={handleChangeSize}
          >
            <option value="5">5</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>
    );
  }

  return (
    <>
      <Alert variant="success" className="mt-2">
        <FaIdCard size="1.6rem" className="me-2" /> You have logged in as{" "}
        <strong>{userid}</strong> having the{" "}
        {roles.length > 1 ? "roles" : "role"} of:{" "}
        <strong>{roles.join(", ")}</strong>
      </Alert>
      <div className="my-2">
        <div className="d-flex justify-content-between">
          <div>
            <h5>Managed Pids:</h5>
          </div>
          {(admin || providerAdmin) && (
            <div>
              <Link className="btn-outline-dark btn" to="/managed-pids/add">
                <FaPlusCircle /> Add new PID provider
              </Link>
            </div>
          )}
        </div>
        {providers.length ? (
          <ul className="list-unstyled">{providers}</ul>
        ) : (
          <Alert variant="warning" className="mt-4 text-center">
            <FaExclamationTriangle size="1.8rem" />
            <br />
            No PID Provider entries found.
            <br />
            Please create a <Link to="/managed-pids/add">new one...</Link>
          </Alert>
        )}
        <hr />
        {pageNav}
      </div>
    </>
  );
}

export default ManagedPids;
