type AuthType = "user" | "owner";

export const authStorage = {
  setAuth: (type: AuthType, data: any) => {
    if (data) {
      localStorage.setItem(`auth_${type}`, JSON.stringify(data));
    } else {
      localStorage.removeItem(`auth_${type}`);
    }
  },

  getAuth: (type: AuthType) => {
    try {
      const data = localStorage.getItem(`auth_${type}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error parsing auth data for ${type}:`, error);
      return null;
    }
  },

  clearAuth: (type: AuthType) => {
    localStorage.removeItem(`auth_${type}`);
  },

  clearAll: () => {
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_owner");
  },
};
