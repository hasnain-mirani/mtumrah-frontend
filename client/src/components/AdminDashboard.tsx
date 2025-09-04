import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import StatCard from './StatCard';
import PieChart from './PieChart';
import { 
  Calendar, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  XCircle,
  BarChart3,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { analytics, bookings, inquiries, agents, approveChange, rejectChange } = useData();

  // Get pending approvals
  const pendingBookings = bookings.filter(b => b.approvalStatus === 'pending');
  const pendingInquiries = inquiries.filter(i => i.approvalStatus === 'pending');
  const totalPendingApprovals = pendingBookings.length + pendingInquiries.length;

  // Calculate real-time metrics
  const totalRevenue = bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + parseInt(b.amount.replace(/[$,]/g, '')), 0);

  const activeInquiries = inquiries.filter(i => i.status === 'pending').length;
  const resolvedInquiries = inquiries.filter(i => i.status === 'responded' || i.status === 'closed').length;

  // Monthly bookings (current month)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyBookings = bookings.filter(b => {
    const bookingDate = new Date(b.createdAt);
    return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
  }).length;
  const stats = [
    {
      title: 'Total Bookings',
      value: bookings.length.toString(),
      icon: Calendar,
      color: 'bg-blue-500',
      trend: monthlyBookings > 0 ? `+${monthlyBookings} this month` : 'No bookings this month',
    },
    {
      title: 'Active Inquiries',
      value: activeInquiries.toString(),
      icon: MessageSquare,
      color: 'bg-emerald-500',
      trend: `${resolvedInquiries} resolved`,
    },
    {
      title: 'Pending Approvals',
      value: totalPendingApprovals.toString(),
      icon: Clock,
      color: 'bg-orange-500',
      trend: totalPendingApprovals > 0 ? 'Needs attention' : 'All clear',
    },
    {
      title: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      trend: `${bookings.filter(b => b.status === 'confirmed').length} confirmed`,
    },
  ];

  // Calculate real-time agent performance
  const agentPerformanceData = agents.map((agent, index) => {
    const agentBookings = bookings.filter(b => b.agentId === agent.id).length;
    const totalBookings = bookings.length || 1; // Prevent division by zero
    return {
      name: agent.name,
      value: (agentBookings / totalBookings) * 100,
      color: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F59E0B'][index % 6]
    };
  });

  // Calculate monthly trends (last 6 months)
  const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    const monthNum = date.getMonth();
    
    const monthBookings = bookings.filter(b => {
      const bookingDate = new Date(b.createdAt);
      return bookingDate.getMonth() === monthNum && bookingDate.getFullYear() === year;
    });
    
    const monthRevenue = monthBookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + parseInt(b.amount.replace(/[$,]/g, '')), 0);
    
    return {
      month: `${month} ${year}`,
      bookings: monthBookings.length,
      revenue: monthRevenue
    };
  }).reverse();

  const pendingApprovals = [
    ...bookings.filter(b => b.approvalStatus === 'pending').map(b => ({
      type: 'booking' as const,
      id: b.id,
      title: `Booking Update - ${b.customer}`,
      agent: b.agentName,
      changes: b.pendingChanges
    })),
    ...inquiries.filter(i => i.approvalStatus === 'pending').map(i => ({
      type: 'inquiry' as const,
      id: i.id,
      title: `Inquiry Update - ${i.subject}`,
      agent: i.agentName,
      changes: i.pendingChanges
    }))
  ];

  const handleApproveBooking = (bookingId: string) => {
    approveChange('booking', bookingId);
  };

  const handleRejectBooking = (bookingId: string) => {
    rejectChange('booking', bookingId);
  };

  const handleApproveInquiry = (inquiryId: string) => {
    approveChange('inquiry', inquiryId);
  };

  const handleRejectInquiry = (inquiryId: string) => {
    rejectChange('inquiry', inquiryId);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 gap-6 lg:gap-8">
        {/* Agent Performance Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Bookings by Agents
          </h3>
          <div className="text-sm text-gray-500 mb-6">Current Year</div>
          {agentPerformanceData.length > 0 ? (
            <PieChart data={agentPerformanceData} />
          ) : (
            <div className="text-center py-8 text-gray-500">
              No booking data available
            </div>
          )}
        </div>
      </div>

      {/* Agent Performance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bookings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inquiries
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {agents.map((agent) => {
                const agentBookings = bookings.filter(b => b.agentId === agent.id);
                const agentRevenue = agentBookings
                  .filter(b => b.status === 'confirmed')
                  .reduce((sum, b) => sum + parseInt(b.amount.replace(/[$,]/g, '')), 0);
                const agentInquiries = inquiries.filter(i => i.agentId === agent.id);
                const performance = agent.monthlyTarget > 0 ? (agentRevenue / agent.monthlyTarget) * 100 : 0;
                
                return (
                  <tr key={agent.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                          <div className="text-sm text-gray-500">{agent.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {agentBookings.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${agentRevenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {agentInquiries.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(performance, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{performance.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Approvals */}
      {totalPendingApprovals > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
            Pending Approvals ({totalPendingApprovals})
          </h3>
          <div className="space-y-4">
            {/* Pending Bookings */}
            {pendingBookings.map((booking) => (
              <div key={`booking-${booking.id}`} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <h4 className="font-medium text-gray-900">Booking Update - {booking.customer}</h4>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Agent: {booking.agentName}</p>
                    <p className="text-sm text-gray-600">Package: {booking.package}</p>
                    <p className="text-sm text-gray-600">Amount: {booking.amount}</p>
                    {booking.pendingChanges && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-gray-600">
                        <strong>Requested Changes:</strong>
                        <pre className="mt-1 whitespace-pre-wrap">{JSON.stringify(booking.pendingChanges, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleApproveBooking(booking.id)}
                      className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleRejectBooking(booking.id)}
                      className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Pending Inquiries */}
            {pendingInquiries.map((inquiry) => (
              <div key={`inquiry-${inquiry.id}`} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-green-500" />
                      <h4 className="font-medium text-gray-900">Inquiry Update - {inquiry.subject}</h4>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Agent: {inquiry.agentName}</p>
                    <p className="text-sm text-gray-600">Customer: {inquiry.name}</p>
                    <p className="text-sm text-gray-600">Priority: {inquiry.priority}</p>
                    {inquiry.pendingChanges && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-gray-600">
                        <strong>Requested Changes:</strong>
                        <pre className="mt-1 whitespace-pre-wrap">{JSON.stringify(inquiry.pendingChanges, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleApproveInquiry(inquiry.id)}
                      className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleRejectInquiry(inquiry.id)}
                      className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;