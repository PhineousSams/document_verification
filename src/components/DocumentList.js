import React, { useState, useEffect } from 'react';
import '../components/CheckerDashboard.css'; // Import the CSS for the admin table

const DocumentList = ({ contract, account }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showingAllDocs, setShowingAllDocs] = useState(false);

  useEffect(() => {
    console.log('DocumentList component mounted with account:', account);
    console.log('DocumentList component mounted with contract:', contract);
    if (contract && account) {
      fetchDocuments();
    }
  }, [contract, account]);

  const fetchDocuments = async () => {
    if (!contract || !account) {
      console.log('No contract or account available');
      setDocuments([]);
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching documents for account:', account);
      
      // Try to get all documents instead of just user documents
      let docIds;
      let isShowingAllDocs = false;
      
      // First try to get user documents
      const userDocIds = await contract.methods.getUserDocuments(account).call({ from: account });
      console.log('User document IDs returned:', userDocIds);
      
      // If no user documents found, try to get all documents
      if (!userDocIds || userDocIds.length === 0) {
        console.log('No user documents found, trying to get all documents');
        docIds = await contract.methods.getAllDocuments().call({ from: account });
        console.log('All document IDs returned:', docIds);
        isShowingAllDocs = true;
      } else {
        docIds = userDocIds;
      }
      
      // Update the showingAllDocs state
      setShowingAllDocs(isShowingAllDocs);
      
      if (docIds && docIds.length > 0) {
        console.log('Found document IDs, fetching details...');
        const docs = await Promise.all(
          docIds.map(async id => {
            console.log('Fetching document with ID:', id);
            const result = await contract.methods.getDocument(id).call();
            console.log('Document result:', result);
            
            // Convert tuple to object with named properties
            return {
              id: id,
              documentHash: result[0],
              owner: result[1],
              timestamp: result[2],
              status: result[3],
              expiryDate: result[4],
              metadata: result[5],
              verifier: result[6],
              rejectionReason: result[7]
            };
          })
        );
        console.log('Documents fetched and processed:', docs);
        setDocuments(docs);
      } else {
        console.log('No document IDs found for this account');
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      '0': 'Pending',
      '1': 'Verified',
      '2': 'Rejected'
    };
    return statusMap[status] || 'Unknown';
  };

  if (loading) {
    return <div className="loading">Loading documents...</div>;
  }

  return (
    <div className="document-list">
      <h3>{showingAllDocs ? 'All Documents' : 'My Documents'}</h3>
      {documents.length === 0 ? (
        <div className="no-documents">
          {showingAllDocs 
            ? "No documents found in the system." 
            : "You haven't submitted any documents yet."}
        </div>
      ) : (
        <div className="admin-documents-table">
          <table>
            <thead>
              <tr>
                <th>Document Hash</th>
                <th>Owner</th>
                <th>Submitted Date</th>
                <th>Status</th>
                {/* No Actions column for users */}
              </tr>
            </thead>
            <tbody>
              {documents.map((doc, index) => (
                <tr key={index}>
                  <td data-label="Document Hash" className="document-hash-cell">
                    {doc.documentHash}
                  </td>
                  <td data-label="Owner" className="document-owner-cell">
                    {doc.owner}
                  </td>
                  <td data-label="Submitted Date" className="document-date-cell">
                    {new Date(parseInt(doc.timestamp) * 1000).toLocaleString()}
                  </td>
                  <td data-label="Status">
                    <span className={`document-status-cell status-${getStatusText(doc.status).toLowerCase()}`}>
                      {getStatusText(doc.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DocumentList;
