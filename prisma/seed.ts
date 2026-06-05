import { PrismaClient } from "@prisma/client";
const Role = { ADMIN: "ADMIN", TEACHER: "TEACHER", STUDENT: "STUDENT" } as const;
const AssessmentType = { WRITTEN: "WRITTEN", PROJECT: "PROJECT", ORAL: "ORAL" } as const;
const AssessmentStatus = { PUBLISHED: "PUBLISHED", DRAFT: "DRAFT" } as const;
const QuestionType = { MCQ: "MCQ", ESSAY: "ESSAY", SHORT_ANSWER: "SHORT_ANSWER" } as const;
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create classes
  const jss1 = await prisma.class.upsert({
    where: { name: "JSS1" },
    update: {},
    create: { name: "JSS1", description: "Junior Secondary School 1" },
  });
  const jss2 = await prisma.class.upsert({
    where: { name: "JSS2" },
    update: {},
    create: { name: "JSS2", description: "Junior Secondary School 2" },
  });
  const ss1 = await prisma.class.upsert({
    where: { name: "SS1" },
    update: {},
    create: { name: "SS1", description: "Senior Secondary School 1" },
  });

  // Create subjects
  const math = await prisma.subject.upsert({
    where: { code: "MATH" },
    update: {},
    create: { name: "Mathematics", code: "MATH", description: "Mathematics" },
  });
  const english = await prisma.subject.upsert({
    where: { code: "ENG" },
    update: {},
    create: { name: "English", code: "ENG", description: "English Language" },
  });
  const science = await prisma.subject.upsert({
    where: { code: "SCI" },
    update: {},
    create: { name: "Science", code: "SCI", description: "Basic Science" },
  });
  const social = await prisma.subject.upsert({
    where: { code: "SOC" },
    update: {},
    create: { name: "Social Studies", code: "SOC", description: "Social Studies" },
  });
  const ict = await prisma.subject.upsert({
    where: { code: "ICT" },
    update: {},
    create: { name: "ICT", code: "ICT", description: "Information and Communication Technology" },
  });

  // Create admin
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@nextora.edu" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@nextora.edu",
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  // Create teachers
  const teacherPassword = await bcrypt.hash("teacher123", 12);
  const teacher1 = await prisma.user.upsert({
    where: { email: "teacher1@nextora.edu" },
    update: {},
    create: {
      name: "Mr. John Adebayo",
      email: "teacher1@nextora.edu",
      password: teacherPassword,
      role: Role.TEACHER,
    },
  });
  const teacher2 = await prisma.user.upsert({
    where: { email: "teacher2@nextora.edu" },
    update: {},
    create: {
      name: "Mrs. Grace Okafor",
      email: "teacher2@nextora.edu",
      password: teacherPassword,
      role: Role.TEACHER,
    },
  });

  // Create students
  const studentPassword = await bcrypt.hash("student123", 12);
  const studentsData = [
    { name: "Chidi Nwosu", email: "chidi@nextora.edu", studentId: "NXT001", classId: jss1.id },
    { name: "Amara Eze", email: "amara@nextora.edu", studentId: "NXT002", classId: jss1.id },
    { name: "Tunde Bakare", email: "tunde@nextora.edu", studentId: "NXT003", classId: jss2.id },
    { name: "Ngozi Obi", email: "ngozi@nextora.edu", studentId: "NXT004", classId: jss2.id },
    { name: "Emeka Nzewi", email: "emeka@nextora.edu", studentId: "NXT005", classId: ss1.id },
  ];

  const students = [];
  for (const s of studentsData) {
    const student = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        name: s.name,
        email: s.email,
        password: studentPassword,
        role: Role.STUDENT,
        studentId: s.studentId,
        classId: s.classId,
      },
    });
    students.push(student);
  }

  // Create sample written assessment
  const writtenAssessment = await prisma.assessment.create({
    data: {
      title: "Mathematics Mid-Term Examination",
      description: "Mid-term examination covering algebra and geometry topics",
      type: AssessmentType.WRITTEN,
      status: AssessmentStatus.PUBLISHED,
      subjectId: math.id,
      classId: jss1.id,
      createdById: teacher1.id,
      duration: 60,
      totalMarks: 40,
      passMark: 20,
      instructions: "Answer all questions. Show workings where necessary. No calculators allowed.",
      startTime: new Date(Date.now() - 86400000),
      endTime: new Date(Date.now() + 7 * 86400000),
    },
  });

  // Add MCQ questions
  const mcqQuestions = [
    {
      text: "What is the value of x in the equation 2x + 6 = 14?",
      options: JSON.stringify(["x = 2", "x = 4", "x = 6", "x = 8"]),
      correctAnswer: "x = 4",
      marks: 2,
    },
    {
      text: "What is the area of a rectangle with length 8cm and width 5cm?",
      options: JSON.stringify(["30 cm²", "35 cm²", "40 cm²", "45 cm²"]),
      correctAnswer: "40 cm²",
      marks: 2,
    },
    {
      text: "Which of the following is a prime number?",
      options: JSON.stringify(["9", "15", "17", "21"]),
      correctAnswer: "17",
      marks: 2,
    },
    {
      text: "What is 15% of 200?",
      options: JSON.stringify(["25", "30", "35", "40"]),
      correctAnswer: "30",
      marks: 2,
    },
    {
      text: "What is the perimeter of a square with side 7cm?",
      options: JSON.stringify(["21 cm", "28 cm", "35 cm", "49 cm"]),
      correctAnswer: "28 cm",
      marks: 2,
    },
  ];

  for (let i = 0; i < mcqQuestions.length; i++) {
    await prisma.question.create({
      data: {
        assessmentId: writtenAssessment.id,
        order: i + 1,
        type: QuestionType.MCQ,
        text: mcqQuestions[i].text,
        options: mcqQuestions[i].options,
        correctAnswer: mcqQuestions[i].correctAnswer,
        marks: mcqQuestions[i].marks,
      },
    });
  }

  // Add essay questions
  await prisma.question.create({
    data: {
      assessmentId: writtenAssessment.id,
      order: 6,
      type: QuestionType.ESSAY,
      text: "Explain the concept of algebraic expressions and give three examples of how they are used in real life. (15 marks)",
      marks: 15,
    },
  });

  await prisma.question.create({
    data: {
      assessmentId: writtenAssessment.id,
      order: 7,
      type: QuestionType.ESSAY,
      text: "A rectangular garden has a perimeter of 48m. If the length is 4m more than the width, find the dimensions of the garden. Show all workings. (15 marks)",
      marks: 15,
    },
  });

  // Create sample project assessment
  const projectAssessment = await prisma.assessment.create({
    data: {
      title: "ICT Practical Project - Website Design",
      description: "Create a simple website using HTML and CSS",
      type: AssessmentType.PROJECT,
      status: AssessmentStatus.PUBLISHED,
      subjectId: ict.id,
      classId: ss1.id,
      createdById: teacher2.id,
      totalMarks: 100,
      passMark: 50,
      instructions:
        "Create a personal portfolio website using HTML and CSS. The website should have at least 3 pages: Home, About, and Contact. Submit the project files as a ZIP archive.",
      endTime: new Date(Date.now() + 14 * 86400000),
    },
  });

  // Add project criteria
  const projectCriteria = [
    { name: "Design & Layout", description: "Visual appeal and layout of the website", maxMarks: 25 },
    { name: "HTML Structure", description: "Proper use of HTML tags and semantic elements", maxMarks: 25 },
    { name: "CSS Styling", description: "Quality and creativity of CSS styling", maxMarks: 25 },
    { name: "Functionality", description: "Working links, forms, and interactive elements", maxMarks: 15 },
    { name: "Code Quality", description: "Clean, commented, and well-organized code", maxMarks: 10 },
  ];

  for (const criteria of projectCriteria) {
    await prisma.projectCriteria.create({
      data: {
        assessmentId: projectAssessment.id,
        name: criteria.name,
        description: criteria.description,
        maxMarks: criteria.maxMarks,
      },
    });
  }

  // Create sample oral assessment
  const oralAssessment = await prisma.assessment.create({
    data: {
      title: "English Oral Presentation",
      description: "Individual oral presentation on a chosen topic",
      type: AssessmentType.ORAL,
      status: AssessmentStatus.PUBLISHED,
      subjectId: english.id,
      classId: jss2.id,
      createdById: teacher2.id,
      totalMarks: 50,
      passMark: 25,
      instructions:
        "Each student will give a 5-minute oral presentation on a topic of their choice. You will be evaluated on content, delivery, and language use.",
      endTime: new Date(Date.now() + 5 * 86400000),
    },
  });

  // Add oral criteria
  const oralCriteria = [
    { name: "Content & Knowledge", description: "Depth and accuracy of information presented", maxMarks: 20 },
    { name: "Delivery & Confidence", description: "Clarity, confidence, and engagement", maxMarks: 15 },
    { name: "Language Use", description: "Grammar, vocabulary, and pronunciation", maxMarks: 15 },
  ];

  for (const criteria of oralCriteria) {
    await prisma.oralCriteria.create({
      data: {
        assessmentId: oralAssessment.id,
        name: criteria.name,
        description: criteria.description,
        maxMarks: criteria.maxMarks,
      },
    });
  }

  console.log("Database seeded successfully!");
  console.log("\nLogin credentials:");
  console.log("Admin: admin@nextora.edu / admin123");
  console.log("Teacher 1: teacher1@nextora.edu / teacher123");
  console.log("Teacher 2: teacher2@nextora.edu / teacher123");
  console.log("Students: chidi@nextora.edu, amara@nextora.edu, etc. / student123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
