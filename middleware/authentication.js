import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'mystrongsecretkey';

const authenticate = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.redirect(302, '/registration');

    jwt.verify(token, secret, (err, login) => {
        if (err) return res.redirect(302, '/registration');

        req.login = login;
        next();
    });
}

const redirectToMainPage = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return next();

    jwt.verify(token, secret, (err, login) => {
        if (!err) return res.redirect(302, '/main_page');

        req.login = login;
        next();
    });
}

const authenticateSocket = (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.cookie?.match(/token=([^;]+)/)?.[1];

    if (!token) {
        return next(new Error("Authentication error: No token provided"));
    }

    jwt.verify(token, 'mystrongsecretkey', (err, decoded) => {
        if (err) {
            return next(new Error("Authentication error: Invalid token"));
        }

        socket.user = decoded;
        next();
    });
};

export { authenticate, redirectToMainPage, authenticateSocket };