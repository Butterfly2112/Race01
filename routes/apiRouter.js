import express from 'express';
import multer from 'multer';
import * as apiController from "../controllers/apiControllers.js";
import { authenticate } from '../middleware/authentication.js';

const apiRouter = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const filter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb({error: 'You can only upload images'}, false);
    }
}

const upload = multer({ storage, filter });

apiRouter.post('/register', upload.none(), apiController.registerUser);
apiRouter.post('/login', upload.none(), apiController.loginUser);
apiRouter.post('/remind', upload.none(), apiController.remindPassword);
apiRouter.post('/profile_picture', authenticate, upload.single('file'), apiController.uploadPFP);
apiRouter.post('/logout', authenticate, apiController.logout);
apiRouter.post('/guest-login', upload.none(), apiController.guestLogin);

apiRouter.get('/user/me', authenticate, apiController.getMe);
apiRouter.get('/profile_picture', authenticate, apiController.getPFP);

export default apiRouter;