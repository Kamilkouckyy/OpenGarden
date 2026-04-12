import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import TaskStatusModal from "./TaskStatusModal";
import "./TaskDetailCard.css";

const MOCK_TASKS = [
  {
    id: 1,
    title: "Weeding garden bed #3",
    resolver: "Eva Nováková",
    deadline: "2024-04-30",
    assignment: "Zahrádka A3",
    description:
      "Weed garden bed #3, remove all the weeds around the vegetables.\nMake sure to remove the roots completely.",
    status: "in_progress",
    author: "Anna",
  },
  {
    id: 2,
    title: "Sweep the entire garden",
    resolver: "Anna",
    deadline: "2024-05-03",
    assignment: "Whole garden",
    description: "Sweep all common paths and shared areas in the garden.",
    status: "open",
    author: "Anna",
  },
  {
    id: 3,
    title: "Repair rake",
    resolver: "David",
    deadline: "2024-05-08",
    assignment: "Equipment",
    description: "Check the damaged rake and repair or replace the broken handle.",
    status: "done",
    author: "David",
  },
];

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
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

  const taskFromData = useMemo(
    () => MOCK_TASKS.find((item) => String(item.id) === String(id)),
    [id]
  );

  const [task, setTask] = useState(taskFromData);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(taskFromData?.status || "open");
  const [formData, setFormData] = useState(taskFromData);

  if (!task) {
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

  const handleSaveEdit = () => {
    setTask(formData);
    setSelectedStatus(formData.status);
    setIsEditMode(false);
  };

  const handleCancelEdit = () => {
    setFormData(task);
    setIsEditMode(false);
  };

  const handleDelete = () => {
    if (!window.confirm(`Do you really want to delete task "${task.title}"?`)) return;
    window.alert(`Deleting task "${task.title}" will be connected later.`);
  };

  const handleOpenStatusModal = () => {
    setSelectedStatus(task.status);
    setShowStatusModal(true);
  };

  const handleSaveStatus = () => {
    setTask((prev) => ({
      ...prev,
      status: selectedStatus,
    }));
    setFormData((prev) => ({
      ...prev,
      status: selectedStatus,
    }));
    setShowStatusModal(false);
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
                  {task.description.split("\n").map((line, index) => (
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