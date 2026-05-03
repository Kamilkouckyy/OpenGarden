import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { equipmentApi, tasksApi } from "../../services/api";
import { useUser } from "../../context/UserContext";
import { useLanguage } from "../../i18n/LanguageContext";
import "./EquipmentOverview.css";

export default function EquipmentOverview() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { t } = useLanguage();
  const isAdmin = user?.role === "admin";

  const [items, setItems] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");

  const [notification, setNotification] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [openAccordion, setOpenAccordion] = useState({});
  const [form, setForm] = useState({
    name: "",
    description: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  const getStatusLabel = (status) => {
    if (status === "functional") return t("equipment.functional");
    if (status === "non_functional") return t("equipment.nonFunctional");
    return status;
  };

  const toggleAccordion = (itemId, section) => {
    setOpenAccordion((previous) => ({
      ...previous,
      [itemId]: {
        info: false,
        tasks: false,
        ...(previous[itemId] || {}),
        [section]: !(previous[itemId]?.[section]),
      },
    }));
  };

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 2800);
  };

  const load = useCallback(async () => {
    try {
      const [equipmentList, taskList] = await Promise.all([
        equipmentApi.list(),
        tasksApi.list(),
      ]);
      setItems(equipmentList);
      setTasks(taskList);
    } catch {
      notify(t("equipment.loadFailed"), "error");
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setFormLoading(true);

    try {
      await equipmentApi.create(form, user);
      notify(t("equipment.createSuccess", { name: form.name }));
      setShowForm(false);
      setForm({ name: "", description: "" });
      load();
    } catch (err) {
      notify(err.message || t("equipment.createFailed"), "error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (item) => {
    const next =
      item.status === "functional" ? "non_functional" : "functional";

    try {
      await equipmentApi.update(item.id, { status: next }, user);
      notify(t("equipment.statusChanged", { status: getStatusLabel(next) }));
      load();
    } catch (err) {
      notify(err.message || t("equipment.statusChangeFailed"), "error");
    }
  };

  const handleDelete = async (item) => {
    try {
      await equipmentApi.remove(item.id, user);
      notify(t("equipment.deleteSuccess", { name: item.name }), "error");
      load();
    } catch (err) {
      notify(err.message || t("equipment.deleteFailed"), "error");
    }
  };

  const filtered = items
    .filter((item) => filter === "all" || item.status === filter)
    .filter((item) => {
      const query = search.trim().toLowerCase();

      if (!query) return true;

      return (
        item.name?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (sort === "name") {
        return (a.name || "").localeCompare(b.name || "", "cs");
      }

      if (sort === "status") {
        return (a.status || "").localeCompare(b.status || "", "cs");
      }

      return Number(b.id || 0) - Number(a.id || 0);
    });

  return (
    <>
      <div className="eq-card">
        <div className="eq-header">
          <div className="eq-title-wrap">
            <span className="eq-icon">🛠️</span>
            <h1 className="eq-title">{t("equipment.title")}</h1>
          </div>

          <div className="eq-toolbar">
            <div className="eq-search-wrap">
              <span className="eq-search-icon">🔍</span>
              <input
                className="eq-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("equipment.searchPlaceholder")}
              />
            </div>

            <select
              className="eq-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              aria-label={t("equipment.sortAriaLabel")}
            >
              <option value="newest">{t("equipment.sortNewest")}</option>
              <option value="name">{t("equipment.sortName")}</option>
              <option value="status">{t("equipment.sortStatus")}</option>
            </select>

            <div className="eq-filters">
              {[
                ["all", t("equipment.all")],
                ["functional", t("equipment.functional")],
                ["non_functional", t("equipment.nonFunctional")],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`eq-filter-btn${filter === value ? " active" : ""}`}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="eq-btn-add"
              onClick={() => setShowForm(true)}
            >
              {t("equipment.addNew")}
            </button>
          </div>
        </div>

        <div className="eq-grid">
          {loading && <div className="eq-empty">{t("equipment.loading")}</div>}

          {!loading && filtered.length === 0 && (
            <div className="eq-empty">{t("equipment.empty")}</div>
          )}

          {!loading &&
            filtered.map((item) => {
              const canAct = isAdmin || item.authorId === user?.id;
              const isFunctional = item.status === "functional";
              const infoOpen = Boolean(openAccordion[item.id]?.info);
              const tasksOpen = Boolean(openAccordion[item.id]?.tasks);
              const linkedActiveTasks = tasks.filter(
                (task) =>
                  task.linkedType === "equipment" &&
                  Number(task.linkedId) === Number(item.id) &&
                  task.status !== "done"
              );

              return (
                <div
                  key={item.id}
                  className={`eq-item-card${isFunctional ? "" : " broken"}`}
                >
                  <div className="eq-item-top">
                    <span className="eq-item-name">{item.name}</span>

                    <div className="eq-status-line">
                      <span className="eq-status-label">
                        {t("equipment.status")}:
                      </span>
                      <span
                        className={`eq-badge${isFunctional ? " ok" : " broken"}`}
                      >
                        {getStatusLabel(item.status)}
                      </span>
                    </div>
                  </div>

                  <div className="eq-collapse-list">
                    <button
                      type="button"
                      className="eq-collapse-row eq-collapse-toggle"
                      aria-expanded={infoOpen}
                      onClick={() => toggleAccordion(item.id, "info")}
                    >
                      <span className={`eq-collapse-arrow${infoOpen ? " open" : ""}`}>▶</span>
                      <span>{t("equipment.informationLocation")}</span>
                    </button>

                    {infoOpen && (
                      <div className="eq-collapse-content">
                        {item.description || t("equipment.noDescription")}
                      </div>
                    )}

                    <button
                      type="button"
                      className="eq-collapse-row eq-collapse-toggle"
                      aria-expanded={tasksOpen}
                      onClick={() => toggleAccordion(item.id, "tasks")}
                    >
                      <span className={`eq-collapse-arrow${tasksOpen ? " open" : ""}`}>▶</span>
                      <span>{t("equipment.activeTasks")} ({linkedActiveTasks.length})</span>
                    </button>

                    {tasksOpen && (
                      <div className="eq-collapse-content">
                        {linkedActiveTasks.length === 0
                          ? t("equipment.noLinkedTasks")
                          : linkedActiveTasks.map((task) => task.title).join(" | ")}
                      </div>
                    )}
                  </div>

                  <div className="eq-item-actions">
                    {canAct && (
                      <button
                        type="button"
                        className={`eq-action-btn${
                          isFunctional ? " eq-break" : " eq-fix"
                        }`}
                        onClick={() => handleToggleStatus(item)}
                      >
                        {isFunctional
                          ? t("equipment.markNonFunctional")
                          : t("equipment.markFunctional")}
                      </button>
                    )}

                    <button
                      type="button"
                      className="eq-action-btn eq-task"
                      onClick={() =>
                        navigate(`/tasks?linkedType=equipment&linkedId=${item.id}`)
                      }
                    >
                      {t("equipment.createTask")}
                    </button>

                    {canAct && (
                      <button type="button" className="eq-action-btn eq-edit">
                        {t("equipment.edit")}
                      </button>
                    )}

                    {canAct && (
                      <button
                        type="button"
                        className="eq-action-btn eq-delete"
                        onClick={() => setDeleteTarget(item)}
                      >
                        {t("equipment.delete")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {showForm && (
        <div className="eq-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="eq-modal" onClick={(event) => event.stopPropagation()}>
            <h2>{t("equipment.addModalTitle")}</h2>

            <form onSubmit={handleCreate}>
              <label>
                {t("equipment.name")} <span className="req">*</span>
              </label>
              <input
                maxLength={100}
                required
                value={form.name}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    name: event.target.value,
                  }))
                }
                placeholder={t("equipment.namePlaceholder")}
              />

              <label>{t("equipment.description")}</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    description: event.target.value,
                  }))
                }
                placeholder={t("equipment.descriptionPlaceholder")}
              />

              <div className="eq-modal-actions">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="eq-modal-btn-primary"
                >
                  {formLoading ? t("equipment.adding") : t("equipment.add")}
                </button>

                <button
                  type="button"
                  className="eq-modal-btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  {t("equipment.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="eq-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="eq-modal" onClick={(event) => event.stopPropagation()}>
            <h2>{t("equipment.deleteConfirm", { name: deleteTarget.name })}</h2>
            <p>{t("equipment.deleteHint")}</p>

            <div className="eq-modal-actions">
              <button
                type="button"
                className="eq-modal-btn-primary"
                onClick={async () => {
                  const target = deleteTarget;
                  setDeleteTarget(null);
                  await handleDelete(target);
                }}
              >
                {t("equipment.delete")}
              </button>

              <button
                type="button"
                className="eq-modal-btn-secondary"
                onClick={() => setDeleteTarget(null)}
              >
                {t("equipment.cancel")}
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