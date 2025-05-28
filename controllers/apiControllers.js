import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import User from '../models/users.js';
import { generatePassword, sendEmail } from "../utils.js";

const secret = process.env.JWT_SECRET || 'mystrongsecretkey';

export const guests = new Map();

export const registerUser = async (req, res) => {
    const { login, password, confirm_pass, email_address } = req.body;

    if (password !== confirm_pass) {
        return res.status(400).json({error: 'Passwords do not match'});
    }

    if (guests.get(login) !== undefined) {
        return res.status(400).json({error: 'User already exists'});
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const response = await User.save(login, hash, email_address);

        if (response.error_code) {
            return res.status(400).json({error: response.error_message});
        }

        const token = jwt.sign({login}, secret, {expiresIn: '1h'});
        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            maxAge: 3600000
        });

        res.redirect(302, '/main_page');
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const loginUser = async (req, res) => {
    const { login, password } = req.body;

    try {
        const response = await User.find(login);

        if (response.error_code) {
            return res.status(400).json({error: 'Invalid credentials'});
        }

        const isValid = await bcrypt.compare(password, response.password);

        if (!isValid) {
            return res.status(400).json({error: 'Invalid credentials'});
        }

        const token = jwt.sign({login}, secret, {expiresIn: '1h'});

        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            maxAge: 3600000
        });

        res.redirect(302, '/main_page');
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const remindPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const response = await User.findByEmail(email);

        if (!response.user) {
            return res.status(400).json({error: 'Email not found'});
        }

        const password = generatePassword();
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const success = await User.updatePassword(email, hash);
        if (!success) {
            return res.status(400).json({error: 'Error changing password'});
        }

        await sendEmail(email, password);

        res.status(200).send();
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const logout = (req, res) => {
    const { login } = req.login;

    if (guests.get(login) !== undefined) {
        guests.delete(login);
    }

    res.clearCookie('token');
    res.status(200).send();
}

export const getMe = (req, res) => {
    const { login } = req.login;
    res.json({ login: login });
}

export const uploadPFP = async (req, res) => {
    const { login } = req.login;
    const file = req.file;

    try {
        const response = await User.getPFP(login);
        if (response && response.profile_picture && response.profile_picture !== './uploads/default.png') {
            await fs.unlink(response.profile_picture);
        }

        await User.savePFP(login, file.destination + '/' + file.filename)
        res.status(200).send();
    }
    catch (err) {
        console.log(err);
    }
}

export const getPFP = async (req, res) => {
    let { login } = req.login;
    if (req.query.login) {
        login = req.query.login;
    }

    try {
        const response = await User.getPFP(login);
        if (response) {
            res.status(200).json({ pfpUrl: response.profile_picture });
        }
        else {
            res.status(200).json({ pfpUrl: './uploads/default.png' });
        }
    }
    catch (err) {
        console.log(err);
    }
}

export const guestLogin = async (req, res) => {
    const { login } = req.body;

    try {
        const response = await User.find(login);

        if (guests.get(login) !== undefined) {
            return res.status(200).send({error: 'This account already exists'});
        }

        if (response.error_code === 'USER_NOT_FOUND') {
            const token = jwt.sign({ login }, secret, {expiresIn: '1h'});

            res.cookie('token', token, {
                httpOnly: true,
                secure: false,
                maxAge: 3600000
            });

            guests.set(login, '');
            res.status(200).json({success: true});
        }
        else {
            res.status(200).json({error: 'This account already exists'});
        }
    }
    catch (err) {
        console.log(err);
    }
}