// Capa de datos compartida. Usa /api/events; si la API no está disponible
// (por ejemplo abriendo el HTML en local) usa localStorage para poder probar.
const API = '/api/events';
const LS_KEY = 'bbps_eventos_local';
const LOCAL_USER = 'admin', LOCAL_PASS = 'bbps2153';

const Data = {
  mode: 'api',

  local() { try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; } },
  saveLocal(list) { try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch {} },

  async list() {
    try {
      const r = await fetch(API, { cache: 'no-store' });
      if (!r.ok) throw 0;
      this.mode = 'api';
      return await r.json();
    } catch {
      this.mode = 'local';
      return this.local();
    }
  },

  auth(user, pass) { return 'Basic ' + btoa(unescape(encodeURIComponent(user + ':' + pass))); },

  async login(user, pass) {
    try {
      const r = await fetch(API + '?check=1', { headers: { Authorization: this.auth(user, pass) } });
      if (r.status === 401) return false;
      if (!r.ok) throw 0;
      this.mode = 'api';
      return true;
    } catch {
      this.mode = 'local';
      return user === LOCAL_USER && pass === LOCAL_PASS;
    }
  },

  async add(ev, cred) {
    if (this.mode === 'local') {
      const list = this.local();
      list.push({ id: Date.now().toString(36), ...ev });
      this.saveLocal(list);
      return;
    }
    const r = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: this.auth(cred.user, cred.pass) },
      body: JSON.stringify(ev),
    });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'No se pudo guardar');
  },

  async remove(id, cred) {
    if (this.mode === 'local') { this.saveLocal(this.local().filter((e) => e.id !== id)); return; }
    const r = await fetch(API + '?id=' + encodeURIComponent(id), {
      method: 'DELETE', headers: { Authorization: this.auth(cred.user, cred.pass) },
    });
    if (!r.ok) throw new Error('No se pudo eliminar');
  },
};

// Hora fijada en Argentina (UTC-3) para que todos vean lo mismo sin importar su zona.
const eventTime = (e) => new Date(`${e.date}T${e.time}:00-03:00`).getTime();
const fmtDate = (d) => { const [y, m, dd] = d.split('-'); return `${dd}/${m}/${y.slice(2)}`; };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
