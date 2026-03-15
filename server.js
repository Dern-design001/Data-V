require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create uploads directory
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Set up Multer for form data file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
    }
});
const upload = multer({ storage: storage });

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/datav')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB...', err));

// Schema & Model
const dataItemSchema = new mongoose.Schema({
    name: String,
    image: String
});

const topicSchema = new mongoose.Schema({
    name: String,
    dataItems: [dataItemSchema]
});

const Topic = mongoose.model('Topic', topicSchema);

// Routes
// 1. Get all topics
app.get('/api/topics', async (req, res) => {
    try {
        const topics = await Topic.find();
        const formattedTopics = topics.map(t => ({
            id: t._id.toString(),
            name: t.name,
            dataItems: t.dataItems.map(d => ({
                id: d._id.toString(),
                name: d.name,
                image: d.image
            }))
        }));
        res.json(formattedTopics);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. Add a new topic
app.post('/api/topics', async (req, res) => {
    try {
        const topic = new Topic({
            name: req.body.name,
            dataItems: []
        });
        const savedTopic = await topic.save();
        res.status(201).json({
            id: savedTopic._id.toString(),
            name: savedTopic.name,
            dataItems: []
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 3. Delete a topic
app.delete('/api/topics/:id', async (req, res) => {
    try {
        await Topic.findByIdAndDelete(req.params.id);
        res.json({ message: 'Topic deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 4. Add data to a topic
app.post('/api/topics/:id/data', upload.single('image'), async (req, res) => {
    try {
        const topic = await Topic.findById(req.params.id);
        if (!topic) return res.status(404).json({ message: 'Topic not found' });
        if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

        const newDataItem = {
            name: req.body.name,
            image: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
        };
        topic.dataItems.push(newDataItem);
        await topic.save();
        
        const newestItem = topic.dataItems[topic.dataItems.length - 1];
        res.status(201).json({
            id: newestItem._id.toString(),
            name: newestItem.name,
            image: newestItem.image
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 5. Delete data from a topic
app.delete('/api/topics/:topicId/data/:dataId', async (req, res) => {
    try {
        const topic = await Topic.findById(req.params.topicId);
        if (!topic) return res.status(404).json({ message: 'Topic not found' });

        topic.dataItems = topic.dataItems.filter(item => item._id.toString() !== req.params.dataId);
        await topic.save();
        
        res.json({ message: 'Data item deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
