import express from 'express';
import multer from 'multer';
import { registerUser, loginUser, remindPassword } from "../controllers/apiControllers.js";
import { authenticate } from '../middleware/authentication.js'; // Import the authenticate middleware

const apiRouter = express.Router();
const upload = multer();

apiRouter.post('/register', upload.none(), registerUser);
apiRouter.post('/login', upload.none(), loginUser);
apiRouter.post('/remind', upload.none(), remindPassword);

apiRouter.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.status(200).send();
});

// new GET-endpoint
apiRouter.get('/user/me', authenticate, (req, res) => {
    if (req.login && req.login.login) {
        res.json({ login: req.login.login });
    }
    else {
        res.status(401).json({ error: 'Not authenticated or user data missing' });
    }
});

export default apiRouter;