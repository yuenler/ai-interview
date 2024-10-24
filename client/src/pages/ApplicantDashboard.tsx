// ApplicantDashboard.tsx
import React, { useEffect, useState, useContext } from 'react';
import { UserContext } from '../UserContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface Props {
  navigateTo: (page: string) => void;
}

const ApplicantDashboard: React.FC<Props> = ({navigateTo}) => {
  const { user } = useContext(UserContext);
  const [assignedTests, setAssignedTests] = useState<any[]>([]);

  useEffect(() => {
    const fetchAssignedTests = async () => {
      if (user?.email) {
        const q = query(
          collection(db, 'candidates'),
          where('email', '==', user.email)
        );
        const querySnapshot = await getDocs(q);
        const tests = querySnapshot.docs.map((doc) => doc.data());
        setAssignedTests(tests);
      }
    };
    fetchAssignedTests();
  }, [user]);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Welcome, {user?.name}</h2>
      <h3 className="text-xl font-semibold mb-2">Your Assigned Tests:</h3>
      {assignedTests.length > 0 ? (
        <ul>
            {assignedTests.map((test, index) => (
          <li key={index} className="mb-2">
            <button
              onClick={() => navigateTo('permissions')}
              className="text-blue-600 hover:underline"
            >
              {test.roleName} at {test.companyName}
            </button>
          </li>
        ))}
        </ul>
      ) : (
        <p>You have no assigned tests at the moment.</p>
      )}
    </div>
  );
};

export default ApplicantDashboard;
