const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const usersEnvFile = path.join(__dirname, '../users.env');

// Read users from users.env file
const readUsers = () => {
  try {
    const data = fs.readFileSync(usersEnvFile, 'utf8');
    const lines = data.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    return lines.map(line => {
      const parts = line.split('|');
      if (parts.length < 7) return null;
      return {
        id: parseInt(parts[0]),
        username: parts[1],
        firstName: parts[2],
        lastName: parts[3],
        password: parts[4],
        role: parts[5],
        createdAt: parts[6]
      };
    }).filter(u => u !== null);
  } catch (err) {
    return [];
  }
};

// Write users to users.env file
const writeUsers = (users) => {
  const lines = ['# User credentials stored in format: id|username|firstName|lastName|hashedPassword|role|createdAt'];
  users.forEach(u => {
    lines.push(`${u.id}|${u.username}|${u.firstName}|${u.lastName}|${u.password}|${u.role}|${u.createdAt}`);
  });
  fs.writeFileSync(usersEnvFile, lines.join('\n') + '\n');
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
