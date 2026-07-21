import {
  createInstrument,
  deleteInstrumentByCode,
  getInstrumentByCode,
  getInstrumentById,
  getInstruments,
  updateInstrumentByCode,
} from "../apis/InstrumentAPI.jsx";

const formatError = (error) => {
  if (!error) return new Error("Đã có lỗi không xác định.");
  const message =
    error?.response?.data?.message ||
    error?.message ||
    "Không thể thực hiện thao tác. Vui lòng thử lại.";
  return new Error(message);
};

const normalizeListResponse = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;

  const candidateKeys = ["items", "content", "data", "results"];
  for (const key of candidateKeys) {
    const value = payload?.[key];
    if (Array.isArray(value)) return value;
    // Check nested standard wrapper (e.g., payload.data.items)
    if (value && typeof value === 'object') {
       for (const subKey of candidateKeys) {
          if (Array.isArray(value[subKey])) return value[subKey];
       }
    }
  }

  // Fall back to the first array value inside the object, if any
  const firstArrayValue = Object.values(payload || {}).find(Array.isArray);
  return Array.isArray(firstArrayValue) ? firstArrayValue : [];
};

/**
 * Helper function to build full image URL for instrument
 * @param {string} imagePath - Image path from API (can be relative or absolute)
 * @returns {string} Full image URL
 */
