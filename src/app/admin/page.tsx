import { prisma } from "@/lib/db";

export default async function AdminDashboard() {
  const [userCount, studentCount, teacherCount, assessmentCount, submissionCount, subjectCount, classCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "TEACHER" } }),
      prisma.assessment.count(),
      prisma.submission.count(),
      prisma.subject.count(),
      prisma.class.count(),
    ]);

  const recentAssessments = await prisma.assessment.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      subject: { select: { name: true } },
      createdBy: { select: { name: true } },
      _count: { select: { submissions: true } },
    },
  });

  const stats = [
    { label: "Students", value: studentCount, color: "#1a56db" },
    { label: "Teachers", value: teacherCount, color: "#3b82f6" },
    { label: "Assessments", value: assessmentCount, color: "#a78bfa" },
    { label: "Submissions", value: submissionCount, color: "#10b981" },
    { label: "Subjects", value: subjectCount, color: "#ff6b00" },
    { label: "Classes", value: classCount, color: "#f59e0b" },
  ];

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "#6b7280" }}>Nextora Academy — System Overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="card text-center py-5">
            <div
              className="text-2xl font-bold mb-0.5"
              style={{ color: stat.color }}
            >
              {stat.value}
            </div>
            <div className="text-xs" style={{ color: "#6b7280" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b" style={{ borderColor: "#2e3250" }}>
          <h2 className="font-semibold text-white">Recent Assessments</h2>
        </div>
        <div>
          {recentAssessments.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm" style={{ color: "#6b7280" }}>No assessments yet.</p>
          ) : (
            recentAssessments.map((a) => (
              <div key={a.id} className="px-6 py-4 border-b last:border-0 flex items-center justify-between" style={{ borderColor: "#2e3250" }}>
                <div>
                  <p className="font-medium text-white">{a.title}</p>
                  <p className="text-sm" style={{ color: "#6b7280" }}>
                    {a.subject.name} · by {a.createdBy.name}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded"
                    style={{ background: "rgba(26,86,219,0.15)", color: "#3b82f6" }}
                  >
                    {a.type}
                  </span>
                  <p className="text-xs mt-1" style={{ color: "#6b7280" }}>{a._count.submissions} submissions</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
