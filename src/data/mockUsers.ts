export interface MockUser {
  email: string;
  password: string;
  role: 'admin' | 'instructor';
  name: string;
}

export const mockUsers: MockUser[] = [
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

/**
 * Simulate authentication against mock users.
 * Returns the matched user or null if credentials are invalid.
 */
export const authenticateUser = (
  email: string,
  password: string
): MockUser | null => {
  return (
    mockUsers.find(
      (user) => user.email === email && user.password === password
    ) ?? null
  );
};