const buildInstrumentImageUrl = (imagePath) => {
  if (!imagePath || imagePath.trim() === "") return "";

  const trimmedPath = imagePath.trim();
  const baseURL = "http://localhost:8080";

  // If already a full URL (starts with http:// or https://), return as is
  if (trimmedPath.startsWith("http://") || trimmedPath.startsWith("https://")) {
    // If URL already contains /instrument/Images/, check if filename needs encoding
    if (trimmedPath.includes("/instrument/Images/")) {
      const urlParts = trimmedPath.split("/instrument/Images/");
      if (urlParts.length === 2 && urlParts[1]) {
        const filename = urlParts[1];
        // Only encode if not already encoded (check for % which indicates encoding)
        if (!filename.includes("%")) {
          const encodedFilename = encodeURIComponent(filename);
          return `${urlParts[0]}/instrument/Images/${encodedFilename}`;
        }
      }
    }
    return trimmedPath;
  }

  // Check if path already contains /instrument/Images/ (without http://)
  // This handles cases where backend returns path like "/instrument/Images/filename.jpg"
  // Must check BEFORE other checks to avoid double processing
  if (trimmedPath.includes("/instrument/Images/")) {
    const parts = trimmedPath.split("/instrument/Images/");
    if (parts.length === 2 && parts[1]) {
      const filename = parts[1];
      // Only encode if not already encoded
      if (!filename.includes("%")) {
        const encodedFilename = encodeURIComponent(filename);
        return `${baseURL}/instrument/Images/${encodedFilename}`;
      }
      return `${baseURL}/instrument/Images/${filename}`;
    }
    // If split didn't work as expected, try to extract filename from end
    const lastSlashIndex = trimmedPath.lastIndexOf("/");
    if (lastSlashIndex > 0) {
      const filename = trimmedPath.substring(lastSlashIndex + 1);
      if (filename && !filename.includes("%")) {
        const encodedFilename = encodeURIComponent(filename);
        return `${baseURL}/instrument/Images/${encodedFilename}`;
      }
    }
  }

  // Helper to encode only the filename (last part) while preserving path structure
  const encodePathFilename = (path) => {
    const parts = path.split("/");
    if (parts.length > 0 && parts[parts.length - 1]) {
      // Encode only the filename (last part)
      parts[parts.length - 1] = encodeURIComponent(parts[parts.length - 1]);
      return parts.join("/");
    }
    return path;
  };

  // Handle /images/instruments/... paths - convert to /instrument/Images/...
  // Backend may return /images/instruments/... but serve from /instrument/Images/...
  // Example: "/images/instruments/5fbbdba3-2d1c-45d4-a9d8-750045e447fb_file.jpg"
  // Result: "http://localhost:8080/instrument/Images/5fbbdba3-2d1c-45d4-a9d8-750045e447fb_file.jpg"
  if (trimmedPath.startsWith("/images/instruments/")) {
    const imageFileName = trimmedPath.replace("/images/instruments/", "");
    const encodedFileName = encodeURIComponent(imageFileName);
    return `${baseURL}/instrument/Images/${encodedFileName}`;
  }

  // Handle images/instruments/... (without leading slash)
  if (trimmedPath.startsWith("images/instruments/")) {
    const imageFileName = trimmedPath.replace("images/instruments/", "");
    const encodedFileName = encodeURIComponent(imageFileName);
    return `${baseURL}/instrument/Images/${encodedFileName}`;
  }

  // If starts with /Images/ or /images/, convert to /instrument/Images/...
  if (
    trimmedPath.startsWith("/Images/") ||
    trimmedPath.startsWith("/images/")
  ) {
    const imageFileName = trimmedPath.replace(/^\/[Ii]mages\//, "");
    const encodedFileName = encodeURIComponent(imageFileName);
    return `${baseURL}/instrument/Images/${encodedFileName}`;
  }

  // If path starts with "Images/", append directly to /instrument/
  // Example: "Images/f4a44ab4-81cf-47de-9555-d67ccf02fbb1.jpg"
  // Result: http://localhost:8080/instrument/Images/f4a44ab4-81cf-47de-9555-d67ccf02fbb1.jpg
  if (trimmedPath.startsWith("Images/")) {
    // Extract filename and encode it
    const imageFileName = trimmedPath.replace("Images/", "");
    const encodedFileName = encodeURIComponent(imageFileName);
    return `${baseURL}/instrument/Images/${encodedFileName}`;
  }

  // If starts with /instrument/, encode the filename part
  if (trimmedPath.startsWith("/instrument/")) {
    const pathAfterInstrument = trimmedPath.replace("/instrument/", "");
    const encodedPath = encodePathFilename(pathAfterInstrument);
    return `${baseURL}/instrument/${encodedPath}`;
  }

  // If starts with /, encode the filename part
  if (trimmedPath.startsWith("/")) {
    const pathWithoutSlash = trimmedPath.substring(1);
    const encodedPath = encodePathFilename(pathWithoutSlash);
    return `${baseURL}/${encodedPath}`;
  }

  // Otherwise, assume it's just a filename and try common paths
  // Encode the filename to handle spaces and special characters
  const encodedPath = encodeURIComponent(trimmedPath);
  return `${baseURL}/instrument/Images/${encodedPath}`;
};

const mapInstrumentShape = (instrument = {}) => {
  const code =
    instrument.code ??
    instrument.instrumentCode ??
    instrument.InstrumentCode ??
    "";
  const machineStatus =
    instrument.machineStatus ??
    instrument.status ??
    instrument.Status ??
    instrument.MachineStatus ??
    "ACTIVE";

  // Lấy reagentStatus từ nhiều nguồn có thể
  const rawReagentStatus =
    instrument.reagentStatus ??
    instrument.reagent_status ??
    instrument.ReagentStatus ??
    instrument.Reagent_Status;

  const reagentStatus = rawReagentStatus ?? "FULL";

  // Get image path from various possible fields
  const rawImagePath =
    instrument.imagePath ||
    instrument.ImagePath ||
    instrument.imageUrl ||
    instrument.ImageUrl ||
    "";
  const imageUrl = buildInstrumentImageUrl(rawImagePath);

  return {
    ...instrument,
    code,
    instrumentCode: code,
    machineStatus,
    status: machineStatus,
    reagentStatus,
    imageUrl: imageUrl, // Add built image URL
    imagePath: rawImagePath, // Keep original path for reference
  };
};

const buildInstrumentPayload = (
  { code, name, status, reagentStatus, imageFile },
  isUpdate = false
) => {
  // Khi update, luôn sử dụng FormData (API expect multipart/form-data)
  // Khi create, sử dụng FormData nếu có file, JSON nếu không có file
  if (isUpdate || imageFile instanceof File) {
    const formData = new FormData();
    // Chỉ gửi code khi tạo mới, không gửi khi update (vì đã có trong URL)
    // Backend expect PascalCase: InstrumentCode, Name, Status, ReagentStatus, Image
    if (code && !isUpdate) {
      formData.append("InstrumentCode", code);
    }
    if (name) {
      formData.append("Name", name);
    }
    if (typeof status !== "undefined") {
      // Backend expect enum (số), gửi số trực tiếp
      formData.append("Status", String(status));
    }
    if (typeof reagentStatus !== "undefined" && reagentStatus !== null) {
      formData.append("ReagentStatus", String(reagentStatus));
    }
    // Chỉ append Image nếu có file mới
    if (imageFile instanceof File) {
      formData.append("Image", imageFile);
    }
    // Nếu update mà không có file mới, không gửi field Image (backend sẽ giữ nguyên ảnh cũ)

    return formData;
  }

  // Nếu create và không có file, sử dụng JSON
  const payload = {};
  if (code) payload.InstrumentCode = code;
  if (name) payload.Name = name;
  if (typeof status !== "undefined") payload.Status = status;
  if (typeof reagentStatus !== "undefined" && reagentStatus !== null) {
    payload.ReagentStatus = reagentStatus;
  }
  if (typeof imageFile === "string" && imageFile) {
    payload.ImagePath = imageFile;
  }

  return payload;
};

const InstrumentService = {
  async list(params = {}) {
    try {
      const data = await getInstruments(params);
      const items = normalizeListResponse(data).map(mapInstrumentShape);

      // Trả về cả dữ liệu và thông tin phân trang
      return {
        items,
        totalPages: data?.totalPages || 1,
        totalElements: data?.totalElements || items.length,
        currentPage: data?.currentPage || params.page || 1,
        pageSize: data?.pageSize || params.pageSize || 10,
      };
    } catch (error) {
      throw formatError(error);
    }
  },

  async getById(id) {
    try {
      return await getInstrumentById(id);
    } catch (error) {
      throw formatError(error);
    }
  },

  async getByCode(code) {
    try {
      const instrument = await getInstrumentByCode(code);
      // Map the instrument to ensure imageUrl is built correctly
      return mapInstrumentShape(instrument);
    } catch (error) {
      throw formatError(error);
    }
  },

  async create(payload) {
    try {
      const jsonPayload = buildInstrumentPayload(payload);
      return await createInstrument(jsonPayload);
    } catch (error) {
      throw formatError(error);
    }
  },

  async update(code, payload) {
    try {
      const builtPayload = buildInstrumentPayload({ ...payload, code }, true);
      return await updateInstrumentByCode(code, builtPayload);
    } catch (error) {
      throw formatError(error);
    }
  },

  async remove(code) {
    try {
      return await deleteInstrumentByCode(code);
    } catch (error) {
      throw formatError(error);
    }
  },
};

export default InstrumentService;
