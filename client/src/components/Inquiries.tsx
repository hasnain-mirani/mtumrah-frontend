// src/components/Inquiries.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { http } from '../lib/http';
import {
  Search,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Phone,
} from 'lucide-react';

type UiInquiry = {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'pending' | 'responded' | 'closed' | string;
  priority: 'low' | 'medium' | 'high' | string;
  approvalStatus?: 'pending' | 'approved' | 'rejected' | string;
  response?: string;
  agentId?: string;
  agentName?: string;
  createdAt?: string;
};

function mapInquiry(i: any): UiInquiry {
  const id = i?._id || i?.id || crypto.randomUUID();
  return {
    id,
    name: i?.name ?? i?.customerName ?? 'Unknown',
    email: i?.email ?? '',
    phone: i?.phone ?? i?.contactNumber ?? '',
    subject: i?.subject ?? '(No subject)',
    message: i?.message ?? '',
    status: (i?.status ?? 'pending') as UiInquiry['status'],
    priority: (i?.priority ?? 'low') as UiInquiry['priority'],
    approvalStatus: i?.approvalStatus,
    response: i?.response,
    agentId: i?.agentId ?? i?.agent?.id,
    agentName: i?.agentName ?? i?.agent?.name ?? '',
    createdAt: i?.createdAt,
  };
}

function getStatusColor(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'responded':
      return 'bg-blue-100 text-blue-800';
    case 'closed':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4" />;
    case 'responded':
      return <MessageSquare className="h-4 w-4" />;
    case 'closed':
      return <CheckCircle className="h-4 w-4" />;
    default:
      return <XCircle className="h-4 w-4" />;
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800';
    case 'medium':
      return 'bg-orange-100 text-orange-800';
    case 'low':
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function formatDate(dateString?: string) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (Number.isNaN(d.valueOf())) return '—';
  return d.toLocaleString();
}

