import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Page, StudentDetails } from '../types';
import { doc, getDoc, setDoc, serverTimestamp } from '../firebase';
import { db } from '../firebase';

interface PersonalDetailsProps {
    navigateTo: (page: Page) => void;
    user: User;
    setNotification: (notification: { message: string, type: 'success' | 'error' } | null) => void;
}

const PersonalDetails: React.FC<PersonalDetailsProps> = ({ navigateTo, user, setNotification }) => {
    const [details, setDetails] = useState<Omit<StudentDetails, 'uid'>>({
        fullName: user.displayName || '',
        phoneNumber: '',
        homeAddress: '',
        fatherName: '',
        fatherMobile: '',
        motherName: '',
        motherMobile: '',
    });
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!db) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const docRef = doc(db, 'studentDetails', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setDetails({
                        fullName: data.fullName || user.displayName || '',
                        phoneNumber: data.phoneNumber || '',
                        homeAddress: data.homeAddress || '',
                        fatherName: data.fatherName || '',
                        fatherMobile: data.fatherMobile || '',
                        motherName: data.motherName || '',
                        motherMobile: data.motherMobile || '',
                    });
                } else {
                    setDetails(prev => ({ ...prev, fullName: user.displayName || '' }));
                }
            } catch (error) {
                console.error("Error fetching personal details: ", error);
                setNotification({ message: 'Failed to load personal details.', type: 'error' });
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [user.uid, user.displayName, setNotification]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!db) {
            setNotification({ message: 'Database not connected.', type: 'error' });
            return;
        }
        setIsSubmitting(true);
        try {
            const docRef = doc(db, 'studentDetails', user.uid);
            await setDoc(docRef, { 
                uid: user.uid, 
                ...details,
                updatedAt: serverTimestamp()
            }, { merge: true });
            setNotification({ message: 'Personal details updated successfully!', type: 'success' });
        } catch (error) {
            console.error("Error updating personal details: ", error);
            setNotification({ message: 'Failed to update details. Please try again.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading personal details...</div>;
    }

    const formInputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500 transition";

    return (
        <div className="max-w-3xl mx-auto">
            <button onClick={() => navigateTo(Page.Dashboard)} className="mb-6 text-violet-600 hover:text-violet-800 font-semibold">
                &larr; Back to Dashboard
            </button>
            <div className="bg-white p-8 rounded-lg shadow-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Personal Details</h1>
                    <p className="mt-2 text-lg text-gray-600">Keep your information up to date.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-8">
                    <fieldset className="border p-4 rounded-lg">
                        <legend className="text-lg font-semibold text-gray-700 px-2">Your Information</legend>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                <input id="fullName" name="fullName" type="text" value={details.fullName} onChange={handleChange} required className={formInputClass} />
                            </div>
                            <div>
                                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input id="phoneNumber" name="phoneNumber" type="tel" value={details.phoneNumber} onChange={handleChange} className={formInputClass} />
                            </div>
                        </div>
                        <div className="mt-6">
                             <label htmlFor="homeAddress" className="block text-sm font-medium text-gray-700 mb-1">Home Address</label>
                            <textarea id="homeAddress" name="homeAddress" rows={3} value={details.homeAddress} onChange={handleChange} className={formInputClass} />
                        </div>
                    </fieldset>

                     <fieldset className="border p-4 rounded-lg">
                        <legend className="text-lg font-semibold text-gray-700 px-2">Guardian Information</legend>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                            <div>
                                <label htmlFor="fatherName" className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
                                <input id="fatherName" name="fatherName" type="text" value={details.fatherName} onChange={handleChange} className={formInputClass} />
                            </div>
                             <div>
                                <label htmlFor="fatherMobile" className="block text-sm font-medium text-gray-700 mb-1">Father's Mobile</label>
                                <input id="fatherMobile" name="fatherMobile" type="tel" value={details.fatherMobile} onChange={handleChange} className={formInputClass} />
                            </div>
                             <div>
                                <label htmlFor="motherName" className="block text-sm font-medium text-gray-700 mb-1">Mother's Name</label>
                                <input id="motherName" name="motherName" type="text" value={details.motherName} onChange={handleChange} className={formInputClass} />
                            </div>
                             <div>
                                <label htmlFor="motherMobile" className="block text-sm font-medium text-gray-700 mb-1">Mother's Mobile</label>
                                <input id="motherMobile" name="motherMobile" type="tel" value={details.motherMobile} onChange={handleChange} className={formInputClass} />
                            </div>
                        </div>
                    </fieldset>
                    
                    <button type="submit" disabled={isSubmitting} className="w-full py-3 px-4 bg-violet-600 text-white font-bold rounded-lg hover:bg-violet-700 disabled:bg-gray-400 transition-colors">
                        {isSubmitting ? 'Saving...' : 'Save Details'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PersonalDetails;
