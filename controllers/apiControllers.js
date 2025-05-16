import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/users.js';
import { generatePassword, sendEmail } from "../utils.js";

const secret = process.env.JWT_SECRET || 'mystrongsecretkey';

const registerUser = async (req, res) => {
    const { login, password, confirm_pass, fullname, email_address } = req.body;

    if (password !== confirm_pass) {
        return res.status(400).json({error: 'Passwords do not match'});
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const response = await User.save(login, hash, fullname, email_address);

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

const loginUser = async (req, res) => {
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

const remindPassword = async (req, res) => {
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

export { registerUser, loginUser, remindPassword }