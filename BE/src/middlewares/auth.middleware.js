const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { UnauthorizedError } = require('../exceptions/UnauthorizedError');

/**
 * Middleware validateApiKey: Bảo vệ Endpoint thông qua cơ chế Public/Secret Key
 * @param {'public' | 'secret'} requiredType - Cấp độ bảo mật bắt buộc (mặc định 'public')
 */
const validateApiKey = (requiredType = 'public') => {
  return (req, res, next) => {
    try {
      const publicKey = req.headers['x-api-public-key'];
      const secretKey = req.headers['x-api-secret-key'];

      // 1. Kiểm tra Secret Key trước (Dành cho Admin / Webhook Server-to-Server)
      if (secretKey && secretKey === env.API_SECRET_KEY) {
        req.authType = 'admin';
        return next();
      }

      // Nếu yêu cầu bắt buộc là 'secret' mà không khớp, block ngay tại đây
      if (requiredType === 'secret') {
        throw new UnauthorizedError('Secret Key is required for this action');
      }

      // 2. Kiểm tra Public Key (Dành cho Client / Mobile App)
      if (publicKey && publicKey === env.API_PUBLIC_KEY) {
        req.authType = 'client';
        return next();
      }

      // Không có Key nào hợp lệ
      throw new UnauthorizedError('Invalid API Key');
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware verifyToken: Xác thực JWT Access Token từ header Authorization
 * Decode token → gán req.user = { id, roleId }
 * Dùng cho các route cần biết user đang login (tạo booking, payment, review...)
 */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token is required');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Access token is required');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      roleId: decoded.roleId,
    };

    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Invalid access token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Access token has expired'));
    }
    return next(error);
  }
};

/**
 * Middleware optionalToken: Decode JWT nếu có, không throw nếu không có
 * Dùng cho route vừa cho phép ẩn danh vừa hỗ trợ user đã login
 */
const optionalToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      roleId: decoded.roleId,
    };
  } catch {
    // Token invalid/expired → treat as anonymous, don't throw
  }

  return next();
};

module.exports = { validateApiKey, verifyToken, optionalToken };
