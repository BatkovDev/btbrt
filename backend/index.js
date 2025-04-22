import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const SALT_ROUNDS = 10;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chat_app';

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Mongo connection error:', err));

// Schemas & Models
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true }, // Changed from 'name'
  password: { type: String, required: true },
});

const chatSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: String, required: true }, // Added
  message: { type: String, required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  timestamp: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
const Chat = mongoose.model('Chat', chatSchema);

  
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Почта и пароль обязательны' });
  try {
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ email, password: hashed });
    res.json({ id: user._id, email: user.email });
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ error: 'Почта уже используется' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Почта и пароль обязательны' });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Пользователь не найден' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ id: user._id, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/history', async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });
  try {
    const history = await Chat.find({ user: user_id })
      .sort({ timestamp: 1 })
      .select('message role sessionId timestamp')
      .exec();
    res.json(history.map(h => ({ id: h._id, message: h.message, role: h.role, sessionId: h.sessionId, timestamp: h.timestamp })));
  console.log('Saving chat:', { user_id, role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/chats', async (req, res) => {
  const { user_id, sessionId, message, role } = req.body;
  console.log('Saving chat:', { user_id, sessionId, message, role });
  if (!user_id || !sessionId || !message || !role) {
    return res.status(400).json({ error: 'user_id, sessionId, message, and role required' });
  }
  try {
    const chat = await Chat.create({ user: user_id, sessionId, message, role });
    return res.json({
      id: chat._id,
      user_id: chat.user,
      sessionId: chat.sessionId,
      message: chat.message,
      role: chat.role,
    });
  } catch (err) {
    console.error('Error saving chat:', err);
    return res.status(500).json({ error: err.message });
  }
});
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
