import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { taskApi } from "../../services/api/taskApi";
import { subscribeToDbChanges } from "../../services/api/mockDb";
import TaskStatusModal from "./TaskStatusModal";
import "./TaskPanelOverview.css";

function formatTaskStatus(status) {
  if (status === "open") return "otevřený";
  if (status === "in_progress") return "rozpracovaný";
  if (status === "done") return "dokončený";
  return status;
}

function formatDisplayDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("cs-CZ");
}

function TaskPanelOverview({ currentUser }) {
  const navigate = useNavigate();
  const [taskList, setTaskList] = useState([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("open");

  useEffect(() => {
    let isMounted = true;

    const loadTasks = async () => {
      const data = await taskApi.list();
      if (isMounted) setTaskList(data);
    };

    loadTasks();
    const unsubscribe = subscribeToDbChanges(loadTasks);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const openStatusModal = (task) => {
    setSelectedTaskId(task.id);
    setSelectedStatus(task.status || "open");
    setShowStatusModal(true);
  };

  const handleSaveStatus = async () => {
    await taskApi.updateStatus(selectedTaskId, selectedStatus);
    setShowStatusModal(false);
    setSelectedTaskId(null);
  };

  const handleDelete = async (taskId, title) => {
    if (!window.confirm(`Opravdu chcete smazat úkol "${title}"?`)) return;
    await taskApi.remove(taskId);
  };

  if (!taskList || taskList.length === 0) {
    return (
      <section className="task-panel">
        <div className="task-panel__shell">
          <div className="task-panel__empty">Žádné úkoly k zobrazení</div>
        </div>
      </section>
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

            <button type="button" className="task-panel__add-btn">
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
                  className={`task-panel__card task-panel__card--${task.color || "yellow"}`}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                >
                  <div className="task-panel__card-header">
                    <h2 className="task-panel__task-title">{task.title}</h2>
                  </div>

                  <div className="task-panel__info">
                    <div className="task-panel__status-row">
                      <span className="task-panel__status-label">Stav:</span>
                      <span className="task-panel__status-text">{formatTaskStatus(task.status)}</span>
                    </div>

                    <div className="task-panel__row">
                      <span className="task-panel__label">Termín:</span>
                      <span className="task-panel__value">{formatDisplayDate(task.deadline)}</span>
                    </div>

                    <div className="task-panel__assignment-box">{task.assignment}</div>
                  </div>

                  <div className="task-panel__actions" onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      className={`task-panel__button ${
                        task.status === "done"
                          ? "task-panel__button--done"
                          : "task-panel__button--complete"
                      }`}
                      onClick={() => openStatusModal(task)}
                    >
                      {task.status === "done" ? "✔ Hotovo" : "✓ Dokončit"}
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
    </>
  );
}

export default TaskPanelOverview;
