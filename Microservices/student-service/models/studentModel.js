const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'students.sqlite');

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
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullName TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      age INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT
    )
  `);
  save();
});

const getAll = () => {
  const stmt = db.prepare('SELECT * FROM students');
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
};

const getById = (id) => {
  const stmt = db.prepare('SELECT * FROM students WHERE id = ?');
  stmt.bind([id]);
  const row = stmt.step() ? stmt.getAsObject() : undefined;
  stmt.free();
  return row;
};

const getByEmail = (email) => {
  const stmt = db.prepare('SELECT * FROM students WHERE email = ?');
  stmt.bind([email]);
  const row = stmt.step() ? stmt.getAsObject() : undefined;
  stmt.free();
  return row;
};

const create = ({ fullName, email, age }) => {
  const createdAt = new Date().toISOString();
  const trimmedName = fullName.trim();
  const trimmedEmail = email.trim().toLowerCase();

  db.run(
    'INSERT INTO students (fullName, email, age, createdAt) VALUES (?, ?, ?, ?)',
    [trimmedName, trimmedEmail, age, createdAt]
  );
  save();

  // Get the last inserted row directly
  const stmt = db.prepare('SELECT * FROM students WHERE email = ?');
  stmt.bind([trimmedEmail]);
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return row;
};

const update = (id, data) => {
  const existing = getById(id);
  if (!existing) return null;

  const updated = {
    ...existing,
    ...(data.fullName && { fullName: data.fullName.trim() }),
    ...(data.email && { email: data.email.trim().toLowerCase() }),
    ...(data.age && { age: data.age }),
    updatedAt: new Date().toISOString(),
  };

  db.run(
    'UPDATE students SET fullName = ?, email = ?, age = ?, updatedAt = ? WHERE id = ?',
    [updated.fullName, updated.email, updated.age, updated.updatedAt, id]
  );
  save();
  return getById(id);
};

const remove = (id) => {
  const existing = getById(id);
  if (!existing) return null;
  db.run('DELETE FROM students WHERE id = ?', [id]);
  save();
  return existing;
};

module.exports = { ready, getAll, getById, getByEmail, create, update, remove };
