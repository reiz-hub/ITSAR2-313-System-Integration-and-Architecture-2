const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'enrollments.sqlite');

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
    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId INTEGER NOT NULL,
      courseId INTEGER NOT NULL,
      enrolledAt TEXT NOT NULL,
      UNIQUE(studentId, courseId)
    )
  `);
  save();
});

const getAll = () => {
  const stmt = db.prepare('SELECT * FROM enrollments');
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
};

const getByStudentId = (studentId) => {
  const stmt = db.prepare('SELECT * FROM enrollments WHERE studentId = ?');
  stmt.bind([studentId]);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
};

const getByCourseId = (courseId) => {
  const stmt = db.prepare('SELECT * FROM enrollments WHERE courseId = ?');
  stmt.bind([courseId]);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
};

const exists = (studentId, courseId) => {
  const stmt = db.prepare('SELECT 1 FROM enrollments WHERE studentId = ? AND courseId = ?');
  stmt.bind([studentId, courseId]);
  const found = stmt.step();
  stmt.free();
  return found;
};

const create = ({ studentId, courseId }) => {
  const enrolledAt = new Date().toISOString();
  db.run(
    'INSERT INTO enrollments (studentId, courseId, enrolledAt) VALUES (?, ?, ?)',
    [studentId, courseId, enrolledAt]
  );
  save();

  // Get the last inserted row
  const stmt = db.prepare('SELECT * FROM enrollments ORDER BY id DESC LIMIT 1');
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return row;
};

const removeByStudentId = (studentId) => {
  const stmt = db.prepare('SELECT COUNT(*) as cnt FROM enrollments WHERE studentId = ?');
  stmt.bind([studentId]);
  stmt.step();
  const count = stmt.getAsObject().cnt;
  stmt.free();
  db.run('DELETE FROM enrollments WHERE studentId = ?', [studentId]);
  save();
  return count;
};

const removeByCourseId = (courseId) => {
  const stmt = db.prepare('SELECT COUNT(*) as cnt FROM enrollments WHERE courseId = ?');
  stmt.bind([courseId]);
  stmt.step();
  const count = stmt.getAsObject().cnt;
  stmt.free();
  db.run('DELETE FROM enrollments WHERE courseId = ?', [courseId]);
  save();
  return count;
};

module.exports = {
  ready,
  getAll,
  getByStudentId,
  getByCourseId,
  exists,
  create,
  removeByStudentId,
  removeByCourseId,
};
