import React, { useEffect, useState } from "react";
import { Card, Button, Row, Col, Badge, Spinner, Container, Modal, Form } from "react-bootstrap";
import axios from "axios";
import { useAuth } from "../../Context/AuthContext";
import { FaCheckCircle, FaExclamationTriangle, FaUserCircle } from "react-icons/fa";

const SuperAdminDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [actionType, setActionType] = useState("");
  const [note, setNote] = useState("");
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: "", reason: "" });
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const fetchFlaggedComplaints = async () => {
      try {
        setLoading(true);
        const { data } = await axios.post(
          "http://localhost:6101/admin-api/superadmin/flagged-complaints",
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
  }, [user]);

  useEffect(() => {
    let filtered = [...complaints];
    if (filters.category) filtered = filtered.filter(c => c.category === filters.category);
    if (filters.reason) filtered = filtered.filter(c => c.flagged.reason === filters.reason);
    setFilteredComplaints(filtered);
  }, [filters, complaints]);

  const handleAction = async (complaintId) => {
    try {
      await axios.post(
        `http://localhost:6101/admin-api/superadmin/complaints/${complaintId}/action`,
        { action: actionType, note, email: user?.email }
      );
      setComplaints(prev => prev.filter(c => c.complaint_id !== complaintId));
      setSelectedComplaint(null);
      setNote("");
      alert(`Complaint marked as '${actionType}' successfully!`);
    } catch (err) {
      console.error("Error performing action:", err);
      alert("Failed to perform action");
    }
  };

  const emptyState = (
    <div className="text-center mt-5">
      <FaExclamationTriangle size={60} className="text-muted mb-3" />
      <h5 className="text-muted">No flagged complaints available</h5>
      <p className="text-muted">Everything looks clean for now.</p>
    </div>
  );

  const uniqueCategories = [...new Set(complaints.map(c => c.category))];
  const uniqueReasons = [...new Set(complaints.map(c => c.flagged.reason))];

  return (
    <Container className="py-5">
      <h2 className="text-center mb-4 fw-bold">⚠️ Super Admin - Flagged Complaints</h2>

      {/* Filters */}
      <Row className="mb-4 justify-content-center" style={{ gap: "5px" }}>
        <Col xs={12} md={4}>
          <Form.Select
            value={filters.category}
            onChange={e => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">Filter by Category</option>
            {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </Form.Select>
        </Col>
<Col xs={12} sm={6} md={6} lg={4}>
  <Form.Select
    value={filters.reason}
    onChange={e => setFilters({ ...filters, reason: e.target.value })}
  >
    <option value="">Filter by Reason</option>
    {uniqueReasons.map(reason => (
      <option key={reason} value={reason}>{reason}</option>
    ))}
  </Form.Select>
</Col>

      </Row>

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading flagged complaints...</p>
        </div>
      ) : filteredComplaints.length === 0 ? (
        emptyState
      ) : (
        <Row xs={1} sm={2} md={3} className="g-4">
          {filteredComplaints.map(complaint => (
            <Col key={complaint.complaint_id}>
              <Card className="shadow-sm border-0 rounded-3 h-100 position-relative p-3">
                {/* Category Badge top-left */}
                <Badge
                  bg="primary"
                  style={{
                    position: "absolute",
                    top: "15px",
                    left: "15px",
                    padding: "0.4em 0.7em",
                    fontSize: "0.75rem",
                    borderRadius: "0.75rem",
                    backgroundColor: "#007bff",
                    color: "#fff",
                    fontWeight: "500"
                  }}
                >
                  {complaint.category}
                </Badge>

                {/* Title */}
                <Card.Body className="d-flex flex-column mt-4">
                  <h5 className="fw-bold mb-2">{complaint.title}</h5>

                  {/* Description */}
                  <Card.Text className="text-secondary mb-3">
                    {expanded[complaint.complaint_id] || complaint.description.length <= 120
                      ? complaint.description
                      : complaint.description.slice(0, 120) + "..."}
                    {complaint.description.length > 120 && (
                      <Button
                        variant="link"
                        className="p-0 ms-1"
                        style={{ fontSize: "0.85rem" }}
                        onClick={() =>
                          setExpanded(prev => ({ ...prev, [complaint.complaint_id]: !prev[complaint.complaint_id] }))
                        }
                      >
                        {expanded[complaint.complaint_id] ? "Show Less" : "Read More"}
                      </Button>
                    )}
                  </Card.Text>

                 {/* User Info */}
<div className="mb-3 small text-muted">
  <div className="d-flex align-items-center gap-2 mb-1">
    <FaUserCircle size={18} /> <span><b>User:</b> {complaint.user_id}</span>
  </div>
  <div className="mb-1">
    <b>Flagged By:</b> {complaint.flagged.flaggedBy}
  </div>
  <div className="mb-1">
    <b>Reason:</b>{" "}
    <Badge
      bg="warning"
      text="dark"
      style={{
        padding: "0.3em 0.5em",
        fontSize: "0.75rem",
        borderRadius: "0.5rem",
        fontWeight: "500"
      }}
    >
      {complaint.flagged.reason}
    </Badge>
  </div>

  {/* Show Note if available */}
  {complaint.flagged.note && (
    <div className="mt-1">
      <b>Note:</b>{" "}
      <span className="text-dark fst-italic">
        {complaint.flagged.note}
      </span>
    </div>
  )}
</div>


                  {/* Action Buttons */}
                  <div className="mt-auto d-flex gap-2">
                    <Button
                      variant="success"
                      className="flex-fill"
                      onClick={() => {
                        setSelectedComplaint(complaint);
                        setActionType("valid");
                      }}
                    >
                      <FaCheckCircle /> Mark as Valid
                    </Button>
                    <Button
                      variant="warning"
                      className="flex-fill"
                      onClick={() => {
                        setSelectedComplaint(complaint);
                        setActionType("warn");
                      }}
                    >
                      <FaExclamationTriangle /> Warn User
                    </Button>
                  </div>
                </Card.Body>

                {/* Footer */}
                <Card.Footer className="text-end text-muted small" style={{ backgroundColor: "transparent" }}>
                  ID: {complaint.complaint_id}
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}

{/* Action Modal */}
{selectedComplaint && (
  <Modal show={!!selectedComplaint} onHide={() => setSelectedComplaint(null)} centered>
    <Modal.Header closeButton>
      <Modal.Title className="fw-bold text-primary">
        Confirm Action
      </Modal.Title>
    </Modal.Header>

    <Modal.Body>
      <p className="mb-3">
        Are you sure you want to{" "}
        <b className={actionType === "valid" ? "text-success" : "text-warning"}>
          {actionType === "valid" ? "mark as Valid" : "Warn User"}
        </b>{" "}
        for this complaint?
      </p>

      <h6 className="fw-bold mb-2">{selectedComplaint.title}</h6>
      <p className="text-muted small mb-3">
        {selectedComplaint.description}
      </p>

      {/* Note Input */}
      <Form.Group>
        <Form.Label className="fw-semibold">Note (Optional)</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add an internal note for record..."
        />
      </Form.Group>
    </Modal.Body>

    <Modal.Footer className="d-flex justify-content-between">
      <Button variant="outline-secondary" onClick={() => setSelectedComplaint(null)}>
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


    </Container>
  );
};

export default SuperAdminDashboard;
