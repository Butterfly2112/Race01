import express from 'express';
import path from 'path';
import { __dirname } from "../utils.js";
import { authenticate, redirectToMainPage } from '../middleware/authentication.js';

const pageRouter = express.Router();

pageRouter.get('/', redirectToMainPage, (req, res) => {
    res.sendFile(path.join(__dirname, '/views/landing_page.html'));
});

pageRouter.get('/main_page', authenticate, (req, res) => {
    res.sendFile(path.join(__dirname, '/views/main_page.html'));
});

pageRouter.get('/registration', redirectToMainPage, (req, res) => {
    res.sendFile(path.join(__dirname, '/views/registration.html'));
});

pageRouter.get('/login', redirectToMainPage, (req, res) => {
    res.sendFile(path.join(__dirname, '/views/login.html'));
});

pageRouter.get('/remind_password', redirectToMainPage, (req, res) => {
    res.sendFile(path.join(__dirname, '/views/remind_password.html'));
});

pageRouter.get('/lobby', authenticate, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'lobby.html'));
});

pageRouter.get('/room', authenticate, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'room.html'));
});

export default pageRouter;