const Inquiries: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [list, setList] = useState<UiInquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'responded' | 'closed'>('all');

  const [responseText, setResponseText] = useState('');
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const canEditInquiry = (inq: UiInquiry) => isAdmin || inq.agentId === (user as any)?.agentId;

  const fetchInquiries = async () => {
    setLoading(true);
    setErr('');
    try {
      const url = isAdmin ? '/api/inquiries' : '/api/inquiries/my';
      const { data } = await http.get(url);
      const arr = Array.isArray(data) ? data : (data?.inquiries ?? []);
      setList(arr.map(mapInquiry));
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        (typeof e?.response?.data === 'string' ? e.response.data : '') ||
        e?.message ||
        'Failed to load inquiries';
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const startResponse = (id: string) => {
    setRespondingTo(id);
    setResponseText('');
  };
  const cancelResponse = () => {
    setRespondingTo(null);
    setResponseText('');
  };

  // Send response to backend
  const respond = async (inquiryId: string, text: string) => {
    // If your backend uses PUT /api/inquiries/:id instead of /respond,
    // replace the next line with:
    // const { data } = await http.put(`/api/inquiries/${inquiryId}`, isAdmin ? { response: text, status: 'responded' } : { response: text });
    const { data } = await http.put(`/api/inquiries/${inquiryId}/respond`, {
      response: text,
      ...(isAdmin ? { status: 'responded' } : {}), // admin can mark as responded directly
    });

    // Prefer server response; otherwise update locally
    const updated = mapInquiry(data?.inquiry ?? data ?? {});
    setList((prev) => prev.map((i) => (i.id === inquiryId ? updated : i)));

    // If server returns nothing meaningful, do a soft update:
    if (!data) {
      setList((prev) =>
        prev.map((i) =>
          i.id === inquiryId
            ? {
                ...i,
                response: text,
                status: isAdmin ? 'responded' : i.status, // agents may remain 'pending' until approval
                approvalStatus: isAdmin ? 'approved' : 'pending',
              }
            : i
        )
      );
    }
  };

  const closeInquiry = async (inquiryId: string) => {
    try {
      const { data } = await http.put(`/api/inquiries/${inquiryId}`, { status: 'closed' });
      const updated = mapInquiry(data?.inquiry ?? data ?? { _id: inquiryId, status: 'closed' });
      setList((prev) => prev.map((i) => (i.id === inquiryId ? updated : i)));
    } catch {
      alert('Failed to close inquiry');
    }
  };

  const submitResponse = async () => {
    if (!respondingTo || !responseText.trim()) return;
    try {
      await respond(respondingTo, responseText.trim());
      setRespondingTo(null);
      setResponseText('');
    } catch (e) {
      alert('Failed to send response');
    }
  };

  const displayInquiries = useMemo(() => {
    // If you ever fetch global for agents, keep this filter:
    return isAdmin ? list : list.filter((i) => i.agentId === (user as any)?.agentId);
  }, [isAdmin, list, user]);

  const filteredInquiries = displayInquiries.filter((inquiry) => {
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      inquiry.name.toLowerCase().includes(s) ||
      inquiry.subject.toLowerCase().includes(s) ||
      inquiry.id.toLowerCase().includes(s);
    const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = filteredInquiries.filter((i) => i.status === 'pending').length;
  const respondedCount = filteredInquiries.filter((i) => i.status === 'responded').length;
  const closedCount = filteredInquiries.filter((i) => i.status === 'closed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isAdmin ? 'All Inquiries' : 'My Inquiries'}
          </h1>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Home</span>
            <span>/</span>
            <span className="text-blue-600">Inquiries</span>
          </div>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && <div className="bg-white rounded-xl border border-gray-200 p-4">Loading inquiries…</div>}
      {err && !loading && <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4">{err}</div>}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
            </div>
            <div className="ml-2 sm:ml-4">
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">{pendingCount}</p>
              <p className="text-xs sm:text-sm text-gray-600">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <div className="ml-2 sm:ml-4">
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">{respondedCount}</p>
              <p className="text-xs sm:text-sm text-gray-600">Responded</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            </div>
            <div className="ml-2 sm:ml-4">
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">{closedCount}</p>
              <p className="text-xs sm:text-sm text-gray-600">Closed</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
            </div>
            <div className="ml-2 sm:ml-4">
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">{filteredInquiries.length}</p>
              <p className="text-xs sm:text-sm text-gray-600">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search inquiries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="responded">Responded</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Inquiries List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="divide-y divide-gray-200">
          {filteredInquiries.map((inquiry) => (
            <div key={inquiry.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between space-y-4 xl:space-y-0">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                    <span className="text-xs sm:text-sm font-medium text-blue-600">{inquiry.id}</span>
                    <span
                      className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        inquiry.status
                      )}`}
                    >
                      {getStatusIcon(inquiry.status)}
                      <span>{inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}</span>
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(inquiry.priority)}`}>
                      {inquiry.priority.charAt(0).toUpperCase() + inquiry.priority.slice(1)} Priority
                    </span>
                    {inquiry.approvalStatus === 'pending' && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Pending Approval
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2 line-clamp-2">{inquiry.subject}</h3>

                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 lg:space-x-6 text-xs sm:text-sm text-gray-500 mb-3">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <User className="h-4 w-4" />
                      <span className="truncate">{inquiry.name}</span>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{inquiry.email}</span>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <Phone className="h-4 w-4" />
                      <span>{inquiry.phone}</span>
                    </div>
                  </div>

                  <p className="text-sm sm:text-base text-gray-600 mb-4 line-clamp-2 sm:line-clamp-3">{inquiry.message}</p>

                  {inquiry.response && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <h4 className="text-sm font-medium text-blue-900 mb-1">Response:</h4>
                      <p className="text-sm text-blue-800">{inquiry.response}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0 text-xs sm:text-sm text-gray-500">
                    <div>
                      Assigned to: <span className="font-medium text-gray-900">{inquiry.agentName || '—'}</span>
                      {inquiry.approvalStatus === 'pending' && <span className="ml-2 text-orange-600">(Pending Approval)</span>}
                    </div>
                    <div>Created: {formatDate(inquiry.createdAt)}</div>
                  </div>
                </div>

                <div className="flex flex-col space-y-2 xl:ml-6">
                  <button className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                    View Details
                  </button>

                  {canEditInquiry(inquiry) && inquiry.status === 'pending' && (
                    <button
                      className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      onClick={() => startResponse(inquiry.id)}
                    >
                      Respond
                    </button>
                  )}

                  {isAdmin && inquiry.status !== 'closed' && (
                    <button
                      className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                      onClick={() => closeInquiry(inquiry.id)}
                    >
                      Close
                    </button>
                  )}
                </div>
              </div>

              {/* Response Form */}
              {respondingTo === inquiry.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Write Response:</h4>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Type your response here..."
                  />
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={submitResponse}
                      disabled={!responseText.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send Response
                    </button>
                    <button
                      onClick={cancelResponse}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {!loading && !err && filteredInquiries.length === 0 && (
            <div className="p-8 text-center text-gray-500">No inquiries found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inquiries;
