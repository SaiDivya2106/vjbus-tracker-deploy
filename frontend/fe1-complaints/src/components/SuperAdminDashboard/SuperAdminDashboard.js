

import React, { useEffect, useState } from "react";
import {
  Card,
  Button,
  Row,
  Col,
  Spinner,
  Container,
  Modal,
  Form
} from "react-bootstrap";
import axios from "axios";
import { useAuth } from "../../Context/AuthContext";
import { FaExclamationTriangle, FaUserCircle } from "react-icons/fa";
import "./SuperAdminDashboard.css";
import { isExperimental } from "../../utils/isExperimental";

const SuperAdminDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [actionType, setActionType] = useState("");
  const [note, setNote] = useState("");
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: "", reason: "" });

  // Popup full-card modal
  const [fullViewComplaint, setFullViewComplaint] = useState(null);

  const baseUrl = process.env.REACT_APP_COMPLAINTS_APP_BE_URL;

  // Fetch complaints
  useEffect(() => {
    const fetchFlaggedComplaints = async () => {
      try {
        setLoading(true);
        const { data } = await axios.post(
          `${baseUrl}/admin-api/superadmin/flagged-complaints`,
          { email: user?.email }
        );
        setComplaints(data);
        setFilteredComplaints(data);
      } catch (err) {
        console.error("Error fetching flagged complaints:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.email) fetchFlaggedComplaints();
  }, [user, baseUrl]);

  // Filter complaints
  useEffect(() => {
    let filtered = [...complaints];
    if (filters.category)
      filtered = filtered.filter((c) => c.category === filters.category);
    if (filters.reason)
      filtered = filtered.filter((c) => c.flagged.reason === filters.reason);

    setFilteredComplaints(filtered);
  }, [filters, complaints]);

  const handleAction = async (complaintId) => {
    try {
      await axios.post(
        `${baseUrl}/admin-api/superadmin/complaints/${complaintId}/action`,
        { action: actionType, note, email: user?.email }
      );

      setComplaints((prev) =>
        prev.filter((c) => c.complaint_id !== complaintId)
      );

      setSelectedComplaint(null);
      setNote("");
      alert(`Complaint marked as '${actionType}' successfully!`);
      if (isExperimental) alert("📧 Demo: Action email simulated.");
    } catch (err) {
      console.error("Error performing action:", err);
      alert("Failed to perform action");
    }
  };

  const emptyState = (
    <div className="text-center mt-5">
      <FaExclamationTriangle size={60} className="text-muted mb-3" />
      <h5 className="text-muted">No flagged Requests available</h5>
      <p className="text-muted">Everything looks clean for now.</p>
    </div>
  );

  const uniqueCategories = [...new Set(complaints.map((c) => c.category))];
  const uniqueReasons = [...new Set(complaints.map((c) => c.flagged.reason))];

  // Allowed reasons (keep in sync with flag UI)
  const allowedFlagReasons = [
    "False or Misleading Information",
    "Irrelevant or Non-Complaint Content",
    "Individual-Specific Issue",
    "Other",
  ];

  // Use only allowed reasons for the filter dropdown (show only those present)
  const filteredReasons = allowedFlagReasons.filter((r) => uniqueReasons.includes(r));

  return (
    <div className="superadmin-container">
      <Container>
        <h2 className=" text-center mb-4 fw-bold  page-title">
          ⚠ Super Admin - Flagged Requests
        </h2>

        {/* Filters */}
        {/* Filters */}
        {/* Filters */}
        <Row className="filter-row justify-content-center">
          <Col xs={12} lg={10}>
            <div className="filter-container">
              <div className="filter-box-grid">

                {/* Category */}
                <div className="filter-group">
                  <div className="filter-title">
                    <span className="filter-icon blue">
                      <i className="bi bi-funnel"></i>
                    </span>
                    Filter by Category
                  </div>

                  <Form.Select
                    className="form-select filter-select-bootstrap"
                    value={filters.category}
                    onChange={(e) =>
                      setFilters({ ...filters, category: e.target.value })
                    }
                  >
                    <option value="">All Categories</option>
                    {uniqueCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </Form.Select>
                </div>

                {/* Reason */}
                <div className="filter-group">
                  <div className="filter-title">
                    <span className="filter-icon purple">
                      <i className="bi bi-funnel"></i>
                    </span>
                    Filter by Reason
                  </div>

                  <Form.Select
                    className="form-select filter-select-bootstrap purple-border"
                    value={filters.reason}
                    onChange={(e) =>
                      setFilters({ ...filters, reason: e.target.value })
                    }
                  >
                    <option value="">All Reasons</option>
                    {filteredReasons.length > 0
                      ? filteredReasons.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))
                      : allowedFlagReasons.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                  </Form.Select>
                </div>

              </div>
            </div>
          </Col>
        </Row>



        {/* Loading */}
        {loading ? (
          <div className="text-center my-5">
            <Spinner animation="border" variant="light" />
            <p className="mt-3 text-muted">Loading flagged requests...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          emptyState
        ) : (
          <div className="filter-container">
            <Row className="gx-4 gy-4">
              {filteredComplaints.map((complaint) => {
                const words = complaint.description.split(" ");
                const shortDesc = words.slice(0, 25).join(" ");

                return (
                  <Col
                    key={complaint.complaint_id}
                    sm={12}
                    md={6}
                    lg={4}
                  >
                    <Card className="flag-card h-100">
                      <div className="category-chip">{complaint.category}</div>

                      <Card.Body className="flag-body">
                        <h5 className="card-title-custom">{complaint.title}</h5>

                        {/* Description with "View More" */}
                        <Card.Text className="description">
                          {words.length > 25
                            ? shortDesc + "..."
                            : complaint.description}

                          {words.length > 25 && (
                            <Button
                              variant="link"
                              className="read-more"
                              onClick={() => setFullViewComplaint(complaint)}
                            >
                              View More
                            </Button>
                          )}
                        </Card.Text>

                        {/* Details */}
                        <div className="details-section">
                          <div className="detail-row">
                            <span className="detail-label text-dark">User:</span>
                            <span className="">
                              <FaUserCircle size={16} className="user-icon me-1" />
                              {complaint.user_id}
                            </span>
                          </div>

                          <div className="detail-row">
                            <span className="detail-label text-dark">Flagged By:</span>
                            <span className="">
                              {complaint.flagged.flaggedBy}
                            </span>
                          </div>

                          <div className="detail-row">
                            <span className="detail-label text-dark">Reason:</span>
                            <span className="reason-badge">
                              {complaint.flagged.reason}
                            </span>
                          </div>

                          {/* {complaint.flagged.note && (
                          <div className="detail-row">
                            <span className="detail-label text-dark">Note:</span>
                            <span className="">
                              {complaint.flagged.note}
                            </span>
                          </div>
                        )} */}


                          {complaint.flagged.note && (
                            <div className="detail-row">
                              <span className="detail-label text-dark">Note:</span>

                              <span className="note-preview">
                                {complaint.flagged.note.length > 120
                                  ? complaint.flagged.note.slice(0, 120) + "..."
                                  : complaint.flagged.note}

                                {complaint.flagged.note.length > 120 && (
                                  <Button
                                    variant="link"
                                    className="read-more"
                                    onClick={() => setFullViewComplaint(complaint)}
                                  >
                                    View More
                                  </Button>
                                )}
                              </span>
                            </div>
                          )}


                        </div>

                        <hr className="separator" />

                        {/* Buttons */}
                        <div className="btn-row">
                          <Button
                            className="super-btn super-valid"
                            onClick={() => {
                              setSelectedComplaint(complaint);
                              setActionType("valid");
                            }}
                          >
                            ✔ Mark Valid
                          </Button>

                          <Button
                            className="super-btn super-warn"
                            onClick={() => {
                              setSelectedComplaint(complaint);
                              setActionType("warn");
                            }}
                          >
                            ⚠ Warn User
                          </Button>
                        </div>


                        <hr className="separator bottom" />

                        <div className="card-id-footer">
                          ID: {complaint.complaint_id}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </div>
        )}

        {/* ACTION MODAL */}
        {/* ACTION MODAL */}
        {selectedComplaint && (
          <Modal
            show={!!selectedComplaint}
            onHide={() => setSelectedComplaint(null)}
            centered
            className="white-modal"
          >
            <Modal.Header closeButton>
              <Modal.Title className="modal-header-title">
                Confirm Action
              </Modal.Title>
            </Modal.Header>

            <Modal.Body className="confirm-modal-body">
              <p className="confirm-text">
                Are you sure you want to{" "}
                <b
                  className={
                    actionType === "valid"
                      ? "highlight-valid"
                      : "highlight-warn"
                  }
                >
                  {actionType === "valid" ? "mark as Valid" : "Warn User"}
                </b>{" "}
                for this complaint?
              </p>

              {/* Title */}
              <div className="modal-section-title">Title</div>
              <div className="modal-description-box">
                <h5>{selectedComplaint.title}</h5>
              </div>

              {/* Description */}
              <div className="modal-section-title">Description</div>
              <div className="modal-description-box">
                {selectedComplaint.description}
              </div>

              {/* Note Input */}
              <div className="modal-section-title">Note (Optional)</div>
              <Form.Control
                as="textarea"
                rows={3}
                className="form-control note-textarea-bootstrap"
                placeholder="Add an internal note..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />

            </Modal.Body>

            <Modal.Footer className="justify-content-end gap-2">
              <Button
                variant="outline-secondary"
                className="btnsuperadmin"
                onClick={() => setSelectedComplaint(null)}
              >
                Cancel
              </Button>

              <Button
                variant={actionType === "valid" ? "success" : "warning"}
                onClick={() => handleAction(selectedComplaint.complaint_id)}
              >
                Confirm
              </Button>
            </Modal.Footer>


          </Modal>
        )}


        {/* FULL VIEW POPUP */}
        <Modal
          show={!!fullViewComplaint}
          onHide={() => setFullViewComplaint(null)}
          centered
          className="superadmin-detail-modal detail-modal no-scrollbar"
        >
          <Modal.Body>


            <button
              className="modal-close-x"
              onClick={() => setFullViewComplaint(null)}
              aria-label="Close"
            >
              ×
            </button>

            <h2 className="detail-title">Complaint Details</h2>

            <div className="detail-row">
              <div className="detail-label">Title:</div>
              <div className="detail-value">{fullViewComplaint?.title}</div>
            </div>

            <div className="detail-row">
              <div className="detail-label">Description:</div>
              <div className="detail-value">{fullViewComplaint?.description}</div>
            </div>

            <div className="detail-row">
              <div className="detail-label">User:</div>
              <div className="detail-value">{fullViewComplaint?.user_id}</div>
            </div>

            <div className="detail-row">
              <div className="detail-label">Category:</div>
              <div className="detail-value">{fullViewComplaint?.category}</div>
            </div>

            <div className="detail-row">
              <div className="detail-label">Flagged By:</div>
              <div className="detail-value">{fullViewComplaint?.flagged?.flaggedBy}</div>
            </div>

            <div className="detail-row text-white">
              <div className="detail-label">Reason:</div>
              <div className="detail-value reason-box">
                {fullViewComplaint?.flagged?.reason}
              </div>
            </div>

            {fullViewComplaint?.flagged?.note && (
              <div className="detail-row">
                <div className="detail-label">Note:</div>
                <div className="detail-value">{fullViewComplaint?.flagged?.note}</div>
              </div>
            )}

            <div className="d-flex justify-content-center">
              <button
                className="detail-close-btn"
                onClick={() => setFullViewComplaint(null)}
              >
                Close
              </button>
            </div>

          </Modal.Body>
        </Modal>

      </Container>
    </div>
  );
};

export default SuperAdminDashboard;
