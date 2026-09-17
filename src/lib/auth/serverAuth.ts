import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User, IUserDocument } from "@/models/User";
import * as admin from "firebase-admin";

function initFirebaseAdmin(): boolean {
  if (admin.apps.length > 0) return true;
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) return false;

  try {
    let key = process.env.FIREBASE_PRIVATE_KEY || "";
    key = key.trim();
    if (
      (key.startsWith('"') && key.endsWith('"')) ||
      (key.startsWith("'") && key.endsWith("'"))
    ) {
      key = key.slice(1, -1);
    }
    key = key.replace(/\\n/g, "\n");

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: key,
      }),
    });
    return true;
  } catch (err) {
    console.error("Firebase admin initialization error:", err);
    return false;
  }
}

// Initial invocation
initFirebaseAdmin();

export interface AuthenticatedUser {
  id: string; // MongoDB _id as string
  firebaseUid: string;
  email: string;
  name: string;
  avatar?: string;
  preferences: {
    workDays: number[];
    dailyWorkHours: number;
    theme: "light" | "dark" | "system";
  };
}

/**
 * Extracts and verifies the authenticated user from the request Authorization header.
 * Strictly scopes all operations to the verified Firebase identity.
 * Reuses existing MongoDB user records when matching email or Firebase UID exists.
 */
export async function getAuthenticatedUser(
  req: NextRequest
): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.get("authorization");

  // Check for Bearer token
  let token: string | null = null;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split("Bearer ")[1].trim();
  }

  // Demo / Dev Mode Support
  const isDemoEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true";
  
  let firebaseUid: string = "";
  let email: string = "";
  let name: string = "Productivity User";
  let avatar: string | undefined = undefined;

  if (token && token.startsWith("demo-token-")) {
    if (!isDemoEnabled) return null;
    const suffix = token.replace("demo-token-", "") || "user";
    firebaseUid = `demo_uid_${suffix}`;
    if (suffix.includes("@")) {
      email = suffix;
      name = suffix.split("@")[0];
    } else {
      email = `${suffix}@gmail.com`;
      name = suffix.charAt(0).toUpperCase() + suffix.slice(1);
    }
  } else if (token) {
    initFirebaseAdmin();
    if (admin.apps.length > 0) {
      try {
        const decoded = await admin.auth().verifyIdToken(token);
        firebaseUid = decoded.uid;
        email = decoded.email || "user@example.com";
        name = decoded.name || decoded.email?.split("@")[0] || "User";
        avatar = decoded.picture || undefined;
      } catch (err) {
        console.error("Token verification failed:", err);
        return null;
      }
    } else {
      console.error("Firebase Admin could not be initialized");
      return null;
    }
  } else if (isDemoEnabled) {
    // Default fallback in local demo mode if no token provided
    firebaseUid = "demo_uid_default";
    email = "demo@personalos.local";
    name = "Demo Engineer";
  } else {
    return null;
  }

  // Ensure DB connection and find or link user in MongoDB
  try {
    await connectToDatabase();
    
    // 1. Check by Firebase UID
    let userDoc = await User.findOne({ firebaseUid });

    // 2. If not found by UID, check by email to reuse existing account
    if (!userDoc && email) {
      userDoc = await User.findOne({ email });
      if (userDoc) {
        // Link new Firebase UID to existing account
        userDoc.firebaseUid = firebaseUid;
        if (avatar && !userDoc.avatar) userDoc.avatar = avatar;
        if (name && (userDoc.name === "User" || !userDoc.name)) userDoc.name = name;
        await userDoc.save();
      }
    }

    // 3. If account still does not exist, create new MongoDB User
    if (!userDoc) {
      userDoc = await User.create({
        firebaseUid,
        email,
        name,
        avatar,
        preferences: {
          workDays: [0, 1, 2, 3, 4], // Sun-Thu default
          dailyWorkHours: 5.5,
          notificationSettings: {
            overloadWarning: true,
            urgentDeadline: true,
            idleGoalAlert: true,
          },
          theme: "dark",
        },
      });
    }

    return {
      id: userDoc._id.toString(),
      firebaseUid: userDoc.firebaseUid,
      email: userDoc.email,
      name: userDoc.name,
      avatar: userDoc.avatar,
      preferences: {
        workDays: userDoc.preferences?.workDays || [0, 1, 2, 3, 4],
        dailyWorkHours: userDoc.preferences?.dailyWorkHours || 5.5,
        theme: userDoc.preferences?.theme || "dark",
      },
    };
  } catch (dbErr) {
    console.warn("Database error in getAuthenticatedUser, using memory session:", dbErr);
    // In-memory fallback if MongoDB connection fails during initial startup
    return {
      id: `mem_${firebaseUid}`,
      firebaseUid,
      email,
      name,
      avatar,
      preferences: {
        workDays: [0, 1, 2, 3, 4],
        dailyWorkHours: 5.5,
        theme: "dark",
      },
    };
  }
}

/**
 * Helper to return a 401 Unauthorized response
 */
export function unauthorizedResponse(message: string = "Unauthorized. Please log in.") {
  return NextResponse.json({ error: message }, { status: 401 });
}
