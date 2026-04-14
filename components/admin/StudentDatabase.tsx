import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, query } from '../../firebase';
import { Page, StudentDetails, UserBooking } from '../../types';

interface StudentDatabaseProps {
    setNotification: (notification: { message: string, type: 'success' | 'error' } | null) => void;
    navigateTo: (page: Page) => void;
}

interface StudentDatabaseEntry extends StudentDetails {
    roomName?: string;
    floorNumber?: number;
}

const StudentDatabase: React.FC<StudentDatabaseProps> = ({ setNotification, navigateTo }) => {
    const [students, setStudents] = useState<StudentDatabaseEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db) {
            setLoading(false);
            return;
        };
        
        let studentDetailsData: StudentDetails[] | null = null;
        let bookingsData: Map<string, UserBooking> | null = null;

        const combineAndSetData = () => {
            if (studentDetailsData === null || bookingsData === null) return;

            const combinedData: StudentDatabaseEntry[] = studentDetailsData.map(student => {
                const booking = bookingsData!.get(student.uid);
                return {
                    ...student,
                    roomName: booking?.roomName,
                    floorNumber: booking?.floorNumber,
                };
            });
            combinedData.sort((a, b) => a.fullName.localeCompare(b.fullName));
            setStudents(combinedData);
            setLoading(false);
        };

        const studentDetailsQuery = query(collection(db, 'studentDetails'));
        const unsubscribeStudents = onSnapshot(studentDetailsQuery, (querySnapshot) => {
            studentDetailsData = querySnapshot.docs.map(doc => doc.data() as StudentDetails);
            combineAndSetData();
        }, (error) => {
            console.error("Error fetching student details:", error);
            setNotification({ message: 'Failed to fetch student details.', type: 'error' });
            setLoading(false);
        });

        const bookingsQuery = query(collection(db, 'bookings'));
        const unsubscribeBookings = onSnapshot(bookingsQuery, (querySnapshot) => {
            bookingsData = new Map<string, UserBooking>();
            querySnapshot.docs.forEach(doc => {
                bookingsData.set(doc.id, doc.data() as UserBooking);
            });
            combineAndSetData();
        }, (error) => {
            console.error("Error fetching booking details:", error);
            setNotification({ message: 'Failed to fetch booking details.', type: 'error' });
            setLoading(false);
        });


        return () => {
            unsubscribeStudents();
            unsubscribeBookings();
        };
    }, [setNotification]);

    if (loading) {
        return <div className="text-center p-8">Loading student database...</div>;
    }

    return (
        <div>
            <button onClick={() => navigateTo(Page.AdminDashboard)} className="mb-6 text-violet-600 hover:text-violet-800 font-semibold">
                &larr; Back to Dashboard
            </button>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Student Database</h2>
                {students.length === 0 ? (
                    <p className="text-gray-500">No student details have been submitted yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room Details</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Home Address</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Father's Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Father's Mobile</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mother's Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mother's Mobile</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {students.map(student => (
                                    <tr key={student.uid}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.fullName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {student.roomName && student.floorNumber 
                                                ? `${student.roomName}, Floor ${student.floorNumber}`
                                                : 'N/A'
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.phoneNumber}</td>
                                        <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-xs">{student.homeAddress}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.fatherName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.fatherMobile}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.motherName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.motherMobile}</td>
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

export default StudentDatabase;
