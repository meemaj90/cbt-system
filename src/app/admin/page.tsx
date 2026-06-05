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
    { label: "Total Students", value: studentCount, color: "bg-blue-500", icon: "👨‍🎓" },
    { label: "Total Teachers", value: teacherCount, color: "bg-indigo-500", icon: "👨‍🏫" },
    { label: "Assessments", value: assessmentCount, color: "bg-purple-500", icon: "📝" },
    { label: "Submissions", value: submissionCount, color: "bg-green-500", icon: "✅" },
    { label: "Subjects", value: subjectCount, color: "bg-orange-500", icon: "📚" },
    { label: "Classes", value: classCount, color: "bg-teal-500", icon: "🏫" },
  ];

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Nextora Academy — System Overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Recent Assessments</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {recentAssessments.length === 0 ? (
            <p className="px-6 py-8 text-center text-gray-500 text-sm">No assessments yet.</p>
          ) : (
            recentAssessments.map((a) => (
              <div key={a.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{a.title}</p>
                  <p className="text-sm text-gray-500">
                    {a.subject.name} · by {a.createdBy.name}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                    {a.type}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{a._count.submissions} submissions</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
