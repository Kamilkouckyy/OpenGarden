import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { reportsApi, equipmentApi, tasksApi } from "../../services/api";
import { useUser } from "../../context/UserContext";
import { useLanguage } from "../../i18n/LanguageContext";
import "./ReportsOverview.css";

const STATUS_NEXT = { new: "in_progress", in_progress: "resolved" };

export default function ReportsOverview() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { t, language } = useLanguage();
  const isAdmin = user?.role === "admin";

  const [reports, setReports] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");

  const [notification, setNotification] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [openSections, setOpenSections] = useState({});
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    photoUrl: "",
    equipmentId: "",
    context: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  const getStatusLabel = (status) => {
    if (status === "new") return t("reports.new");
    if (status === "in_progress") return t("reports.inProgress");
    if (status === "resolved") return t("reports.resolved");
    return status;
  };

  const getNextStatusLabel = (status) => {
    if (status === "new") return t("reports.startSolving");
    if (status === "in_progress") return t("reports.markResolved");
    return status;
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      photoUrl: "",
      equipmentId: "",
      context: "",
    });
  };

  const openCreateModal = () => {
    setEditTarget(null);
    resetForm();
    setShowForm(true);
  };

  const openEditModal = (report) => {
    setEditTarget(report);
    setForm({
      title: report.title || "",
      description: report.description || "",
      photoUrl: report.photoUrl || "",
      equipmentId: report.equipmentId ? String(report.equipmentId) : "",
      context: report.context || "",
    });
    setShowForm(true);
  };

  const toggleSection = (reportId, section) => {
    setOpenSections((previous) => ({
      ...previous,
      [reportId]: {
        description: false,
        discussion: false,
        tasks: false,
        ...(previous[reportId] || {}),
        [section]: !previous[reportId]?.[section],
      },
    }));
  };

  const toggleAllSections = (reportId) => {
    setOpenSections((previous) => {
      const current = previous[reportId] || {};
      const shouldOpen = !(current.description && current.discussion && current.tasks);

      return {
        ...previous,
        [reportId]: {
          description: shouldOpen,
          discussion: shouldOpen,
          tasks: shouldOpen,
        },
      };
    });
  };

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 2800);
  };

  const formatDeadline = (value) => {
    if (!value) return "";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    const locale = language === "cs" ? "cs-CZ" : "en-GB";
    return new Intl.DateTimeFormat(locale).format(date);
  };

  const load = useCallback(async () => {
    try {
      const [r, eq, taskList] = await Promise.all([
        reportsApi.list(),
        equipmentApi.list(),
        tasksApi.list(),
      ]);
      setReports(r);
      setEquipment(eq);
      setTasks(taskList);
    } catch {
      notify(t("reports.loadFailed"), "error");
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const payload = {
        title: form.title,
        description: form.description,
        photoUrl: form.photoUrl || undefined,
        equipmentId: form.equipmentId ? Number(form.equipmentId) : undefined,
        context: form.context || undefined,
      };

      if (editTarget) {
        await reportsApi.update(editTarget.id, payload, user);
        notify(t("reports.updateSuccess"));
      } else {
        await reportsApi.create(payload, user);
        notify(t("reports.createSuccess"));
      }

      setShowForm(false);
      setEditTarget(null);
      resetForm();
      load();
    } catch (err) {
      notify(
        err.message || (editTarget ? t("reports.updateFailed") : t("reports.createFailed")),
        "error"
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (report) => {
    const next = STATUS_NEXT[report.status];
    if (!next) return;

    try {
      await reportsApi.update(report.id, { status: next }, user);
      notify(
        next === "resolved"
          ? t("reports.resolvedSuccess")
          : t("reports.statusUpdated")
      );
      load();
    } catch (err) {
      notify(err.message || t("reports.statusChangeFailed"), "error");
    }
  };

  const handleDelete = async (report) => {
    try {
      await reportsApi.remove(report.id, user);
      notify(t("reports.deleteSuccess"), "error");
      load();
    } catch (err) {
      notify(err.message || t("reports.deleteFailed"), "error");
    }
  };

  const visibleReports = reports
    .filter((report) => filter === "all" || report.status === filter)
    .filter((report) => {
      const query = search.trim().toLowerCase();

      if (!query) return true;

      return (
        report.title?.toLowerCase().includes(query) ||
        report.description?.toLowerCase().includes(query) ||
        report.context?.toLowerCase().includes(query) ||
        report.authorName?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (sort === "title") {
        return (a.title || "").localeCompare(b.title || "", "cs");
      }

      if (sort === "status") {
        return (a.status || "").localeCompare(b.status || "", "cs");
      }

      return Number(b.id || 0) - Number(a.id || 0);
    });

  const activeReports = filter === "resolved"
    ? visibleReports
    : visibleReports.filter((report) => report.status !== "resolved");
  const resolvedReports = filter === "resolved"
    ? []
    : visibleReports.filter((report) => report.status === "resolved");

  return (
    <>
      <div className="rp-card">
        <div className="rp-header">
          <div className="rp-title-wrap">
            <span className="rp-icon">📢</span>
            <h1 className="rp-title">{t("reports.title")}</h1>
          </div>

          <div className="rp-toolbar">
            <div className="rp-search-wrap">
              <span className="rp-search-icon">🔍</span>
              <input
                className="rp-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("reports.searchPlaceholder")}
              />
            </div>

            <select
              className="rp-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              aria-label={t("reports.sortAriaLabel")}
            >
              <option value="newest">{t("reports.sortNewest")}</option>
              <option value="title">{t("reports.sortTitle")}</option>
              <option value="status">{t("reports.sortStatus")}</option>
            </select>

            <div className="rp-filters">
              {[
                ["all", t("reports.all")],
                ["new", t("reports.new")],
                ["in_progress", t("reports.inProgress")],
                ["resolved", t("reports.resolved")],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`rp-filter-btn${filter === value ? " active" : ""}`}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>

            <button type="button" className="rp-btn-add" onClick={openCreateModal}>
              {t("reports.addNew")}
            </button>
          </div>
        </div>

        <section className="rp-section">
          <h2 className="rp-section-title">{t("reports.activeReports")}</h2>

          <div className="rp-list">
            {loading && <div className="rp-empty">{t("reports.loading")}</div>}

            {!loading && activeReports.length === 0 && (
              <div className="rp-empty">{t("reports.empty")}</div>
            )}

            {!loading &&
              activeReports.map((report) => {
                const canAct = isAdmin || report.authorId === user?.id;
                const linkedActiveTasks = tasks.filter(
                  (task) =>
                    task.linkedType === "report" &&
                    Number(task.linkedId) === Number(report.id) &&
                    task.status !== "done"
                ).sort((a, b) => {
                  if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
                  if (a.dueDate) return -1;
                  if (b.dueDate) return 1;
                  return (a.title || "").localeCompare(b.title || "", language === "cs" ? "cs" : "en");
                });

                return (
                  <div
                    key={report.id}
                    className={`rp-report-card rp-report-card--${report.status}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleAllSections(report.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggleAllSections(report.id);
                      }
                    }}
                  >
                    <div className="rp-report-top">
                      <span className="rp-report-title">
                        {report.title}
                      </span>

                      <div className="rp-status-line">
                        <span className="rp-status-label">
                          {t("reports.status")}:
                        </span>
                        <span className={`rp-badge rp-badge--${report.status}`}>
                          {getStatusLabel(report.status)}
                        </span>
                      </div>
                    </div>

                    <div className="rp-collapse-list">
                      <button
                        type="button"
                        className="rp-collapse-row rp-collapse-toggle"
                        aria-expanded={Boolean(openSections[report.id]?.description)}
                        onClick={(event) => { event.stopPropagation(); toggleSection(report.id, "description"); }}
                      >
                        <span className={`rp-collapse-arrow${openSections[report.id]?.description ? " open" : ""}`}>▶</span>
                        <span>{t("reports.showDescription")}</span>
                      </button>

                      {openSections[report.id]?.description && (
                        <div className="rp-collapse-content">{report.description || t("reports.noDescription")}</div>
                      )}

                      <button
                        type="button"
                        className="rp-collapse-row rp-collapse-toggle"
                        aria-expanded={Boolean(openSections[report.id]?.discussion)}
                        onClick={(event) => { event.stopPropagation(); toggleSection(report.id, "discussion"); }}
                      >
                        <span className={`rp-collapse-arrow${openSections[report.id]?.discussion ? " open" : ""}`}>▶</span>
                        <span>{t("reports.discussion")} (1)</span>
                      </button>

                      {openSections[report.id]?.discussion && (
                        <div className="rp-collapse-content">{t("reports.discussionUnavailable")}</div>
                      )}

                      <button
                        type="button"
                        className="rp-collapse-row rp-collapse-toggle"
                        aria-expanded={Boolean(openSections[report.id]?.tasks)}
                        onClick={(event) => { event.stopPropagation(); toggleSection(report.id, "tasks"); }}
                      >
                        <span className={`rp-collapse-arrow${openSections[report.id]?.tasks ? " open" : ""}`}>▶</span>
                        <span>{t("reports.activeTasks")} ({linkedActiveTasks.length})</span>
                      </button>

                      {openSections[report.id]?.tasks && (
                        <div className="rp-collapse-content">
                          {linkedActiveTasks.length === 0
                            ? t("reports.noLinkedTasks")
                            : (
                              <ul className="rp-task-list">
                                {linkedActiveTasks.map((task) => (
                                  <li key={task.id} className="rp-task-item">
                                    <span className="rp-task-icon" aria-hidden="true">⏳</span>
                                    <span>{task.title}</span>
                                    {task.dueDate && (
                                      <span className="rp-task-deadline">({formatDeadline(task.dueDate)})</span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                        </div>
                      )}
                    </div>

                    <div className="rp-report-actions" onClick={(event) => event.stopPropagation()}>
                      {canAct && STATUS_NEXT[report.status] && (
                        <button
                          type="button"
                          className="rp-action-btn rp-advance"
                          onClick={() => handleStatusChange(report)}
                        >
                          {getNextStatusLabel(report.status)}
                        </button>
                      )}

                      <button
                        type="button"
                        className="rp-action-btn rp-task"
                        onClick={() =>
                          navigate(`/tasks?linkedType=report&linkedId=${report.id}`)
                        }
                      >
                        {t("reports.createTask")}
                      </button>

                      <button
                        type="button"
                        className="rp-action-btn rp-comment"
                        onClick={() => navigate(`/reports/${report.id}`)}
                      >
                        {t("reports.detail")}
                      </button>

                      {canAct && (
                        <button type="button" className="rp-action-btn rp-edit" onClick={() => openEditModal(report)}>
                          {t("reports.edit")}
                        </button>
                      )}

                      {canAct && (
                        <button
                          type="button"
                          className="rp-action-btn rp-delete"
                          onClick={() => setDeleteTarget(report)}
                        >
                          {t("reports.delete")}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </section>

        <button
          type="button"
          className="rp-archive rp-collapse-toggle"
          aria-expanded={archiveOpen}
          onClick={() => setArchiveOpen((previous) => !previous)}
        >
          <span className={`rp-archive-arrow rp-collapse-arrow${archiveOpen ? " open" : ""}`}>▶</span>
          <span className="rp-archive-icon">▣</span>
          <span>
            {t("reports.resolvedArchive")} ({resolvedReports.length})
          </span>
        </button>

        {archiveOpen && (
          <div className="rp-archive-list">
            {resolvedReports.length === 0 ? (
              <div className="rp-empty">{t("reports.empty")}</div>
            ) : (
              resolvedReports.map((report) => (
                <div key={report.id} className="rp-archive-item">
                  <Link className="rp-report-title" to={`/reports/${report.id}`}>
                    {report.title}
                  </Link>
                  <span className={`rp-badge rp-badge--${report.status}`}>{getStatusLabel(report.status)}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showForm && (
        <div
          className="rp-modal-overlay"
          onClick={() => {
            setShowForm(false);
            setEditTarget(null);
          }}
        >
          <div className="rp-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editTarget ? t("reports.edit") : t("reports.newReport")}</h2>

            <form onSubmit={handleCreate}>
              <label>
                {t("reports.name")} <span className="req">*</span>
              </label>
              <input
                maxLength={200}
                required
                value={form.title}
                onChange={(e) =>
                  setForm((previous) => ({
                    ...previous,
                    title: e.target.value,
                  }))
                }
                placeholder={t("reports.titlePlaceholder")}
              />

              <label>
                {t("reports.description")} <span className="req">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((previous) => ({
                    ...previous,
                    description: e.target.value,
                  }))
                }
                placeholder={t("reports.descriptionPlaceholder")}
              />

              <label>{t("reports.photoUrl")}</label>
              <input
                type="url"
                value={form.photoUrl}
                onChange={(e) =>
                  setForm((previous) => ({
                    ...previous,
                    photoUrl: e.target.value,
                  }))
                }
                placeholder={t("reports.photoPlaceholder")}
              />

              <label>{t("reports.equipmentHint")}</label>
              <select
                value={form.equipmentId}
                onChange={(e) =>
                  setForm((previous) => ({
                    ...previous,
                    equipmentId: e.target.value,
                  }))
                }
              >
                <option value="">{t("reports.none")}</option>
                {equipment.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.name}
                  </option>
                ))}
              </select>

              <label>{t("reports.contextHint")}</label>
              <input
                maxLength={100}
                value={form.context}
                onChange={(e) =>
                  setForm((previous) => ({
                    ...previous,
                    context: e.target.value,
                  }))
                }
                placeholder={t("reports.contextPlaceholder")}
              />

              <div className="rp-modal-actions">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="rp-modal-btn-primary"
                >
                  {formLoading
                    ? t("reports.submitting")
                    : editTarget
                      ? t("reports.edit")
                      : t("reports.submitReport")}
                </button>

                <button
                  type="button"
                  className="rp-modal-btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditTarget(null);
                  }}
                >
                  {t("reports.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="rp-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="rp-modal" onClick={(event) => event.stopPropagation()}>
            <h2>{t("reports.deleteConfirm", { title: deleteTarget.title })}</h2>
            <p>{t("reports.deleteHint")}</p>

            <div className="rp-modal-actions">
              <button
                type="button"
                className="rp-modal-btn-primary"
                onClick={async () => {
                  const target = deleteTarget;
                  setDeleteTarget(null);
                  await handleDelete(target);
                }}
              >
                {t("reports.delete")}
              </button>

              <button
                type="button"
                className="rp-modal-btn-secondary"
                onClick={() => setDeleteTarget(null)}
              >
                {t("reports.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className={`gbl-notif ${notification.type}`}>
          {notification.msg}
        </div>
      )}
    </>
  );
}