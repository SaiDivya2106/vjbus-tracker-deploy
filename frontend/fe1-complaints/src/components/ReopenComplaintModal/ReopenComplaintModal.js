import React, { useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import "./ReopenComplaintModal.css";

const ReopenComplaintModal = ({
  show,
  onHide,
  complaintId,
  userEmail,
  baseUrl,
  onSuccess,
}) => {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = comment.trim();
    if (!trimmed || trimmed.length < 5) {
      toast.error("Comment must be at least 5 characters long", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("authToken");
      await axios.post(
        `${baseUrl}/user-api/reopen-complaint/${complaintId}`,
        {
          text: trimmed,
          userEmail,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Let the parent component (UserDashboard) show the success toast
      setComment("");
      onHide();
      onSuccess?.();
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Failed to reopen complaint";
      toast.error(errorMsg, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <span>❓</span> Why Isn't Your Issue Fixed?
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group>
          <Form.Label className="fw-semibold">
            Please explain what's still wrong:
          </Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            placeholder="Describe the remaining issue or concerns..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="reopen-textarea"
          />
          <small className="text-muted d-block mt-2">
            Minimum 5 characters required. Your comment will be sent to the
            admin team.
          </small>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={onHide}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={
            isSubmitting || !comment.trim() || comment.trim().length < 5
          }
        >
          {isSubmitting ? "Submitting..." : "Reopen & Notify Admin"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReopenComplaintModal;
