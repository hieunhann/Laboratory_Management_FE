// src/components/home/BlogSection.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Spin } from "antd";
import "./BlogSection.css";
import BlogService from "../../services/BlogService";

export default function BlogSection() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Lấy 3 bài blog đã được duyệt (status = 1) mới nhất
      const result = await BlogService.getApprovedBlogs(1, 3);

      // Handle new format (object with blogs array) or old format (array)
      let latestBlogs = [];
      if (result && result.blogs) {
        latestBlogs = result.blogs;
      } else if (Array.isArray(result)) {
        latestBlogs = result;
      }

      setBlogs(latestBlogs);

      // Only show error if we expected data but got none
      // (Don't show error if backend just has no blogs)
      if (latestBlogs.length === 0) {
        // This is fine - just means no blogs available
        setError(null);
      }
    } catch (err) {
      // Only show error for non-auth issues
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        setError("Không thể tải bài viết. Vui lòng thử lại sau.");
      }
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="blog-section-bg">
      <div className="blog-section-header">
        <span className="blog-badge">Blog & Tin tức</span>
        <div className="blog-title-group">
          <h2 className="blog-title">Kiến thức sức khỏe</h2>
          <p className="blog-desc">
            Cập nhật thông tin y tế và lời khuyên từ chuyên gia
          </p>
        </div>
        <Link to="/blog" className="blog-viewall">
          Xem tất cả &rarr;
        </Link>
      </div>

      {loading ? (
        <div className="blog-loading">
          <Spin size="large" />
        </div>
      ) : error ? (
        <div className="blog-error">
          <p>{error}</p>
        </div>
      ) : blogs.length === 0 ? (
        <div className="blog-empty">
          <p>Chưa có bài viết nào được đăng.</p>
        </div>
      ) : (
        <div className="blog-cards">
          {blogs.map((blog) => (
            <div key={blog.id} className="blog-card">
              <Link to={`/blog/${blog.id}`} className="blog-card-link">
                <img
                  src={blog.img || blog.thumbnailUrl || blog.imageUrl}
                  alt={blog.title}
                  className="blog-img"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
                <div className="blog-card-content">
                  <div className="blog-meta">
                    <span className="blog-tag">
                      {blog.tag || blog.category}
                    </span>
                    <span className="blog-time">{blog.time}</span>
                  </div>
                  <div className="blog-card-title">{blog.title}</div>
                  <div className="blog-card-author">
                    Tác giả: {blog.author || "Unknown"}
                  </div>
                  <div className="blog-card-desc">{blog.desc}</div>
                </div>
              </Link>
              <Link to={`/blog/${blog.id}`} className="blog-view-details-btn">
                Đọc thêm
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
