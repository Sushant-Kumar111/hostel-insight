import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Page, UserBooking, Floor, Room } from '../types';
import { addDoc, collection, serverTimestamp } from '../firebase';
import { db } from '../firebase';

interface LaundryServiceProps {
    navigateTo: (page: Page) => void;
    user: User;
    setNotification: (notification: { message: string, type: 'success' | 'error' } | null) => void;
    floors: Floor[];
    userBooking: UserBooking | null;
}

const LaundryService: React.FC<LaundryServiceProps> = ({ navigateTo, user, setNotification, floors, userBooking }) => {
    const [selectedFloorId, setSelectedFloorId] = useState('');
    const [selectedRoomId, setSelectedRoomId] = useState('');
    const [numberOfClothes, setNumberOfClothes] = useState('');
    const [laundryNumber, setLaundryNumber] = useState('');
    const [bagNumber, setBagNumber] = useState('');
    
    const [roomOptions, setRoomOptions] = useState<Room[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Pre-fill form if user has a booking
        if (userBooking) {
            setSelectedFloorId(userBooking.floorId);
            setSelectedRoomId(userBooking.roomId);
        }
    }, [userBooking]);

    useEffect(() => {
        if (selectedFloorId) {
            const selectedFloor = floors.find(f => f.id === selectedFloorId);
            setRoomOptions(selectedFloor ? selectedFloor.rooms : []);
        } else {
            setRoomOptions([]);
        }
    }, [selectedFloorId, floors]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFloorId || !selectedRoomId || !numberOfClothes || !laundryNumber || !bagNumber) {
            setNotification({message: 'Please fill in all fields.', type: 'error'});
            return;
        }
        if (!db) {
            setNotification({message: 'Database not connected.', type: 'error'});
            return;
        }

        setIsSubmitting(true);
        try {
            const selectedFloor = floors.find(f => f.id === selectedFloorId);
            const selectedRoom = selectedFloor?.rooms.find(r => r.id === selectedRoomId);

            if (!selectedFloor || !selectedRoom) {
                throw new Error("Selected room or floor not found.");
            }

            await addDoc(collection(db, "laundryRequests"), {
                userId: user.uid,
                userName: user.displayName || user.email,
                floorId: selectedFloorId,
                roomId: selectedRoomId,
                floorNumber: selectedFloor.floorNumber,
                roomName: selectedRoom.name,
                numberOfClothes: parseInt(numberOfClothes, 10),
                laundryNumber,
                bagNumber,
                status: 'Pending',
                createdAt: serverTimestamp(),
            });
            setNotification({message: 'Your laundry request has been submitted successfully!', type: 'success'});
            // Reset form
            if (!userBooking) { // Only reset location if not pre-filled
                setSelectedFloorId('');
                setSelectedRoomId('');
            }
            setNumberOfClothes('');
            setLaundryNumber('');
            setBagNumber('');

        } catch (error) {
            console.error("Error submitting laundry request: ", error);
            setNotification({message: 'Failed to submit request. Please try again.', type: 'error'});
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
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Laundry Service Request</h1>
                    <p className="mt-2 text-lg text-gray-600">Please fill out the form to submit your laundry.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                         <div>
                            <label htmlFor="floor" className="block text-sm font-medium text-gray-700 mb-1">Floor *</label>
                            <select
                                id="floor"
                                value={selectedFloorId}
                                onChange={(e) => setSelectedFloorId(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500 transition"
                            >
                                <option value="">Select a floor</option>
                                {floors.map(floor => (
                                    <option key={floor.id} value={floor.id}>Floor {floor.floorNumber}</option>
                                ))}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="room" className="block text-sm font-medium text-gray-700 mb-1">Room Number *</label>
                            <select
                                id="room"
                                value={selectedRoomId}
                                onChange={(e) => setSelectedRoomId(e.target.value)}
                                required
                                disabled={!selectedFloorId}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500 transition disabled:bg-gray-100"
                            >
                                <option value="">Select a room</option>
                                {roomOptions.map(room => (
                                     <option key={room.id} value={room.id}>{room.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="numberOfClothes" className="block text-sm font-medium text-gray-700 mb-1">Number of Clothes *</label>
                        <input
                            id="numberOfClothes"
                            type="number"
                            value={numberOfClothes}
                            onChange={(e) => setNumberOfClothes(e.target.value)}
                            placeholder="e.g., 15"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500 transition"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                         <div>
                            <label htmlFor="laundryNumber" className="block text-sm font-medium text-gray-700 mb-1">Laundry Number *</label>
                            <input
                                id="laundryNumber"
                                type="text"
                                value={laundryNumber}
                                onChange={(e) => setLaundryNumber(e.target.value)}
                                placeholder="Your assigned laundry ID"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500 transition"
                            />
                        </div>
                         <div>
                            <label htmlFor="bagNumber" className="block text-sm font-medium text-gray-700 mb-1">Bag Number *</label>
                            <input
                                id="bagNumber"
                                type="text"
                                value={bagNumber}
                                onChange={(e) => setBagNumber(e.target.value)}
                                placeholder="Number on your laundry bag"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500 transition"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 px-4 bg-violet-600 text-white font-bold rounded-lg hover:bg-violet-700 disabled:bg-gray-400 transition-colors"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Laundry Request'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LaundryService;
