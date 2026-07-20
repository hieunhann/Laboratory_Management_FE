import { useMemo } from "react";

export function usePermission() {
  const perms = useMemo(() => {
    const perm = localStorage.getItem("permissions");
    return perm ? JSON.parse(perm) : [];
  }, []);

  const can = (key) => perms.includes(key);
  return { can };
}
