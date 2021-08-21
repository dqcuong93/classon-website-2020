const isProduction = () => process.env.NODE_ENV === 'production';
const dotenv = require('dotenv');
const path = require('path');
if (isProduction()) {
    dotenv.config({
        path: path.resolve(__dirname, '.env.production')
    })
} else {
    dotenv.config();
}

const session = require('express-session');
const bodyParser = require('body-parser');
const nodemailer = require("nodemailer");
const favicon = require('serve-favicon');
const express = require('express');
const csurf = require('csurf');

const app = express();

const { createLMSUser } = require('./lib/app');
const { createClassonUser } = require('./lib/api');

const parseJson = bodyParser.json();
const parseUrlencoded = bodyParser.urlencoded({ extended: true });
const parseBody = [parseJson, parseUrlencoded];

const csrfProtection = csurf();

const sessionConfig = {
    secret: 'Cl@sson 2020',
    resave: false,
    saveUninitialized: false
}

const transport = nodemailer.createTransport({
    host: 'in-v3.mailjet.com',
    port: 587,
    // debug: true,
    // logger: true,
    // secure: false,
    // requireTLS: true,
    auth: {
       user: 'fb78f84ef21d11b5aef261244b429f39',
       pass: '95610efff65a139e799015bcc2a9d0a1'
    },
    // tls: {
    //     ciphers: 'SSLv3'
    // }
})

const sendMail = (name, phone, email, subject, message) => {
    const messageDetail = {
        from: 'mail@classon.edu.vn',
        to: 'duc.trinh@classon.edu.vn,cuong.dao@classon.edu.vn,viet.nguyen@classon.edu.vn',
        subject: 'You got a new contact from ClassOn website.',
        text: `Name: ${name}.\nPhone: ${phone}.\nEmail: ${email}.\nSubject: ${subject}.\nMessage: ${message}`
    }
    return new Promise((resolve, reject) => {
        transport.sendMail(messageDetail, function (err, data) {
            if (err) {
                console.log('Failed to send mail:', err);
                reject(err);
            } else {
                console.log('Successfully sent a contact.');
                resolve(data);
            }
        })
    })
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));
app.use('/static', express.static(path.join(__dirname, 'public')));

app.use(session(sessionConfig));
app.use(function (req, res, next) {
    res.locals.lang = req.session.lang;
    next();
})
app.use(parseBody);

const configData = {
    signin_url: process.env.APP_URL,
    registration_url: '/register'
}

app.get('/', (req, res) => {
    if (req.session.lang === 'en') {
        res.render('pages/index_en', configData);
    } else {
        res.render('pages/index', configData);
    }
})

app.get('/register/:package', csrfProtection, (req, res) => {
    let packageName;
    if (req.session.lang === 'en') {
        packageName = req.params.package &&
            (req.params.package.charAt(0).toUpperCase() + req.params.package.slice(1))
    } else if (req.params.package) {
        switch (req.params.package) {
            case 'starter':
                packageName = 'Khởi Đầu';
                break;
            case 'advanced':
                packageName = 'Nâng Cao';
                break;
            case 'pro':
                packageName = 'Chuyên Nghiệp';
                break;
            case 'scale':
                packageName = 'Mở rộng';
                break;
        }
    }
    
    res.render('pages/register', Object.assign({}, configData, {
        csrfToken: req.csrfToken(),
        package: req.params.package,
        packageName
    }))
})

app.post('/register', parseBody, csrfProtection, async (req, res) => {
    const data = req.body;
    const firstName = data.firstname;
    const lastName = data.lastname;
    const email = data.email.toLowerCase();
    const password = data.password.trim();
    const phoneNumber = data.phone;
    const package = data.package;

    let alert;
    let message;

    if (password.length < 8) {
        alert = 'error';
        message = req.session.lang === 'en' ?
            'The password must be at least 8 characters.' :
            'Mật khẩu phải có ít nhất 8 ký tự trở lên.'
    } else {
        const fullName = [firstName, lastName].join(' ');
        try {
            const lmsUser = await createLMSUser(fullName, email, password);
            console.log('lmsUser:', lmsUser);
            if (lmsUser.id) {
                const classonUser = await createClassonUser(firstName, lastName,
                    email, password, phoneNumber, parseInt(lmsUser.id), package);
                console.log('classonUser:', classonUser);
                alert = 'success';
            }
        } catch (err) {
            console.log('[ERROR]', err);
        }
    
        if (alert === 'success') {
            message = req.session.lang === 'en' ?
                'Successfully registered your account.' :
                'Đã đăng ký thành công tài khoản của bạn.'
        } else {
            alert = 'error';
            message = req.session.lang === 'en' ?
                'Failed to create account.' :
                'Không tạo được tài khoản.'
        }
    }

    res.json({
        alert,
        message
    })
})

app.get('/thank_you', (req, res) => {
    res.render('pages/thank_you', configData);
})

app.get('/lang/:lang', (req, res) => {
    req.session.lang = req.params.lang;
    res.redirect('/');
})

app.post('/contact', async (req, res) => {
    const data = req.body;
    const lang = data.lang;
    const name = data.name && data.name.trim();
    const phone = data.phone && data.phone.trim();
    const email = data.email && data.email.trim();
    const subject = data.subject && data.subject.trim();
    const message = data.message && data.message.trim();

    let returnBack;
    let messageContent;
    if (name && email && subject && message) {
        try {
            await sendMail(name, phone, email, subject, message);
            returnBack = 'success';
            messageContent = lang === 'en' ?
                'Thank you for contact, we will get back to you ASAP.' :
                'Cám ơn bạn đã liên hệ, chúng tôi sẽ phản hồi cho bạn trong thời gian sớm nhất.'
        } catch (err) {
        }
    }

    if (returnBack !== 'success') {
        returnBack = 'error';
        messageContent = lang === 'en' ?
            'Failed to process your information.' :
            'Có lỗi xảy ra khi xử lý thông tin bạn cung cấp.'
    }

    res.json({
        alert: returnBack,
        message: messageContent
    })
})

app.use(function (err, req, res, next) {
    if (err.code !== 'EBADCSRFTOKEN') {
        return next(err);
    }
    res.status(403).json({
        error: 'Session has been expired or tampered with.'
    })
})

const port = process.env.PORT;
app.listen(port, () => console.log(`ClassOn is listening on port: ${port}`));