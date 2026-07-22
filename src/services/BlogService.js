import BlogAPI from "../apis/BlogAPI";
import { formatDate1 } from "../utils/formatDate";
import { getUserById } from "./IAMService.jsx";
import { setAuthToken } from "../utils/auth";

/**
 * Blog Service
 * Business logic layer for blog operations
 * Transforms data between API and UI format
 */

const BlogService = {
  STATUS_TEXT_BY_CODE: {
    0: "pending",
    1: "approved",
    2: "rejected",
  },
  STATUS_CODE_BY_TEXT: {
    pending: 0,
    approved: 1,
    rejected: 2,
  },

  mapStatusFromAPI(status) {
    if (typeof status === "number") {
      return BlogService.STATUS_TEXT_BY_CODE[status] || "pending";
    }
    if (typeof status === "string" && status.trim() !== "") {
      const normalized = status.trim().toLowerCase();
      if (
        Object.prototype.hasOwnProperty.call(
          BlogService.STATUS_CODE_BY_TEXT,
          normalized
        )
      ) {
        return normalized;
      }
      const parsed = Number(normalized);
      if (!Number.isNaN(parsed)) {
        return BlogService.STATUS_TEXT_BY_CODE[parsed] || "pending";
      }
    }
    return "pending";
  },

  mapStatusToAPI(status) {
    if (typeof status === "number") {
      return status;
    }
    if (typeof status === "string") {
      const normalized = status.trim().toLowerCase();
      if (
        Object.prototype.hasOwnProperty.call(
          BlogService.STATUS_CODE_BY_TEXT,
          normalized
        )
      ) {
        return BlogService.STATUS_CODE_BY_TEXT[normalized];
      }
      const parsed = Number(normalized);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    return 0;
  },

  /**
   * Helper function to build full image URL
   * @param {string} imagePath - Image path from API (can be relative or absolute)
   * @returns {string} Full image URL
   */
  buildImageUrl: (imagePath) => {
    if (!imagePath || imagePath.trim() === "") return "";
    
    const trimmedPath = imagePath.trim();
    // Gateway URL for images
    const baseURL = "https://hemalink-gateway-5ils.onrender.com";
    
    // If already a full URL (starts with http:// or https://), return as is
    if (trimmedPath.startsWith("http://") || trimmedPath.startsWith("https://")) {
      return trimmedPath;
    }
    
    // Handle /app/Images/... paths - convert to /blog/Images/...
    // Example: "/app/Images/383de81f-bd02-4151-9195-677834cd84de.jpg"
    // Result: "http://localhost:8080/blog/Images/383de81f-bd02-4151-9195-677834cd84de.jpg"
    if (trimmedPath.startsWith("/app/Images/")) {
      const imageFileName = trimmedPath.replace("/app/Images/", "");
      return `${baseURL}/blog/Images/${imageFileName}`;
    }
    
    // Handle /app/Images/... without leading slash
    if (trimmedPath.startsWith("app/Images/")) {
      const imageFileName = trimmedPath.replace("app/Images/", "");
      return `${baseURL}/blog/Images/${imageFileName}`;
    }
    
    // If starts with /, check if it's /Images/... and convert to /blog/Images/...
    if (trimmedPath.startsWith("/Images/")) {
      const imageFileName = trimmedPath.replace("/Images/", "");
      return `${baseURL}/blog/Images/${imageFileName}`;
    }
    
    // If path starts with "Images/", append directly to /blog/
    // Example: "Images/f4a44ab4-81cf-47de-9555-d67ccf02fbb1.jpg"
    // Result: http://localhost:8080/blog/Images/f4a44ab4-81cf-47de-9555-d67ccf02fbb1.jpg
    if (trimmedPath.startsWith("Images/")) {
      // Build URL: http://localhost:8080/blog/Images/...
      return `${baseURL}/blog/${trimmedPath}`;
    }
    
    // If starts with /blog/, use as is
    if (trimmedPath.startsWith("/blog/")) {
      return `${baseURL}${trimmedPath}`;
    }
    
    // If starts with /, it's a relative path from root (but not /app/ or /Images/)
    if (trimmedPath.startsWith("/")) {
      return `${baseURL}${trimmedPath}`;
    }
    
    // Otherwise, assume it's just a filename and try common paths
    return `${baseURL}/blog/api/blog-posts/Images/${trimmedPath}`;
  },

  /**
   * Transform API blog data to UI format
   * @param {Object} apiBlog - Blog data from API
   * @returns {Object} Transformed blog object for UI
   */
  transformBlogFromAPI: (apiBlog) => {
    if (!apiBlog) return {};
    const rawBlog = apiBlog?.data && typeof apiBlog.data === "object" && !Array.isArray(apiBlog.data) && (apiBlog.data.blogPostId || apiBlog.data.postId || apiBlog.data.id || apiBlog.data.title) ? apiBlog.data : (apiBlog?.data || apiBlog);
    const categoryName =
      rawBlog.category?.categoryName ||
      rawBlog.categoryName ||
      rawBlog.tag ||
      "";
    const status = BlogService.mapStatusFromAPI(rawBlog.status);
    
    // Get image URL from various possible fields (including imagePath from API)
    const rawImageUrl = rawBlog.imagePath || rawBlog.imageUrl || rawBlog.thumbnailUrl || rawBlog.img || rawBlog.image || "";
    const imageUrl = BlogService.buildImageUrl(rawImageUrl);
    
    return {
      id: rawBlog.blogPostId || rawBlog.postId || rawBlog.id,
      title: rawBlog.title || "",
      author: rawBlog.author || rawBlog.authorName || "Unknown",
      authorId: rawBlog.authorId || rawBlog.author?.id || "",
      categoryId: rawBlog.categoryId || rawBlog.category?.categoryId || null,
      category: categoryName,
      tag: rawBlog.tag || categoryName,
      status,
      content: rawBlog.content || "",
      img: imageUrl,
      thumbnailUrl: imageUrl,
      imageUrl: imageUrl,
      // Keep original imagePath for fallback
      imagePath: rawBlog.imagePath || rawImageUrl || "",
      createdDate: rawBlog.createdDate ? formatDate1(rawBlog.createdDate) : "",
      updatedDate: rawBlog.updatedDate ? formatDate1(rawBlog.updatedDate) : "",
      date: rawBlog.createdDate
        ? formatDate1(rawBlog.createdDate)
        : formatDate1(new Date().toISOString()),
      fullDate: rawBlog.createdDate
        ? new Date(rawBlog.createdDate).toLocaleDateString("vi-VN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "",
      time: rawBlog.createdDate
        ? formatTimeAgo(new Date(rawBlog.createdDate))
        : "Vừa xong",
      views: rawBlog.views || 0,
      comments: rawBlog.comments || 0,
      desc:
        rawBlog.description ||
        (rawBlog.content ? rawBlog.content.substring(0, 100) + "..." : ""),
    };
  },

  /**
   * Build FormData for blog API (backend requires multipart/form-data)
   * @param {Object} uiBlog - Blog data from UI
   * @returns {FormData} FormData with blog fields
   */
  buildBlogPayload: (uiBlog) => {
    const hasCategoryId =
      uiBlog.categoryId !== undefined &&
      uiBlog.categoryId !== null &&
      uiBlog.categoryId !== "" &&
      !Number.isNaN(Number(uiBlog.categoryId));
    const categoryId = hasCategoryId ? Number(uiBlog.categoryId) : undefined;
    const authorId =
      uiBlog.authorId && uiBlog.authorId.trim() !== ""
        ? uiBlog.authorId.trim()
        : undefined;

    const formData = new FormData();
    
    // Backend expect: Title, Content, CategoryId, AuthorId, Image
    if (uiBlog.title) {
      formData.append("Title", uiBlog.title);
    }
    if (uiBlog.content) {
      formData.append("Content", uiBlog.content);
    }
    if (categoryId !== undefined && categoryId !== null) {
      formData.append("CategoryId", categoryId);
    }
    if (authorId) {
      formData.append("AuthorId", authorId);
    }
    
    // Only append Image if there's a file
    // For update without new image, backend will keep existing image
    if (uiBlog.imageFile instanceof File) {
      formData.append("Image", uiBlog.imageFile);
    }

    return formData;
  },

  /**
   * Transform UI blog data to API format (deprecated - use buildBlogPayload instead)
   * @param {Object} uiBlog - Blog data from UI
   * @returns {Object} Transformed blog object for API
   */
  transformBlogToAPI: (uiBlog) => {
    const status = BlogService.mapStatusToAPI(uiBlog.status);
    const hasCategoryId =
      uiBlog.categoryId !== undefined &&
      uiBlog.categoryId !== null &&
      uiBlog.categoryId !== "" &&
      !Number.isNaN(Number(uiBlog.categoryId));
    const categoryId = hasCategoryId ? Number(uiBlog.categoryId) : undefined;
    const authorId =
      uiBlog.authorId && uiBlog.authorId.trim() !== ""
        ? uiBlog.authorId.trim()
        : undefined;
    const thumbnailUrl = uiBlog.thumbnailUrl || uiBlog.img || "";

    const payload = {
      title: uiBlog.title,
      author: uiBlog.author,
      category: uiBlog.category,
      tag: uiBlog.tag || uiBlog.category,
      status,
      content: uiBlog.content,
      imageUrl: uiBlog.img,
    };

    if (thumbnailUrl) {
      payload.thumbnailUrl = thumbnailUrl;
    }
    if (authorId) {
      payload.authorId = authorId;
    }
    if (hasCategoryId && categoryId !== undefined && categoryId !== null) {
      payload.categoryId = categoryId;
    }

    return payload;
  },

  /**
   * Transform API category data to UI format
   * @param {Object} apiCategory
   * @returns {{id:number|string, categoryId:number|string, name:string, description:string}}
   */
  transformCategoryFromAPI: (apiCategory) => {
    if (!apiCategory) {
      return {
        id: null,
        categoryId: null,
        name: "",
        description: "",
        createdDate: null,
      };
    }
    return {
      id: apiCategory.categoryId || apiCategory.id,
      categoryId: apiCategory.categoryId || apiCategory.id,
      name: apiCategory.categoryName || apiCategory.name || "",
      description: apiCategory.description || "",
      createdDate: apiCategory.createdDate || apiCategory.created || null,
    };
  },

  /**
   * Normalize list responses coming from API
   * @param {*} apiResponse
   * @returns {Array}
   */
  extractBlogList: (apiResponse) => {
    if (!apiResponse) return [];
    if (Array.isArray(apiResponse)) return apiResponse;
    if (apiResponse?.data?.data && Array.isArray(apiResponse.data.data)) return apiResponse.data.data;
    if (apiResponse?.data?.data?.items && Array.isArray(apiResponse.data.data.items)) return apiResponse.data.data.items;
    if (Array.isArray(apiResponse.items)) return apiResponse.items;
    if (Array.isArray(apiResponse.data)) return apiResponse.data;
    if (apiResponse.data && Array.isArray(apiResponse.data.items)) {
      return apiResponse.data.items;
    }
    return [];
  },

  /**
   * Normalize category list responses coming from API
   * @param {*} apiResponse
   * @returns {Array}
   */
  extractCategoryList: (apiResponse) => {
    if (!apiResponse) return [];
    if (Array.isArray(apiResponse)) return apiResponse;
    if (apiResponse?.data?.data && Array.isArray(apiResponse.data.data)) return apiResponse.data.data;
    if (apiResponse?.data?.data?.items && Array.isArray(apiResponse.data.data.items)) return apiResponse.data.data.items;
    if (Array.isArray(apiResponse.items)) return apiResponse.items;
    if (Array.isArray(apiResponse.data)) return apiResponse.data;
    if (apiResponse.data && Array.isArray(apiResponse.data.items)) {
      return apiResponse.data.items;
    }
    return [];
  },

  /**
   * Enrich blog with author full name from IAM service
   * @param {Object} blog - Blog object
   * @returns {Promise<Object>} Blog with author full name
   */
  enrichBlogWithAuthor: async (blog) => {
    if (blog.authorId) {
      try {
        const userData = await getUserById(blog.authorId);

        if (userData) {
          // Handle different field names for full name
          const fullName =
            userData.fullName ||
            userData.FullName ||
            userData.name ||
            userData.Name;

          if (fullName) {
            return { ...blog, author: fullName };
          }
        }
      } catch (error) {
        console.error(`Error fetching author for blog ${blog.id}:`, error);
      }
    }
    return blog;
  },

  /**
   * Get all blogs
   * @param {Object} params - Query parameters
   * @param {number} params.status - Status filter (0: pending, 1: approved, 2: rejected)
   * @param {string} params.authorId - Author ID filter
   * @returns {Promise<Array>} Array of blogs in UI format
   */
  getAllBlogs: async (params = {}) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) setAuthToken(token);
      const apiResponse = await BlogAPI.getAllBlogs(params);
      const apiBlogs = BlogService.extractBlogList(apiResponse);
      const transformedBlogs = apiBlogs.map((blog) =>
        BlogService.transformBlogFromAPI(blog)
      );

      // Enrich blogs with author names in parallel
      const enrichedBlogs = await Promise.all(
        transformedBlogs.map((blog) => BlogService.enrichBlogWithAuthor(blog))
      );

      return enrichedBlogs;
    } catch (error) {
      console.error("BlogService - Error getting all blogs:", error);
      throw error;
    }
  },

  getAllBlogsById: async (authorId) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) setAuthToken(token);
      const apiResponse = await BlogAPI.getAllBlogs({ authorId });
      if (apiResponse.status >= 200 && apiResponse.status < 300) {
        const apiBlogs = BlogService.extractBlogList(apiResponse);
        const transformedBlogs = apiBlogs.map((blog) =>
          BlogService.transformBlogFromAPI(blog)
        );

        // Enrich blogs with author names in parallel
        const enrichedBlogs = await Promise.all(
          transformedBlogs.map((blog) => BlogService.enrichBlogWithAuthor(blog))
        );
        return enrichedBlogs;
      }
    } catch (error) {
      console.error("BlogService - Error getting all blogs:", error);
      throw error;
    }
  },

  /**
   * Get approved blogs with search (for public display - no authentication required)
   * @param {number} page - Page number
   * @param {number} pageSize - Page size
   * @param {string} search - Search term
   * @returns {Promise<Object>} Object with blogs array and pagination info
   */
  getApprovedBlogsWithSearch: async (page = 1, pageSize = 100, search = "") => {
    try {
      // Public endpoint - don't require authentication
      const apiResponse = await BlogAPI.getApprovedBlogsWithSearch(page, pageSize, search);
      const apiBlogs = BlogService.extractBlogList(apiResponse);
      
      // Extract pagination info from response
      let totalCount = 0;
      let totalPages = 1;
      
      if (apiResponse && typeof apiResponse === 'object') {
        totalCount = apiResponse.totalCount || apiResponse.total || apiResponse.count || apiBlogs.length;
        totalPages = apiResponse.totalPages || Math.ceil(totalCount / pageSize) || 1;
      } else {
        totalCount = apiBlogs.length;
        totalPages = Math.ceil(totalCount / pageSize) || 1;
      }
      
      // If no blogs found, return empty result with pagination info
      if (!apiBlogs || apiBlogs.length === 0) {
        return {
          blogs: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: page,
          pageSize: pageSize
        };
      }
      
      const transformedBlogs = apiBlogs.map((blog) =>
        BlogService.transformBlogFromAPI(blog)
      );

      // Try to enrich blogs with author names, but don't fail if it errors
      const enrichedBlogs = await Promise.all(
        transformedBlogs.map(async (blog) => {
          try {
            const token = localStorage.getItem("accessToken");
            if (token && blog.authorId) {
              return await BlogService.enrichBlogWithAuthor(blog);
            }
            return blog;
          } catch (error) {
            if (error.response?.status !== 404) {
              console.warn(`Could not enrich blog ${blog.id} with author:`, error.message);
            }
            return blog;
          }
        })
      );
      
      // Sort by blogPostId/id descending (newest first - highest ID)
      enrichedBlogs.sort((a, b) => {
        const idA = a.id || 0;
        const idB = b.id || 0;
        return idB - idA;
      });

      return {
        blogs: enrichedBlogs,
        totalCount: totalCount,
        totalPages: totalPages,
        currentPage: page,
        pageSize: pageSize
      };
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn("BlogService - Authentication required, returning empty result");
        return {
          blogs: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: page,
          pageSize: pageSize
        };
      }
      console.error("BlogService - Error getting approved blogs with search:", error);
      throw error;
    }
  },

  /**
   * Get approved blogs (for public display - no authentication required)
   * @param {number} page - Page number
   * @param {number} pageSize - Page size
   * @param {number} categoryId - Optional category ID filter
   * @returns {Promise<Object>} Object with blogs array and pagination info
   */
  getApprovedBlogs: async (page = 1, pageSize = 100, categoryId = null) => {
    try {
      // Public endpoint - don't require authentication
      const apiResponse = await BlogAPI.getApprovedBlogs(page, pageSize, categoryId);
      const apiBlogs = BlogService.extractBlogList(apiResponse);
      
      // Extract pagination info from response
      let totalCount = 0;
      let totalPages = 1;
      
      if (apiResponse && typeof apiResponse === 'object') {
        totalCount = apiResponse.totalCount || apiResponse.total || apiResponse.count || apiBlogs.length;
        totalPages = apiResponse.totalPages || Math.ceil(totalCount / pageSize) || 1;
      } else {
        totalCount = apiBlogs.length;
        totalPages = Math.ceil(totalCount / pageSize) || 1;
      }
      
      // If no blogs found, return empty result with pagination info
      if (!apiBlogs || apiBlogs.length === 0) {
        return {
          blogs: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: page,
          pageSize: pageSize
        };
      }
      
      const transformedBlogs = apiBlogs.map((blog) =>
        BlogService.transformBlogFromAPI(blog)
      );

      // Try to enrich blogs with author names, but don't fail if it errors
      // Author enrichment requires authentication, so we'll skip it for public access
      const enrichedBlogs = await Promise.all(
        transformedBlogs.map(async (blog) => {
          try {
            // Only try to enrich if we have a token
            const token = localStorage.getItem("accessToken");
            if (token && blog.authorId) {
              return await BlogService.enrichBlogWithAuthor(blog);
            }
            return blog;
          } catch (error) {
            // If enrichment fails, return blog without author name
            // Don't log 404 errors for author lookup as they're expected
            if (error.response?.status !== 404) {
              console.warn(`Could not enrich blog ${blog.id} with author:`, error.message);
            }
            return blog;
          }
        })
      );
      
      // Sort by blogPostId/id descending (newest first - highest ID)
      enrichedBlogs.sort((a, b) => {
        const idA = a.id || 0;
        const idB = b.id || 0;
        return idB - idA;
      });

      return {
        blogs: enrichedBlogs,
        totalCount: totalCount,
        totalPages: totalPages,
        currentPage: page,
        pageSize: pageSize
      };
    } catch (error) {
      // If 401 or other auth errors, return empty result instead of throwing
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn("BlogService - Authentication required, returning empty result");
        return {
          blogs: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: page,
          pageSize: pageSize
        };
      }
      console.error("BlogService - Error getting approved blogs:", error);
      throw error;
    }
  },

  /**
   * Get all categories (public endpoint - no authentication required)
   * @returns {Promise<Array>} Array of categories
   */
  getCategories: async () => {
    try {
      // Public endpoint - don't require authentication
      const apiResponse = await BlogAPI.getAllCategories();
      const apiCategories = BlogService.extractCategoryList(apiResponse);
      
      // If no categories found, return empty array
      if (!apiCategories || apiCategories.length === 0) {
        return [];
      }
      
      return apiCategories.map((category) =>
        BlogService.transformCategoryFromAPI(category)
      );
    } catch (error) {
      // If 401 or other auth errors, return empty array instead of throwing
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn("BlogService - Authentication required for categories, returning empty array");
        return [];
      }
      console.error("BlogService - Error getting categories:", error);
      throw error;
    }
  },

  /**
   * Create a new category
   * @param {Object} categoryData - Category data
   * @param {string} categoryData.name - Category name
   * @param {string} categoryData.description - Category description
   * @returns {Promise<Object>} Created category in UI format
   */
  createCategory: async (categoryData) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) setAuthToken(token);
      
      // Transform UI data to API format - Backend may require PascalCase
      const apiPayload = {
        CategoryName: categoryData.name || categoryData.categoryName || categoryData.CategoryName || "",
        Description: categoryData.description || categoryData.Description || "",
      };
      
      console.log("Creating category with payload:", apiPayload);
      
      const createdCategory = await BlogAPI.createCategory(apiPayload);
      return BlogService.transformCategoryFromAPI(createdCategory);
    } catch (error) {
      console.error("BlogService - Error creating category:", error);
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
      }
      throw error;
    }
  },

  /**
   * Update an existing category
   * @param {number} id - Category ID
   * @param {Object} categoryData - Updated category data
   * @param {string} categoryData.name - Category name
   * @param {string} categoryData.description - Category description
   * @param {string} categoryData.createdDate - Original created date
   * @param {Object} existingCategory - Existing category object (optional)
   * @returns {Promise<Object>} Updated category in UI format
   */
  updateCategory: async (id, categoryData, existingCategory = null) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) setAuthToken(token);
      
      // Get createdDate from existingCategory (original category from API)
      // Try to get from existingCategory first (this should have the original API format)
      let formattedCreatedDate = null;
      if (existingCategory) {
        // Check various possible date fields in existingCategory
        const originalCreatedDate = 
          existingCategory.createdDate || 
          existingCategory.CreatedDate ||
          null;
        
        if (originalCreatedDate) {
          try {
            // If it's already ISO format (contains 'T' and 'Z'), use it directly
            if (typeof originalCreatedDate === 'string' && originalCreatedDate.includes('T')) {
              formattedCreatedDate = originalCreatedDate;
            } 
            // If it's a Date object, convert to ISO
            else if (originalCreatedDate instanceof Date) {
              formattedCreatedDate = originalCreatedDate.toISOString();
            }
            // Otherwise, try to parse and convert
            else {
              const dateObj = new Date(originalCreatedDate);
              if (!isNaN(dateObj.getTime())) {
                formattedCreatedDate = dateObj.toISOString();
              }
            }
          } catch (e) {
            console.warn("Error formatting createdDate:", e);
          }
        }
      }
      
      // Generate updatedDate with current time (ISO format: "2025-12-01T14:05:28.202Z")
      const updatedDate = new Date().toISOString();
      
      // Use camelCase format as shown in backend API structure
      const apiPayload = {
        categoryId: id,
        categoryName: categoryData.name || categoryData.categoryName || "",
        description: categoryData.description || "",
        createdDate: formattedCreatedDate,
        updatedDate: updatedDate,
      };
      
      console.log("Updating category with payload:", apiPayload);
      
      const updatedCategory = await BlogAPI.updateCategory(id, apiPayload);
      return BlogService.transformCategoryFromAPI(updatedCategory);
    } catch (error) {
      console.error(`BlogService - Error updating category ${id}:`, error);
      // Log detailed error response
      if (error.response) {
        console.error("Error response data:", JSON.stringify(error.response.data, null, 2));
        console.error("Error response status:", error.response.status);
        console.error("Error response headers:", error.response.headers);
      }
      throw error;
    }
  },

  /**
   * Delete a category
   * @param {number|string} id - Category ID (categoryId)
   * @returns {Promise} Delete confirmation
   */
  deleteCategory: async (id) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) setAuthToken(token);
      
      // Ensure categoryId is a number
      const categoryId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
      
      if (isNaN(categoryId) || categoryId <= 0) {
        throw new Error(`Invalid categoryId: ${id}. categoryId must be a positive number.`);
      }
      
      console.log(`BlogService - Attempting to delete category with categoryId: ${categoryId} (type: ${typeof categoryId})`);
      
      const result = await BlogAPI.deleteCategory(categoryId);
      
      console.log(`BlogService - Category with categoryId ${categoryId} deleted successfully`);
      return result;
    } catch (error) {
      console.error(`BlogService - Error deleting category with categoryId ${id}:`, error);
      
      // Log detailed error information
      if (error.response) {
        console.error("Delete error response:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
        });
      }
      
      throw error;
    }
  },

  /**
   * Get blog by ID (public endpoint for approved blogs)
   * @param {number} id - Blog ID
   * @returns {Promise<Object>} Blog object in UI format
   */
  getBlogById: async (id) => {
    try {
      // Public endpoint - don't require authentication
      const apiBlog = await BlogAPI.getBlogById(id);
      
      if (!apiBlog) {
        throw new Error(`Blog with ID ${id} not found`);
      }
      
      const transformedBlog = BlogService.transformBlogFromAPI(apiBlog);
      
      // Try to enrich with author, but don't fail if it errors
      let enrichedBlog = transformedBlog;
      try {
        // Only try to enrich if we have a token
        const token = localStorage.getItem("accessToken");
        if (token && transformedBlog.authorId) {
          enrichedBlog = await BlogService.enrichBlogWithAuthor(transformedBlog);
        }
      } catch (authorError) {
        // Continue with transformed blog without author enrichment
        console.warn(`Could not enrich blog ${id} with author info:`, authorError);
      }
      
      return enrichedBlog;
    } catch (error) {
      console.error(`BlogService - Error getting blog ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create new blog
   * @param {Object} blogData - Blog data from UI (may contain imageFile)
   * @returns {Promise<Object>} Created blog in UI format
   */
  createBlog: async (blogData) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) setAuthToken(token);
      const apiData = BlogService.buildBlogPayload(blogData);
      const createdBlog = await BlogAPI.createBlog(apiData);
      return BlogService.transformBlogFromAPI(createdBlog);
    } catch (error) {
      console.error("BlogService - Error creating blog:", error);
      throw error;
    }
  },

  /**
   * Update blog
   * @param {number} id - Blog ID
   * @param {Object} blogData - Updated blog data from UI (may contain imageFile)
   * @returns {Promise<Object>} Updated blog in UI format
   */
  updateBlog: async (id, blogData) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) setAuthToken(token);
      const apiData = BlogService.buildBlogPayload(blogData);
      const updatedBlog = await BlogAPI.updateBlog(id, apiData);
      return BlogService.transformBlogFromAPI(updatedBlog);
    } catch (error) {
      console.error(`BlogService - Error updating blog ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete blog
   * @param {number} id - Blog ID
   * @returns {Promise} Delete confirmation
   */
  deleteBlog: async (id) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) setAuthToken(token);
      return await BlogAPI.deleteBlog(id);
    } catch (error) {
      console.error(`BlogService - Error deleting blog ${id}:`, error);
      throw error;
    }
  },

  /**
   * Approve blog
   * @param {number} id - Blog ID
   * @returns {Promise} Approve confirmation
   */
  approveBlog: async (id) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) setAuthToken(token);
      return await BlogAPI.approveBlog(id);
    } catch (error) {
      console.error(`BlogService - Error approving blog ${id}:`, error);
      throw error;
    }
  },

  /**
   * Reject blog
   * @param {number} id - Blog ID
   * @returns {Promise} Reject confirmation
   */
  rejectBlog: async (id) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) setAuthToken(token);
      return await BlogAPI.rejectBlog(id);
    } catch (error) {
      console.error(`BlogService - Error rejecting blog ${id}:`, error);
      throw error;
    }
  },

  /**
   * Comment Service Methods
   */

  /**
   * Transform API comment data to UI format
   * @param {Object} apiComment - Comment data from API
   * @returns {Object} Transformed comment object for UI
   */
  transformCommentFromAPI: (apiComment) => {
    if (!apiComment) return null;
    
    // API returns userId (lowercase u) - prioritize this
    const authorId = 
      apiComment.userId || 
      apiComment.UserId || 
      apiComment.authorId || 
      apiComment.AuthorId ||
      apiComment.userID ||
      apiComment.user_id ||
      "";
    
    return {
      id: apiComment.commentId || apiComment.id || apiComment.Id,
      postId: apiComment.postId || apiComment.PostId || apiComment.blogPostId,
      content: apiComment.content || apiComment.Content || "",
      authorId: authorId, // This should now get userId from API
      author: apiComment.author || apiComment.Author || apiComment.authorName || apiComment.AuthorName || "Unknown",
      createdDate: apiComment.createdDate ? formatDate1(apiComment.createdDate) : (apiComment.CreatedDate ? formatDate1(apiComment.CreatedDate) : ""),
      updatedDate: apiComment.updatedDate ? formatDate1(apiComment.updatedDate) : (apiComment.UpdatedDate ? formatDate1(apiComment.UpdatedDate) : ""),
    };
  },

  /**
   * Extract comment list from API response
   * @param {*} apiResponse
   * @returns {Array}
   */
  extractCommentList: (apiResponse) => {
    if (!apiResponse) return [];
    // Check for data array first (most common structure)
    if (Array.isArray(apiResponse.data)) return apiResponse.data;
    if (Array.isArray(apiResponse)) return apiResponse;
    if (Array.isArray(apiResponse.items)) return apiResponse.items;
    if (apiResponse.data && Array.isArray(apiResponse.data.items)) {
      return apiResponse.data.items;
    }
    return [];
  },

  /**
   * Get comments by post ID
   * @param {number|string} postId - Blog post ID
   * @returns {Promise<Array>} Array of comments in UI format
   */
  getCommentsByPostId: async (postId) => {
    try {
      const apiResponse = await BlogAPI.getCommentsByPostId(postId);
      const apiComments = BlogService.extractCommentList(apiResponse);
      
      // Debug: Log raw API response to see structure
      if (apiComments.length > 0) {
        console.log('Raw API comment:', apiComments[0]);
      }
      
      // Transform comments
      const transformedComments = apiComments
        .map((comment) => {
          const transformed = BlogService.transformCommentFromAPI(comment);
          // Debug: Log transformed comment
          console.log('Transformed comment:', transformed);
          return transformed;
        })
        .filter((comment) => comment !== null);

      // Try to enrich comments with author names
      const enrichedComments = await Promise.all(
        transformedComments.map(async (comment) => {
          try {
            const token = localStorage.getItem("accessToken");
            if (token && comment.authorId) {
              const userData = await getUserById(comment.authorId);
              if (userData) {
                const fullName =
                  userData.fullName ||
                  userData.FullName ||
                  userData.name ||
                  userData.Name;
                if (fullName) {
                  return { ...comment, author: fullName };
                }
              }
            }
            return comment;
          } catch (error) {
            // If enrichment fails, return comment without author name
            if (error.response?.status !== 404) {
              console.warn(`Could not enrich comment ${comment.id} with author:`, error.message);
            }
            return comment;
          }
        })
      );

      // Sort by createdDate descending (newest first)
      enrichedComments.sort((a, b) => {
        const dateA = a.createdDate ? new Date(a.createdDate) : new Date(0);
        const dateB = b.createdDate ? new Date(b.createdDate) : new Date(0);
        return dateB - dateA;
      });

      return enrichedComments;
    } catch (error) {
      console.error(`BlogService - Error getting comments for post ${postId}:`, error);
      throw error;
    }
  },

  /**
   * Create a new comment
   * @param {Object} commentData - Comment data
   * @param {number|string} commentData.postId - Blog post ID
   * @param {string} commentData.content - Comment content
   * @returns {Promise<Object>} Created comment in UI format
   */
  createComment: async (commentData) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Authentication required to create comment");
      }
      setAuthToken(token);

      const createdComment = await BlogAPI.createComment(commentData);
      return BlogService.transformCommentFromAPI(createdComment);
    } catch (error) {
      console.error("BlogService - Error creating comment:", error);
      throw error;
    }
  },

  /**
   * Update an existing comment
   * @param {number|string} commentId - Comment ID
   * @param {Object} commentData - Updated comment data
   * @param {string} commentData.content - Updated comment content
   * @returns {Promise<Object>} Updated comment in UI format
   */
  updateComment: async (commentId, commentData) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Authentication required to update comment");
      }
      setAuthToken(token);

      const updatedComment = await BlogAPI.updateComment(commentId, commentData);
      return BlogService.transformCommentFromAPI(updatedComment);
    } catch (error) {
      console.error(`BlogService - Error updating comment ${commentId}:`, error);
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

      return await BlogAPI.deleteComment(commentId);
    } catch (error) {
      console.error(`BlogService - Error deleting comment ${commentId}:`, error);
      throw error;
    }
  },
};

/**
 * Format time ago helper function
 * @param {Date} date - Date to format
 * @returns {string} Formatted time string
 */
function formatTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Vừa xong";
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 604800)} tuần trước`;
  return date.toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default BlogService;
