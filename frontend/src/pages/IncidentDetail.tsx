import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { incidentApi } from '../api/incidents';
import { commentApi } from '../api/comments';
import type { Incident, IncidentSeverity } from '../types/incident';
import type { Comment } from '../types/comment';
import { format } from 'date-fns';
import { ArrowLeft, AlertTriangle, Clock, Lock, Send, X } from 'lucide-react';

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [incident, setIncident] = useState<Incident | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // NEW: State for the Close Incident Modal
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [closingComment, setClosingComment] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const [incidentData, commentsData] = await Promise.all([
        incidentApi.get(id),
        commentApi.list(id)
      ]);
      setIncident(incidentData);
      setComments(commentsData);
    } catch (error) {
      console.error("Failed to load war room data:", error);
      navigate('/dashboard'); 
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateIncident = async (field: 'status' | 'severity', value: string) => {
    if (!id || !incident) return;

    // NEW: Intercept the CLOSED status change!
    if (field === 'status' && value === 'CLOSED') {
      setIsCloseModalOpen(true);
      return; // Stop here. Do not fire the API yet.
    }

    try {
      await incidentApi.update(id, { [field]: value });
      await fetchData(); 
    } catch (error) {
      console.error(`Failed to update ${field}:`, error);
      alert(`Failed to update ${field}`);
    }
  };

  // NEW: The function that runs when they submit the closing rationale
  const handleConfirmClose = async () => {
    if (!id || !closingComment.trim()) return;
    
    setIsClosing(true);
    try {
      // 1. Post the human rationale first
      await commentApi.create(id, { body: `Closing Rationale: ${closingComment}` });
      // 2. Actually close the incident
      await incidentApi.update(id, { status: 'CLOSED' });
      
      // Cleanup and refresh
      setIsCloseModalOpen(false);
      setClosingComment('');
      await fetchData();
    } catch (error) {
      console.error("Failed to close incident:", error);
      alert("Failed to close incident");
    } finally {
      setIsClosing(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      await commentApi.create(id, { body: newComment });
      setNewComment('');
      await fetchData(); 
    } catch (error) {
      console.error("Failed to post comment:", error);
      alert("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !incident) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading War Room...</div>;
  }

  const isClosed = incident.status === 'CLOSED';

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6 lg:px-8">
        <button 
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {isClosed && (
          <div className="mb-6 bg-gray-100 border-l-4 border-gray-500 p-4 rounded-md flex items-center shadow-sm">
            <Lock className="h-5 w-5 text-gray-500 mr-2" />
            <p className="text-sm text-gray-700 font-medium">This incident is CLOSED and read-only. No further edits can be made.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Incident Details & Controls */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{incident.title}</h1>
              <p className="text-gray-600 mb-6 whitespace-pre-wrap">{incident.description}</p>

              <div className="space-y-4">
                {/* Status Control */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    disabled={isClosed}
                    value={incident.status}
                    onChange={(e) => handleUpdateIncident('status', e.target.value)}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    <option value="OPEN">Open</option>
                    <option value="INVESTIGATING">Investigating</option>
                    <option value="MITIGATED">Mitigated</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                {/* Severity Control */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                  <select
                    disabled={isClosed}
                    value={incident.severity}
                    onChange={(e) => handleUpdateIncident('severity', e.target.value)}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <hr className="my-4 border-gray-200" />

                {/* Timestamps */}
                <div className="text-sm text-gray-500 space-y-2">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    Created: {format(new Date(incident.created_at), 'PPp')}
                  </div>
                  {incident.resolved_at && (
                    <div className="flex items-center text-green-600">
                      <Clock className="h-4 w-4 mr-2" />
                      Resolved: {format(new Date(incident.resolved_at), 'PPp')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: The Audit Trail & Comments */}
          <div className="lg:col-span-2 flex flex-col h-[800px]">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 flex flex-col h-full">
              
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                <h2 className="text-lg font-medium text-gray-900">Audit Trail & Comments</h2>
              </div>

              {/* Scrollable Timeline */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                {comments.length === 0 ? (
                  <p className="text-center text-gray-500 italic mt-10">No activity logged yet.</p>
                ) : (
                  comments.map((comment) => {
                    const isSystem = comment.body.startsWith('System:');
                    const isRationale = comment.body.startsWith('Closing Rationale:');
                    
                    return (
                      <div key={comment.id} className={`flex ${isSystem ? 'justify-center' : 'justify-start'}`}>
                        {isSystem ? (
                          <div className="bg-gray-200/50 rounded-full px-4 py-1.5 text-xs text-gray-600 flex items-center shadow-sm border border-gray-300">
                            <AlertTriangle className="h-3 w-3 mr-1.5 text-gray-500" />
                            {comment.body}
                            <span className="ml-2 text-gray-400">
                              {format(new Date(comment.created_at), 'HH:mm')}
                            </span>
                          </div>
                        ) : (
                          <div className={`border shadow-sm rounded-lg p-4 max-w-2xl w-full ${isRationale ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
                            <div className="flex justify-between items-start mb-2">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded ${isRationale ? 'text-red-700 bg-red-100' : 'text-blue-600 bg-blue-50'}`}>
                                {isRationale ? 'Closing Rationale' : 'User Note'}
                              </span>
                              <span className="text-xs text-gray-400">
                                {format(new Date(comment.created_at), 'MMM d, HH:mm')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">
                              {isRationale ? comment.body.replace('Closing Rationale: ', '') : comment.body}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Comment Input Area */}
              <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
                <form onSubmit={handlePostComment} className="flex space-x-3">
                  <input
                    type="text"
                    disabled={isClosed}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={isClosed ? "Incident closed. Comments disabled." : "Add a note to the timeline..."}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <button
                    type="submit"
                    disabled={isClosed || isSubmitting || !newComment.trim()}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Posting...' : 'Post'}
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* NEW: Close Incident Confirmation Modal */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setIsCloseModalOpen(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Close Incident</h3>
                <button onClick={() => setIsCloseModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-4">
                  Please provide a reason for closing this incident. This will be permanently logged in the audit trail.
                </p>
                <textarea
                  rows={4}
                  required
                  value={closingComment}
                  onChange={(e) => setClosingComment(e.target.value)}
                  placeholder="e.g., Confirmed with the database team that the connection pool was successfully resized."
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                />
              </div>

              <div className="sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  disabled={isClosing || !closingComment.trim()}
                  onClick={handleConfirmClose}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {isClosing ? 'Closing...' : 'Confirm Close'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}