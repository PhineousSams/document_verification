import React, { useState, useEffect } from 'react';
import './CheckerDashboard.css';

const CheckerDashboard = ({ contract, account }) => {
  const [documents, setDocuments] = useState([]);
  const [processingTx, setProcessingTx] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    if (contract && account) {
      fetchPendingDocuments();
    }
  }, [contract, account]);

  const fetchPendingDocuments = async () => {
    try {
      const allDocs = await contract.methods.getAllDocuments().call();
      
      const docsPromises = allDocs.map(id => 
        contract.methods.getDocument(id).call()
          .then(doc => ({
            id: id, // Keep the original ID for approveDocument and rejectDocument
            documentHash: doc[0], // This is also the document hash
            owner: doc[1],
            timestamp: doc[2],
            status: parseInt(doc[3]),
            expiryDate: doc[4],
            metadata: doc[5] ? JSON.parse(doc[5]) : {},
            verifier: doc[6],
            rejectionReason: doc[7]
          }))
          .catch(() => null)
      );

      const docs = (await Promise.all(docsPromises))
        .filter(doc => doc && doc.status === 0); // Status.Pending = 0

      setDocuments(docs);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  const handleVerify = async (documentId) => {
    if (!documentId || processingTx) return;
    
    try {
      setProcessingTx(true);
      await contract.methods.approveDocument(documentId).send({ from: account });
      await fetchPendingDocuments();
    } catch (error) {
      console.error('Error verifying document:', error);
    } finally {
      setProcessingTx(false);
    }
  };

  const openRejectModal = (documentId) => {
    setSelectedDocument(documentId);
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!selectedDocument || processingTx || !rejectionReason) return;
    
    try {
      setProcessingTx(true);
      await contract.methods.rejectDocument(selectedDocument, rejectionReason)
        .send({ from: account });
      await fetchPendingDocuments();
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedDocument(null);
    } catch (error) {
      console.error('Error rejecting document:', error);
    } finally {
      setProcessingTx(false);
    }
  };

  return (
    <div className="form-section">
      <div className="form-section-header">
        <h2>Pending Documents</h2>
        <p>Review and verify submitted documents</p>
      </div>
      
      <div className="form-section-body">
        <div className="admin-documents-table">
          {documents.length === 0 ? (
            <div className="no-pending-documents">
              <p>No pending documents to verify</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Document Hash</th>
                  <th>Owner</th>
                  <th>Submitted Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
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
                      <span className="document-status-cell status-pending">
                        Pending
                      </span>
                    </td>
                    <td data-label="Actions">
                      <div className="admin-action-buttons">
                        <button
                          onClick={() => handleVerify(doc.id)}
                          disabled={processingTx}
                          className="admin-verify-button"
                        >
                          {processingTx ? 'Processing...' : 'Verify'}
                        </button>
                        <button
                          onClick={() => openRejectModal(doc.id)}
                          disabled={processingTx}
                          className="admin-reject-button"
                        >
                          {processingTx ? 'Processing...' : 'Reject'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showRejectModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Reject Document</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection"
              rows={4}
              className="rejection-reason"
            />
            <div className="modal-actions">
              <button
                onClick={handleReject}
                disabled={processingTx || !rejectionReason}
                className="btn btn-danger"
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setSelectedDocument(null);
                }}
                disabled={processingTx}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckerDashboard;
