const fetch = require("node-fetch");

const ROOT_URL = [process.env.APP_URL, 'api/v1'].join('/');
const USER_API = [ROOT_URL, 'accounts', process.env.CLASSON_ACCOUNT, 'users'].join('/');

const COMMON_HEADERS = {
    "Accept": "application/json+canvas-string-ids",
    "Content-Type": "application/json",
    "Authorization": ["Bearer", process.env.APP_SYSTEM_TOKEN].join(' ')
}

const createLMSUser = async (name, email, password) => {
    const data = {
        user: {
            name,
            terms_of_use: true,
            skip_registration: true
        },
        pseudonym: {
            unique_id: email,
            password,
            send_confirmation: true
        },
        communication_channel: {
            skip_confirmation: true
        },
        force_validations: true
    }
    const res = await fetch(USER_API, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: COMMON_HEADERS
    })
    return await res.json();
}

module.exports = {
    createLMSUser
}