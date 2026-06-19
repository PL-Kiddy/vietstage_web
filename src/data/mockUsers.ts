export interface MockUser {
  email: string;
  password: string;
  role: 'admin' | 'instructor' | 'learner';
  name: string;
}

const defaultUsers: MockUser[] = [
  {
    email: 'admin@fpt.edu.vn',
    password: '123456',
    role: 'admin',
    name: 'Quản trị viên',
  },
  {
    email: 'instructor@fpt.edu.vn',
    password: '123456',
    role: 'instructor',
    name: 'Giảng viên',
  },
];

export const getMockUsers = (): MockUser[] => {
  const saved = localStorage.getItem('vietstage_mock_users');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Error parsing mock users:', e);
    }
  }
  return defaultUsers;
};

export let mockUsers: MockUser[] = getMockUsers();

/**
 * Register a new user in localStorage.
 * Returns true if successful, false if the email is already registered.
 */
export const registerUser = (user: MockUser): boolean => {
  const currentUsers = getMockUsers();
  if (currentUsers.some((u) => u.email.toLowerCase() === user.email.toLowerCase())) {
    return false;
  }
  const updated = [...currentUsers, user];
  localStorage.setItem('vietstage_mock_users', JSON.stringify(updated));
  mockUsers = updated;
  return true;
};

/**
 * Simulate authentication against mock users.
 * Returns the matched user or null if credentials are invalid.
 */
export const authenticateUser = (
  email: string,
  password: string
): MockUser | null => {
  const currentUsers = getMockUsers();
  return (
    currentUsers.find(
      (user) => user.email.toLowerCase() === email.toLowerCase() && user.password === password
    ) ?? null
  );
};

/**
 * Reset a user's password in the localStorage mock database.
 */
export const resetUserPassword = (
  email: string,
  newPassword: string
): boolean => {
  const currentUsers = getMockUsers();
  const index = currentUsers.findIndex(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
  if (index === -1) return false;
  currentUsers[index].password = newPassword;
  localStorage.setItem('vietstage_mock_users', JSON.stringify(currentUsers));
  return true;
};
