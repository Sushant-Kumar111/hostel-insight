import React, { useState } from 'react';
import { Room } from '../types';
import { User } from 'firebase/auth';

interface BookingModalProps {
    room: Room;
    floorNumber: number;
    onClose: () => void;
    onBookRoom: (studentId: string, fullName: string) => void;
    user: User;
}

const BookingModal: React.FC<BookingModalProps> = ({ room, floorNumber, onClose, onBookRoom, user }) => {
    const [step, setStep] = useState(1);
    const [fullName, setFullName] = useState(user.displayName || '');
    const [studentId, setStudentId] = useState('');

    const handleProceedToPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (fullName && studentId) {
            setStep(2);
        }
    };
    
    const handleConfirmPayment = () => {
        onBookRoom(studentId, fullName);
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 sm:p-8 m-4 max-w-lg w-full shadow-2xl relative animate-fade-in-up">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                     <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="mb-4">
                    <h2 className="text-2xl font-bold text-violet-600">{room.name}</h2>
                    <p className="text-gray-500">Floor {floorNumber}</p>
                    <span className="mt-2 inline-block px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                        {room.capacity - room.students.length} / {room.capacity} spots available
                    </span>
                </div>

                {step === 1 && (
                    <div>
                         <div className="mb-6">
                            <h3 className="font-semibold text-gray-800 mb-2">Current Roommates</h3>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                {room.students.length > 0 ? (
                                    <ul className="space-y-2">
                                        {room.students.map(s => <li key={s.uid} className="text-gray-600">{s.name}</li>)}
                                    </ul>
                                ) : (
                                    <p className="text-gray-500 text-center">No students booked yet. Be the first! 🎉</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-800 mb-2">Book Your Spot</h3>
                            <form onSubmit={handleProceedToPayment} className="space-y-4">
                                <div>
                                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
                                    <input
                                        type="text"
                                        id="fullName"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                        className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500 transition text-gray-900 bg-white"
                                        placeholder="Enter your full name"
                                    />
                                </div>
                                 <div>
                                    <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">Student ID</label>
                                    <input
                                        type="text"
                                        id="studentId"
                                        value={studentId}
                                        onChange={(e) => setStudentId(e.target.value)}
                                        required
                                        className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500 transition text-gray-900 bg-white"
                                        placeholder="Enter your student ID"
                                    />
                                </div>
                                <button type="submit" className="w-full py-3 px-4 bg-violet-600 text-white font-bold rounded-lg hover:bg-violet-700 transition-colors">
                                    Proceed to Payment
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {step === 2 && (
                     <div>
                        <h3 className="font-semibold text-gray-800 mb-4">Complete Payment</h3>
                         <div className="bg-gray-50 text-center p-6 rounded-lg border border-gray-200 mb-6">
                            <p className="text-sm text-gray-500">BOOKING AMOUNT</p>
                            <p className="text-5xl font-bold text-violet-600 my-2">$50.00</p>
                         </div>
                        <div className="flex justify-end space-x-4">
                            <button onClick={() => setStep(1)} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleConfirmPayment} className="px-6 py-2 bg-violet-600 text-white font-bold rounded-lg hover:bg-violet-700 transition-colors">
                                Pay $50.00
                            </button>
                        </div>
                     </div>
                )}
            </div>
        </div>
    );
};

export default BookingModal;
