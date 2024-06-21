import { useState, useEffect, useContext } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AuthContext } from "./auth";
import {
  FaCheck,
  FaCog,
  FaEdit,
  FaExclamationTriangle,
  FaIdCard,
  FaList,
  FaPlusCircle,
  FaTrashAlt,
} from "react-icons/fa";
import { ApiResponse, Provider } from "./types";
import { Alert, Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import DataTable, { TableColumn } from "react-data-table-component";
import { DeleteModal } from "./DeleteModal";
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

const tooltipList = <Tooltip id="tooltip">View PID</Tooltip>;
const tooltipEdit = <Tooltip id="tooltip">Edit PID</Tooltip>;
const tooltipDelete = <Tooltip id="tooltip">Delete PID</Tooltip>;
const tooltipAPPROVE = <Tooltip id="tooltip">Change to Approved</Tooltip>;
const tooltipPENDING = <Tooltip id="tooltip">Change to Pending</Tooltip>;

const customStyles = {
  headCells: {
    style: {
      color: "#202124",
      fontSize: "16px",
      backgroundColor: "#F4F6F8",
    },
  },
  rows: {
    style: {
      fontSize: "14px",
    },
  },
};

const ManagedPids = () => {
  const { roles, userid } = useContext(AuthContext)!;
  const admin = roles.includes("admin");
  const providerAdmin = roles.includes("provider_admin");

  const [data, setData] = useState<Provider[]>([]);
  const [triggerFetch, setTriggerFetch] = useState(true);
  const [searchParams] = useSearchParams();

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
          body: JSON.stringify({ status }),
        });

        if (response.ok) {
          setStatusModalConfig({
            ...statusModalConfig,
            show: false,
            status: "",
            itemId: "",
            itemName: "",
          });
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

  useEffect(() => {
    const fetchData = async () => {
      let allData: Provider[] = [];
      let page = 1;
      const size = 100;
      let totalPages = 1;

      if (keycloak) {
        try {
          while (page <= totalPages) {
            const response = await fetch(
              `${PROVIDERS_ADMIN_API_ROUTE}?size=${size}&page=${page}`,
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${keycloak.token}`,
                },
              },
            );
            const json: ApiResponse = await response.json();
            allData = allData.concat(json.content);
            totalPages = json.total_pages;
            page += 1;
          }
          setData(allData);
        } catch (error) {
          console.log(error);
        }
      }
    };

    fetchData();
    setTriggerFetch(false);
  }, [searchParams, triggerFetch, keycloak]);

  const createBadges = (row: Provider) => {
    return (
      <>
        {row.resolution_modes.map((mode) => (
          <span className="badge badge-small bg-secondary mx-1" key={mode.mode}>
            {mode.name}
          </span>
        ))}
      </>
    );
  };

  const columns: TableColumn<Provider>[] = [
    {
      name: "Name",
      selector: (row) => row.name,
      sortable: true,
      cell: (row) => (
        <>
          <span
            style={{ color: "black", border: "1px black solid" }}
            className="badge badge-small bg-warning"
          >
            {row.type}
          </span>
          <strong style={{ marginLeft: "0.6rem" }}>{row.name}</strong>
        </>
      ),
      wrap: true,
      width: "300px",
    },
    {
      name: "Description",
      selector: (row) => row.description,
      cell: (row) => (
        <div className="m-1">
          {row.description.length > 100
            ? row.description.substring(0, 100) + "..."
            : row.description}
        </div>
      ),
      wrap: true,
      width: "500px",
    },
    {
      name: "Modes",
      cell: (row) => <div className="m-2">{createBadges(row)}</div>,
      wrap: true,
    },
    {
      name: "Status",
      selector: (row) => row.status || "",
      cell: (row) => <div className="m-1">{row.status}</div>,
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="btn-group">
          <OverlayTrigger placement="top" overlay={tooltipList}>
            <Button
              variant="light"
              size="sm"
              onClick={() =>
                (window.location.href = `/managed-pids/view/${row.id}`)
              }
            >
              <FaList />
            </Button>
          </OverlayTrigger>
          <OverlayTrigger placement="top" overlay={tooltipEdit}>
            <Button
              variant="light"
              size="sm"
              onClick={() =>
                (window.location.href = `/managed-pids/edit/${row.id}`)
              }
            >
              <FaEdit />
            </Button>
          </OverlayTrigger>
          <OverlayTrigger placement="top" overlay={tooltipDelete}>
            <Button
              variant="light"
              size="sm"
              onClick={() => handleDeleteOpenModal(row)}
            >
              <FaTrashAlt />
            </Button>
          </OverlayTrigger>
          <OverlayTrigger
            placement="top"
            overlay={
              row.status === "APPROVED" ? tooltipPENDING : tooltipAPPROVE
            }
          >
            <Button
              variant="light"
              size="sm"
              onClick={() => handleApproveOpenModal(row)}
            >
              {row.status === "APPROVED" ? <FaCheck /> : <FaCog />}
            </Button>
          </OverlayTrigger>
        </div>
      ),
    },
  ];

  return (
    <>
      <Alert variant="success" className="mt-2">
        <FaIdCard size="1.6rem" className="me-2" /> You have logged in as{" "}
        <strong>{userid}</strong> having the{" "}
        {roles.length > 1 ? "roles" : "role"} of:{" "}
        <strong>{roles.join(", ")}</strong>
      </Alert>
      <div className="d-flex justify-content-between">
        <div>
          <h5>Managed Pids:</h5>
        </div>
        {(admin || providerAdmin) && (
          <div className="mb-2">
            <Link className="btn-outline-dark btn" to="/managed-pids/add">
              <FaPlusCircle /> Add new PID types
            </Link>
          </div>
        )}
      </div>
      {data && data.length > 0 ? (
        <DataTable
          columns={columns}
          data={data}
          defaultSortFieldId={1}
          theme="default"
          customStyles={customStyles}
          pagination
        />
      ) : (
        <Alert variant="info">
          <div className="d-flex align-items-center">
            <FaExclamationTriangle size={40} />
            <div className="ms-3">
              <strong>No types!</strong>
              <br />
              It seems there are no PID types yet.
            </div>
          </div>
        </Alert>
      )}

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
    </>
  );
};

export default ManagedPids;
