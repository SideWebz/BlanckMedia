const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const usersFile = path.join(__dirname, '../data/users.json');

// Read users from JSON file
const readUsers = () => {
  try {
    const data = fs.readFileSync(usersFile, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

// Write users to JSON file
const writeUsers = (users) => {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
};

// Get all users
const getAllUsers = () => {
  return readUsers();
};

// Add a new user
const addUser = (username, firstName, lastName, password, isAdmin = false, callback) => {
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) return callback(err);

    const users = readUsers();
    const newUser = {
      id: Date.now(),
      username,
      firstName,
      lastName,
      password: hashedPassword,
      role: isAdmin ? 'admin' : 'user',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeUsers(users);
    callback(null, newUser);
  });
};

// Find user by username
const findUserByUsername = (username) => {
  const users = readUsers();
  return users.find(u => u.username === username);
};

// Delete a user by ID
const deleteUser = (id) => {
  const users = readUsers();
  const filtered = users.filter(u => u.id !== parseInt(id));
  writeUsers(filtered);
  return filtered;
};

// Check if user is admin
const isUserAdmin = (userId) => {
  const users = readUsers();
  const user = users.find(u => u.id === parseInt(userId));
  return user && user.role === 'admin';
};

// Get user by ID
const getUserById = (userId) => {
  const users = readUsers();
  return users.find(u => u.id === parseInt(userId));
};

module.exports = {
  getAllUsers,
  addUser,
  deleteUser,
  findUserByUsername,
  isUserAdmin,
  getUserById
};
