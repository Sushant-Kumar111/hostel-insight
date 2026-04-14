import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Page, LeaveRequest } from '../types';
import { addDoc, collection, serverTimestamp, query, where, onSnapshot, orderBy } from '../firebase';
import { db } from '../firebase';

interface LeaveApplyProps {
    navigateTo: (page: Page) => void;
    user: User;
    setNotification: (notification: { message: string, type: 'success' | 'error' } | null) => void;
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

const LeaveApply: React.FC<LeaveApplyProps> = ({ navigateTo, user, setNotification }) => {
    const [departureDateTime, setDepartureDateTime] = useState('');
    const [returnDateTime, setReturnDateTime] = useState('');
    const [placeOfVisit, setPlaceOfVisit] = useState('');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pastRequests, setPastRequests] = useState<LeaveRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!db) {
            setIsLoading(false);
            return;
        }
        const q = query(
            collection(db, 'leaveRequests'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const userRequests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaveRequest));
            setPastRequests(userRequests);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching past requests:", error);
            setNotification({ message: 'Failed to load your past leave requests.', type: 'error' });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user.uid, setNotification]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!departureDateTime || !returnDateTime || !placeOfVisit || !reason) {
            setNotification({ message: 'Please fill in all fields.', type: 'error' });
            return;
        }
        if (new Date(returnDateTime) <= new Date(departureDateTime)) {
            setNotification({ message: 'Return date and time must be after departure.', type: 'error' });
            return;
        }
        if (!db) return;

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "leaveRequests"), {
                userId: user.uid,
                userName: user.displayName || user.email,
                departureDateTime: new Date(departureDateTime),
                returnDateTime: new Date(returnDateTime),
                placeOfVisit,
                reason,
                status: 'Pending',
                createdAt: serverTimestamp(),
            });
            setNotification({ message: 'Your leave request has been submitted successfully!', type: 'success' });
            setDepartureDateTime('');
            setReturnDateTime('');
            setPlaceOfVisit('');
            setReason('');
        } catch (error) {
            console.error("Error submitting request: ", error);
            setNotification({ message: 'Failed to submit request. Please try again.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const statusStyles = {
        Pending: 'bg-yellow-100 text-yellow-800',
        Approved: 'bg-green-100 text-green-800',
        Rejected: 'bg-red-100 text-red-800',
    };

    return (
        <div className="max-w-3xl mx-auto">
            <button onClick={() => navigateTo(Page.Dashboard)} className="mb-6 text-violet-600 hover:text-violet-800 font-semibold">
                &larr; Back to Dashboard
            </button>
            <div className="bg-white p-8 rounded-lg shadow-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Apply for Leave</h1>
                    <p className="mt-2 text-lg text-gray-600">Please fill out the details for your leave request.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="departureDateTime" className="block text-sm font-medium text-gray-700 mb-1">Departure Date & Time *</label>
                            <input
                                id="departureDateTime"
                                type="datetime-local"
                                value={departureDateTime}
                                onChange={(e) => setDepartureDateTime(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500 transition"
                            />
                        </div>
                        <div>
                            <label htmlFor="returnDateTime" className="block text-sm font-medium text-gray-700 mb-1">Return Date & Time *</label>
                            <input
                                id="returnDateTime"
                                type="datetime-local"
                                value={returnDateTime}
                                onChange={(e) => setReturnDateTime(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500 transition"
                            />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="placeOfVisit" className="block text-sm font-medium text-gray-700 mb-1">Place of Visit *</label>
                        <input
                            id="placeOfVisit"
                            type="text"
                            value={placeOfVisit}
                            onChange={(e) => setPlaceOfVisit(e.target.value)}
                            placeholder="e.g., Hometown, City Name"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500 transition"
                        />
                    </div>
                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">Reason for Leave *</label>
                        <textarea
                            id="reason"
                            rows={4}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g., Family function, Medical appointment..."
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500 transition"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 px-4 bg-violet-600 text-white font-bold rounded-lg hover:bg-violet-700 disabled:bg-gray-400 transition-colors"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Leave Request'}
                    </button>
                </form>
            </div>

            <div className="mt-12 bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Leave History</h2>
                {isLoading ? (
                    <p>Loading your requests...</p>
                ) : pastRequests.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">You have not submitted any leave requests yet.</p>
                ) : (
                    <div className="space-y-4">
                        {pastRequests.map(request => (
                            <div key={request.id} className="border border-gray-200 p-4 rounded-lg bg-slate-50">
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <h3 className="font-semibold text-gray-800">
                                            To: {request.placeOfVisit}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {formatTimestamp(request.departureDateTime)} - {formatTimestamp(request.returnDateTime)}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusStyles[request.status]}`}>
                                        {request.status}
                                    </span>
                                </div>
                                <p className="mt-2 text-gray-700">{request.reason}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeaveApply;
