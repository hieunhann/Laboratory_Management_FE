import api, { publicApi } from "../configs/axios";
import { setAuthToken } from "../utils/auth";
import { IAMServiceAPI } from "./IAMServiceAPI";

/**
 * Blog API Service
 * Handles all HTTP requests related to blog posts and categories
 */

const BlogAPI = {
  /**
   * Get all blog posts
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.pageSize - Page size
   * @param {number} params.status - Status filter (0: pending, 1: approved, 2: rejected)
   * @param {string} params.search - Search term for filtering blogs
   * @param {string} params.authorId - Author ID filter
   * @param {number} params.categoryId - Category ID filter
   * @returns {Promise} Array of blog posts
   */
  getAllBlogs: async (params = {}) => {
    const {
      page = 1,
      pageSize = 100,
      status,
      authorId,
      search,
      categoryId,
    } = params;
    let url = `blog/api/blog-posts?page=${page}&pageSize=${pageSize}`;

    if (status !== undefined && status !== null) {
      url += `&status=${status}`;
    }

    if (authorId) {
      url += `&authorId=${authorId}`;
    }

    if (categoryId !== undefined && categoryId !== null) {
      url += `&categoryId=${categoryId}`;
    }

    if (search && search.trim() !== "") {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }

    const response = await api.get(url);
    return response.data;
  },

  /**
   * Get approved blog posts with search (for public display)
   * @param {number} page - Page number
   * @param {number} pageSize - Page size
   * @param {string} search - Search term
   * @returns {Promise} Array of approved blog posts
   */
  getApprovedBlogsWithSearch: async (page = 1, pageSize = 100, search = "") => {
    try {
      const { page: p = 1, pageSize: ps = 100 } = { page, pageSize };
      let url = `blog/api/blog-posts?page=${p}&pageSize=${ps}&status=1`;

      if (search && search.trim() !== "") {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }

      // Try with token first if available
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const response = await api.get(url);
          return response.data;
        } catch (authError) {
          // If 401, try without auth
          if (authError.response?.status === 401) {
            const response = await publicApi.get(url);
            return response.data;
          }
          throw authError;
        }
      }

      // Use publicApi for public requests (no auth required)
      const response = await publicApi.get(url);
      return response.data;
    } catch (error) {
      // If still 401, return empty array instead of throwing
      if (error.response?.status === 401) {
        return { items: [], data: [] };
      }
      throw error;
    }
  },

  /**
   * Get approved blog posts (for public display)
   * @param {number} page - Page number
   * @param {number} pageSize - Page size
   * @param {number} categoryId - Optional category ID filter
   * @returns {Promise} Array of approved blog posts
   */
  getApprovedBlogs: async (page = 1, pageSize = 100, categoryId = null) => {
    try {
      const { page: p = 1, pageSize: ps = 100 } = { page, pageSize };
      let url = `blog/api/blog-posts?page=${p}&pageSize=${ps}&status=1`;

      // Ensure categoryId is properly formatted
      if (
        categoryId !== undefined &&
        categoryId !== null &&
        categoryId !== "null" &&
        categoryId !== ""
      ) {
        // Convert to number if it's a string
        const normalizedCategoryId =
          typeof categoryId === "string"
            ? parseInt(categoryId, 10)
            : categoryId;

        if (!isNaN(normalizedCategoryId)) {
          url += `&categoryId=${normalizedCategoryId}`;
        }
      }

      // Try with token first if available
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const response = await api.get(url);
          return response.data;
        } catch (authError) {
          // If 401, try without auth
          if (authError.response?.status === 401) {
            const response = await publicApi.get(url);
            return response.data;
          }
          throw authError;
        }
      }

      // Use publicApi for public requests (no auth required)
      const response = await publicApi.get(url);
      return response.data;
    } catch (error) {
      // If still 401, return empty array instead of throwing
      if (error.response?.status === 401) {
        return { items: [], data: [] };
      }
      throw error;
    }
  },

  /**
   * Get a single blog post by ID (public endpoint for approved blogs)
   * @param {number} id - Blog post ID
   * @returns {Promise} Blog post object
   */
  getBlogById: async (id) => {
    // Try with token first if available
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const response = await api.get(`blog/api/blog-posts/${id}`);
        return response.data;
      } catch (authError) {
        // If 401, try without auth
        if (authError.response?.status === 401) {
          const response = await publicApi.get(`blog/api/blog-posts/${id}`);
          return response.data;
        }
        throw authError;
      }
    }

    // Use publicApi for public requests (no auth required)
    const response = await publicApi.get(`blog/api/blog-posts/${id}`);
    return response.data;
  },

  /**
   * Create a new blog post
   * @param {FormData|Object} blogData - Blog post data (FormData for file upload or Object for JSON)
   * @returns {Promise} Created blog post
   */
  createBlog: async (blogData) => {
    try {
      // Axios tự động xử lý FormData, không cần set Content-Type
      const response = await api.post("blog/api/blog-posts", blogData);
      return response.data;
    } catch (error) {
      console.log("Error creating blog:", error);
      throw error;
    }
  },

  /**
   * Update an existing blog post
   * @param {number} id - Blog post ID
   * @param {FormData|Object} blogData - Updated blog post data (FormData for file upload or Object for JSON)
   * @returns {Promise} Updated blog post
   */
  updateBlog: async (id, blogData) => {
    try {
      // Axios tự động xử lý FormData, không cần set Content-Type
      const response = await api.put(`blog/api/blog-posts/${id}`, blogData);
      return response.data;
    } catch (error) {
      console.log(`Error updating blog ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a blog post
   * @param {number} id - Blog post ID
   * @returns {Promise} Delete confirmation
   */
  deleteBlog: async (id) => {
    try {
      const response = await api.delete(`blog/api/blog-posts/${id}`);
      return response.data;
    } catch (error) {
      console.log(`Error deleting blog ${id}:`, error);
      throw error;
    }
  },

  /**
   * Approve a blog post
   * @param {number} id - Blog post ID
   * @param {number} status - Status code (0, 1, or 2)
   * @returns {Promise} Approve confirmation
   */
  approveBlog: async (id, status = 1) => {
    try {
      const response = await api.patch(`blog/api/blog-posts/${id}/status`, {
        status: Number(status),
      });
      return response.data;
    } catch (error) {
      console.log("Error approving blog:", error);
      throw error;
    }
  },

  /**
   * Reject a blog post
   * @param {number} id - Blog post ID
   * @param {number} status - Status code (0, 1, or 2)
   * @returns {Promise} Reject confirmation
   */
  rejectBlog: async (id, status = 2) => {
    try {
      const response = await api.patch(`blog/api/blog-posts/${id}/status`, {
        status: Number(status),
      });
      return response.data;
    } catch (error) {
      console.log("Error rejecting blog:", error);
      throw error;
    }
  },

  /**
   * Get all categories (public endpoint)
   * @returns {Promise<Array|Object>} Category response data
   */
  getAllCategories: async () => {
    try {
      // Try with token first if available
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const response = await api.get("blog/api/categories");
          return response.data;
        } catch (authError) {
          // If 401, try without auth
          if (authError.response?.status === 401) {
            console.log("Auth failed, trying public access for categories");
            const response = await publicApi.get("blog/api/categories");
            return response.data;
          }
          throw authError;
        }
      }

      // Use publicApi for public requests (no auth required)
      const response = await publicApi.get("blog/api/categories");
      return response.data;
    } catch (error) {
      // If still 401, return empty array instead of throwing
      if (error.response?.status === 401) {
        console.log(
          "Category API requires authentication, returning empty array"
        );
        return [];
      }
      console.log("Error fetching categories:", error);
      throw error;
    }
  },

  /**
   * Create a new category
   * @param {Object} categoryData - Category data
   * @param {string} categoryData.categoryName - Category name
   * @param {string} categoryData.description - Category description
   * @returns {Promise} Created category
   */
  createCategory: async (categoryData) => {
    try {
      const response = await api.post("blog/api/categories", categoryData);
      return response.data;
    } catch (error) {
      console.log("Error creating category:", error);
      throw error;
    }
  },

  /**
   * Update an existing category
   * @param {number} id - Category ID
   * @param {Object} categoryData - Updated category data
   * @param {string} categoryData.categoryName - Category name
   * @param {string} categoryData.description - Category description
   * @returns {Promise} Updated category
   */
  updateCategory: async (id, categoryData) => {
    try {
      const response = await api.put(`blog/api/categories/${id}`, categoryData);
      return response.data;
    } catch (error) {
      console.log(`Error updating category ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a category
   * @param {number} id - Category ID (integer)
   * @returns {Promise} Delete confirmation
   */
  deleteCategory: async (id) => {
    try {
      // Ensure id is a number
      const categoryId = typeof id === 'string' ? parseInt(id, 10) : id;
      
      if (isNaN(categoryId) || categoryId <= 0) {
        throw new Error(`Invalid category ID: ${id}`);
      }
      
      console.log(`Deleting category with ID: ${categoryId}`);
      const response = await api.delete(`blog/api/categories/${categoryId}`);
      
      // Accept both 200 OK and 204 No Content as success
      if (response.status === 200 || response.status === 204) {
        return response.data || { success: true };
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error deleting category ${id}:`, error);
      if (error.response) {
        console.error("Delete error details:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        });
      }
      throw error;
    }
  },

  /**
   * Get blog image by image path
   * @param {string} imagePath - Image path from blog post
   * @returns {Promise<Blob>} Image blob
   */
  getBlogImage: async (imagePath) => {
    try {
      // Try different possible endpoints
      // If backend has a specific endpoint for images
      const response = await api.get(`blog/api/blog-posts/image/${imagePath}`, {
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      console.log("Error fetching blog image:", error);
      throw error;
    }
  },

  /**
   * Comment API Methods
   */

  /**
   * Get comments by post ID
   * @param {number|string} postId - Blog post ID
   * @returns {Promise} Array of comments
   */
  getCommentsByPostId: async (postId) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) setAuthToken(token);
      // Try with auth first, fallback to public if 401
      try {
        const response = await api.get(`blog/api/blog-posts/${postId}/comments`);
        return response.data;
      } catch (authError) {
        if (authError.response?.status === 401) {
          // Try public access for viewing comments
          const response = await publicApi.get(
            `blog/api/blog-posts/${postId}/comments`
          );
          return response.data;
        }
        throw authError;
      }
    } catch (error) {
      // If still 401, return empty array instead of throwing
      if (error.response?.status === 401) {
        console.log(
          "Comment API requires authentication, returning empty array"
        );
        return [];
      }
      console.log(`Error fetching comments for post ${postId}:`, error);
      throw error;
    }
  },

  /**
   * Get a single comment by ID
   * @param {number|string} commentId - Comment ID
   * @returns {Promise} Comment object
   */
  getCommentById: async (commentId) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) setAuthToken(token);
      const response = await api.get(`blog/api/comments/${commentId}`);
      return response.data;
    } catch (error) {
      console.log(`Error fetching comment ${commentId}:`, error);
      throw error;
    }
  },

  /**
   * Create a new comment
   * @param {Object} commentData - Comment data
   * @param {number|string} commentData.postId - Blog post ID
   * @param {string} commentData.content - Comment content
   * @returns {Promise} Created comment
   */
  createComment: async (commentData) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Authentication required to create comment");
      }
      setAuthToken(token);

      // Lấy thông tin user hiện tại để lấy userId
      const userResponse = await IAMServiceAPI.GetCurrentUser();
      const userId = userResponse?.data?.data?.userId;

      if (!userId) {
        throw new Error("Unable to get current user information");
      }

      // Thêm userId vào commentData nếu chưa có
      const commentPayload = {
        ...commentData,
        userId: userId,
        commentId: commentData.commentId || 0,
        isUpdated: commentData.isUpdated || false,
      };

      const response = await api.post("blog/api/comments", commentPayload);
      return response.data;
    } catch (error) {
      console.log("Error creating comment:", error);
      throw error;
    }
  },

  /**
   * Update an existing comment
   * @param {number|string} commentId - Comment ID
   * @param {Object} commentData - Updated comment data
   * @param {string} commentData.content - Updated comment content
   * @returns {Promise} Updated comment
   */
  updateComment: async (commentId, commentData) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Authentication required to update comment");
      }
      setAuthToken(token);
      const response = await api.put(
        `blog/api/comments/${commentId}`,
        commentData
      );
      return response.data;
    } catch (error) {
      console.log(`Error updating comment ${commentId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a comment
   * @param {number|string} commentId - Comment ID
   * @returns {Promise} Delete confirmation
   */
  deleteComment: async (commentId) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Authentication required to delete comment");
      }
      setAuthToken(token);
      const response = await api.delete(`blog/api/comments/${commentId}`);
      return response.data;
    } catch (error) {
      console.log(`Error deleting comment ${commentId}:`, error);
      throw error;
    }
  },

  /**
   * Search comments
   * @param {Object} params - Search parameters
   * @param {string} params.search - Search term
   * @param {number|string} params.postId - Optional post ID filter
   * @returns {Promise} Array of matching comments
   */
  searchComments: async (params = {}) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) setAuthToken(token);
      const { search, postId } = params;
      let url = "blog/api/comments/search";

      const queryParams = [];
      if (search && search.trim() !== "") {
        queryParams.push(`search=${encodeURIComponent(search.trim())}`);
      }
      if (postId) {
        queryParams.push(`postId=${postId}`);
      }

      if (queryParams.length > 0) {
        url += `?${queryParams.join("&")}`;
      }

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.log("Error searching comments:", error);
      throw error;
    }
  },
};

export default BlogAPI;
