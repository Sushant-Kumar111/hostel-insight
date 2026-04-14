import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, query, orderBy } from '../../firebase';
import { FeedbackRecord, Page } from '../../types';
import Icon from '../icons/IconMap';

interface FeedbackViewProps {
    setNotification: (notification: { message: string, type: 'success' | 'error' } | null) => void;
    navigateTo: (page: Page) => void;
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
            <Icon key={star} name="Feedback" className={`h-5 w-5 ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`} />
        ))}
    </div>
);

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

const FeedbackView: React.FC<FeedbackViewProps> = ({ setNotification, navigateTo }) => {
    const [feedback, setFeedback] = useState<FeedbackRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db) return;
        const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const feedbackData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedbackRecord));
            setFeedback(feedbackData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching feedback:", error);
            setNotification({ message: 'Failed to fetch feedback.', type: 'error' });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [setNotification]);

    if (loading) {
        return <div className="text-center p-8">Loading feedback...</div>;
    }

    return (
        <div>
            <button onClick={() => navigateTo(Page.AdminDashboard)} className="mb-6 text-violet-600 hover:text-violet-800 font-semibold">
                &larr; Back to Dashboard
            </button>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4">All Student Feedback</h2>
                {feedback.length === 0 ? (
                    <p className="text-gray-500">No feedback has been submitted yet.</p>
                ) : (
                    <div className="space-y-4">
                        {feedback.map(item => (
                            <div key={item.id} className="border border-gray-200 p-4 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-gray-800">{item.category}</p>
                                        <p className="text-sm text-gray-500">By: {item.userName}</p>
                                        <div className="mt-1">
                                            <StarRating rating={item.rating} />
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-400">{formatTimestamp(item.createdAt)}</span>
                                </div>
                                {item.comment && <p className="mt-2 text-gray-700 italic">"{item.comment}"</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeedbackView;
