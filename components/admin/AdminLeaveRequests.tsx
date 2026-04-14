import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from '../../firebase';
import { LeaveRequest, Page } from '../../types';

interface AdminLeaveRequestsProps {
    setNotification: (notification: { message: string, type: 'success' | 'error' } | null) => void;
    navigateTo: (page: Page) => void;
}

const formatTimestamp = (ts: any) => {
    if (!ts) return '';
    if (typeof ts.toDate === 'function') {
        return ts.toDate().toLocaleString();
    }
    if (ts.seconds) {
        return new Date(ts.seconds * 1000).toLocaleString();
    }
    const date = new Date(ts);
    if (!isNaN(date.getTime())) {
        return date.toLocaleString();
    }
    return 'Invalid Date';
};

const AdminLeaveRequests: React.FC<AdminLeaveRequestsProps> = ({ setNotification, navigateTo }) => {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending');

    useEffect(() => {
        if (!db) return;
        const q = query(collection(db, 'leaveRequests'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const requestsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaveRequest));
            setRequests(requestsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching leave requests:", error);
            setNotification({ message: 'Failed to fetch leave requests.', type: 'error' });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [setNotification]);

    const handleUpdateRequest = async (requestId: string, status: 'Approved' | 'Rejected') => {
        if (!db) return;
        try {
            const requestRef = doc(db, 'leaveRequests', requestId);
            await updateDoc(requestRef, { status });
            setNotification({ message: `Request has been ${status.toLowerCase()}.`, type: 'success' });
        } catch (error) {
            console.error(`Error updating request to ${status}:`, error);
            setNotification({ message: 'Failed to update request.', type: 'error' });
        }
    };
    
    const filteredRequests = requests.filter(request => request.status === activeTab);

    if (loading) {
        return <div className="text-center p-8">Loading leave requests...</div>;
    }

    return (
        <div>
            <button onClick={() => navigateTo(Page.AdminDashboard)} className="mb-6 text-violet-600 hover:text-violet-800 font-semibold">
                &larr; Back to Dashboard
            </button>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold text-gray-800">Student Leave Requests</h2>
                    <div className="flex border-b border-gray-200">
                        <button onClick={() => setActiveTab('Pending')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'Pending' ? 'border-b-2 border-violet-500 text-violet-600' : 'text-gray-500 hover:text-gray-700'}`}>Pending</button>
                        <button onClick={() => setActiveTab('Approved')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'Approved' ? 'border-b-2 border-violet-500 text-violet-600' : 'text-gray-500 hover:text-gray-700'}`}>Approved</button>
                        <button onClick={() => setActiveTab('Rejected')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'Rejected' ? 'border-b-2 border-violet-500 text-violet-600' : 'text-gray-500 hover:text-gray-700'}`}>Rejected</button>
                    </div>
                </div>

                {filteredRequests.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p>There are no {activeTab.toLowerCase()} leave requests at this time.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Departure</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destination</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                                    {activeTab === 'Pending' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredRequests.map(req => (
                                    <tr key={req.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.userName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatTimestamp(req.departureDateTime)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatTimestamp(req.returnDateTime)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.placeOfVisit}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={req.reason}>{req.reason}</td>
                                        {activeTab === 'Pending' && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                <button onClick={() => handleUpdateRequest(req.id, 'Approved')} className="text-green-600 hover:text-green-900 bg-green-100 px-3 py-1 rounded-md">Approve</button>
                                                <button onClick={() => handleUpdateRequest(req.id, 'Rejected')} className="text-red-600 hover:text-red-900 bg-red-100 px-3 py-1 rounded-md">Reject</button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminLeaveRequests;
