import { Router } from "express";
import bcrypt from "bcrypt";
import { storage } from "../storage";
import { insertUserSchema } from "@shared/schema";

const router = Router();

// Simple test user creation for initial setup
router.post("/api/create-first-user", async (req, res) => {
  try {
    const { username, email, password, tier } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email, and password required" });
    }

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await storage.createUser({
      username,
      email,
      password: hashedPassword,
      subscriptionTier: tier || "free"
    });

    res.json({
      message: "User created successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        subscriptionTier: user.subscriptionTier
      }
    });
  } catch (error) {
    console.error("User creation error:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

router.post("/api/auth/register", async (req, res) => {
  try {
    const userData = insertUserSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = await storage.createUser({
      ...userData,
      password: hashedPassword,
      subscriptionTier: "free"
    });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        subscriptionTier: user.subscriptionTier
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Set session
    req.session.userId = user.id;

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        isAdmin: user.isAdmin || false
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/api/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

router.get("/api/auth/me", async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        isAdmin: user.isAdmin || false,
        favoriteTeams: user.favoriteTeams || [],
        primaryInterest: user.primaryInterest || null,
        onboardingComplete: user.onboardingComplete || false,
      }
    });
  } catch (error) {
    console.error("Auth check error:", error);
    res.status(500).json({ error: "Authentication check failed" });
  }
});

router.post("/api/auth/onboarding", async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const { favoriteTeams, primaryInterest } = req.body as { favoriteTeams: unknown; primaryInterest?: string };
    if (!Array.isArray(favoriteTeams)) {
      return res.status(400).json({ error: "favoriteTeams must be an array" });
    }
    const validInterest = ['news', 'picks', 'play'].includes(String(primaryInterest)) ? String(primaryInterest) : null;

    const { db } = await import("../db");
    const { users } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    await db.update(users)
      .set({ favoriteTeams: favoriteTeams as string[], primaryInterest: validInterest, onboardingComplete: true })
      .where(eq(users.id, userId));

    res.json({ success: true });
  } catch (error) {
    console.error("Onboarding error:", error);
    res.status(500).json({ error: "Failed to save onboarding" });
  }
});

export default router;
