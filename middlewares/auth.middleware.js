// const { verifyAccessToken } = require('../utils/jwt.util');

// const verifyToken = (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return res.status(401).json({ message: 'Access denied. No token provided.' });
//     }

//     const token = authHeader.split(' ')[1];
//     const decoded = verifyAccessToken(token);

//     req.user = {
//       id: decoded.id,
//       email: decoded.email,
//       mobileNumber: decoded.mobileNumber,
//     };

//     next();
//   } catch (error) {
//     if (error.name === 'TokenExpiredError') {
//       return res.status(401).json({ message: 'Access token expired. Please refresh token.' });
//     } else if (error.name === 'JsonWebTokenError') {
//       return res.status(401).json({ message: 'Invalid access token.' });
//     }

//     console.error('Token verification error:', error);
//     return res.status(500).json({ message: 'Internal server error.' });
//   }
// };

// module.exports = verifyToken;



const {
  verifyAccessToken,
  verifyAdminToken,
} = require('../utils/jwt.util');

const verifyAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;

    // 🧠 Try Admin Token First
    try {
      decoded = verifyAdminToken(token);
      if (decoded?.role === 'admin') {
        req.admin = {
          username: decoded.username,
          role: decoded.role,
        };
        return next(); // ✅ Allow as admin
      }
    } catch (_) {
      // Continue to try user token
    }

    // 🔐 Try User Access Token
    try {
      decoded = verifyAccessToken(token);
      req.user = {
        id: decoded.id,
        email: decoded.email,
        mobileNumber: decoded.mobileNumber,
      };
      return next(); // ✅ Allow as user
    } catch (err) {
      // fall through
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired. Please login again.' });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token.' });
      }
    }

    return res.status(403).json({ message: 'Access denied. Invalid token.' });

  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = verifyAuth;
