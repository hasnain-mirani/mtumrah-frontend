import React, { createContext, useContext, useState } from 'react';
import { Booking, Inquiry, Agent, Analytics } from '../types';

interface DataContextType {
  bookings: Booking[];
  inquiries: Inquiry[];
  agents: Agent[];
  analytics: Analytics;
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => void;
  updateBooking: (id: string, updates: Partial<Booking>, requiresApproval?: boolean) => void;
  deleteBooking: (id: string, requiresApproval?: boolean) => void;
  addInquiry: (inquiry: Omit<Inquiry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateInquiry: (id: string, updates: Partial<Inquiry>, requiresApproval?: boolean) => void;
  addAgent: (agent: Omit<Agent, 'id' | 'totalBookings' | 'totalRevenue' | 'recentBookings'>) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;
  approveChange: (type: 'booking' | 'inquiry', id: string) => void;
  rejectChange: (type: 'booking' | 'inquiry', id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: 'BK001',
      customer: 'Mohammed Ali',
      email: 'mohammed@example.com',
      phone: '+966 50 123 4567',
      package: 'Premium Umrah Package',
      departureDate: '2024-03-15',
      returnDate: '2024-03-22',
      status: 'confirmed',
      amount: '$3,500',
      agentId: 'AG001',
      agentName: 'Ali Rahman',
      createdAt: '2024-02-10',
    },
    {
      id: 'BK002',
      customer: 'Fatima Ahmed',
      email: 'fatima@example.com',
      phone: '+966 55 987 6543',
      package: 'Standard Umrah Package',
      departureDate: '2024-04-01',
      returnDate: '2024-04-08',
      status: 'pending',
      amount: '$2,800',
      agentId: 'AG002',
      agentName: 'Sara Khan',
      createdAt: '2024-02-12',
    }
  ]);

  const [inquiries, setInquiries] = useState<Inquiry[]>([
    {
      id: 'INQ001',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      phone: '+966 50 111 2222',
      subject: 'Premium Umrah Package Inquiry',
      message: 'I am interested in your premium Umrah package for a family of 4.',
      status: 'pending',
      priority: 'high',
      agentId: 'AG001',
      agentName: 'Ali Rahman',
      createdAt: '2024-02-15T10:30:00Z',
      updatedAt: '2024-02-15T10:30:00Z',
    },
    {
      id: 'INQ002',
      name: 'Omar Hassan',
      email: 'omar@example.com',
      phone: '+966 55 333 4444',
      subject: 'Travel Dates Inquiry',
      message: 'What are the available travel dates for March 2024?',
      status: 'responded',
      priority: 'medium',
      agentId: 'AG002',
      agentName: 'Sara Khan',
      createdAt: '2024-02-14T14:20:00Z',
      updatedAt: '2024-02-14T16:45:00Z',
      response: 'We have availability from March 10-25. Please let me know your preferred dates.'
    }
  ]);

  const [agents, setAgents] = useState<Agent[]>([
    {
      id: 'AG001',
      name: 'Ali Rahman',
      email: 'ali@example.com',
      phone: '+966 50 123 4567',
      totalBookings: 15,
      totalRevenue: 45000,
      monthlyTarget: 50000,
      joinDate: '2023-06-15',
      status: 'active',
      recentBookings: [
        { id: 'BK001', customer: 'Mohammed Ali', amount: 3500 }
      ]
    },
    {
      id: 'AG002',
      name: 'Sara Khan',
      email: 'sara@example.com',
      phone: '+966 55 987 6543',
      totalBookings: 12,
      totalRevenue: 38000,
      monthlyTarget: 40000,
      joinDate: '2023-08-20',
      status: 'active',
      recentBookings: [
        { id: 'BK002', customer: 'Fatima Ahmed', amount: 2800 }
      ]
    }
  ]);

  const analytics: Analytics = {
    totalBookings: bookings.length,
    monthlyBookings: bookings.filter(b =>
      new Date(b.createdAt).getMonth() === new Date().getMonth()
    ).length,
    totalRevenue: bookings.reduce((sum, b) =>
      sum + parseInt(b.amount.replace(/[$,]/g, '')), 0
    ),
    activeInquiries: inquiries.filter(i => i.status === 'pending').length,
    resolvedInquiries: inquiries.filter(i => i.status !== 'pending').length,
    agentPerformance: agents.map(agent => ({
      agentId: agent.id,
      agentName: agent.name,
      bookings: bookings.filter(b => b.agentId === agent.id).length,
      revenue: bookings
        .filter(b => b.agentId === agent.id)
        .reduce((sum, b) => sum + parseInt(b.amount.replace(/[$,]/g, '')), 0),
      inquiries: inquiries.filter(i => i.agentId === agent.id).length
    })),
    monthlyTrends: [
      { month: 'Jan', bookings: 8, revenue: 24000 },
      { month: 'Feb', bookings: 12, revenue: 36000 },
      { month: 'Mar', bookings: 15, revenue: 45000 }
    ]
  };

  const addBooking = (bookingData: Omit<Booking, 'id' | 'createdAt'>) => {
    const newBooking: Booking = {
      ...bookingData,
      id: `BK${String(bookings.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setBookings(prev => [...prev, newBooking]);
  };

  const updateBooking = (id: string, updates: Partial<Booking>, requiresApproval = false) => {
    setBookings(prev => prev.map(booking => {
      if (booking.id === id) {
        if (requiresApproval) {
          return {
            ...booking,
            pendingChanges: updates,
            approvalStatus: 'pending'
          };
        }
        return { ...booking, ...updates };
      }
      return booking;
    }));
  };

  const deleteBooking = (id: string, requiresApproval = false) => {
    if (requiresApproval) {
      updateBooking(id, { status: 'cancelled' }, true);
    } else {
      setBookings(prev => prev.filter(booking => booking.id !== id));
    }
  };

  const addInquiry = (inquiryData: Omit<Inquiry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newInquiry: Inquiry = {
      ...inquiryData,
      id: `INQ${String(inquiries.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setInquiries(prev => [...prev, newInquiry]);
  };

  const updateInquiry = (id: string, updates: Partial<Inquiry>, requiresApproval = false) => {
    setInquiries(prev => prev.map(inquiry => {
      if (inquiry.id === id) {
        if (requiresApproval) {
          return {
            ...inquiry,
            pendingChanges: updates,
            approvalStatus: 'pending'
          };
        }
        return { ...inquiry, ...updates, updatedAt: new Date().toISOString() };
      }
      return inquiry;
    }));
  };

  const addAgent = (agentData: Omit<Agent, 'id' | 'totalBookings' | 'totalRevenue' | 'recentBookings'>) => {
    const newAgent: Agent = {
      ...agentData,
      id: `AG${String(agents.length + 1).padStart(3, '0')}`,
      totalBookings: 0,
      totalRevenue: 0,
      recentBookings: []
    };
    setAgents(prev => [...prev, newAgent]);
  };

  const updateAgent = (id: string, updates: Partial<Agent>) => {
    setAgents(prev => prev.map(agent => 
      agent.id === id ? { ...agent, ...updates } : agent
    ));
  };

  const deleteAgent = (id: string) => {
    setAgents(prev => prev.filter(agent => agent.id !== id));
  };

  const approveChange = (type: 'booking' | 'inquiry', id: string) => {
    if (type === 'booking') {
      setBookings(prev => prev.map(booking => {
        if (booking.id === id && booking.pendingChanges) {
          return {
            ...booking,
            ...booking.pendingChanges,
            status: booking.pendingChanges.status || 'confirmed',
            pendingChanges: undefined,
            approvalStatus: undefined
          };
        }
        return booking;
      }));
    } else {
      setInquiries(prev => prev.map(inquiry => {
        if (inquiry.id === id && inquiry.pendingChanges) {
          return {
            ...inquiry,
            ...inquiry.pendingChanges,
            status: inquiry.pendingChanges.status || 'responded',
            pendingChanges: undefined,
            approvalStatus: undefined,
            updatedAt: new Date().toISOString()
          };
        }
        return inquiry;
      }));
    }
  };

  const rejectChange = (type: 'booking' | 'inquiry', id: string) => {
    if (type === 'booking') {
      setBookings(prev => prev.map(booking => {
        if (booking.id === id) {
          return {
            ...booking,
            pendingChanges: undefined,
            approvalStatus: undefined
          };
        }
        return booking;
      }));
    } else {
      setInquiries(prev => prev.map(inquiry => {
        if (inquiry.id === id) {
          return {
            ...inquiry,
            pendingChanges: undefined,
            approvalStatus: undefined
          };
        }
        return inquiry;
      }));
    }
  };

  const value = {
    bookings,
    inquiries,
    agents,
    analytics,
    addBooking,
    updateBooking,
    deleteBooking,
    addInquiry,
    updateInquiry,
    addAgent,
    updateAgent,
    deleteAgent,
    approveChange,
    rejectChange
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};