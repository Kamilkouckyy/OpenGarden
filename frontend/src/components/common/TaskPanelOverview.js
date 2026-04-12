import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import TaskStatusModal from "./TaskStatusModal";
import "./TaskPanelOverview.css";

const MOCK_TASKS = [
  {
    id: 1,
    title: "Úkol: Prořezat maliník",
    status: "otevřený",
    dueDate: "27.3.2026",
    assignedTo: "Anna",
    relatedBed: "Zahrádka A3",
    author: "Anna",
    color: "red",
  },
  {
    id: 2,
    title: "Úkol: Zalít rajčata",
    status: "otevřený",
    dueDate: "30.3.2026",
    assignedTo: "Eva Nováková",
    relatedBed: "Zahrádka A1",
    author: "Anna",
    color: "yellow",
  },
  {
    id: 3,
    title: "Úkol: Zalít rajčata",
    status: "otevřený",
    dueDate: "30.3.2026",
    assignedTo: "David",
    relatedBed: "Zahrádka A3",
    author: "David",
    color: "yellow",
  },
  {
    id: 4,
    title: "Úkol: Opravit hrábě",
    status: "rozpracovaný",
    dueDate: "31.3.2026",
    assignedTo: "David",
    relatedBed: "Nářadí",
    author: "David",
    color: "blue",
  },
  {
    id: 5,
    title: "Úkol: Zamést celou zahradu",
    status: "dokončený",
    dueDate: "27.3.2026",
    assignedTo: "Anna",
    relatedBed: "Celá zahrada",
    author: "Anna",
    color: "green",
  },
];

function mapStatusToModalValue(status) {
  if (status === "otevřený") return "open";
  if (status === "rozpracovaný") return "in_progress";
  if (status === "dokončený") return "done";
  return "open";
}

function mapModalValueToStatus(status) {
  if (status === "open") return "otevřený";
  if (status === "in_progress") return "rozpracovaný";
  if (status === "done") return "dokončený";
  return "otevřený";
}

function TaskPanelOverview({ tasks, currentUser }) {
  const navigate = useNavigate();
  const [taskList, setTaskList] = useState(
    tasks && tasks.length > 0 ? tasks : MOCK_TASKS
  );
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("open");

  const openStatusModal = (task) => {
    setSelectedTaskId(task.id);
    setSelectedStatus(mapStatusToModalValue(task.status));
    setShowStatusModal(true);
  };

  const handleSaveStatus = () => {
    setTaskList((prev) =>
      prev.map((task) =>
        task.id === selectedTaskId
          ? { ...task, status: mapModalValueToStatus(selectedStatus) }
          : task
      )
    );
    setShowStatusModal(false);
    setSelectedTaskId(null);
  };

  const handleDelete = (taskId, title) => {
    if (!window.confirm(`Opravdu chcete smazat úkol "${title}"?`)) return;
    setTaskList((prev) => prev.filter((task) => task.id !== taskId));
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
    </>
  );
}

export default TaskPanelOverview;