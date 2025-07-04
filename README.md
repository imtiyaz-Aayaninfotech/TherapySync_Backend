├── config/                  # Configuration files (e.g., DB, env)
│   ├── db.js
│   └── logger.js
│
├── controllers/            # Request handlers (Business logic)
│   └── user.controller.js
│
├── models/                 # Mongoose schemas
│   └── user.model.js
│
├── routes/                 # API route definitions
│   └── user.routes.js
│
├── middlewares/            # Custom middleware (auth, error, etc.)
│   ├── auth.middleware.js
│   └── error.middleware.js
│
├── services/               # Reusable logic, e.g., email, payment, etc.
│   └── email.service.js
│
├── utils/                  # Utility/helper functions
│   └── generateToken.js
│
├── validations/            # Joi or express-validator schemas
│   └── user.validation.js
│
├── uploads/                # For file/image uploads
│
├── .env                    # Environment variables
├── .gitignore
├── app.js                  # Main app config
├── server.js               # Start server here (import app.js)
├── package.json
