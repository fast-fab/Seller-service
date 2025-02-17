export class AuthError extends Error {
    constructor(message) {
      super(message);
      this.name = 'AuthError';
    }
  }
  
  export class ValidationError extends Error {
    constructor(message) {
      super(message);
      this.name = 'ValidationError';
    }
  }
  
  export class NotFoundError extends Error {
    constructor(message) {
      super(message);
      this.name = 'NotFoundError';
    }
  }
  
  export class BadRequestError extends Error {
    constructor(message) {
      super(message);
      this.name = 'BadRequestError';
    }
  }
  
  export const errorHandler = (err, req, res, next) => {
    console.error('Error:', {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  
    if (err instanceof AuthError) {
      return res.status(401).json({
        error: err.message,
        type: 'authentication_error'
      });
    }
  
    if (err instanceof ValidationError) {
      return res.status(400).json({
        error: err.message,
        type: 'validation_error'
      });
    }
  
    if (err instanceof NotFoundError) {
      return res.status(404).json({
        error: err.message,
        type: 'not_found_error'
      });
    }
  
    if (err instanceof BadRequestError) {
      return res.status(400).json({
        error: err.message,
        type: 'bad_request_error'
      });
    }

    if (err.code) {
      switch (err.code) {
        case 'P2002':
          return res.status(409).json({
            error: 'Resource already exists',
            type: 'conflict_error'
          });
        case 'P2025':
          return res.status(404).json({
            error: 'Record not found',
            type: 'not_found_error'
          });
      }
    }
  
    return res.status(500).json({
      error: 'Internal server error',
      type: 'server_error',
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
  };