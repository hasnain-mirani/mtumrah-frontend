import React, { createContext, useContext, useState } from 'react';
import { Booking, Inquiry, Agent, Analytics } from '../types';
import { http } from '../lib/http';

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
  fetchAgents: () => Promise<void>;
  fetchBookings: () => Promise<void>;
  fetchInquiries: () => Promise<void>;
  approveChange: (type: 'booking' | 'inquiry', id: string) => void;
  rejectChange: (type: 'booking' | 'inquiry', id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [inquiries, setInquiries] = useState<Inquiry[]>([]);

  const [agents, setAgents] = useState<Agent[]>([]);

  // Fetch agents from API
  const fetchAgents = React.useCallback(async () => {
    try {
      // Get user from localStorage to determine role
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Only fetch agents data for admins
      if (user.role === 'admin') {
        const { data } = await http.get('/api/agent/performance');
        const agentsList = Array.isArray(data) ? data : data?.data || data?.agents || [];
        setAgents(agentsList);
      } else {
        // For agents, set empty array or skip
        setAgents([]);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      setAgents([]);
    }
  }, []);

  // Fetch bookings from API
  const fetchBookings = React.useCallback(async () => {
    try {
      // Get user from localStorage to determine role
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const endpoint = user.role === 'admin' ? '/api/bookings' : '/api/bookings/my';
      
      const { data } = await http.get(endpoint);
      const bookingsList = Array.isArray(data) ? data : data?.data || data?.bookings || [];
      // Map _id to id for consistency and extract agentId from populated agent object
      const mappedBookings = bookingsList.map(booking => ({
        ...booking,
        id: booking._id || booking.id,
        agentId: booking.agent?._id || booking.agent || booking.agentId,
        agentName: booking.agent?.name || booking.agentName,
        amount: booking.amount || booking.totalAmount // Map totalAmount to amount for consistency
      }));
      setBookings(mappedBookings);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      setBookings([]);
    }
  }, []);

  // Fetch inquiries from API
  const fetchInquiries = React.useCallback(async () => {
    try {
      const { data } = await http.get('/api/inquiries');
      const inquiriesList = Array.isArray(data) ? data : data?.data || data?.inquiries || [];
      // Map _id to id for consistency and extract agentId from populated assignedAgent object
      const mappedInquiries = inquiriesList.map(inquiry => ({
        ...inquiry,
        id: inquiry._id || inquiry.id,
        agentId: inquiry.assignedAgent?._id || inquiry.assignedAgent || inquiry.agentId,
        agentName: inquiry.assignedAgent?.name || inquiry.agentName
      }));
      setInquiries(mappedInquiries);
    } catch (error) {
      console.error('Failed to fetch inquiries:', error);
      setInquiries([]);
    }
  }, []);

  // Load all data on mount (only if user is authenticated)
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchAgents();
      fetchBookings();
      fetchInquiries();
    }
  }, []); // Empty dependency array to run only once

  // Listen for authentication changes
  React.useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('token');
      if (token) {
        fetchAgents();
        fetchBookings();
        fetchInquiries();
      } else {
        setAgents([]);
        setBookings([]);
        setInquiries([]);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const analytics: Analytics = {
    totalBookings: bookings.length,
    monthlyBookings: bookings.filter(b =>
      b.createdAt && new Date(b.createdAt).getMonth() === new Date().getMonth()
    ).length,
    totalRevenue: bookings.reduce((sum, b) => {
      if (!b.amount || typeof b.amount !== 'string') return sum;
      const amount = parseFloat(b.amount.replace(/[$,]/g, '')) || 0;
      return sum + amount;
    }, 0),
    activeInquiries: inquiries.filter(i => i.status === 'pending').length,
    resolvedInquiries: inquiries.filter(i => i.status !== 'pending').length,
    agentPerformance: agents.map(agent => ({
      agentId: agent.id,
      agentName: agent.name,
      bookings: bookings.filter(b => b.agentId === agent.id).length,
      revenue: bookings
        .filter(b => b.agentId === agent.id)
        .reduce((sum, b) => {
          if (!b.amount || typeof b.amount !== 'string') return sum;
          const amount = parseFloat(b.amount.replace(/[$,]/g, '')) || 0;
          return sum + amount;
        }, 0),
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

  const approveChange = async (type: 'booking' | 'inquiry', id: string) => {
    try {
    if (type === 'booking') {
        const { data } = await http.put(`/api/bookings/${id}/approve`);
        if (data.success) {
          setBookings(prev => prev.map(booking => 
            booking.id === id 
              ? { ...booking, approvalStatus: 'approved', status: 'confirmed' }
              : booking
          ));
        }
    } else {
        const { data } = await http.put(`/api/inquiries/${id}/approve`);
        if (data.success) {
          setInquiries(prev => prev.map(inquiry => 
            inquiry.id === id 
              ? { ...inquiry, approvalStatus: 'approved', status: 'responded' }
              : inquiry
          ));
        }
      }
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const rejectChange = async (type: 'booking' | 'inquiry', id: string) => {
    try {
    if (type === 'booking') {
        const { data } = await http.put(`/api/bookings/${id}/reject`);
        if (data.success) {
          setBookings(prev => prev.map(booking => 
            booking.id === id 
              ? { ...booking, approvalStatus: 'rejected', status: 'cancelled' }
              : booking
          ));
        }
    } else {
        const { data } = await http.put(`/api/inquiries/${id}/reject`);
        if (data.success) {
          setInquiries(prev => prev.map(inquiry => 
            inquiry.id === id 
              ? { ...inquiry, approvalStatus: 'rejected', status: 'closed' }
              : inquiry
          ));
        }
      }
    } catch (error) {
      console.error('Failed to reject:', error);
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
    fetchAgents,
    fetchBookings,
    fetchInquiries,
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