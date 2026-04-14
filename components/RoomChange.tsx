import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Page, UserBooking, Floor, Room } from '../types';
import { addDoc, collection, serverTimestamp } from '../firebase';
import { db } from '../firebase';

interface RoomChangeProps {
    navigateTo: (page: Page) => void;
    user: User;
    userBooking: UserBooking | null;
    setNotification: (notification: { message: string, type: 'success' | 'error' } | null) => void;
    floors: Floor[];
}

const RoomChange: React.FC<RoomChangeProps> = ({ navigateTo, user, userBooking, setNotification, floors }) => {
    const [reason, setReason] = useState('');
    const [preferredFloorId, setPreferredFloorId] = useState('');
    const [preferredRoomId, setPreferredRoomId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [preferredRoomOptions, setPreferredRoomOptions] = useState<Room[]>([]);

    useEffect(() => {
        if (preferredFloorId) {
            const selectedFloor = floors.find(f => f.id === preferredFloorId);
            setPreferredRoomOptions(selectedFloor ? selectedFloor.rooms : []);
            setPreferredRoomId(''); // Reset room selection when floor changes
        } else {
            setPreferredRoomOptions([]);
        }
    }, [preferredFloorId, floors]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason) {
            setNotification({ message: 'Please provide a reason for your room change request.', type: 'error' });
            return;
        }
        if (!db || !userBooking) {
            setNotification({ message: 'Cannot submit request. Missing booking information or database connection.', type: 'error' });
            return;
        }

        // Validation for preferred room
        if (preferredFloorId && preferredRoomId) {
            const selectedFloor = floors.find(f => f.id === preferredFloorId);
            const selectedRoom = selectedFloor?.rooms.find(r => r.id === preferredRoomId);

            if (selectedRoom && selectedRoom.students.length >= selectedRoom.capacity) {
                setNotification({ message: 'The selected room is already full. Please choose another.', type: 'error' });
                return;
            }
        }

        setIsSubmitting(true);
        try {
            const selectedFloor = floors.find(f => f.id === preferredFloorId);
            const selectedRoom = selectedFloor?.rooms.find(r => r.id === preferredRoomId);

            await addDoc(collection(db, 'roomChangeRequests'), {
                userId: user.uid,
                userName: user.displayName || user.email,
                currentRoom: {
                    floorId: userBooking.floorId,
                    roomId: userBooking.roomId,
                    roomName: userBooking.roomName,
                    floorNumber: userBooking.floorNumber,
                },
                preferredRoom: preferredRoomId ? {
                    floorId: preferredFloorId,
                    roomId: preferredRoomId,
                    roomName: selectedRoom?.name,
                    floorNumber: selectedFloor?.floorNumber
                } : null,
                reason,
                status: 'Pending',
                createdAt: serverTimestamp(),
            });
            setNotification({ message: 'Your room change request has been submitted successfully!', type: 'success' });
            setReason('');
            setPreferredFloorId('');
            setPreferredRoomId('');
            navigateTo(Page.Dashboard);
        } catch (error) {
            console.error("Error submitting room change request: ", error);
            setNotification({ message: 'Failed to submit request. Please try again.', type: 'error' });
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
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Request a Room Change</h1>
                    <p className="mt-2 text-lg text-gray-600">Requests are subject to availability.</p>
                </div>

                {!userBooking ? (
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md text-center">
                        <p>You don't have a room booked. Please book a room before requesting a change.</p>
                    </div>
                ) : (
                    <>
                        <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                             <label className="block text-sm font-medium text-gray-700 mb-1">Current Room</label>
                             <input
                                type="text"
                                readOnly
                                value={`${userBooking.roomName}, Floor ${userBooking.floorNumber}`}
                                className="w-full px-4 py-2 bg-gray-200 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
                             />
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="preferredFloor" className="block text-sm font-medium text-gray-700 mb-1">Preferred Floor</label>
                                    <select
                                        id="preferredFloor"
                                        value={preferredFloorId}
                                        onChange={(e) => setPreferredFloorId(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500 transition"
                                    >
                                        <option value="">Select a floor (optional)</option>
                                        {floors.map(floor => (
                                            <option key={floor.id} value={floor.id}>Floor {floor.floorNumber}</option>
                                        ))}
                                    </select>
                                </div>
                                 <div>
                                    <label htmlFor="preferredRoom" className="block text-sm font-medium text-gray-700 mb-1">Preferred Room</label>
                                    <select
                                        id="preferredRoom"
                                        value={preferredRoomId}
                                        onChange={(e) => setPreferredRoomId(e.target.value)}
                                        disabled={!preferredFloorId}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500 transition disabled:bg-gray-100"
                                    >
                                        <option value="">Select a room (optional)</option>
                                        {preferredRoomOptions.map(room => (
                                            <option key={room.id} value={room.id}>
                                                {room.name} ({room.students.length}/{room.capacity})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">Reason for Change</label>
                                <textarea
                                    id="reason"
                                    rows={5}
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Please provide a detailed reason for your request (e.g., roommate issues, maintenance problems, etc.)..."
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
                    </>
                )}
            </div>
        </div>
    );
};

export default RoomChange;
