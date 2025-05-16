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

export { authenticate, redirectToMainPage };