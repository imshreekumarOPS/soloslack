const express = require('express');
const router = express.Router();
const multer = require('multer');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { r2Client, bucketName, publicUrl } = require('../config/storage');
const File = require('../models/File');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    }
});

router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const file = req.file;
        const key = `${Date.now()}-${file.originalname}`;
        
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        });

        await r2Client.send(command);

        const fileUrl = `${publicUrl}/${key}`;

        const newFile = new File({
            name: file.originalname,
            url: fileUrl,
            key: key,
            mimeType: file.mimetype,
            size: file.size,
            workspaceId: req.body.workspaceId || null,
            noteId: req.body.noteId || null
        });

        await newFile.save();

        res.status(201).json(newFile);
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const query = {};
        if (req.query.workspaceId) query.workspaceId = req.query.workspaceId;
        if (req.query.noteId) query.noteId = req.query.noteId;

        const files = await File.find(query).sort({ createdAt: -1 });
        res.json(files);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching files', error: error.message });
    }
});

module.exports = router;
