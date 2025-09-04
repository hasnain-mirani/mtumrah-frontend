import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import StatCard from './StatCard';
import { Calendar, MessageSquare, TrendingUp, Clock } from 'lucide-react';

const AgentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { bookings, inquiries, analytics } = useData();

  // Filter data for current agent
  const agentBookings = bookings.filter(b => b.agentId === user?.agentId);
  const agentInquiries = inquiries.filter(i => i.agentId === user?.agentId);
  
  const agentRevenue = agentBookings.reduce((sum, b) => 
    sum + parseInt(b.amount.replace(/[$,]/g, '')), 0
  );

  const pendingApprovals = [
    ...agentBookings.filter(b => b.approvalStatus === 'pending'),
    ...agentInquiries.filter(i => i.approvalStatus === 'pending')
  ];

  const stats = [
    {
      title: 'My Bookings',
      value: agentBookings.length.toString(),
      icon: Calendar,
      color: 'bg-blue-500',
      trend: '+5%',
    },
    {
      title: 'My Inquiries',
      value: agentInquiries.length.toString(),
      icon: MessageSquare,
      color: 'bg-emerald-500',
      trend: '+3%',
    },
    {
      title: 'Pending Approvals',
      value: pendingApprovals.length.toString(),
      icon: Clock,
      color: 'bg-orange-500',
      trend: 'No change',
    },
    {
      title: 'My Revenue',
      value: `$${agentRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      trend: '+15%',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Agent Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option>This Month</option>
            <option>This Week</option>
            <option>Today</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        {/* Recent Bookings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Bookings</h3>
          <div className="space-y-4">
            {agentBookings.slice(0, 5).map((booking) => (
              <div key={booking.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-2 h-2 rounded-full mt-2 bg-blue-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{booking.customer}</p>
                  <p className="text-sm text-gray-500">{booking.package}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-400">{booking.departureDate}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-900">{booking.amount}</div>
              </div>
            ))}
            {agentBookings.length === 0 && (
              <p className="text-gray-500 text-center py-8">No bookings yet</p>
            )}
          </div>
        </div>

        {/* Recent Inquiries */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Inquiries</h3>
          <div className="space-y-4">
            {agentInquiries.slice(0, 5).map((inquiry) => (
              <div key={inquiry.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  inquiry.status === 'pending' ? 'bg-yellow-500' :
                  inquiry.status === 'responded' ? 'bg-blue-500' : 'bg-green-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{inquiry.name}</p>
                  <p className="text-sm text-gray-500 truncate">{inquiry.subject}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-400">
                      {new Date(inquiry.createdAt).toLocaleDateString()}
                    </p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      inquiry.priority === 'high' ? 'bg-red-100 text-red-800' :
                      inquiry.priority === 'medium' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {inquiry.priority}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {agentInquiries.length === 0 && (
              <p className="text-gray-500 text-center py-8">No inquiries yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Pending Approvals */}
      {pendingApprovals.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 text-orange-500 mr-2" />
            Pending Admin Approval ({pendingApprovals.length})
          </h3>
          <div className="space-y-4">
            {pendingApprovals.map((item) => (
              <div key={item.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {'customer' in item ? `Booking: ${item.customer}` : `Inquiry: ${item.subject}`}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {'customer' in item ? item.package : item.message}
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      Waiting for admin approval
                    </p>
                  </div>
                  <div className="ml-4">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                      Pending
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{agentBookings.length}</div>
            <div className="text-sm text-gray-500">Total Bookings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">${agentRevenue.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Total Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {agentInquiries.filter(i => i.status === 'responded').length}
            </div>
            <div className="text-sm text-gray-500">Resolved Inquiries</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;