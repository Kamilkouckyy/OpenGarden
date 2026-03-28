import React from "react";
import "./TaskPanelOverview.css";

function TaskPanelOverview({ tasks }) {
  if (!tasks || tasks.length === 0) {
    return (
      <section className="task-panel">
        <div className="task-panel__empty">No tasks available.</div>
      </section>
    );
  }

  return (
    <section className="task-panel">
      <div className="task-panel__header">
        <h1 className="task-panel__title">Task Panel Overview</h1>
        <p className="task-panel__subtitle">
          Overview of current community garden tasks.
        </p>
      </div>

      <div className="task-panel__list">
        {tasks.map((task) => (
          <article key={task.id} className="task-panel__card">
            <div className="task-panel__card-header">
              <h2 className="task-panel__task-title">{task.title}</h2>
              <span className={`task-panel__status task-panel__status--${task.status.replace(" ", "-")}`}>
                {task.status}
              </span>
            </div>

            <div className="task-panel__info">
              <div className="task-panel__row">
                <span className="task-panel__label">Due date</span>
                <span className="task-panel__value">{task.dueDate}</span>
              </div>

              <div className="task-panel__row">
                <span className="task-panel__label">Assigned to</span>
                <span className="task-panel__value">
                  {task.assignedTo ? task.assignedTo : "Unassigned"}
                </span>
              </div>

              <div className="task-panel__row">
                <span className="task-panel__label">Related bed</span>
                <span className="task-panel__value">
                  {task.relatedBed ? task.relatedBed : "Not specified"}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default TaskPanelOverview;