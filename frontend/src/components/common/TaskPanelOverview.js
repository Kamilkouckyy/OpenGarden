import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import TaskStatusModal from "./TaskStatusModal";
import TaskCreationForm from "./TaskCreationForm";
import { taskApi } from "../../services/api/taskApi";
import { subscribeToDbChanges } from "../../services/api/mockDb";
import "./TaskPanelOverview.css";

function mapStatusToModalValue(status) {
  if (status === "otevřený") return "open";
  if (status === "rozpracovaný") return "in_progress";
  if (status === "dokončený") return "done";

  if (status === "open") return "open";
  if (status === "in_progress") return "in_progress";
  if (status === "done") return "done";

  return "open";
}

function mapApiStatusToLabel(status) {
  if (status === "open") return "otevřený";
  if (status === "in_progress") return "rozpracovaný";
  if (status === "done") return "dokončený";
  return status;
}

function formatDateForCard(value) {
  if (!value) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("cs-CZ");
}

function normalizeTask(task) {
  return {
    ...task,
    status: mapApiStatusToLabel(task.status),
    dueDate: formatDateForCard(task.deadline),
    assignedTo: task.resolver,
    relatedBed: task.assignment,
  };
}

function TaskPanelOverview({ currentUser }) {
  const navigate = useNavigate();
  const [taskList, setTaskList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("open");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const items = await taskApi.list();
      setTaskList(items.map(normalizeTask));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();

    const unsubscribe = subscribeToDbChanges(() => {
      loadTasks();
    });

    return unsubscribe;
  }, []);

  const resolverOptions = useMemo(
    () => [...new Set(taskList.map((task) => task.assignedTo).filter(Boolean))],
    [taskList]
  );

  const contextOptions = useMemo(
    () => [...new Set(taskList.map((task) => task.relatedBed).filter(Boolean))],
    [taskList]
  );

  const openStatusModal = (task) => {
    setSelectedTaskId(task.id);
    setSelectedStatus(mapStatusToModalValue(task.status));
    setShowStatusModal(true);
  };

  const handleSaveStatus = async () => {
    await taskApi.updateStatus(selectedTaskId, selectedStatus);
    setShowStatusModal(false);
    setSelectedTaskId(null);
    await loadTasks();
  };

  const handleDelete = async (taskId, title) => {
    if (!window.confirm(`Opravdu chcete smazat úkol "${title}"?`)) return;
    await taskApi.remove(taskId);
    await loadTasks();
  };

  const handleCreateTask = async (newTask) => {
    setIsSubmittingCreate(true);
    try {
      await taskApi.create({
        title: newTask.title.trim().startsWith("Úkol:")
          ? newTask.title.trim()
          : `Úkol: ${newTask.title.trim()}`,
        resolver: newTask.assignedTo,
        deadline: newTask.dueDate,
        assignment: newTask.relatedContext,
        description: "",
        status: "open",
        author: currentUser?.name || "",
      });

      setShowCreateForm(false);
      await loadTasks();
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  if (isLoading) {
    return (
      <section className="task-panel">
        <div className="task-panel__shell">
          <div className="task-panel__empty">Načítání úkolů...</div>
        </div>
      </section>
    );
  }

  if (!taskList || taskList.length === 0) {
    return (
      <>
        <section className="task-panel">
          <div className="task-panel__shell">
            <div className="task-panel__header">
              <div className="task-panel__heading">
                <div className="task-panel__heading-icon">☰</div>
                <h1 className="task-panel__title">Seznam Úkolů</h1>
              </div>

              <button
                type="button"
                className="task-panel__add-btn"
                onClick={() => setShowCreateForm(true)}
              >
                + Přidat nový úkol
              </button>
            </div>

            <div className="task-panel__empty">Žádné úkoly k zobrazení</div>
          </div>
        </section>

        <TaskCreationForm
          shown={showCreateForm}
          disabled={isSubmittingCreate}
          resolverOptions={resolverOptions}
          contextOptions={contextOptions}
          onSubmit={handleCreateTask}
          onCancel={() => setShowCreateForm(false)}
        />
      </>
    );
  }

  return (
    <>
      <section className="task-panel">
        <div className="task-panel__shell">
          <div className="task-panel__header">
            <div className="task-panel__heading">
              <div className="task-panel__heading-icon">☰</div>
              <h1 className="task-panel__title">Seznam Úkolů</h1>
            </div>

            <button
              type="button"
              className="task-panel__add-btn"
              onClick={() => setShowCreateForm(true)}
            >
              + Přidat nový úkol
            </button>
          </div>

          <div className="task-panel__list">
            {taskList.map((task) => {
              const canEdit =
                currentUser?.role === "Správce" || currentUser?.name === task.author;

              return (
                <article
                  key={task.id}
                  className={`task-panel__card task-panel__card--${task.color}`}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                >
                  <div className="task-panel__card-header">
                    <h2 className="task-panel__task-title">{task.title}</h2>
                  </div>

                  <div className="task-panel__info">
                    <div className="task-panel__status-row">
                      <span className="task-panel__status-label">Stav:</span>
                      <span className="task-panel__status-text">{task.status}</span>
                    </div>

                    <div className="task-panel__row">
                      <span className="task-panel__label">Termín:</span>
                      <span className="task-panel__value">{task.dueDate}</span>
                    </div>

                    <div className="task-panel__assignment-box">{task.relatedBed}</div>
                  </div>

                  <div
                    className="task-panel__actions"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button
                      type="button"
                      className={`task-panel__button ${
                        task.status === "dokončený"
                          ? "task-panel__button--done"
                          : "task-panel__button--complete"
                      }`}
                      onClick={() => openStatusModal(task)}
                    >
                      {task.status === "dokončený" ? "✔ Hotovo" : "✓ Dokončit"}
                    </button>

                    {canEdit && (
                      <button
                        type="button"
                        className="task-panel__button task-panel__button--edit"
                        onClick={() => navigate(`/tasks/${task.id}`)}
                      >
                        ✎ Upravit
                      </button>
                    )}

                    {canEdit && (
                      <button
                        type="button"
                        className="task-panel__button task-panel__button--delete"
                        onClick={() => handleDelete(task.id, task.title)}
                      >
                        🗑 Smazat
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="task-panel__empty-note">Žádné úkoly k zobrazení</div>
        </div>
      </section>

      <TaskStatusModal
        isOpen={showStatusModal}
        selectedStatus={selectedStatus}
        onChange={setSelectedStatus}
        onSave={handleSaveStatus}
        onCancel={() => {
          setShowStatusModal(false);
          setSelectedTaskId(null);
        }}
      />

      <TaskCreationForm
        shown={showCreateForm}
        disabled={isSubmittingCreate}
        resolverOptions={resolverOptions}
        contextOptions={contextOptions}
        onSubmit={handleCreateTask}
        onCancel={() => setShowCreateForm(false)}
      />
    </>
  );
}

export default TaskPanelOverview;