// /controllers/authController.js
import dbConnect from "../lib/db.js";
import User from "../models/User.js";
import { generateToken, verifyGoogleIdToken } from "../lib/auth.js";

await dbConnect(); // ensure DB is connected for Next.js edge route compatibility

// POST /api/auth/signup
export async function signup(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Please provide username, email and password" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "User with this email already exists" });
    }

    const user = await User.create({ username, email, password });
    // user.password is hashed by pre save
    const token = generateToken(user);

    // Return user without password
    const userSafe = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      managesClub: user.managesClub || null
    };

    return res.status(201).json({ user: userSafe, token });
  } catch (err) {
    console.error("SIGNUP_ERR", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// POST /api/auth/login
export async function login(req, res) {
  try {
    console.log("Login request recieved:");
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    // select password explicitly
    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user);

    const userSafe = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      managesClub: user.managesClub || null
    };

    return res.status(200).json({ user: userSafe, token });
  } catch (err) {
    console.error("LOGIN_ERR", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// POST /api/auth/google
// body: { idToken } (the client obtains Google id token using google sign-in)
export async function googleAuth(req, res) {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: "idToken is required" });

    const payload = await verifyGoogleIdToken(idToken);
    if (!payload || !payload.email_verified) {
      // Even if not verified, you could still allow, but safer to require verified.
      return res.status(401).json({ message: "Google token invalid or email not verified" });
    }

    const { email, name, picture } = payload;

    // Check existing user
    let user = await User.findOne({ email });
    if (!user) {
      // create new user with a random password (they will use Google to login)
      const randomPassword = Math.random().toString(36).slice(-10);
      user = await User.create({
        username: name || email.split("@")[0],
        email,
        password: randomPassword,
        avatarUrl: picture || null
      });
    }

    const token = generateToken(user);
    const userSafe = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      managesClub: user.managesClub || null,
      avatarUrl: user.avatarUrl || null
    };

    return res.status(200).json({ user: userSafe, token });
  } catch (err) {
    console.error("GOOGLE_AUTH_ERR", err);
    return res.status(500).json({ message: "Server error during Google auth" });
  }
}

// GET /api/auth/me  (protected)
export async function getMe(req, res) {
  try {
    // req.user is attached by middleware
    const userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ user });
  } catch (err) {
    console.error("GET_ME_ERR", err);
    return res.status(500).json({ message: "Server error" });
  }
}
