package com.balanze.app;

/**
 * Shared Google Sign-In Web client ID (public OAuth client).
 * Cap sync should bake this into capacitor.config; fallback covers empty sync.
 */
final class GoogleAuthConfig {
    static final String WEB_CLIENT_ID =
        "684747632135-l7g9s4u1ka3tbjll9eu0avga2jmcs7m1.apps.googleusercontent.com";

    private GoogleAuthConfig() {}

    static String resolveServerClientId(String fromConfig) {
        return (fromConfig != null && !fromConfig.isEmpty()) ? fromConfig : WEB_CLIENT_ID;
    }
}
