const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // React dev servers
  credentials: true
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// In-memory users (in production, use a database)
let users = [
  {
    id: 1,
    username: 'admin',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    role: 'admin'
  }
];

// Data file path
const DATA_FILE = path.join(__dirname, 'data.json');

// Function to read data from JSON file
const readDataFromFile = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data).entries || [];
    }
    return [];
  } catch (error) {
    console.error('Error reading data file:', error);
    return [];
  }
};

// Function to write data to JSON file
const writeDataToFile = (dataEntries) => {
  try {
    const data = { entries: dataEntries };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing data file:', error);
  }
};

// Initialize data from file
let dataEntries = readDataFromFile();

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Generate JWT token with 1 year expiration
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '1y' } // 1 year expiration
  );
};

// API endpoints only

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all data entries (protected)
app.get('/api/data', authenticateToken, (req, res) => {
  // Refresh data from file
  dataEntries = readDataFromFile();
  res.json(dataEntries);
});

// Search data entries (protected)
app.get('/api/data/search', authenticateToken, (req, res) => {
  const { nickname, discord, instagram } = req.query;
  
  // Refresh data from file
  dataEntries = readDataFromFile();
  let filteredData = dataEntries;

  if (nickname) {
    filteredData = filteredData.filter(entry => 
      entry.nickname && entry.nickname.toLowerCase().includes(nickname.toLowerCase())
    );
  }

  if (discord) {
    filteredData = filteredData.filter(entry => 
      entry.discord && entry.discord.toLowerCase().includes(discord.toLowerCase())
    );
  }

  if (instagram) {
    filteredData = filteredData.filter(entry => 
      entry.instagram && entry.instagram.toLowerCase().includes(instagram.toLowerCase())
    );
  }

  res.json(filteredData);
});

// Add new data entry (protected)
app.post('/api/data', authenticateToken, (req, res) => {
  try {
    const { code, nickname, status, instagram, discord, platform } = req.body;

    if (!code || !nickname || !status) {
      return res.status(400).json({ message: 'Code, nickname, and status are required' });
    }

    // Refresh data from file
    dataEntries = readDataFromFile();

    const newEntry = {
      id: dataEntries.length + 1,
      code,
      nickname,
      status,
      instagram: instagram || null,
      discord: discord || null,
      platform: platform || null
    };

    dataEntries.push(newEntry);
    writeDataToFile(dataEntries);
    res.status(201).json(newEntry);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Parse multi-line input and add multiple entries
app.post('/api/data/bulk', authenticateToken, (req, res) => {
  try {
    const { multiLineInput } = req.body;

    if (!multiLineInput) {
      return res.status(400).json({ message: 'Multi-line input is required' });
    }

    // Refresh data from file
    dataEntries = readDataFromFile();

    const lines = multiLineInput.split('\n').filter(line => line.trim());
    const newEntries = [];

    for (const line of lines) {
      const parts = line.split(' - ');
      
      // Determine format based on number of dashes
      const dashCount = (line.match(/-/g) || []).length;
      let category = dashCount === 2 ? 'klas' : '3dcim';
      
      if (parts.length >= 3) {
        const code = parts[0].trim();
        const nicknameAndStatus = parts[1].trim();
        const socialInfo = parts[2].trim();
        const platform = parts[3] ? parts[3].trim() : null;

        // Extract nickname and status
        const nicknameStatusMatch = nicknameAndStatus.match(/^(.+?)\s+(.+)$/);
        const nickname = nicknameStatusMatch ? nicknameStatusMatch[1].trim() : nicknameAndStatus;
        const status = nicknameStatusMatch ? nicknameStatusMatch[2].trim() : '';

        // Extract social media info
        let instagram = null;
        let discord = null;

        if (platform.includes('Instagram')) {
          instagram = socialInfo.replace('Instagram', '').trim();
        } else if (platform.includes('dc')) {
          discord = socialInfo.replace('dc', '').trim();
        }

        const newEntry = {
          id: dataEntries.length + newEntries.length + 1,
          code,
          nickname,
          status,
          instagram,
          discord,
          platform,
          category
        };

        newEntries.push(newEntry);
      }
    }

    dataEntries.push(...newEntries);
    writeDataToFile(dataEntries);
    res.status(201).json({ 
      message: `${newEntries.length} entries added successfully`,
      entries: newEntries 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
}); 