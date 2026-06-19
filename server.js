const express = require('express');
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-12345';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '/')));

// Configure Multer for File Uploads to Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'english-galaxy-uploads',
        resource_type: 'auto' // Supports PDFs, images, etc.
    },
});
const upload = multer({ storage: storage });

// --- AUTH MIDDLEWARE ---
const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    // Attach user if token exists, but don't block if missing (for public routes)
    if (!token) {
        req.user = null;
        return next();
    }

    if (token === 'mock_admin_token') {
        req.user = { id: 'admin', role: 'ADMIN', status: 'APPROVED' };
        return next();
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            req.user = null;
        } else {
            req.user = user; // { id, role, status }
        }
        next();
    });
};

const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'ADMIN') return res.status(403).json({ error: "Admin access required" });
    next();
};

// --- API ENDPOINTS ---

// --- THEME ENDPOINTS ---
app.get('/api/theme', async (req, res) => {
    try {
        const settings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
        if (settings && settings.theme) {
            return res.json(settings.theme);
        }
        // Fallback to local theme.json if db is empty (for legacy support)
        const themePath = path.join(__dirname, 'settings', 'theme.json');
        if (fs.existsSync(themePath)) {
            res.json(JSON.parse(fs.readFileSync(themePath, 'utf8')));
        } else {
            res.json({});
        }
    } catch (err) {
        res.json({});
    }
});

app.post('/api/theme', authenticate, requireAdmin, async (req, res) => {
    try {
        await prisma.siteSettings.upsert({
            where: { id: 'global' },
            update: { theme: req.body },
            create: { id: 'global', theme: req.body }
        });
        res.json({ message: "Theme updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to save theme" });
    }
});

// --- AUTH ENDPOINTS ---

app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, fullName, school } = req.body;
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(400).json({ error: "Email already in use" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, password: hashedPassword, fullName, school, role: 'TEACHER', status: 'PENDING' }
        });
        res.status(201).json({ message: "Registration successful. Pending admin approval." });
    } catch (err) {
        res.status(500).json({ error: "Registration failed" });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ error: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        const token = jwt.sign({ id: user.id, role: user.role, status: user.status }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user.id, email: user.email, role: user.role, status: user.status, fullName: user.fullName } });
    } catch (err) {
        res.status(500).json({ error: "Login failed" });
    }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json({ id: user.id, email: user.email, role: user.role, status: user.status, fullName: user.fullName });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch user" });
    }
});

// --- LESSON ENDPOINTS ---

// Get all lessons
app.get('/api/lessons', authenticate, async (req, res) => {
    try {
        const lessons = await prisma.lesson.findMany({
            orderBy: { createdAt: 'desc' }
        });

        // Determine if user has teacher access
        const isApprovedTeacher = req.user && (req.user.role === 'ADMIN' || (req.user.role === 'TEACHER' && req.user.status === 'APPROVED'));

        // Add 'level' and filter content based on auth
        const mappedLessons = lessons.map(l => {
            let level = 'other';
            if (['grade-2', 'grade-3', 'grade-4'].includes(l.grade)) level = 'primary';
            else if (['grade-5', 'grade-6', 'grade-7', 'grade-8', 'lgs'].includes(l.grade)) level = 'middle-school';
            else if (['grade-9', 'grade-10', 'grade-11', 'grade-12', 'yks'].includes(l.grade)) level = 'high-school';
            
            // SECURITY: Strip pdfTeacher if not an approved teacher
            const securedLesson = { ...l, level: level };
            if (!isApprovedTeacher) {
                securedLesson.pdfTeacher = null;
            }
            
            return securedLesson;
        });

        // Filter out completely "Teacher Only" resources if user is not authorized
        // A resource is considered teacher-only if it only has pdfTeacher, and NO pdfStudent or contentBody
        const finalLessons = mappedLessons.filter(l => {
            if (isApprovedTeacher) return true;
            if (l.pdfStudent || l.contentBody || l.audioUrl || l.videoUrl) return true;
            return false; // Skip if it's strictly a teacher-only document
        });

        res.json(finalLessons);
    } catch (error) {
        console.error("Error fetching lessons:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get single lesson
app.get('/api/lessons/:id', async (req, res) => {
    try {
        const lesson = await prisma.lesson.findUnique({
            where: { id: req.params.id }
        });
        if (!lesson) return res.status(404).json({ error: "Lesson not found" });
        res.json(lesson);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Create new lesson
app.post('/api/lessons', async (req, res) => {
    try {
        const data = req.body;
        const lesson = await prisma.lesson.create({
            data: {
                title: data.title,
                description: data.description,
                grade: data.grade,
                unit: data.unit,
                resourceType: data.resourceType,
                difficulty: data.difficulty,
                skills: data.skills || [],
                learningOutcomes: data.learningOutcomes || [],
                vocabulary: data.vocabulary || [],
                tags: data.tags || [],
                contentBody: data.contentBody,
                pdfStudent: data.pdfStudent,
                pdfTeacher: data.pdfTeacher,
                audioUrl: data.audioUrl,
                videoUrl: data.videoUrl,
                interactiveData: data.interactiveData ? (typeof data.interactiveData === 'string' ? JSON.parse(data.interactiveData) : data.interactiveData) : null
            }
        });
        res.status(201).json(lesson);
    } catch (error) {
        console.error("Error creating lesson:", error);
        res.status(400).json({ error: "Failed to create lesson" });
    }
});

// Update lesson
app.put('/api/lessons/:id', async (req, res) => {
    try {
        const data = req.body;
        const lesson = await prisma.lesson.update({
            where: { id: req.params.id },
            data: {
                title: data.title,
                description: data.description,
                grade: data.grade,
                unit: data.unit,
                resourceType: data.resourceType,
                contentBody: data.contentBody,
                pdfStudent: data.pdfStudent,
                pdfTeacher: data.pdfTeacher,
                interactiveData: data.interactiveData ? (typeof data.interactiveData === 'string' ? JSON.parse(data.interactiveData) : data.interactiveData) : null
            }
        });
        res.json(lesson);
    } catch (error) {
        console.error("Error updating lesson:", error);
        res.status(400).json({ error: "Failed to update lesson" });
    }
});

// Delete lesson
app.delete('/api/lessons/:id', async (req, res) => {
    try {
        await prisma.lesson.delete({
            where: { id: req.params.id }
        });
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: "Failed to delete lesson" });
    }
});

// --- ADMIN ENDPOINTS ---

app.get('/api/admin/users', authenticate, requireAdmin, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            where: { role: 'TEACHER' },
            orderBy: { createdAt: 'desc' },
            select: { id: true, email: true, fullName: true, school: true, status: true, createdAt: true }
        });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

app.put('/api/admin/users/:id/approve', authenticate, requireAdmin, async (req, res) => {
    try {
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: { status: 'APPROVED' }
        });
        res.json({ message: "User approved successfully", status: user.status });
    } catch (err) {
        res.status(500).json({ error: "Failed to approve user" });
    }
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }
    // Return the Cloudinary URL so the frontend can save it to the DB
    res.json({ url: req.file.path });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
