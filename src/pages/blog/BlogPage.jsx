// src/pages/blog/BlogPage.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Spin } from "antd";
import CustomPagination from "../../components/common/Pagination";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import BlogService from "../../services/BlogService";
import "./BlogPage.css";

export default function BlogPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState(null); // null = "Tất cả"
  const [blogPosts, setBlogPosts] = useState([]);
  const [allBlogs, setAllBlogs] = useState([]); // Store all blogs for client-side category filtering
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState(""); // For input field

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12); // 12 items per page
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Client-side filtering function
  const applyCategoryFilter = React.useCallback(
    (blogs, categoryId) => {
      let filteredBlogs = blogs;

      // Filter by category if selected
      if (categoryId !== null && categoryId !== undefined) {
        filteredBlogs = blogs.filter((blog) => {
          const blogCategoryId = blog.categoryId;
          // Normalize both IDs for comparison
          const normalizedSelectedId =
            typeof categoryId === "string"
              ? parseInt(categoryId, 10)
              : categoryId;
          const normalizedBlogId =
            typeof blogCategoryId === "string"
              ? parseInt(blogCategoryId, 10)
              : blogCategoryId;

          return (
            normalizedBlogId === normalizedSelectedId ||
            blogCategoryId === categoryId ||
            blog.categoryId === categoryId
          );
        });
      }

      // Calculate pagination
      const total = filteredBlogs.length;
      const totalPagesCount = Math.ceil(total / pageSize) || 1;
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedBlogs = filteredBlogs.slice(startIndex, endIndex);

      setBlogPosts(paginatedBlogs);
      setTotalPages(totalPagesCount);
      setTotalCount(total);
    },
    [currentPage, pageSize]
  );

  // Load blogs when page, search, or category changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    loadBlogs();
  }, [currentPage, searchTerm, selectedCategoryId]);

  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const categoriesData = await BlogService.getCategories();
      setCategories(categoriesData || []);
    } catch (err) {
      // Still set empty array so UI doesn't break
      setCategories([]);
      // Don't show error to user - categories are optional
    } finally {
      setCategoriesLoading(false);
    }
  };

  const loadBlogs = async () => {
    try {
      setLoading(true);
      setError(null);

      // If searching, use API with search parameter
      // If filtering by category, we'll need to load all and filter client-side
      // since API doesn't support categoryId filter
      let result;

      if (searchTerm.trim() !== "") {
        // Use search API - this will use server-side search
        result = await BlogService.getApprovedBlogsWithSearch(
          currentPage,
          pageSize,
          searchTerm.trim()
        );
      } else {
        // Load with pagination from API
        result = await BlogService.getApprovedBlogs(
          currentPage,
          pageSize,
          null
        );
      }

      let blogsData = [];
      let total = 0;
      let totalPagesCount = 1;

      if (result && result.blogs) {
        blogsData = result.blogs || [];
        total = result.totalCount || result.total || blogsData.length;
        totalPagesCount = result.totalPages || Math.ceil(total / pageSize) || 1;
      } else if (Array.isArray(result)) {
        blogsData = result;
        total = result.length;
        totalPagesCount = Math.ceil(total / pageSize) || 1;
      }

      // If no search and no category filter, store all blogs for category extraction
      if (searchTerm.trim() === "" && selectedCategoryId === null) {
        // Load all blogs once to extract categories
        if (allBlogs.length === 0) {
          const allResult = await BlogService.getApprovedBlogs(1, 1000, null);
          let allBlogsData = [];
          if (allResult && allResult.blogs) {
            allBlogsData = allResult.blogs || [];
          } else if (Array.isArray(allResult)) {
            allBlogsData = allResult;
          }
          setAllBlogs(allBlogsData);

          // Extract categories from blogs if categories API didn't work
          setCategories((prevCategories) => {
            if (prevCategories.length === 0 && allBlogsData.length > 0) {
              const uniqueCategories = new Map();
              allBlogsData.forEach((blog) => {
                const catId = blog.categoryId;
                const catName = blog.category || blog.tag;
                if (catId && catName && !uniqueCategories.has(catId)) {
                  uniqueCategories.set(catId, {
                    id: catId,
                    categoryId: catId,
                    name: catName,
                    categoryName: catName,
                  });
                }
              });

              if (uniqueCategories.size > 0) {
                const extractedCategories = Array.from(
                  uniqueCategories.values()
                );
                return extractedCategories;
              }
            }
            return prevCategories;
          });
        }
      }

      // Apply category filter if selected (client-side)
      if (selectedCategoryId !== null && selectedCategoryId !== undefined) {
        blogsData = blogsData.filter((blog) => {
          const blogCategoryId = blog.categoryId;
          const normalizedSelectedId =
            typeof selectedCategoryId === "string"
              ? parseInt(selectedCategoryId, 10)
              : selectedCategoryId;
          const normalizedBlogId =
            typeof blogCategoryId === "string"
              ? parseInt(blogCategoryId, 10)
              : blogCategoryId;

          return (
            normalizedBlogId === normalizedSelectedId ||
            blogCategoryId === selectedCategoryId ||
            blog.categoryId === selectedCategoryId
          );
        });
        total = blogsData.length;
        totalPagesCount = Math.ceil(total / pageSize) || 1;
      }

      setBlogPosts(blogsData);
      setTotalPages(totalPagesCount);
      setTotalCount(total);
    } catch (err) {
      setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
      setBlogPosts([]);
      setTotalPages(0);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setCurrentPage(1); // Reset to first page when category changes
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
    // Clear search if input is empty
    if (e.target.value.trim() === "") {
      setSearchTerm("");
      setCurrentPage(1);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="blog-page">
      <Navbar />
      <div className="blog-page-content">
        <div className="blog-page-header">
          <h1 className="blog-page-title">Kiến thức sức khỏe</h1>
          <p className="blog-page-subtitle">
            Cập nhật thông tin y tế và sức khỏe mới nhất từ các chuyên gia
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="blog-search-form">
            <div className="blog-search-container">
              <input
                type="text"
                className="blog-search-input"
                placeholder="Tìm kiếm bài viết..."
                value={searchInput}
                onChange={handleSearchInputChange}
              />
              {searchInput && (
                <button
                  type="button"
                  className="blog-clear-input"
                  onClick={() => {
                    setSearchInput("");
                    setSearchTerm("");
                    setCurrentPage(1);
                  }}
                  title="Xóa tìm kiếm"
                >
                  ✕
                </button>
              )}
              <button type="submit" className="blog-search-button">
                Tìm kiếm
              </button>
            </div>
          </form>
        </div>

        {loading && blogPosts.length === 0 ? (
          <div className="blog-page-loading">
            <Spin size="large" />
          </div>
        ) : error ? (
          <div className="blog-page-error">
            <p>{error}</p>
          </div>
        ) : (
          <>
            {/* Always show category filters, even if categories failed to load */}
            <div className="blog-category-filters">
              <button
                className={`category-filter-btn ${
                  selectedCategoryId === null ? "active" : ""
                }`}
                onClick={() => handleCategoryChange(null)}
              >
                Tất cả
              </button>
              {categoriesLoading ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 24px",
                  }}
                >
                  <Spin size="small" />
                </span>
              ) : categories.length > 0 ? (
                categories.map((category) => {
                  const catId = category.id || category.categoryId;
                  const catName = category.name || category.categoryName;
                  // Ensure categoryId is a number if it's a string
                  const normalizedCatId =
                    catId !== null && catId !== undefined
                      ? typeof catId === "string"
                        ? parseInt(catId, 10)
                        : catId
                      : null;

                  return (
                    <button
                      key={catId}
                      className={`category-filter-btn ${
                        selectedCategoryId === normalizedCatId ||
                        selectedCategoryId === catId
                          ? "active"
                          : ""
                      }`}
                      onClick={() => {
                        handleCategoryChange(normalizedCatId);
                      }}
                    >
                      {catName}
                    </button>
                  );
                })
              ) : (
                <span
                  style={{
                    color: "#6b7280",
                    fontSize: "0.9rem",
                    padding: "10px 24px",
                  }}
                >
                  Không có danh mục nào
                </span>
              )}
            </div>

            {blogPosts.length === 0 ? (
              <div className="blog-page-empty">
                <p>Không có bài viết nào trong danh mục này.</p>
              </div>
            ) : (
              <>
                <div className="blog-posts-grid">
                  {blogPosts.map((post) => (
                    <Link
                      to={`/blog/${post.id}`}
                      key={post.id}
                      className="blog-post-card"
                    >
                      {post.img || post.thumbnailUrl || post.imageUrl ? (
                        <img
                          src={post.img || post.thumbnailUrl || post.imageUrl}
                          alt={post.title}
                          className="blog-post-img"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                          loading="lazy"
                        />
                      ) : (
                        <div className="blog-post-img-placeholder">
                          <span>Không có hình ảnh</span>
                        </div>
                      )}
                      <div className="blog-post-content">
                        <div className="blog-post-meta">
                          <span className="blog-post-tag">
                            {post.tag || post.category}
                          </span>
                          <span className="blog-post-date">{post.date}</span>
                        </div>
                        <h3 className="blog-post-title">{post.title}</h3>
                        <p className="blog-post-desc">{post.desc}</p>
                        <div className="blog-post-author">
                          Tác giả: {post.author}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination Controls */}
                <CustomPagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={totalCount}
                  onChange={(page) => handlePageChange(page)}
                />
              </>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
