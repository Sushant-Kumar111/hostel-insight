import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from '../../firebase';
import { ComplaintRecord, Page } from '../../types';

interface ComplaintsViewProps {
    setNotification: (notification: { message: string, type: 'success' | 'error' } | null) => void;
    navigateTo: (page: Page) => void;
}

const formatTimestamp = (ts: any) => {
    if (!ts) return '';
    if (typeof ts.toDate === 'function') { // Firestore Timestamp object
        return ts.toDate().toLocaleString();
    }
    if (ts.seconds) { // Serialized Firestore Timestamp
        return new Date(ts.seconds * 1000).toLocaleString();
    }
    const date = new Date(ts); // ISO string or milliseconds
    if (!isNaN(date.getTime())) {
        return date.toLocaleString();
    }
    return 'Invalid Date';
};

const ComplaintsView: React.FC<ComplaintsViewProps> = ({ setNotification, navigateTo }) => {
    const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'Pending' | 'Resolved'>('Pending');

    useEffect(() => {
        if (!db) return;
        const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const complaintsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ComplaintRecord));
            setComplaints(complaintsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching complaints:", error);
            setNotification({ message: 'Failed to fetch complaints.', type: 'error' });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [setNotification]);

    const handleAddressComplaint = async (complaintId: string) => {
        if (!db) return;
        try {
            const complaintRef = doc(db, 'complaints', complaintId);
            await updateDoc(complaintRef, { status: 'Resolved' });
            setNotification({ message: 'Complaint marked as addressed.', type: 'success' });
        } catch (error) {
            console.error("Error addressing complaint:", error);
            setNotification({ message: 'Failed to address complaint.', type: 'error' });
        }
    };

    const filteredComplaints = complaints.filter(complaint => 
        complaint.status === activeTab
    );
    
    if (loading) {
        return <div className="text-center p-8">Loading complaints...</div>;
    }

    return (
        <div>
            <button onClick={() => navigateTo(Page.AdminDashboard)} className="mb-6 text-violet-600 hover:text-violet-800 font-semibold">
                &larr; Back to Dashboard
            </button>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold text-gray-800">All Hostel Complaints</h2>
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('Pending')}
                            className={`px-4 py-2 text-sm font-medium ${activeTab === 'Pending' ? 'border-b-2 border-violet-500 text-violet-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Pending
                        </button>
                        <button
                            onClick={() => setActiveTab('Resolved')}
                            className={`px-4 py-2 text-sm font-medium ${activeTab === 'Resolved' ? 'border-b-2 border-violet-500 text-violet-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Resolved
                        </button>
                    </div>
                </div>

                {filteredComplaints.length === 0 ? (
                     <div className="text-center py-12 text-gray-500">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No Complaints</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            There are no {activeTab.toLowerCase()} complaints at this time.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredComplaints.map(complaint => (
                           <div key={complaint.id} className="border border-gray-200 p-4 rounded-lg bg-slate-50 shadow-sm transition-all hover:shadow-md">
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-violet-700">
                                            {complaint.location 
                                                ? `${complaint.location.roomName} (Floor ${complaint.location.floorNumber})`
                                                : 'General Complaint'}
                                        </h3>
                                        <p className="text-sm font-medium text-gray-600">
                                            <span className="font-normal">By:</span> {complaint.userName}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <span className="text-xs text-gray-500">{formatTimestamp(complaint.createdAt)}</span>
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-xs font-semibold text-gray-700">
                                        {complaint.category}
                                    </span>
                                </div>
                                <p className="mt-3 text-gray-700 border-t border-gray-200 pt-3">{complaint.description}</p>
                                {activeTab === 'Pending' && (
                                    <div className="mt-4 text-right">
                                        <button
                                            onClick={() => handleAddressComplaint(complaint.id)}
                                            className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            Mark as Addressed
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ComplaintsView;
