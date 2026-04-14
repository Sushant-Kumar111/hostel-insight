import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Page, LateEntryRequest } from '../types';
import { addDoc, collection, serverTimestamp, query, where, onSnapshot } from '../firebase';
import { db } from '../firebase';

interface LateEntryProps {
    navigateTo: (page: Page) => void;
    user: User;
    setNotification: (notification: { message: string, type: 'success' | 'error' } | null) => void;
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

const LateEntry: React.FC<LateEntryProps> = ({ navigateTo, user, setNotification }) => {
    const [departureTime, setDepartureTime] = useState('');
    const [expectedReturnTime, setExpectedReturnTime] = useState('');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pastRequests, setPastRequests] = useState<LateEntryRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!db) {
            setIsLoading(false);
            return;
        }
        // FIX: Removed orderBy to avoid needing a composite index. Sorting is now done client-side.
        const q = query(
            collection(db, 'lateEntryRequests'),
            where('userId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const userRequests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LateEntryRequest));
             // Sort client-side by creation date, newest first
            userRequests.sort((a, b) => {
                const timeA = a.createdAt?.seconds ?? 0;
                const timeB = b.createdAt?.seconds ?? 0;
                return timeB - timeA;
            });
            setPastRequests(userRequests);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching past requests:", error);
            setNotification({ message: 'Failed to load your past requests.', type: 'error' });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user.uid, setNotification]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!departureTime || !expectedReturnTime || !reason) {
            setNotification({ message: 'Please fill in all fields.', type: 'error' });
            return;
        }
        if (new Date(expectedReturnTime) <= new Date(departureTime)) {
            setNotification({ message: 'Return time must be after departure time.', type: 'error' });
            return;
        }
        if (!db) return;

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "lateEntryRequests"), {
                userId: user.uid,
                userName: user.displayName || user.email,
                departureTime: new Date(departureTime),
                expectedReturnTime: new Date(expectedReturnTime),
                reason,
                status: 'Pending',
                createdAt: serverTimestamp(),
            });
            setNotification({ message: 'Your late entry request has been submitted!', type: 'success' });
            setDepartureTime('');
            setExpectedReturnTime('');
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
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Late Entry Request</h1>
                    <p className="mt-2 text-lg text-gray-600">Submit a request for permission to enter the hostel late.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="departureTime" className="block text-sm font-medium text-gray-700 mb-1">Departure Time *</label>
                            <input
                                id="departureTime"
                                type="datetime-local"
                                value={departureTime}
                                onChange={(e) => setDepartureTime(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500 transition"
                            />
                        </div>
                        <div>
                            <label htmlFor="expectedReturnTime" className="block text-sm font-medium text-gray-700 mb-1">Expected Return Time *</label>
                            <input
                                id="expectedReturnTime"
                                type="datetime-local"
                                value={expectedReturnTime}
                                onChange={(e) => setExpectedReturnTime(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500 transition"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                        <textarea
                            id="reason"
                            rows={4}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Please provide a valid reason for your late entry..."
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500 transition"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 px-4 bg-violet-600 text-white font-bold rounded-lg hover:bg-violet-700 disabled:bg-gray-400 transition-colors"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                </form>
            </div>

            <div className="mt-12 bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Past Requests</h2>
                {isLoading ? (
                    <p>Loading your requests...</p>
                ) : pastRequests.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">You have not submitted any late entry requests yet.</p>
                ) : (
                    <div className="space-y-4">
                        {pastRequests.map(request => (
                            <div key={request.id} className="border border-gray-200 p-4 rounded-lg bg-slate-50">
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <h3 className="font-semibold text-gray-800">
                                            Return: {formatTimestamp(request.expectedReturnTime)}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Depart: {formatTimestamp(request.departureTime)}
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

export default LateEntry;
