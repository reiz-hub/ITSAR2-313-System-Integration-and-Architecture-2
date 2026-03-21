const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'courses.sqlite');

let db;

function save() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

const ready = initSqlJs().then((SQL) => {
  if (fs.existsSync(DB_PATH)) {
    const file = fs.readFileSync(DB_PATH);
    db = new SQL.Database(file);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      credits INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT
    )
  `);
  save();
});

const getAll = () => {
  const stmt = db.prepare('SELECT * FROM courses');
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
};

const getById = (id) => {
  const stmt = db.prepare('SELECT * FROM courses WHERE id = ?');
  stmt.bind([id]);
  const row = stmt.step() ? stmt.getAsObject() : undefined;
  stmt.free();
  return row;
};

const create = ({ name, description, credits }) => {
  const createdAt = new Date().toISOString();
  const trimmedName = name.trim();
  const trimmedDesc = description.trim();

  db.run(
    'INSERT INTO courses (name, description, credits, createdAt) VALUES (?, ?, ?, ?)',
    [trimmedName, trimmedDesc, credits, createdAt]
  );
  save();

  // Get the last inserted row directly by querying max id
  const stmt = db.prepare('SELECT * FROM courses ORDER BY id DESC LIMIT 1');
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return row;
};

const update = (id, data) => {
  const existing = getById(id);
  if (!existing) return null;

  const updated = {
    ...existing,
    ...(data.name && { name: data.name.trim() }),
    ...(data.description && { description: data.description.trim() }),
    ...(data.credits && { credits: data.credits }),
    updatedAt: new Date().toISOString(),
  };

  db.run(
    'UPDATE courses SET name = ?, description = ?, credits = ?, updatedAt = ? WHERE id = ?',
    [updated.name, updated.description, updated.credits, updated.updatedAt, id]
  );
  save();
  return getById(id);
};

const remove = (id) => {
  const existing = getById(id);
  if (!existing) return null;
  db.run('DELETE FROM courses WHERE id = ?', [id]);
  save();
  return existing;
};

module.exports = { ready, getAll, getById, create, update, remove };
