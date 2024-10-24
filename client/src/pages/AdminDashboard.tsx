// AdminDashboard.tsx
import React, { useState, useEffect, useContext } from 'react';
import Modal from 'react-modal';
import DataTable from 'react-data-table-component';
import { UserContext } from '../UserContext';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
} from 'firebase/firestore';
import axios from 'axios';
import CreatableSelect from 'react-select/creatable';
import './AdminDashboard.scss';

interface Props {
  navigateTo: (page: string) => void;
}

const AdminDashboard: React.FC<Props> = ({ navigateTo }) => {
  const { user } = useContext(UserContext);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [csvData, setCsvData] = useState('');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [groupName, setGroupName] = useState('');
  const [existingGroups, setExistingGroups] = useState<string[]>([]);
  const [googleSheetLink, setGoogleSheetLink] = useState('');
  const [roleName, setRoleName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    let filtered = candidates;

    if (searchText) {
      filtered = filtered.filter((candidate) =>
        `${candidate.firstName} ${candidate.lastName}`
          .toLowerCase()
          .includes(searchText.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (selectedGroup) {
      filtered = filtered.filter(
        (candidate) => candidate.groupName === selectedGroup
      );
    }

    if (selectedStatus) {
      filtered = filtered.filter(
        (candidate) => candidate.testStatus === selectedStatus
      );
    }

    setFilteredCandidates(filtered);
  }, [searchText, selectedGroup, selectedStatus, candidates]);

  // Fetch candidates from Firestore
  useEffect(() => {
    const fetchCandidates = async () => {
      const q = query(
        collection(db, 'candidates'),
        where('recruiterId', '==', user?.uid || '')
      );
      const querySnapshot = await getDocs(q);
      const candidatesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCandidates(candidatesData);
      setFilteredCandidates(candidatesData);
    };
    if (user) fetchCandidates();
  }, [user]);

  // Fetch existing groups
  useEffect(() => {
    const fetchGroups = async () => {
      const q = query(
        collection(db, 'groups'),
        where('recruiterId', '==', user?.uid || '')
      );
      const querySnapshot = await getDocs(q);
      const groups = querySnapshot.docs.map((doc) => doc.data().groupName);
      setExistingGroups(groups);
    };
    if (user) fetchGroups();
  }, [user]);

  // Define columns for DataTable
  const columns = [
    {
      name: 'Name',
      selector: (row) => `${row.firstName} ${row.lastName}`,
      sortable: true,
    },
    { name: 'Email', selector: (row) => row.email, sortable: true },
    { name: 'Test Status', selector: (row) => row.testStatus, sortable: true },
    {
      name: 'View Video',
      cell: (row) =>
        row.videoLink ? (
          <a href={row.videoLink} target="_blank" rel="noopener noreferrer">
            View Video
          </a>
        ) : (
          'N/A'
        ),
    },
    {
      name: 'View Completed Test',
      cell: (row) =>
        row.testLink ? (
          <a href={row.testLink} target="_blank" rel="noopener noreferrer">
            View Test
          </a>
        ) : (
          'N/A'
        ),
    },
    { name: 'Score', selector: (row) => row.score || 'N/A', sortable: true },
    { name: 'Group Name', selector: (row) => row.groupName, sortable: true },
  ];

  // Open and close modal
  const openModal = () => setModalIsOpen(true);
  const closeModal = () => {
    setModalIsOpen(false);
    setCsvData('');
    setParsedData([]);
    setGroupName('');
    setGoogleSheetLink('');
    setRoleName('');
    setCompanyName('');
  };

  // Handle CSV upload
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        parseCsv(text);
      }
    };
    reader.readAsText(file);
  };

  // Trigger file input click
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Parse CSV data
  const parseCsv = (text: string) => {
    const lines = text.split('\n').filter((line) => line.trim() !== '');
    const data = lines.map((line) => {
      const [firstName, lastName, email] = line.split(',');
      return { firstName, lastName, email };
    });
    setParsedData(data);
  };

  // Handle sending emails and saving candidates
  const handleSendInvitations = async () => {
    try {
      // Save group if new
      if (!existingGroups.includes(groupName)) {
        await addDoc(collection(db, 'groups'), {
          recruiterId: user?.uid,
          groupName,
        });
        setExistingGroups([...existingGroups, groupName]);
      }

      // Save candidates
      const saveCandidatesPromises = parsedData.map((candidate) =>
        addDoc(collection(db, 'candidates'), {
          ...candidate,
          recruiterId: user?.uid,
          testStatus: 'Pending',
          groupName,
          videoLink: '',
          testLink: '',
          score: '',
        })
      );
      await Promise.all(saveCandidatesPromises);

      // Send emails
      await axios.post('/send-invites', {
        recipients: parsedData,
        googleSheetLink,
        roleName,
        companyName,
        recruiterName: user?.name,
      });

      alert('Candidates added and invitations sent successfully!');
      closeModal();
    } catch (error) {
      console.error('Error adding candidates:', error);
      alert('Failed to add candidates.');
    }
  };

  // Options for react-select
  const groupOptions = existingGroups.map((group) => ({
    value: group,
    label: group,
  }));

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Welcome, {user?.name}</h2>

      {/* Search and Filter */}
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search candidates..."
          className="border p-2 rounded w-1/3"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <button
          onClick={openModal}
          className="bg-blue-600 text-white py-2 px-4 rounded"
        >
          Add Candidates
        </button>
      </div>

      <div className="flex space-x-4 mb-4">
        <select
          className="border p-2 rounded"
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
        >
          <option value="">All Groups</option>
          {existingGroups.map((group, index) => (
            <option key={index} value={group}>
              {group}
            </option>
          ))}
        </select>

        <select
          className="border p-2 rounded"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
          {/* Add more statuses as needed */}
        </select>
      </div>

      {/* Candidates Table */}
      <DataTable
        columns={columns}
        data={filteredCandidates}
        pagination
        highlightOnHover
        pointerOnHover
      />

      {/* Add Candidates Modal */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Add Candidates"
        ariaHideApp={false}
        className="Modal"
        overlayClassName="Overlay"
      >
        <h2 className="text-xl font-bold mb-4">Add Candidates</h2>

        {/* Group Name Selection */}
        <div className="mb-4">
          <label className="block font-semibold mb-2">Group Name:</label>
          <CreatableSelect
            options={groupOptions}
            onChange={(option) => setGroupName(option?.value || '')}
            value={groupName ? { label: groupName, value: groupName } : null}
            placeholder="Type or select a group"
            isClearable
            styles={{
              control: (provided) => ({
                ...provided,
                minHeight: '40px',
              }),
            }}
          />
        </div>

        {/* CSV Upload */}
        <div className="mb-4">
          <label className="block font-semibold mb-2">Upload CSV File (First name, Last name, Email):</label>
          <input
            type="file"
            accept=".csv"
            onChange={handleCsvUpload}
            ref={fileInputRef}
            style={{ display: 'none' }}
          />
          <button
            onClick={handleUploadClick}
            className="bg-blue-600 text-white py-2 px-4 rounded"
          >
            Choose CSV File
          </button>
        </div>

        {/* Display Parsed Data */}
        {parsedData.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Preview:</h3>
            <table className="min-w-full border">
              <thead>
                <tr>
                  <th className="border px-2 py-1">First Name</th>
                  <th className="border px-2 py-1">Last Name</th>
                  <th className="border px-2 py-1">Email</th>
                </tr>
              </thead>
              <tbody>
                {parsedData.map((row, index) => (
                  <tr key={index}>
                    <td className="border px-2 py-1">{row.firstName}</td>
                    <td className="border px-2 py-1">{row.lastName}</td>
                    <td className="border px-2 py-1">{row.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Additional Fields */}
        <div className="mb-4">
          <label className="block font-semibold mb-2">Google Sheet Link:</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={googleSheetLink}
            onChange={(e) => setGoogleSheetLink(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold mb-2">Role Name:</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold mb-2">Company Name:</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end">
          <button
            onClick={closeModal}
            className="bg-gray-500 text-white py-2 px-4 rounded mr-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSendInvitations}
            className="bg-blue-600 text-white py-2 px-4 rounded"
          >
            Add Candidates
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
