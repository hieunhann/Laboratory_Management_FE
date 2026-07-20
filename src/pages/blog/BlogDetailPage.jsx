// src/pages/blog/BlogDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Spin } from "antd";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import BlogService from "../../services/BlogService";
import { getCurrentUserRole } from "../../utils/role";
import { getAuthToken } from "../../utils/auth";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import "./BlogDetailPage.css";

export default function BlogDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Comment states
  const [comments, setComments] = useState([]);
  const [allComments, setAllComments] = useState([]); // Store all comments for pagination
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  const [openMenuCommentId, setOpenMenuCommentId] = useState(null);

  // Comment pagination
  const [currentCommentPage, setCurrentCommentPage] = useState(1);
  const commentPageSize = 10;

  // User info
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    loadBlogDetail();
    checkAuth();
  }, [id]);

  useEffect(() => {
    if (post) {
      setCurrentCommentPage(1); // Reset to first page when post changes
      loadComments();
    }
  }, [post]);

  const checkAuth = () => {
    const token = getAuthToken();
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const role =
          decoded[
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
          ] || decoded.role;
        const userId = decoded["sub"] || decoded.userId || decoded.nameid;
        setUserRole(role);
        setCurrentUserId(userId);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error decoding token:", error);
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
  };

  const loadBlogDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      // Gọi API để lấy chi tiết bài blog theo ID
      const blogData = await BlogService.getBlogById(id);
      setPost(blogData);

      // Lấy danh sách các bài blog khác (đã duyệt) để hiển thị bài viết liên quan
      const result = await BlogService.getApprovedBlogs(1, 100);
      let allBlogs = [];
      if (result && result.blogs) {
        allBlogs = result.blogs;
      } else if (Array.isArray(result)) {
        allBlogs = result;
      }
      const related = allBlogs
        .filter((blog) => blog.id !== parseInt(id))
        .slice(0, 2);
      setRelatedPosts(related);
    } catch (err) {
      console.error("Error loading blog detail:", err);
      setError("Không thể tải bài viết. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    if (!id) return;

    setCommentsLoading(true);
    try {
      const commentsData = await BlogService.getCommentsByPostId(id);
      const allCommentsData = commentsData || [];
      setAllComments(allCommentsData);

      // Calculate pagination
      const startIndex = (currentCommentPage - 1) * commentPageSize;
      const endIndex = startIndex + commentPageSize;
      setComments(allCommentsData.slice(startIndex, endIndex));
    } catch (err) {
      console.error("Error loading comments:", err);
      // Don't show error to user if comments fail to load
      setAllComments([]);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  // Update displayed comments when page changes
  useEffect(() => {
    if (allComments.length > 0) {
      const startIndex = (currentCommentPage - 1) * commentPageSize;
      const endIndex = startIndex + commentPageSize;
      const paginatedComments = allComments.slice(startIndex, endIndex);
      setComments(paginatedComments);

      // If current page is empty and not page 1, go to last available page
      if (paginatedComments.length === 0 && currentCommentPage > 1) {
        const lastPage = Math.ceil(allComments.length / commentPageSize);
        if (lastPage > 0) {
          setCurrentCommentPage(lastPage);
        }
      }
    } else {
      setComments([]);
    }
  }, [currentCommentPage, allComments, commentPageSize]);

  const totalCommentPages = Math.ceil(allComments.length / commentPageSize);

  const handleCommentPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalCommentPages) {
      setCurrentCommentPage(newPage);
      // Scroll to comments section
      const commentsSection = document.querySelector(".blog-comments-section");
      if (commentsSection) {
        commentsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.warning("Vui lòng đăng nhập để bình luận");
      navigate("/login");
      return;
    }

    if (userRole !== "Customer") {
      toast.warning("Chỉ khách hàng mới có thể bình luận");
      return;
    }

    if (!commentContent.trim()) {
      toast.warning("Vui lòng nhập nội dung bình luận");
      return;
    }

    setIsSubmittingComment(true);
    try {
      await BlogService.createComment({
        postId: parseInt(id),
        content: commentContent.trim(),
      });

      toast.success("Bình luận đã được thêm thành công!");
      setCommentContent("");
      // Reload comments first, then reset to first page
      await loadComments();
      setCurrentCommentPage(1); // Reset to first page to show new comment
    } catch (err) {
      console.error("Error creating comment:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Không thể thêm bình luận. Vui lòng thử lại.";
      toast.error(errorMsg);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditCommentContent(comment.content);
  };

  const handleUpdateComment = async (commentId) => {
    if (!editCommentContent.trim()) {
      toast.warning("Vui lòng nhập nội dung bình luận");
      return;
    }

    try {
      await BlogService.updateComment(commentId, {
        content: editCommentContent.trim(),
      });

      toast.success("Bình luận đã được cập nhật!");
      setEditingCommentId(null);
      setEditCommentContent("");
      await loadComments();
      // Keep current page after update
    } catch (err) {
      console.error("Error updating comment:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Không thể cập nhật bình luận. Vui lòng thử lại.";
      toast.error(errorMsg);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bình luận này?")) {
      return;
    }

    try {
      await BlogService.deleteComment(commentId);
      toast.success("Bình luận đã được xóa!");
      await loadComments();
      // Adjust page if current page becomes empty
      if (comments.length === 1 && currentCommentPage > 1) {
        setCurrentCommentPage(currentCommentPage - 1);
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Không thể xóa bình luận. Vui lòng thử lại.";
      toast.error(errorMsg);
    }
  };

  const cancelEdit = () => {
    setEditingCommentId(null);
    setEditCommentContent("");
  };

  const handleMenuToggle = (commentId) => {
    setOpenMenuCommentId(openMenuCommentId === commentId ? null : commentId);
  };

  const handleMenuClose = () => {
    setOpenMenuCommentId(null);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".blog-comment-menu-container")) {
        setOpenMenuCommentId(null);
      }
    };

    if (openMenuCommentId) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openMenuCommentId]);

  if (loading) {
    return (
      <div className="blog-detail-page">
        <Navbar />
        <div className="blog-detail-content">
          <div className="blog-detail-loading">
            <Spin size="large" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="blog-detail-page">
        <Navbar />
        <div className="blog-detail-content">
          <div className="blog-detail-error">
            <h1>{error || "Bài viết không tồn tại"}</h1>
            <Link to="/blog" className="back-to-blog-btn">
              Quay lại trang blog
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="blog-detail-page">
      <Navbar />
      <div className="blog-detail-content">
        <div className="blog-detail-breadcrumb">
          <Link to="/">Trang chủ</Link>
          <span> / </span>
          <Link to="/blog">Blog</Link>
          <span> / </span>
          <span>{post.title}</span>
        </div>

        <article className="blog-detail-article">
          <h1 className="blog-detail-title">{post.title}</h1>

          <div className="blog-detail-meta">
            <span className="blog-detail-author">Tác giả: {post.author}</span>
            <span className="blog-detail-date">{post.fullDate}</span>
          </div>

          {(post.img || post.thumbnailUrl || post.imageUrl) && (
            <img
              src={post.img || post.thumbnailUrl || post.imageUrl}
              alt={post.title}
              className="blog-detail-img"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          )}

          <div
            className="blog-detail-body"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div className="blog-detail-share">
            <span className="blog-detail-share-label">Chia sẻ bài viết:</span>
            <div className="blog-detail-share-buttons">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`}
                target="_blank"
                rel="noopener noreferrer"
                className="share-btn facebook"
              >
                Facebook
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${window.location.href}&text=${post.title}`}
                target="_blank"
                rel="noopener noreferrer"
                className="share-btn twitter"
              >
                Twitter
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${window.location.href}`}
                target="_blank"
                rel="noopener noreferrer"
                className="share-btn linkedin"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </article>

        {/* Comments Section */}
        <section className="blog-comments-section">
          <h2 className="blog-comments-title">
            Bình luận ({allComments.length})
          </h2>

          {/* Comment Form - Only for authenticated Customer */}
          {isAuthenticated && userRole === "Customer" ? (
            <form onSubmit={handleSubmitComment} className="blog-comment-form">
              <textarea
                className="blog-comment-input"
                placeholder="Viết bình luận của bạn..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                rows={4}
                required
              />
              <div className="blog-comment-form-actions">
                <button
                  type="submit"
                  className="blog-comment-submit-btn"
                  disabled={isSubmittingComment || !commentContent.trim()}
                >
                  {isSubmittingComment ? "Đang gửi..." : "Gửi bình luận"}
                </button>
              </div>
            </form>
          ) : (
            <div className="blog-comment-login-prompt">
              <p>
                {!isAuthenticated ? (
                  <>
                    <Link to="/login">Đăng nhập</Link> để bình luận
                  </>
                ) : (
                  "Chỉ khách hàng mới có thể bình luận"
                )}
              </p>
            </div>
          )}

          {/* Comments List */}
          {commentsLoading ? (
            <div className="blog-comments-loading">
              <Spin size="large" />
            </div>
          ) : comments.length === 0 ? (
            <div className="blog-comments-empty">
              <p>Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
            </div>
          ) : (
            <div className="blog-comments-list">
              {comments.map((comment) => {
                // Normalize IDs for comparison (remove whitespace, convert to lowercase)
                const normalizedCurrentUserId = currentUserId
                  ? String(currentUserId).trim().toLowerCase()
                  : null;
                const normalizedCommentAuthorId = comment.authorId
                  ? String(comment.authorId).trim().toLowerCase()
                  : null;

                const isOwner =
                  isAuthenticated &&
                  normalizedCurrentUserId &&
                  normalizedCommentAuthorId &&
                  normalizedCurrentUserId === normalizedCommentAuthorId;

                // Debug log
                if (isAuthenticated && currentUserId) {
                  console.log("Comment ownership check:", {
                    commentId: comment.id,
                    commentAuthorId: comment.authorId,
                    normalizedCommentAuthorId: normalizedCommentAuthorId,
                    currentUserId: currentUserId,
                    normalizedCurrentUserId: normalizedCurrentUserId,
                    isOwner: isOwner,
                  });
                }

                return (
                  <div
                    key={comment.id}
                    className={`blog-comment-item ${
                      isOwner ? "blog-comment-owner" : ""
                    }`}
                  >
                    {editingCommentId === comment.id ? (
                      <div className="blog-comment-edit">
                        <textarea
                          className="blog-comment-edit-input"
                          value={editCommentContent}
                          onChange={(e) =>
                            setEditCommentContent(e.target.value)
                          }
                          rows={3}
                        />
                        <div className="blog-comment-edit-actions">
                          <button
                            className="blog-comment-save-btn"
                            onClick={() => handleUpdateComment(comment.id)}
                          >
                            Lưu
                          </button>
                          <button
                            className="blog-comment-cancel-btn"
                            onClick={cancelEdit}
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="blog-comment-header">
                          <div className="blog-comment-author">
                            <strong>{comment.author || "Unknown"}</strong>
                            {isOwner && (
                              <span className="blog-comment-owner-badge">
                                Bạn
                              </span>
                            )}
                          </div>
                          {isOwner && (
                            <div className="blog-comment-menu-container">
                              <button
                                className="blog-comment-menu-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMenuToggle(comment.id);
                                }}
                                title="Tùy chọn"
                              >
                                ⋮
                              </button>
                              {openMenuCommentId === comment.id && (
                                <div className="blog-comment-menu">
                                  <button
                                    className="blog-comment-menu-item"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditComment(comment);
                                      handleMenuClose();
                                    }}
                                  >
                                    Sửa
                                  </button>
                                  <button
                                    className="blog-comment-menu-item delete"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteComment(comment.id);
                                      handleMenuClose();
                                    }}
                                  >
                                    Xóa
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="blog-comment-content">
                          {comment.content}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Comment Pagination */}
          {totalCommentPages > 1 && (
            <div className="blog-comment-pagination">
              <button
                className="comment-pagination-btn"
                onClick={() => handleCommentPageChange(currentCommentPage - 1)}
                disabled={currentCommentPage === 1}
              >
                ‹ Trước
              </button>

              <div className="comment-pagination-info">
                Trang {currentCommentPage} / {totalCommentPages}
              </div>

              {/* Page numbers */}
              <div className="comment-pagination-numbers">
                {Array.from(
                  { length: Math.min(5, totalCommentPages) },
                  (_, i) => {
                    let pageNum;
                    if (totalCommentPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentCommentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentCommentPage >= totalCommentPages - 2) {
                      pageNum = totalCommentPages - 4 + i;
                    } else {
                      pageNum = currentCommentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        className={`comment-pagination-number ${
                          currentCommentPage === pageNum ? "active" : ""
                        }`}
                        onClick={() => handleCommentPageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                )}
              </div>

              <button
                className="comment-pagination-btn"
                onClick={() => handleCommentPageChange(currentCommentPage + 1)}
                disabled={currentCommentPage === totalCommentPages}
              >
                Sau ›
              </button>
            </div>
          )}
        </section>

        {relatedPosts.length > 0 && (
          <section className="blog-related-posts">
            <h2 className="blog-related-title">Bài viết liên quan</h2>
            <div className="blog-related-grid">
              {relatedPosts.map((relatedPost) => (
                <Link
                  to={`/blog/${relatedPost.id}`}
                  key={relatedPost.id}
                  className="blog-related-card"
                >
                  <img
                    src={
                      relatedPost.img ||
                      relatedPost.thumbnailUrl ||
                      relatedPost.imageUrl
                    }
                    alt={relatedPost.title}
                    className="blog-related-img"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                  <div className="blog-related-content">
                    <div className="blog-related-date">{relatedPost.date}</div>
                    <h3 className="blog-related-card-title">
                      {relatedPost.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
      <Footer />
    </div>
  );
}
