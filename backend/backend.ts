import Express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
// @ts-ignore Types exist???
import { Query, Send } from "express-serve-static-core";
import {FactoryData} from "./models/FactoyDataSchema";
import {User} from "./models/UsersSchema";

dotenv.config();

const PORT = 3001;

// *************************************************
// Setup Express
// *************************************************

const app: Express.Application = Express();
app.use(Express.urlencoded({ extended: true }));
app.use(Express.json());

// *************************************************
// MongoDB Configuration
// *************************************************

mongoose.connect(process.env.MONGO_URI ?? 'mongodb://localhost:27017/factory_planner', {
  bufferCommands: true,
  dbName: 'factory_planner',
  user: process.env.MONGO_USER ?? undefined,
  pass: process.env.MONGO_PASS ?? undefined,
  autoIndex: true,
  autoCreate: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.log('Error connecting to MongoDB', error));

// *************************************************
// Request/Response Types
// *************************************************

export interface TypedRequestBody<T> extends Express.Request {
  body: T;
}

export interface TypedRequestQuery<T extends Query> extends Express.Request {
  query: T;
}

export interface TypedRequest<T extends Query, U> extends Express.Request {
  body: U;
  query: T;
}

export interface TypedResponse<ResBody> extends Express.Response {
  json: Send<ResBody, this>;
}

// *************************************************
// Middleware to authenticate with JWT
// *************************************************

interface AuthenticatedRequest extends Express.Request {
  user?: string | jwt.JwtPayload;
}

const authenticate = (req: AuthenticatedRequest, res: Express.Response, next: Express.NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET ?? 'secret');
    next();
    // eslint-disable-next-line
  } catch (error: any) {
    if (error.message) {
      console.log(error.message);
    }
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

// *************************************************
// Routes
// *************************************************

// Hello Endpoint
app.get('/hello', function (_req: Express.Request, res: Express.Response) {
  res.status(200).json({ message: 'Hello, the server is running!' });
});

// Register Endpoint
app.post('/register', async (req: TypedRequestBody<{ username: string; password: string }>, res: Express.Response) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if the user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    res.status(400).json({ message: 'Registration failed.', error });
  }
});

// Login Endpoint
app.post('/login', async (req: TypedRequestBody<{ username: string; password: string }>, res: TypedResponse<{ token: string }>) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const secret = process.env.JWT_SECRET ?? 'secret';
    const token = jwt.sign({ id: user._id, username: user.username }, secret, { expiresIn: '7d' });

    console.log(`Successfully signed in user ${username}`);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error });
  }
});

// Validate Token Endpoint
app.post('/validate-token', (req: TypedRequestBody<{ token: string }>, res: Express.Response) => {
  const token = req.body.token;
  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET ?? 'secret');
    res.status(200).json({ valid: true, decoded });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    res.status(401).json({ valid: false, message: 'Invalid or expired token' });
  }
});

// Save Data Endpoint
app.post('/save', authenticate, async (req: AuthenticatedRequest & TypedRequestBody<{ data: any }>, res: Express.Response) => {
  try {
    const { username } = req.user as jwt.JwtPayload & { username: string };
    const userData = req.body;

    console.log(req.body);

    console.log(`Saving data for user ${username}`);
    console.log(`Data: ${JSON.stringify(userData, null, 2)}`);

    await FactoryData.findOneAndUpdate(
      { user: username },
      { data: userData, lastSaved: new Date() },
      { new: true, upsert: true }
    );

    console.log('Data saved!');

    res.json({ message: 'Data saved successfully', userData });
  } catch (error) {
    console.error(`Data save failed: ${error}`);
    res.status(500).json({ message: 'Data save failed', error });
  }
});

app.get('/load', authenticate, async (req: AuthenticatedRequest & TypedRequestBody<{ data: any }>, res: Express.Response) => {
  try {
    const { username } = req.user as jwt.JwtPayload & { username: string };

    const data = await FactoryData.findOne(
      { user: username },
    );

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Data save failed', error });
  }
});

// *************************************************
// Add 404 handler
// *************************************************

app.use(function (_req: Express.Request, res: Express.Response) {
  res.status(404).send('Not found');
});

// *************************************************
// Start server
// *************************************************

http.createServer(app).listen(PORT, () => console.log(`Webserver running at http://localhost:${PORT}/`));
