import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import TaskStatusModal from "./TaskStatusModal";
import { taskApi } from "../../services/api/taskApi";
import { subscribeToDbChanges } from "../../services/api/mockDb";
import "./TaskDetailCard.css";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getStatusText(status) {
  if (status === "open") return "Open";
  if (status === "in_progress") return "In progress";
  if (status === "done") return "Done";
  return status;
}

export default function TaskDetailCard({ currentUser }) {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("open");
  const [formData, setFormData] = useState(null);

  const loadTask = async () => {
    setIsLoading(true);
    try {
      const item = await taskApi.getById(id);
      setTask(item);
      setFormData(item);
      setSelectedStatus(item?.status || "open");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTask();

    const unsubscribe = subscribeToDbChanges(() => {
      loadTask();
    });

    return unsubscribe;
  }, [id]);

  if (isLoading) {
    return (
      <section className="task-detail">
        <div className="task-detail__card">
          <p className="task-detail__empty">Loading task...</p>
        </div>
      </section>
    );
  }

  if (!task || !formData) {
    return (
      <section className="task-detail">
        <div className="task-detail__card">
          <p className="task-detail__empty">Task was not found.</p>
          <div className="task-detail__footer-actions">
            <Link to="/tasks" className="task-detail__btn task-detail__btn--secondary">
              Return to Task Overview
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const isAdmin = currentUser?.role === "Správce";
  const isAuthor = currentUser?.name === task.author;
  const canEdit = isAdmin || isAuthor;

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditClick = () => {
    setFormData(task);
    setIsEditMode(true);
  };

  const handleSaveEdit = async () => {
    await taskApi.update(task.id, {
      title: formData.title,
      resolver: formData.resolver,
      deadline: formData.deadline,
      assignment: formData.assignment,
      description: formData.description,
      status: formData.status,
    });

    setIsEditMode(false);
    await loadTask();
  };

  const handleCancelEdit = () => {
    setFormData(task);
    setIsEditMode(false);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Do you really want to delete task "${task.title}"?`)) return;
    await taskApi.remove(task.id);
    window.location.href = "/tasks";
  };

  const handleOpenStatusModal = () => {
    setSelectedStatus(task.status);
    setShowStatusModal(true);
  };

  const handleSaveStatus = async () => {
    await taskApi.updateStatus(task.id, selectedStatus);
    setShowStatusModal(false);
    await loadTask();
  };

  return (
    <>
      <section className="task-detail">
        <div className="task-detail__card">
          <div className="task-detail__form">
            <div className="task-detail__field">
              <label className="task-detail__label">Title</label>
              {isEditMode ? (
                <input
                  className="task-detail__input"
                  value={formData.title}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                />
              ) : (
                <div className="task-detail__value-box">{task.title}</div>
              )}
            </div>

            <div className="task-detail__field">
              <label className="task-detail__label">Resolver</label>
              {isEditMode ? (
                <input
                  className="task-detail__input"
                  value={formData.resolver}
                  onChange={(e) => handleFieldChange("resolver", e.target.value)}
                />
              ) : (
                <div className="task-detail__value-box">{task.resolver}</div>
              )}
            </div>

            <div className="task-detail__field task-detail__field--small">
              <label className="task-detail__label">Task deadline</label>
              {isEditMode ? (
                <div className="task-detail__deadline-wrap">
                  <input
                    className="task-detail__input task-detail__input--small"
                    value={formData.deadline}
                    onChange={(e) => handleFieldChange("deadline", e.target.value)}
                    placeholder="YYYY-MM-DD"
                  />
                  <input
                    type="date"
                    className="task-detail__input task-detail__input--date"
                    value={formData.deadline}
                    onChange={(e) => handleFieldChange("deadline", e.target.value)}
                  />
                </div>
              ) : (
                <div className="task-detail__value-box task-detail__value-box--small">
                  {formatDate(task.deadline)}
                </div>
              )}
            </div>

            <div className="task-detail__field task-detail__field--small">
              <label className="task-detail__label">Assignment</label>
              {isEditMode ? (
                <input
                  className="task-detail__input task-detail__input--small"
                  value={formData.assignment}
                  onChange={(e) => handleFieldChange("assignment", e.target.value)}
                />
              ) : (
                <div className="task-detail__value-box task-detail__value-box--small">
                  {task.assignment}
                </div>
              )}
            </div>

            <div className="task-detail__field">
              <label className="task-detail__label">Description</label>
              {isEditMode ? (
                <textarea
                  className="task-detail__textarea"
                  rows={5}
                  value={formData.description}
                  onChange={(e) => handleFieldChange("description", e.target.value)}
                />
              ) : (
                <div className="task-detail__value-box task-detail__value-box--textarea">
                  {task.description?.split("\n").map((line, index) => (
                    <p key={index} className="task-detail__paragraph">
                      {line}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="task-detail__status-row">
              <span className="task-detail__label">Status</span>

              <div className="task-detail__status-right">
                <div className="task-detail__value-box task-detail__value-box--status">
                  {getStatusText(task.status)}
                </div>

                <button
                  type="button"
                  className="task-detail__btn"
                  onClick={handleOpenStatusModal}
                >
                  Status Update
                </button>
              </div>
            </div>

            <div className="task-detail__edit-row">
              {canEdit && !isEditMode && (
                <>
                  <button
                    type="button"
                    className="task-detail__btn"
                    onClick={handleEditClick}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="task-detail__btn task-detail__btn--danger"
                    onClick={handleDelete}
                  >
                    Delete
                  </button>
                </>
              )}

              {canEdit && isEditMode && (
                <>
                  <button
                    type="button"
                    className="task-detail__btn"
                    onClick={handleSaveEdit}
                  >
                    Save
                  </button>

                  <button
                    type="button"
                    className="task-detail__btn task-detail__btn--secondary"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>

            <div className="task-detail__divider" />

            <div className="task-detail__footer-actions">
              <Link to="/tasks" className="task-detail__btn task-detail__btn--secondary">
                Return to Task Overview
              </Link>
            </div>
          </div>
        </div>
      </section>

      <TaskStatusModal
        isOpen={showStatusModal}
        selectedStatus={selectedStatus}
        onChange={setSelectedStatus}
        onSave={handleSaveStatus}
        onCancel={() => setShowStatusModal(false)}
      />
    </>
  );
}