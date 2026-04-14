import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, doc, updateDoc, query, where, orderBy } from '../../firebase';
import { Page, RoomChangeRequest } from '../../types';

interface RoomChangeRequestsProps {
    setNotification: (notification: { message: string, type: 'success' | 'error' } | null) => void;
    onApproveRoomChange: (request: RoomChangeRequest) => Promise<void>;
    navigateTo: (page: Page) => void;
}

const RoomChangeRequests: React.FC<RoomChangeRequestsProps> = ({ setNotification, onApproveRoomChange, navigateTo }) => {
    const [requests, setRequests] = useState<RoomChangeRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db) return;
        const q = query(collection(db, 'roomChangeRequests'), where('status', '==', 'Pending'), orderBy('createdAt', 'desc'));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const requestsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RoomChangeRequest));
            setRequests(requestsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching room change requests:", error);
            setNotification({ message: 'Failed to fetch room change requests.', type: 'error' });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [setNotification]);

    const handleRejectRequest = async (requestId: string) => {
        if (!db) return;
        try {
            const requestRef = doc(db, 'roomChangeRequests', requestId);
            await updateDoc(requestRef, { status: 'Rejected' });
            setNotification({ message: 'Request has been rejected.', type: 'success' });
        } catch (error) {
            console.error("Error rejecting request:", error);
            setNotification({ message: 'Failed to reject request.', type: 'error' });
        }
    };
    
    if (loading) {
        return <div className="text-center p-8">Loading requests...</div>;
    }

    return (
        <div>
            <button onClick={() => navigateTo(Page.AdminDashboard)} className="mb-6 text-violet-600 hover:text-violet-800 font-semibold">
                &larr; Back to Dashboard
            </button>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Pending Room Change Requests</h2>
                {requests.length === 0 ? (
                    <p className="text-gray-500">No pending room change requests.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Room</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preferred Room</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {requests.map(req => (
                                    <tr key={req.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.userName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{`${req.currentRoom.roomName}, Floor ${req.currentRoom.floorNumber}`}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.preferredRoom ? `${req.preferredRoom.roomName}, Floor ${req.preferredRoom.floorNumber}` : 'N/A'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{req.reason}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button onClick={() => onApproveRoomChange(req)} className="text-green-600 hover:text-green-900 bg-green-100 px-3 py-1 rounded-md">Approve</button>
                                            <button onClick={() => handleRejectRequest(req.id)} className="text-red-600 hover:text-red-900 bg-red-100 px-3 py-1 rounded-md">Reject</button>
                                        </td>
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

export default RoomChangeRequests;
