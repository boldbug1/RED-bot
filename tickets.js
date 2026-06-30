// ============================================================
//  tickets.js — Simple JSON-based ticket store
// ============================================================

const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "tickets.json");

function load() {
  if (!fs.existsSync(FILE)) return { counter: 0, tickets: [] };
  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function padId(n) {
  return "T-" + String(n).padStart(3, "0");
}

// ── Create ────────────────────────────────────────────────
function create(name, authorId, authorTag, channelId) {
  const data = load();
  data.counter += 1;
  const ticket = {
    id: padId(data.counter),
    name,
    status: "open",       // open | complete
    authorId,
    authorTag,
    channelId: channelId || null,
    createdAt: new Date().toISOString(),
    closedAt: null,
  };
  data.tickets.push(ticket);
  save(data);
  return ticket;
}

// ── Find ──────────────────────────────────────────────────
function find(query) {
  const { tickets } = load();
  const q = query.trim().toUpperCase();
  // Try exact ID match first
  let t = tickets.find((t) => t.id.toUpperCase() === q);
  if (!t) {
    // Fallback: name contains query (case-insensitive)
    t = tickets.find((t) => t.name.toLowerCase().includes(query.toLowerCase()));
  }
  return t || null;
}

// ── Complete ──────────────────────────────────────────────
function complete(query) {
  const data = load();
  const t = data.tickets.find(
    (t) =>
      t.id.toUpperCase() === query.trim().toUpperCase() ||
      t.name.toLowerCase().includes(query.toLowerCase())
  );
  if (!t) return null;
  t.status = "complete";
  t.closedAt = new Date().toISOString();
  save(data);
  return t;
}

// ── Delete ────────────────────────────────────────────────
function remove(query) {
  const data = load();
  const idx = data.tickets.findIndex(
    (t) =>
      t.id.toUpperCase() === query.trim().toUpperCase() ||
      t.name.toLowerCase().includes(query.toLowerCase())
  );
  if (idx === -1) return null;
  const [removed] = data.tickets.splice(idx, 1);
  save(data);
  return removed;
}

// ── List ──────────────────────────────────────────────────
function list(filter = "all") {
  const { tickets } = load();
  if (filter === "open") return tickets.filter((t) => t.status === "open");
  if (filter === "done") return tickets.filter((t) => t.status === "complete");
  return tickets;
}

function setChannelId(ticketId, channelId) {
  const data = load();
  const t = data.tickets.find((t) => t.id === ticketId);
  if (!t) return null;
  t.channelId = channelId;
  save(data);
  return t;
}

module.exports = { create, find, complete, remove, list, setChannelId };
