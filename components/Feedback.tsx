import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { Page } from '../types';
import Icon from './icons/IconMap';
import { addDoc, collection, serverTimestamp } from '../firebase';
// FIX: Corrected import path to be explicit.
import { db } from '../firebase.ts';

interface FeedbackProps {
    navigateTo: (page: Page) => void;
    user: User;
    setNotification: (notification: { message: string, type: 'success' | 'error' } | null) => void;
}

const Feedback: React.FC<FeedbackProps> = ({ navigateTo, user, setNotification }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [category, setCategory] = useState('');
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            setNotification({message: 'Please provide a star rating.', type: 'error'});
            return;
        }
         if (!category) {
            setNotification({message: 'Please select a category.', type: 'error'});
            return;
        }
        if (!db) {
            setNotification({message: 'Database not connected.', type: 'error'});
            return;
        }
        setIsSubmitting(true);
        try {
            await addDoc(collection(db!, 'feedback'), {
                userId: user.uid,
                userName: user.displayName || user.email,
                rating,
                category,
                comment,
                createdAt: serverTimestamp(),
            });
            setNotification({message: 'Thank you for your feedback!', type: 'success'});
            setRating(0);
            setCategory('');
            setComment('');
        } catch (error) {
            console.error("Error submitting feedback:", error);
            setNotification({message: 'Failed to submit feedback. Please try again.', type: 'error'});
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
             <button onClick={() => navigateTo(Page.Dashboard)} className="mb-6 text-violet-600 hover:text-violet-800 font-semibold">
                &larr; Back to Dashboard
            </button>
            <div className="bg-white p-8 rounded-lg shadow-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Share Your Feedback</h1>
                    <p className="mt-2 text-lg text-gray-600">Your opinion matters to us and helps us improve.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Overall Rating</label>
                        <div className="flex justify-center items-center space-x-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    type="button"
                                    key={star}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="focus:outline-none"
                                >
                                    <Icon name="Feedback" className={`h-10 w-10 transition-colors duration-200 ${ (hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-300'}`} />
                                </button>
                            ))}
                        </div>
                    </div>
                     <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Feedback Category</label>
                        <select
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500 transition"
                        >
                            <option value="">Select a category...</option>
                            <option value="Overall Experience">Overall Experience</option>
                            <option value="Room Quality">Room Quality</option>
                            <option value="Mess & Food">Mess & Food</option>
                            <option value="Staff & Service">Staff & Service</option>
                            <option value="Facilities">Facilities</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">Comments (optional)</label>
                        <textarea
                            id="comment"
                            rows={5}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Tell us more about your experience..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500 transition"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 px-4 bg-violet-600 text-white font-bold rounded-lg hover:bg-violet-700 disabled:bg-gray-400 transition-colors"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Feedback;
