import React, { useState, useEffect, useCallback } from 'react';
// FIX: Corrected import path to be explicit.
import { auth, db, isFirebaseConfigured, onAuthStateChanged, signOut, collection, getDocs, doc, getDoc, writeBatch, updateDoc, setDoc, runTransaction } from './firebase';
import { Page, Floor, UserBooking, Student, Room } from './types';
import { initialHostelData, ADMIN_EMAIL } from './constants';

// FIX: Corrected import path to be explicit.
import Auth from './components/Auth';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
// FIX: Corrected import path to be explicit.
import RoomBooking from './components/RoomBooking';
import RoomChange from './components/RoomChange';
import MessMenu from './components/MessMenu';
import Complaint from './components/Complaint';
import Feedback from './components/Feedback';
import NotificationModal from './components/NotificationModal';
import AdminDashboard from './components/admin/AdminDashboard';
import LaundryService from './components/LaundryService';
import PersonalDetails from './components/PersonalDetails';
import RoomChangeRequests from './components/admin/RoomChangeRequests';
import ComplaintsView from './components/admin/ComplaintsView';
import FeedbackView from './components/admin/FeedbackView';
import StudentDatabase from './components/admin/StudentDatabase';
import LateEntry from './components/LateEntry';
import AdminLateEntryRequests from './components/admin/AdminLateEntryRequests';
import LeaveApply from './components/LeaveApply';
import AdminLeaveRequests from './components/admin/AdminLeaveRequests';


const FirebaseNotConfigured: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow-lg text-center border-t-4 border-red-500">
        <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="mt-4 text-2xl font-bold text-gray-800">Firebase Not Configured</h2>
        <p className="mt-2 text-gray-600">
          It looks like you haven't set up your Firebase configuration yet. This app requires a Firebase backend to function.
        </p>
        <p className="mt-4 text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
          Please open the <code className="font-mono bg-gray-200 px-1 py-0.5 rounded">firebase.ts</code> file and replace the placeholder values in the <code className="font-mono bg-gray-200 px-1 py-0.5 rounded">firebaseConfig</code> object with your actual Firebase project credentials.
        </p>
        <a 
          href="https://console.firebase.google.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-6 inline-block w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          Go to Firebase Console
        </a>
      </div>
    </div>
  );
};

