import React, { useState, useEffect } from 'react';
import './Community.css';
import api from '../api';

function Community({ mouPrefix, userEmail }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mouPrefix]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/mous/${mouPrefix}/comments`);
      setComments(response.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (err) {
      console.error('Error fetching comments:', err);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      return;
    }

    try {
      await api.post(`/api/mous/${mouPrefix}/comments`, {
        text: newComment,
        userEmail: userEmail
      });
      
      setNewComment('');
      fetchComments();
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await api.delete(`/api/mous/${mouPrefix}/comments/${commentId}`);
      fetchComments();
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert('Failed to delete comment');
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return <div className="community-loading">Loading comments...</div>;
  }

  return (
    <div className="community-container">
      <div className="community-header">
        <h3>💬 Community Discussions</h3>
        <p className="community-subtitle">Share updates, ask questions, and collaborate</p>
      </div>

      <div className="comment-form">
        <textarea
          placeholder="Share your thoughts..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="comment-input"
          rows="3"
        />
        <button 
          className="btn-post-comment"
          onClick={handleAddComment}
          disabled={!newComment.trim()}
        >
          Post Comment
        </button>
      </div>

      <div className="comments-list">
        {comments.length === 0 ? (
          <div className="no-comments">
            💭 No comments yet. Be the first to share your thoughts!
          </div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="comment-card">
              <div className="comment-header">
                <div className="comment-author">
                  <div className="author-avatar">
                    {comment.userEmail.charAt(0).toUpperCase()}
                  </div>
                  <div className="author-info">
                    <span className="author-email">{comment.userEmail}</span>
                    <span className="comment-time">{formatTimestamp(comment.timestamp)}</span>
                  </div>
                </div>
                {comment.userEmail === userEmail && (
                  <button
                    className="btn-delete-comment"
                    onClick={() => handleDeleteComment(comment.id)}
                    title="Delete comment"
                  >
                    🗑️
                  </button>
                )}
              </div>
              <p className="comment-text">{comment.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Community;
