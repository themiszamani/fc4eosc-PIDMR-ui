import React, { useState, useEffect, useContext, useCallback } from "react";
import DataTable, { TableColumn } from "react-data-table-component";
import { Button, Form } from "react-bootstrap";
import { RoleChangeRequest } from "./types";
import { FaUsersCog } from "react-icons/fa";
import { AuthContext } from "./auth";
import { toast } from "react-hot-toast";

// API endpoint declared in env variable
const PIDMR_API = import.meta.env.VITE_PIDMR_API;
const PROMOTE_USER_ROLE_API_ROUTE = `${PIDMR_API}/v1/admin/users/role-change-requests`;

const RoleChangeRequestsTable: React.FC = () => {
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

  const [requests, setRequests] = useState<RoleChangeRequest[]>([]);
  const { keycloak } = useContext(AuthContext)!;
  const [filterText, setFilterText] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const fetchRoleChangeRequests = useCallback(async () => {
    if (keycloak) {
      try {
        const response = await fetch(PROMOTE_USER_ROLE_API_ROUTE, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${keycloak.token}`,
          },
        });
        if (!response.ok) {
          throw new Error(
            `Error fetching role change requests: ${response.statusText}`,
          );
        }
        const data = await response.json();
        setRequests(data.content);
      } catch (error) {
        console.error("Error fetching role change requests:", error);
        toast.error("Error fetching role change requests. Please try again.");
      }
    }
  }, [keycloak]);

  useEffect(() => {
    fetchRoleChangeRequests();
  }, [fetchRoleChangeRequests]);

  const UpdateStatus = async (row: RoleChangeRequest, status: string) => {
    if (keycloak) {
      try {
        const response = await fetch(
          `${PROMOTE_USER_ROLE_API_ROUTE}/${row.id}/update-status`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${keycloak.token}`,
            },
            body: JSON.stringify({ status: status }),
          },
        );

        if (response.ok) {
          toast.success(`User request ${status}!`);
          fetchRoleChangeRequests();
        } else {
          const errorData = await response.json();
          toast.error(
            <div>
              <strong>Error updating request status:</strong>
              <br />
              <span>{errorData.message}</span>
            </div>,
          );
        }
      } catch (error: unknown) {
        console.error("Error updating request status:", error);
        toast.error("Backend error while trying to update the request status.");
      }
    }
  };

  const columns: TableColumn<RoleChangeRequest>[] = [
    {
      name: "Name",
      selector: (row) => row.name,
      cell: (row) => (
        <div className="row">
          <div>
            {row.name} {row.surname}{" "}
          </div>
          <div style={{ color: "gray", fontSize: "12px" }}>
            id: {row.user_id.substring(0, 10)}..
          </div>
        </div>
      ),
      sortable: true,
      wrap: true,
      width: "200px",
    },
    {
      name: "Email",
      selector: (row) => row.email,
      sortable: true,
      wrap: true,
    },
    { name: "Role", selector: (row) => row.role, sortable: true, wrap: true },
    {
      name: "Description",
      selector: (row) => row.description,
      sortable: true,
      wrap: true,
      width: "140px",
    },
    {
      name: "Requested On",
      selector: (row) => row.requested_on.substring(0, 16).replace("T", " "),
      sortable: true,
      width: "180px",
    },
    {
      name: "Status",
      selector: (row) => row.status,
      sortable: true,
      width: "110px",
    },
    {
      name: "Actions",
      cell: (row: RoleChangeRequest) => (
        <div>
          {row.status === "PENDING" && (
            <>
              <div
                className="btn btn-sm btn-success"
                onClick={() => UpdateStatus(row, "APPROVED")}
              >
                Approve
              </div>
              <div
                className="btn btn-sm btn-danger m-1"
                onClick={() => UpdateStatus(row, "REJECTED")}
              >
                Reject
              </div>
            </>
          )}
          {row.status === "REJECTED" && (
            <div
              className="btn btn-sm btn-success"
              onClick={() => UpdateStatus(row, "APPROVED")}
            >
              Approve
            </div>
          )}
          {row.status === "APPROVED" && (
            <div
              className="btn btn-sm btn-danger"
              onClick={() => UpdateStatus(row, "REJECTED")}
            >
              Reject
            </div>
          )}
        </div>
      ),
      width: "180px",
    },
  ];

  const handleClear = () => {
    setFilterText("");
    setFilterStatus("");
  };

  const filteredRequests = requests.filter((request) => {
    const matchesText =
      request.name.toLowerCase().includes(filterText.toLowerCase()) ||
      request.surname.toLowerCase().includes(filterText.toLowerCase()) ||
      request.email.toLowerCase().includes(filterText.toLowerCase()) ||
      request.role.toLowerCase().includes(filterText.toLowerCase()) ||
      request.description.toLowerCase().includes(filterText.toLowerCase());

    const matchesStatus = filterStatus
      ? request.status.toLowerCase() === filterStatus.toLowerCase()
      : true;

    return matchesText && matchesStatus;
  });

  return (
    <div className="mt-4 mb-4">
      <h5>
        <FaUsersCog className="me-2" />
        Role Change Requests
      </h5>
      <div className="row mb-3 mt-3">
        <div className="col-4">
          <Form.Select
            id="contactSelection"
            name="formSelectContact"
            aria-label="Contact Selection"
            onChange={(e) => setFilterStatus(e.target.value)}
            value={filterStatus}
          >
            <option id="All" value="">
              Select status
            </option>
            <option key="approved" value="APPROVED">
              APPROVED
            </option>
            <option key="pending" value="PENDING">
              PENDING
            </option>
            <option key="rejected" value="REJECTED">
              REJECTED
            </option>
          </Form.Select>
        </div>
        <div className="col-7">
          <Form.Control
            id="searchField"
            name="filterText"
            aria-label="Input for searching the list"
            placeholder="Search ..."
            value={filterText}
            aria-describedby="button-addon2"
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
        <div className="col-1">
          <Button
            variant="outline-primary"
            id="button-addon2"
            onClick={handleClear}
          >
            Clear
          </Button>
        </div>
      </div>
      <div className="mt-4">
        <DataTable
          columns={columns}
          data={filteredRequests}
          defaultSortFieldId={1}
          theme="default"
          customStyles={customStyles}
          pagination
        />
      </div>
    </div>
  );
};

export default RoleChangeRequestsTable;
