import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Activity, Plus } from 'lucide-react';
import { incidentApi } from '../api/incidents';
import type { Incident } from '../types/incident';
import { format } from 'date-fns';
import CreateIncidentModal from '../components/CreateIncidentModal'; // <-- 1. Import Modal

export default function Dashboard() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // <-- 2. Add Modal State
  const [isModalOpen, setIsModalOpen] = useState(false); 

  // <-- 3. Extract the fetch logic so we can call it on demand
  const fetchIncidents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await incidentApi.list();
      setIncidents(data);
    } catch (error) {
      console.error("Failed to load incidents:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch when the component mounts
  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-xl font-bold text-gray-900">Incident Logbook</span>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setIsModalOpen(true)} // <-- Add this onClick handler
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Report Incident
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <p className="text-center text-gray-500 mt-10">Loading incidents...</p>
        ) : incidents.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg border border-gray-200 shadow-sm">
            <h3 className="mt-2 text-sm font-medium text-gray-900">No incidents</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by reporting a new incident.</p>
          </div>
        ) : (
          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Title</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Severity</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {incidents.map((incident) => (
                  <tr 
                    key={incident.id} 
                    onClick={() => navigate(`/incidents/${incident.id}`)} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                      {incident.title}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      {incident.status}
                    </td>
                    <td className="px-3 py-4 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(incident.severity)}`}>
                        {incident.severity}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      {/* Format: Mar 07, 2026 */}
                      {format(new Date(incident.created_at), 'MMM dd, yyyy')} 
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
        {/* Add the Modal component here at the bottom */}
      <CreateIncidentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchIncidents} // Trigger a refresh when an incident is created!
      />
    </div>
  );
}