const App: React.FC = () => {
    const [user, setUser] = useState<any | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState<Page>(Page.Dashboard);
    const [floors, setFloors] = useState<Floor[]>([]);
    const [needsSeeding, setNeedsSeeding] = useState(false);
    const [userBooking, setUserBooking] = useState<UserBooking | null>(null);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const fetchHostelData = useCallback(async () => {
        console.log('[fetchHostelData] Starting to fetch hostel data, db=', db);
        if (!db) {
            console.error('[fetchHostelData] db is not available');
            return;
        }
        try {
            const floorsCollection = collection(db, 'floors');
            console.log('[fetchHostelData] Created collection ref:', floorsCollection);
            
            const floorSnapshot = await getDocs(floorsCollection);
            console.log('[fetchHostelData] Got snapshot:', floorSnapshot);
            
            if (floorSnapshot.empty) {
                console.log('[fetchHostelData] No floors found, setting needsSeeding to true');
                setNeedsSeeding(true);
                setFloors([]);
            } else {
                console.log('[fetchHostelData] Found floors, processing...');
                const floorsData = floorSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        floorNumber: data.floorNumber || data.id,
                        rooms: data.rooms || [],
                    } as Floor;
                }).sort((a, b) => a.floorNumber - b.floorNumber);
                console.log('[fetchHostelData] Processed floors:', floorsData);
                setFloors(floorsData);
                setNeedsSeeding(false);
            }
        } catch (error) {
            console.error("[fetchHostelData] Error fetching hostel data: ", error);
            setNotification({ message: `Failed to load hostel data: ${error instanceof Error ? error.message : String(error)}`, type: 'error' });
        }
    }, []);

    const fetchUserBooking = useCallback(async (userId: string) => {
        if (!db) return;
        const bookingDocRef = doc(db, 'bookings', userId);
        const bookingSnap = await getDoc(bookingDocRef);
        if (bookingSnap.exists()) {
            setUserBooking(bookingSnap.data() as UserBooking);
        } else {
            setUserBooking(null);
        }
    }, []);

    useEffect(() => {
        if (auth) {
            const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
                setUser(currentUser);
                if (currentUser) {
                    const isAdminUser = currentUser.email === ADMIN_EMAIL;
                    setIsAdmin(isAdminUser);
                    fetchHostelData(); // Always fetch for both user types
                    if (isAdminUser) {
                        setPage(Page.AdminDashboard);
                    } else {
                        setPage(Page.Dashboard);
                        fetchUserBooking(currentUser.uid);
                    }
                } else {
                    setIsAdmin(false);
                    setPage(Page.Dashboard); // Reset page on logout
                    setUserBooking(null);
                }
                setLoading(false);
            });
            return () => unsubscribe();
        } else {
            setLoading(false);
        }
    }, [fetchHostelData, fetchUserBooking]);

    const handleSeedData = async () => {
        if (!db) return;
        const batch = writeBatch(db);
        initialHostelData.forEach(floor => {
            const floorDataForDb = {
              id: floor.floorNumber,
              name: `Floor ${floor.floorNumber}`,
              rooms: floor.rooms,
              floorNumber: floor.floorNumber
            };
            const floorRef = doc(db, 'floors', floor.id);
            batch.set(floorRef, floorDataForDb);
        });
        try {
            await batch.commit();
            setNotification({ message: 'Hostel data seeded successfully!', type: 'success' });
            fetchHostelData();
        } catch (error) {
            console.error("Error seeding data: ", error);
            setNotification({ message: 'Failed to seed data.', type: 'error' });
        }
    };
    
    const handleBookRoom = async (floorId: string, roomId: string, studentId: string, fullName: string) => {
        if (!user || !db) return;

        const floorRef = doc(db, 'floors', floorId);
        
        try {
            const floorDoc = await getDoc(floorRef);
            if (!floorDoc.exists()) throw new Error("Floor not found");
            
            const floorDataFromDb = floorDoc.data();
            const rooms = floorDataFromDb.rooms || [];
            const roomIndex = rooms.findIndex((r: Room) => r.id === roomId);

            if (roomIndex === -1) throw new Error("Room not found");
            
            const room = rooms[roomIndex];
            if (room.students.length >= room.capacity) {
                setNotification({ message: 'This room is already full.', type: 'error' });
                return;
            }

            const newStudent: Student = { uid: user.uid, name: fullName, studentId };
            const updatedRooms = [...rooms];
            updatedRooms[roomIndex] = {
                ...room,
                students: [...room.students, newStudent]
            };
            
            await updateDoc(floorRef, { rooms: updatedRooms });

            const bookingData = {
                floorId,
                roomId,
                roomName: room.name,
                floorNumber: floorDataFromDb.id,
            };
            await setDoc(doc(db, 'bookings', user.uid), bookingData);
            
            setNotification({ message: `Successfully booked ${room.name}!`, type: 'success' });
            await fetchHostelData();
            await fetchUserBooking(user.uid);
            navigateTo(Page.Dashboard);

        } catch (error) {
            console.error("Error booking room:", error);
            setNotification({ message: 'Failed to book room. Please try again.', type: 'error' });
        }
    };

    const handleLogout = async () => {
        if (!auth) return;
        try {
            await signOut(auth);
            setUser(null);
            setPage(Page.Dashboard);
            setFloors([]);
            setUserBooking(null);
        } catch (error) {
            console.error("Logout failed:", error);
            setNotification({ message: 'Failed to log out.', type: 'error' });
        }
    };

    const navigateTo = (page: Page) => {
        setPage(page);
    };

    const handleApproveRoomChange = async (request: any) => {
        if (!db) return;
        try {
            await runTransaction(db, async (transaction) => {
                const { userId, currentRoom, preferredRoom } = request;
                
                // 1. Get all documents needed for the transaction
                const requestRef = doc(db, 'roomChangeRequests', request.id);
                const userBookingRef = doc(db, 'bookings', userId);
                const oldFloorRef = doc(db, 'floors', currentRoom.floorId);
                const newFloorRef = doc(db, 'floors', preferredRoom.floorId);
    
                const [oldFloorDoc, newFloorDoc] = await Promise.all([
                    transaction.get(oldFloorRef),
                    transaction.get(newFloorRef)
                ]);
    
                if (!oldFloorDoc.exists() || !newFloorDoc.exists()) {
                    throw new Error("One or both floors involved in the change do not exist.");
                }
    
                // 2. Perform validation
                const newFloorData = newFloorDoc.data() as Floor;
                const newRoomIndex = newFloorData.rooms.findIndex(r => r.id === preferredRoom.roomId);
                if (newRoomIndex === -1) throw new Error("Preferred room not found.");
                const newRoom = newFloorData.rooms[newRoomIndex];
                if (newRoom.students.length >= newRoom.capacity) {
                    throw new Error("The preferred room is now full.");
                }
    
                // 3. Prepare updates
                // Remove student from old room
                const oldFloorData = oldFloorDoc.data() as Floor;
                const oldRoomIndex = oldFloorData.rooms.findIndex(r => r.id === currentRoom.roomId);
                const studentToRemove = oldFloorData.rooms[oldRoomIndex]?.students.find(s => s.uid === userId);
                
                if (!studentToRemove) throw new Error("Student not found in their current room.");

                const updatedOldRooms = [...oldFloorData.rooms];
                updatedOldRooms[oldRoomIndex].students = updatedOldRooms[oldRoomIndex].students.filter(s => s.uid !== userId);

                // Add student to new room
                const updatedNewRooms = [...newFloorData.rooms];
                updatedNewRooms[newRoomIndex].students.push(studentToRemove);
    
                // 4. Execute transaction updates
                transaction.update(oldFloorRef, { rooms: updatedOldRooms });
                if (currentRoom.floorId !== preferredRoom.floorId) { // Only update new floor if it's different
                    transaction.update(newFloorRef, { rooms: updatedNewRooms });
                }
                transaction.update(userBookingRef, {
                    floorId: preferredRoom.floorId,
                    roomId: preferredRoom.roomId,
                    roomName: preferredRoom.roomName,
                    floorNumber: preferredRoom.floorNumber,
                });
                transaction.update(requestRef, { status: "Approved" });
            });
            setNotification({ message: "Room change approved and updated successfully!", type: "success" });
        } catch (error: any) {
            console.error("Error approving room change:", error);
            setNotification({ message: `Failed to approve room change: ${error.message}`, type: "error" });
        }
    };
    
    if (!isFirebaseConfigured) {
        return <FirebaseNotConfigured />;
    }

    const renderPage = () => {
        if (!user) return null;
    
        switch (page) {
            // Student Pages
            case Page.Dashboard:
                return <Dashboard navigateTo={navigateTo} userName={user.displayName || user.email || 'User'} needsSeeding={needsSeeding} onSeedData={handleSeedData} userBooking={userBooking}/>;
            case Page.RoomBooking:
                return <RoomBooking navigateTo={navigateTo} floors={floors} user={user} onBookRoom={handleBookRoom} userBooking={userBooking} setNotification={setNotification} />;
            case Page.RoomChange:
                return <RoomChange navigateTo={navigateTo} user={user} userBooking={userBooking} setNotification={setNotification} floors={floors} />;
            case Page.MessMenu:
                return <MessMenu navigateTo={navigateTo} />;
            case Page.Complaint:
                return <Complaint navigateTo={navigateTo} user={user} setNotification={setNotification} floors={floors} />;
            case Page.Feedback:
                return <Feedback navigateTo={navigateTo} user={user} setNotification={setNotification} />;
            case Page.LaundryService:
                return <LaundryService navigateTo={navigateTo} user={user} setNotification={setNotification} floors={floors} userBooking={userBooking} />;
            case Page.LateEntry:
                return <LateEntry navigateTo={navigateTo} user={user} setNotification={setNotification} />;
            case Page.LeaveApply:
                return <LeaveApply navigateTo={navigateTo} user={user} setNotification={setNotification} />;
            case Page.PersonalDetails:
                return <PersonalDetails navigateTo={navigateTo} user={user} setNotification={setNotification} />;
            
            // Admin Pages
            case Page.AdminDashboard:
                return <AdminDashboard navigateTo={navigateTo} />;
            case Page.AdminLateEntryRequests:
                return <AdminLateEntryRequests navigateTo={navigateTo} setNotification={setNotification} />;
            case Page.AdminLeaveRequests:
                return <AdminLeaveRequests navigateTo={navigateTo} setNotification={setNotification} />;
            case Page.AdminRoomChangeRequests:
                return <RoomChangeRequests setNotification={setNotification} onApproveRoomChange={handleApproveRoomChange} navigateTo={navigateTo} />;
            case Page.AdminComplaints:
                return <ComplaintsView setNotification={setNotification} navigateTo={navigateTo} />;
            case Page.AdminFeedback:
                return <FeedbackView setNotification={setNotification} navigateTo={navigateTo} />;
            case Page.AdminStudentDatabase:
                return <StudentDatabase setNotification={setNotification} navigateTo={navigateTo} />;
                
            default:
                return isAdmin 
                    ? <AdminDashboard navigateTo={navigateTo} /> 
                    : <Dashboard navigateTo={navigateTo} userName={user.displayName || user.email || 'User'} needsSeeding={needsSeeding} onSeedData={handleSeedData} userBooking={userBooking} />;
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            {notification && (
                <NotificationModal
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}
            {!user ? (
                <Auth onLogin={(loggedInUser) => setUser(loggedInUser)} />
            ) : (
                <>
                    <Header 
                        user={user} 
                        onLogout={handleLogout} 
                        isAdmin={isAdmin} 
                        onGoHome={() => navigateTo(isAdmin ? Page.AdminDashboard : Page.Dashboard)}
                    />
                    <main className="p-4 sm:p-6 lg:p-8">
                        {renderPage()}
                    </main>
                </>
            )}
        </div>
    );
};

export default App;
