export function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your projects and track progress
          </p>
        </div>
        <button className="btn btn-primary btn-md">
          New Project
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card hover:shadow-md transition-shadow">
          <div className="card-content">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  VOXTREE Development
                </h3>
                <p className="text-sm text-gray-500 mb-2">VOXINNOV PVT LTD</p>
                <p className="text-sm text-gray-600 mb-4">
                  Development of the VOXTREE project management system
                </p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
              <span>3 modules</span>
              <span className="font-medium">₹50,000</span>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-md transition-shadow">
          <div className="card-content">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  E-commerce Platform
                </h3>
                <p className="text-sm text-gray-500 mb-2">Client ABC</p>
                <p className="text-sm text-gray-600 mb-4">
                  Full-stack e-commerce solution with payment integration
                </p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Planning
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
              <span>0 modules</span>
              <span className="font-medium">₹75,000</span>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-md transition-shadow">
          <div className="card-content">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  Mobile App
                </h3>
                <p className="text-sm text-gray-500 mb-2">Startup XYZ</p>
                <p className="text-sm text-gray-600 mb-4">
                  React Native mobile application for iOS and Android
                </p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                On Hold
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
              <span>2 modules</span>
              <span className="font-medium">₹30,000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export default ProjectsPage;
