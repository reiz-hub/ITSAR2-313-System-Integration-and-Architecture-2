/**
 * Seed Script — Populates the API with sample test data.
 *
 * Run this after starting ALL services (gateway + 3 microservices):
 *   node seed.js
 *
 * It sends HTTP requests through the API Gateway (port 3000)
 * which proxies them to the correct microservices.
 */

const BASE_URL = 'http://localhost:3000';

// Sample students (will get auto-increment IDs: 1, 2, 3, 4, 5)
const students = [
  { fullName: 'Alice Johnson', email: 'alice.johnson@university.edu', age: 20 },
  { fullName: 'Bob Smith', email: 'bob.smith@university.edu', age: 22 },
  { fullName: 'Carol Williams', email: 'carol.williams@university.edu', age: 19 },
  { fullName: 'David Brown', email: 'david.brown@university.edu', age: 21 },
  { fullName: 'Eva Martinez', email: 'eva.martinez@university.edu', age: 23 },
];

// Sample courses (will get auto-increment IDs: 1, 2, 3, 4, 5)
const courses = [
  { name: 'Introduction to Programming', description: 'Learn programming fundamentals with Python', credits: 3 },
  { name: 'Data Structures and Algorithms', description: 'Study essential data structures and algorithm design', credits: 4 },
  { name: 'Web Development', description: 'Build modern web applications with HTML, CSS, and JavaScript', credits: 3 },
  { name: 'Database Systems', description: 'Design and manage relational and NoSQL databases', credits: 3 },
  { name: 'Software Engineering', description: 'Learn software development methodologies and best practices', credits: 4 },
];

async function postJSON(url, data) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

async function seed() {
  console.log('Seeding sample data...\n');

  // Create students
  console.log('--- Creating Students ---');
  const createdStudents = [];
  for (const student of students) {
    const result = await postJSON(`${BASE_URL}/students`, student);
    console.log(`  Created: ${result.data.fullName} (ID: ${result.data.id})`);
    createdStudents.push(result.data);
  }

  // Create courses
  console.log('\n--- Creating Courses ---');
  const createdCourses = [];
  for (const course of courses) {
    const result = await postJSON(`${BASE_URL}/courses`, course);
    console.log(`  Created: ${result.data.name} (ID: ${result.data.id})`);
    createdCourses.push(result.data);
  }

  // Create enrollments
  // Student 1 (Alice): enrolled in courses 1, 3
  // Student 2 (Bob): enrolled in courses 1, 2, 4
  // Student 3 (Carol): enrolled in courses 2, 3
  // Student 4 (David): enrolled in courses 3, 4, 5
  // Student 5 (Eva): enrolled in courses 1, 5
  console.log('\n--- Creating Enrollments ---');
  const enrollmentPairs = [
    [0, 0], // Alice -> Intro to Programming
    [0, 2], // Alice -> Web Development
    [1, 0], // Bob -> Intro to Programming
    [1, 1], // Bob -> Data Structures
    [1, 3], // Bob -> Database Systems
    [2, 1], // Carol -> Data Structures
    [2, 2], // Carol -> Web Development
    [3, 2], // David -> Web Development
    [3, 3], // David -> Database Systems
    [3, 4], // David -> Software Engineering
    [4, 0], // Eva -> Intro to Programming
    [4, 4], // Eva -> Software Engineering
  ];

  for (const [si, ci] of enrollmentPairs) {
    const result = await postJSON(`${BASE_URL}/enrollments`, {
      studentId: createdStudents[si].id,
      courseId: createdCourses[ci].id,
    });
    console.log(`  Enrolled: ${createdStudents[si].fullName} -> ${createdCourses[ci].name}`);
  }

  console.log('\nSeed complete! You can now test the API.');
  console.log(`  GET http://localhost:3000/students`);
  console.log(`  GET http://localhost:3000/courses`);
  console.log(`  GET http://localhost:3000/enrollments`);
}

seed().catch((err) => {
  console.error('Seed failed. Are all services running? (gateway:3000, student:3001, course:3002, enrollment:3003)');
  console.error(err.message);
});
