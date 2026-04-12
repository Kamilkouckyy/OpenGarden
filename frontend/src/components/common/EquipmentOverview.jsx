import { useCallback, useEffect, useState } from "react";
import { equipmentApi } from "../../services/api";
import { useUser } from "../../context/UserContext";
import "./EquipmentOverview.css";

const STATUS_LABEL = { functional: "Funkční", non_functional: "Nefunkční" };

export default function EquipmentOverview() {
  const { user } = useUser();
  const isAdmin = user?.role === "admin";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [notification, setNotification] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", status: "functional" });
  const [formLoading, setFormLoading] = useState(false);

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 2800);
  };

  const load = useCallback(async () => {
    try {
      setItems(await equipmentApi.list());
    } catch {
      notify("Nepodařilo se načíst vybavení.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await equipmentApi.create(form, user);
      notify(`Vybavení „${form.name}" bylo přidáno.`);
      setShowForm(false);
      setForm({ name: "", description: "", status: "functional" });
      load();
    } catch (err) {
      notify(err.message || "Vytvoření se nezdařilo.", "error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (item) => {
    const next = item.status === "functional" ? "non_functional" : "functional";
    try {
      await equipmentApi.update(item.id, { status: next }, user);
      notify(`Stav byl změněn na „${STATUS_LABEL[next]}".`);
      load();
    } catch (err) {
      notify(err.message || "Změna stavu se nezdařila.", "error");
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Smazat vybavení „${item.name}"?`)) return;
    try {
      await equipmentApi.remove(item.id, user);
      notify(`„${item.name}" bylo odebráno.`, "error");
      load();
    } catch (err) {
      notify(err.message || "Smazání se nezdařilo.", "error");
    }
  };

  const filtered = items.filter((i) => filter === "all" || i.status === filter);

  return (
    <>
      <div className="eq-card">
        <div className="eq-header">
          <div className="eq-title-wrap">
            <span className="eq-icon">🔧</span>
            <h1 className="eq-title">Sdílené vybavení</h1>
          </div>
          <button className="eq-btn-add" onClick={() => setShowForm(true)}>+ Přidat vybavení</button>
        </div>

        <div className="eq-filters">
          {[["all","Vše"],["functional","Funkční"],["non_functional","Nefunkční"]].map(([v,l]) => (
            <button key={v} className={`eq-filter-btn${filter === v ? " active" : ""}`} onClick={() => setFilter(v)}>
              {l} ({v === "all" ? items.length : items.filter(i => i.status === v).length})
            </button>
          ))}
        </div>

        <div className="eq-grid">
          {loading && <div className="eq-empty">Načítám vybavení…</div>}
          {!loading && filtered.length === 0 && <div className="eq-empty">Žádné vybavení k zobrazení.</div>}

          {!loading && filtered.map((item) => {
            const canAct = isAdmin || item.authorId === user?.id;
            const isFunctional = item.status === "functional";
            return (
              <div key={item.id} className={`eq-item-card${isFunctional ? "" : " broken"}`}>
                <div className="eq-item-top">
                  <span className="eq-item-name">{item.name}</span>
                  <span className={`eq-badge${isFunctional ? " ok" : " broken"}`}>
                    {STATUS_LABEL[item.status]}
                  </span>
                </div>
                {item.description && <p className="eq-item-desc">{item.description}</p>}
                <div className="eq-item-actions">
                  {canAct && (
                    <button className={`eq-action-btn${isFunctional ? " eq-break" : " eq-fix"}`} onClick={() => handleToggleStatus(item)}>
                      {isFunctional ? "Označit jako nefunkční" : "Označit jako funkční"}
                    </button>
                  )}
                  {canAct && (
                    <button className="eq-action-btn eq-delete" onClick={() => handleDelete(item)}>Smazat</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showForm && (
        <div className="eq-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="eq-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Přidat vybavení</h2>
            <form onSubmit={handleCreate}>
              <label>Název <span className="req">*</span></label>
              <input maxLength={100} required value={form.name} onChange={(e) => setForm(p => ({...p, name: e.target.value}))} placeholder="Kolečko, Hrábě…" />

              <label>Popis</label>
              <textarea rows={2} value={form.description} onChange={(e) => setForm(p => ({...p, description: e.target.value}))} placeholder="Volitelný popis…" />

              <label>Stav</label>
              <select value={form.status} onChange={(e) => setForm(p => ({...p, status: e.target.value}))}>
                <option value="functional">Funkční</option>
                <option value="non_functional">Nefunkční</option>
              </select>

              <div className="eq-modal-actions">
                <button type="submit" disabled={formLoading} className="eq-modal-btn-primary">
                  {formLoading ? "Přidávám…" : "Přidat"}
                </button>
                <button type="button" className="eq-modal-btn-secondary" onClick={() => setShowForm(false)}>Zrušit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {notification && <div className={`gbl-notif ${notification.type}`}>{notification.msg}</div>}
    </>
  );
}
