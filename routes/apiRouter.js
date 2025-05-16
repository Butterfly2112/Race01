import express from 'express';
import multer from 'multer';
import { registerUser, loginUser, remindPassword } from "../controllers/apiControllers.js";

const apiRouter = express.Router();
const upload = multer();

apiRouter.post('/register', upload.none(), registerUser);
apiRouter.post('/login', upload.none(), loginUser);
apiRouter.post('/remind', upload.none(), remindPassword);

apiRouter.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.status(200).send();
});

export default apiRouter;