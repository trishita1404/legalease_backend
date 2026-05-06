const jwt = require('jsonwebtoken');

class TokenHelper {
    // Generate Access Token (Short lived - 15 mins)
    static EncodeAccessToken(email, user_id, role) {
        let KEY = process.env.JWT_ACCESS_KEY;
        let EXPIRE = { expiresIn: process.env.JWT_ACCESS_EXPIRE };
        let PAYLOAD = { email, user_id, role };
        return jwt.sign(PAYLOAD, KEY, EXPIRE);
    }

    // Generate Refresh Token (Long lived - 7 days)
    static EncodeRefreshToken(email, user_id, role) {
        let KEY = process.env.JWT_REFRESH_KEY;
        let EXPIRE = { expiresIn: process.env.JWT_REFRESH_EXPIRE };
        let PAYLOAD = { email, user_id, role };
        return jwt.sign(PAYLOAD, KEY, EXPIRE);
    }
}

module.exports = TokenHelper;