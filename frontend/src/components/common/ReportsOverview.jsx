import { useCallback, useEffect, useState } from "react";
import { reportsApi, equipmentApi } from "../../services/api";
import { useUser } from "../../context/UserContext";
import "./ReportsOverview.css";

const STATUS_LABEL = { new: "Nové", in_progress: "Probíhá", resolved: "Vyřešené" };
const STATUS_NEXT = { new: "in_progress", in_progress: "resolved" };
const STATUS_NEXT_LABEL = { new: "Zahájit řešení", in_progress: "Označit jako vyřešené" };

export default function ReportsOverview() {
  const { user } = useUser();
  const isAdmin = user?.role === "admin";

  const [reports, setReports] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [notification, setNotification] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", photoUrl: "", equipmentId: "", context: "" });
  const [formLoading, setFormLoading] = useState(false);

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 2800);
  };

  const load = useCallback(async () => {
    try {
      const [r, eq] = await Promise.all([reportsApi.list(), equipmentApi.list()]);
      setReports(r);
      setEquipment(eq);
    } catch {
      notify("Nepodařilo se načíst hlášení.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await reportsApi.create({
        title: form.title,
        description: form.description,
        photoUrl: form.photoUrl || undefined,
        equipmentId: form.equipmentId ? Number(form.equipmentId) : undefined,
        context: form.context || undefined,
      }, user);
      notify("Hlášení bylo vytvořeno.");
      setShowForm(false);
      setForm({ title: "", description: "", photoUrl: "", equipmentId: "", context: "" });
      load();
    } catch (err) {
      notify(err.message || "Vytvoření se nezdařilo.", "error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (report) => {
    const next = STATUS_NEXT[report.status];
    if (!next) return;
    try {
      await reportsApi.update(report.id, { status: next }, user);
      notify(next === "resolved" ? "Hlášení bylo vyřešeno. Linked úkoly dokončeny." : "Stav byl aktualizován.");
      load();
    } catch (err) {
      notify(err.message || "Změna stavu se nezdařila.", "error");
    }
  };

  const handleDelete = async (report) => {
    if (!window.confirm(`Smazat hlášení „${report.title}"?`)) return;
    try {
      await reportsApi.remove(report.id, user);
      notify("Hlášení bylo smazáno.", "error");
      load();
    } catch (err) {
      notify(err.message || "Smazání se nezdařilo.", "error");
    }
  };

  const filtered = reports.filter((r) => filter === "all" || r.status === filter);

  return (
    <>
      <div className="rp-card">
        <div className="rp-header">
          <div className="rp-title-wrap">
            <span className="rp-icon">⚠️</span>
            <h1 className="rp-title">Hlášení problémů</h1>
          </div>
          <button className="rp-btn-add" onClick={() => setShowForm(true)}>+ Nové hlášení</button>
        </div>

        <div className="rp-filters">
          {[["all","Všechna"],["new","Nová"],["in_progress","Probíhají"],["resolved","Vyřešená"]].map(([v,l]) => (
            <button key={v} className={`rp-filter-btn${filter === v ? " active" : ""}`} onClick={() => setFilter(v)}>
              {l} ({v === "all" ? reports.length : reports.filter(r => r.status === v).length})
            </button>
          ))}
        </div>

        <div className="rp-list">
          {loading && <div className="rp-empty">Načítám hlášení…</div>}
          {!loading && filtered.length === 0 && <div className="rp-empty">Žádná hlášení k zobrazení.</div>}

          {!loading && filtered.map((report) => {
            const canAct = isAdmin || report.authorId === user?.id;
            return (
              <div key={report.id} className={`rp-row rp-row--${report.status}`}>
                <div className="rp-row-main">
                  <div className="rp-row-top">
                    <span className="rp-row-title">{report.title}</span>
                    <span className={`rp-badge rp-badge--${report.status}`}>{STATUS_LABEL[report.status]}</span>
                  </div>
                  <div className="rp-row-desc">{report.description}</div>
                  <div className="rp-row-meta">
                    {report.context && <span className="rp-tag">{report.context}</span>}
                    <span className="rp-author">Autor: {report.authorName}</span>
                    {report.photoUrl && <a href={report.photoUrl} target="_blank" rel="noreferrer" className="rp-photo-link">📷 Foto</a>}
                  </div>
                </div>
                <div className="rp-row-actions">
                  {canAct && STATUS_NEXT[report.status] && (
                    <button className="rp-action-btn rp-advance" onClick={() => handleStatusChange(report)}>
                      {STATUS_NEXT_LABEL[report.status]}
                    </button>
                  )}
                  {canAct && (
                    <button className="rp-action-btn rp-delete" onClick={() => handleDelete(report)}>Smazat</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showForm && (
        <div className="rp-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="rp-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nové hlášení</h2>
            <form onSubmit={handleCreate}>
              <label>Název <span className="req">*</span></label>
              <input maxLength={200} required value={form.title} onChange={(e) => setForm(p => ({...p, title: e.target.value}))} placeholder="Stručný popis problému" />

              <label>Popis <span className="req">*</span></label>
              <textarea required rows={3} value={form.description} onChange={(e) => setForm(p => ({...p, description: e.target.value}))} placeholder="Detailní popis problému…" />

              <label>URL fotografie</label>
              <input type="url" value={form.photoUrl} onChange={(e) => setForm(p => ({...p, photoUrl: e.target.value}))} placeholder="https://…" />

              <label>Vybavení (pokud se jedná o poruchu)</label>
              <select value={form.equipmentId} onChange={(e) => setForm(p => ({...p, equipmentId: e.target.value}))}>
                <option value="">— žádné —</option>
                {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
              </select>

              <label>Kontext (místo/popis)</label>
              <input maxLength={100} value={form.context} onChange={(e) => setForm(p => ({...p, context: e.target.value}))} placeholder="Např. 'Záhon A1' nebo 'Hlavní brána'" />

              <div className="rp-modal-actions">
                <button type="submit" disabled={formLoading} className="rp-modal-btn-primary">
                  {formLoading ? "Odesílám…" : "Odeslat hlášení"}
                </button>
                <button type="button" className="rp-modal-btn-secondary" onClick={() => setShowForm(false)}>Zrušit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {notification && <div className={`gbl-notif ${notification.type}`}>{notification.msg}</div>}
    </>
  );
}
