import { mockUsers, getStudentCourses } from '@/lib/enhanced-mock-data';

export default function CoursesPage() {
  const student = mockUsers.students[0]; // Replace with real auth data
  const courses = getStudentCourses();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Courses</h1>
        <span className="text-sm text-gray-500">Student: {student.name}</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white p-6 rounded-lg shadow border hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">{course.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs ${
                course.status === 'Active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {course.status}
              </span>
            </div>
            <p className="text-gray-600 mb-2">{course.code}</p>
            <p className="text-sm text-gray-500 mb-2">Instructor: {course.instructor}</p>
            <p className="text-sm text-gray-500 mb-4">{course.semester}</p>
            {course.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Credits: {course.credits}</span>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No courses available for this semester.</p>
        </div>
      )}
    </div>
  );
}