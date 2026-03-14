import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { incidentApi } from '../api/incidents';
import { commentApi } from '../api/comments';
import { useAuth } from '../context/AuthContext';
import type { Incident, IncidentSeverity, IncidentStatus } from '../types/incident';
import type { Comment } from '../types/comment';
import { format } from 'date-fns';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle,
  Clock,
  Copy,
  Lock,
  Send,
  Shield,
  UserRound,
} from 'lucide-react';

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // RESTORED: Inline Closing State instead of Modal
  const [isClosingMode, setIsClosingMode] = useState(false);
  const [rootCauseInput, setRootCauseInput] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const MIN_ROOT_CAUSE_LENGTH = 30;

  // RESTORED: Auto-scroll ref
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;

    try {
      const [incidentData, commentsData] = await Promise.all([
        incidentApi.get(id),
        commentApi.list(id),
      ]);

      setIncident(incidentData);
      setComments(commentsData);
    } catch (error) {
      console.error('Failed to load war room data:', error);
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // RESTORED: Auto-scroll to bottom of comments when they change
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleUpdateIncident = async <TField extends 'status' | 'severity'>(
    field: TField,
    value: Incident[TField],
  ) => {
    if (!id || !incident) return;
    if (incident[field] === value) return;

    if (field === 'status' && value === 'CLOSED') {
      setIsClosingMode(true);
      return;
    }

    try {
      await incidentApi.update(id, { [field]: value });
      await fetchData();
    } catch (error) {
      console.error(`Failed to update ${field}:`, error);
      alert(`Failed to update ${field}`);
    }
  };

  // RESTORED: Inline closing logic
  const handleConfirmClose = async () => {
    if (!id || rootCauseInput.length < MIN_ROOT_CAUSE_LENGTH) return;

    setIsClosing(true);
    try {
      await commentApi.create(id, { body: `Root Cause: ${rootCauseInput}` });
      await incidentApi.update(id, { 
        status: 'CLOSED',
        root_cause: rootCauseInput 
      });

      setIsClosingMode(false);
      setRootCauseInput('');
      await fetchData();
    } catch (error) {
      console.error('Failed to close incident:', error);
      alert('Failed to close incident');
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
      console.error('Failed to post comment:', error);
      alert('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyId = async () => {
    if (!incident) return;
    try {
      await navigator.clipboard.writeText(incident.id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Failed to copy incident ID:', error);
    }
  };

  if (isLoading || !incident) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        Loading War Room...
      </div>
    );
  }

  const isClosed = incident.status === 'CLOSED';
  const isAdmin = currentUser?.is_admin ?? false;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
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
            <p className="text-sm text-gray-700 font-medium">
              This incident is CLOSED and read-only. No further edits can be made.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className={`shadow-sm rounded-lg p-6 border ${isAdmin ? 'border-amber-200 bg-amber-50/40' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isAdmin ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'}`}>
                      {isAdmin ? 'Admin context' : 'Incident detail'}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">{incident.title}</h1>
                </div>

                <button
                  type="button"
                  onClick={handleCopyId}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:border-gray-400"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy ID'}
                </button>
              </div>

              <p className="text-gray-600 mb-6 whitespace-pre-wrap">{incident.description}</p>

              <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Raised by
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-sm font-medium text-gray-900">
                      {isAdmin ? (
                        <Shield className="h-4 w-4 text-amber-600" />
                      ) : (
                        <UserRound className="h-4 w-4 text-gray-400" />
                      )}
                      {incident.owner_email}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Incident ID
                    </p>
                    <p className="mt-2 font-mono text-xs text-gray-700 break-all max-w-[160px]">
                      {incident.id.substring(0, 8)}...
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* RESTORED: Inline Closing Controls */}
                {isClosingMode ? (
                  <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                    <h3 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1.5" />
                      Finalize & Close Incident
                    </h3>
                    <p className="text-xs text-blue-700 mb-3">
                      Please provide the official Root Cause. This will be permanently logged.
                    </p>
                    <textarea
                      rows={4}
                      value={rootCauseInput}
                      onChange={(e) => setRootCauseInput(e.target.value)}
                      placeholder="e.g., A memory leak in v2.4 caused the event loop to block..."
                      className="w-full border border-blue-200 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm mb-3"
                    />
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${rootCauseInput.length < MIN_ROOT_CAUSE_LENGTH ? 'text-red-500' : 'text-green-600'}`}>
                        {rootCauseInput.length}/{MIN_ROOT_CAUSE_LENGTH} min chars
                      </span>
                      <div className="space-x-2">
                        <button
                          onClick={() => {
                            setIsClosingMode(false);
                            setRootCauseInput('');
                          }}
                          className="text-xs font-medium text-gray-600 hover:text-gray-900 px-2 py-1"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleConfirmClose}
                          disabled={isClosing || rootCauseInput.length < MIN_ROOT_CAUSE_LENGTH}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {isClosing ? 'Saving...' : 'Confirm Close'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        disabled={isClosed}
                        value={incident.status}
                        onChange={(e) =>
                          handleUpdateIncident('status', e.target.value as IncidentStatus)
                        }
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                      >
                        <option value="OPEN">Open</option>
                        <option value="INVESTIGATING">Investigating</option>
                        <option value="MITIGATED">Mitigated</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                      <select
                        disabled={isClosed}
                        value={incident.severity}
                        onChange={(e) =>
                          handleUpdateIncident('severity', e.target.value as IncidentSeverity)
                        }
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </div>
                  </>
                )}

                {isClosed && incident.root_cause && (
                  <div className="mt-4 bg-gray-50 p-3 rounded-md border border-gray-200">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Root Cause</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{incident.root_cause}</p>
                  </div>
                )}

                <hr className="my-4 border-gray-200" />

                <div className="text-sm text-gray-500 space-y-2">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    Created: {format(new Date(incident.created_at), 'PPp')}
                  </div>
                  {incident.started_at && (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      Started: {format(new Date(incident.started_at), 'PPp')}
                    </div>
                  )}
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

          <div className="lg:col-span-2 flex flex-col h-[800px]">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 flex flex-col h-full">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                <h2 className="text-lg font-medium text-gray-900">Audit Trail & Comments</h2>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                {comments.length === 0 ? (
                  <p className="text-center text-gray-500 italic mt-10">
                    No activity logged yet.
                  </p>
                ) : (
                  comments.map((comment) => {
                    const isSystem = comment.body.startsWith('System:');
                    const isRootCause = comment.body.startsWith('Root Cause:');

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
                          <div className={`border shadow-sm rounded-lg p-4 max-w-2xl w-full ${isRootCause ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200'}`}>
                            <div className="flex justify-between items-start mb-2">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded ${isRootCause ? 'text-indigo-700 bg-indigo-100' : 'text-blue-600 bg-blue-50'}`}>
                                {isRootCause ? 'Official Root Cause' : 'User Note'}
                              </span>
                              <span className="text-xs text-gray-400">
                                {format(new Date(comment.created_at), 'MMM d, HH:mm')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">
                              {isRootCause
                                ? comment.body.replace('Root Cause: ', '')
                                : comment.body}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                {/* RESTORED: The invisible anchor element */}
                <div ref={commentsEndRef} />
              </div>

              <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
                <form onSubmit={handlePostComment} className="flex space-x-3">
                  <input
                    type="text"
                    disabled={isClosed}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={isClosed ? 'Incident closed. Comments disabled.' : 'Add a note to the timeline...'}
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
    </div>
  );
}
