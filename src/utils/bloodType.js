// Blood Type mapping utility
export const getBloodTypeLabel = (bloodType) => {
  const bloodTypes = {
    0: "Không xác định",
    1: "A+",
    2: "A-",
    3: "B+",
    4: "B-",
    5: "AB+",
    6: "AB-",
    7: "O+",
    8: "O-",
  };
  return bloodTypes[bloodType] || "Không xác định";
};

export const bloodTypeOptions = [
  { value: 0, label: "Không xác định" },
  { value: 1, label: "A+" },
  { value: 2, label: "A-" },
  { value: 3, label: "B+" },
  { value: 4, label: "B-" },
  { value: 5, label: "AB+" },
  { value: 6, label: "AB-" },
  { value: 7, label: "O+" },
  { value: 8, label: "O-" },
];
