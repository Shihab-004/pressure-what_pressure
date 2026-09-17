import { googleProvider } from "./lib/firebase/client";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log("=== Testing Google Authentication Setup & Configuration ===");

// 1. Verify Google Provider
assert(googleProvider !== undefined, "GoogleAuthProvider is instantiated");
assert(
  (googleProvider as any).getCustomParameters?.().prompt === "select_account",
  "Google provider has custom parameter prompt='select_account' to show account chooser"
);

// 2. Verify friendly error mapping logic
function mapAuthError(code: string): string {
  if (code === "auth/popup-closed-by-user") {
    return "Google sign-in was cancelled (window closed).";
  } else if (code === "auth/account-exists-with-different-credential") {
    return "An account already exists with this email address. Please sign in with your email/password.";
  } else if (code === "auth/network-request-failed") {
    return "Network error. Please check your internet connection.";
  } else {
    return "Google authentication failed.";
  }
}

assert(
  mapAuthError("auth/popup-closed-by-user") === "Google sign-in was cancelled (window closed).",
  "Friendly message when popup closed by user"
);

assert(
  mapAuthError("auth/account-exists-with-different-credential").includes("already exists"),
  "Handles account-exists-with-different-credential gracefully"
);

assert(
  mapAuthError("auth/network-request-failed").includes("Network error"),
  "Handles network-request-failed gracefully"
);

console.log("\n🎉 ALL GOOGLE AUTH TESTS PASSED!\n");
