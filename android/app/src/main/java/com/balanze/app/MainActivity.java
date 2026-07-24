package com.balanze.app;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.os.Build;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.graphics.drawable.GradientDrawable;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.PluginCall;
import com.getcapacitor.JSObject;
import com.getcapacitor.MessageHandler;
import org.json.JSONObject;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;

public class MainActivity extends BridgeActivity {
    
    private GoogleSignInJSInterface googleSignInInterface;
    
    // JavaScript interface to call plugin directly
    public class GoogleSignInJSInterface {
        private GoogleSignInClient googleSignInClient;
        private static final int RC_SIGN_IN = 9001;
        private String pendingCallbackId;
        private ActivityResultLauncher<Intent> signInLauncher;
        
        private void initializeGoogleSignIn() {
            if (googleSignInClient != null) {
                return;
            }
            try {
                String serverClientId = GoogleAuthConfig.resolveServerClientId(
                    bridge.getConfig().getPluginConfiguration("GoogleSignIn").getString("serverClientId", "")
                );
                com.google.android.gms.auth.api.signin.GoogleSignInOptions gso =
                    new com.google.android.gms.auth.api.signin.GoogleSignInOptions.Builder(
                        com.google.android.gms.auth.api.signin.GoogleSignInOptions.DEFAULT_SIGN_IN)
                        .requestIdToken(serverClientId)
                        .requestEmail()
                        .requestProfile()
                        .build();
                googleSignInClient = com.google.android.gms.auth.api.signin.GoogleSignIn.getClient(
                    MainActivity.this, gso);
                Log.e("GoogleSignInJS", "✅ GoogleSignInClient initialized");
            } catch (Exception e) {
                Log.e("GoogleSignInJS", "❌ Error initializing GoogleSignInClient:", e);
            }
        }
        
        @JavascriptInterface
        public void signIn(String callbackId) {
            Log.e("GoogleSignInJS", "========================================");
            Log.e("GoogleSignInJS", "signIn() called from JavaScript interface");
            Log.e("GoogleSignInJS", "Callback ID: " + callbackId);
            Log.e("GoogleSignInJS", "========================================");
            
            pendingCallbackId = callbackId;
            
            // Initialize if needed
            initializeGoogleSignIn();
            
            if (googleSignInClient == null) {
                Log.e("GoogleSignInJS", "❌ GoogleSignInClient is null");
                sendResultToJS(callbackId, null, "Google Sign-In not initialized");
                return;
            }
            
            Activity activity = MainActivity.this;
            if (activity == null) {
                Log.e("GoogleSignInJS", "❌ Activity is null");
                sendResultToJS(callbackId, null, "Activity is null");
                return;
            }
            
            // ALWAYS sign out and revoke access to force account picker to show
            Log.e("GoogleSignInJS", "🔄 Signing out and revoking access to force account picker...");
            
            // First sign out
            googleSignInClient.signOut().addOnCompleteListener(activity, signOutTask -> {
                Log.e("GoogleSignInJS", "✅ Sign out completed");
                
                // Then revoke access to clear all cached account data
                googleSignInClient.revokeAccess().addOnCompleteListener(activity, revokeTask -> {
                    Log.e("GoogleSignInJS", "✅ Access revoked, account cache cleared");
                    
                    // Now show the sign-in intent - this should always show account picker
                    try {
                        android.content.Intent signInIntent = googleSignInClient.getSignInIntent();
                        if (signInLauncher != null) {
                            signInLauncher.launch(signInIntent);
                            Log.e("GoogleSignInJS", "✅ Sign-In intent started - account picker should appear");
                        } else {
                            Log.e("GoogleSignInJS", "❌ signInLauncher is null - not initialized");
                            sendResultToJS(callbackId, null, "Sign-in launcher not initialized");
                        }
                    } catch (Exception e) {
                        Log.e("GoogleSignInJS", "❌ Error starting sign-in intent: " + e.getMessage());
                        e.printStackTrace();
                        sendResultToJS(callbackId, null, "Failed to start sign-in: " + e.getMessage());
                    }
                });
            });
        }
        
        void handleSignInResult(android.content.Intent data) {
            if (pendingCallbackId == null) {
                Log.e("GoogleSignInJS", "⚠️ No pending callback ID");
                return;
            }
            
            String callbackId = pendingCallbackId;
            pendingCallbackId = null; // Clear it immediately
            
            Log.e("GoogleSignInJS", "🔄 Processing sign-in result from Intent...");
            com.google.android.gms.tasks.Task<com.google.android.gms.auth.api.signin.GoogleSignInAccount> task = 
                com.google.android.gms.auth.api.signin.GoogleSignIn.getSignedInAccountFromIntent(data);
            
            task.addOnCompleteListener(MainActivity.this, completedTask -> {
                try {
                    com.google.android.gms.auth.api.signin.GoogleSignInAccount account = 
                        completedTask.getResult(com.google.android.gms.common.api.ApiException.class);
                    
                    if (account != null) {
                        String idToken = account.getIdToken();
                        Log.e("GoogleSignInJS", "✅ Account retrieved - Email: " + account.getEmail());
                        Log.e("GoogleSignInJS", "✅ ID Token present: " + (idToken != null && !idToken.isEmpty()));
                        
                        JSObject result = new JSObject();
                        result.put("success", true);
                        result.put("idToken", idToken);
                        result.put("email", account.getEmail());
                        result.put("displayName", account.getDisplayName());
                        result.put("photoUrl", account.getPhotoUrl() != null ? account.getPhotoUrl().toString() : null);
                        result.put("id", account.getId());
                        
                        Log.e("GoogleSignInJS", "✅ Sign-in successful, sending result to JS");
                        sendResultToJS(callbackId, result.toString(), null);
                    } else {
                        Log.e("GoogleSignInJS", "❌ Account is null");
                        sendResultToJS(callbackId, null, "Sign in failed: account is null");
                    }
                } catch (com.google.android.gms.common.api.ApiException e) {
                    int statusCode = e.getStatusCode();
                    String errorMessage = "Sign in failed: " + statusCode;
                    String exceptionMessage = e.getMessage();
                    String statusString = e.getStatus() != null ? e.getStatus().toString() : "null";
                    
                    // Get more detailed error information
                    String causeMessage = "";
                    Throwable cause = e.getCause();
                    if (cause != null) {
                        causeMessage = cause.getMessage();
                        Log.e("GoogleSignInJS", "❌ Exception cause: " + causeMessage);
                        Log.e("GoogleSignInJS", "❌ Exception cause class: " + cause.getClass().getName());
                    }
                    
                    // Map common error codes
                    if (statusCode == 12500) {
                        errorMessage = "Sign in was cancelled";
                    } else if (statusCode == 10) {
                        errorMessage = "DEVELOPER_ERROR: SHA-1 fingerprint not configured. See FIX_ANDROID_DEVELOPER_ERROR.md";
                        Log.e("GoogleSignInJS", "❌ DEVELOPER_ERROR (Status Code 10) - Most common cause:");
                        Log.e("GoogleSignInJS", "   ⚠️  SHA-1 fingerprint NOT configured in Android OAuth client");
                        Log.e("GoogleSignInJS", "");
                        Log.e("GoogleSignInJS", "📋 QUICK FIX:");
                        Log.e("GoogleSignInJS", "   1. Run: .\\get-sha1-fingerprint.ps1 (or keytool -list -v -keystore balanze-release-key.jks -alias balanze)");
                        Log.e("GoogleSignInJS", "   2. Copy SHA-1 fingerprint (remove colons)");
                        Log.e("GoogleSignInJS", "   3. Go to: https://console.cloud.google.com/apis/credentials");
                        Log.e("GoogleSignInJS", "   4. Create Android OAuth client with:");
                        Log.e("GoogleSignInJS", "      - Package name: com.balanze.app");
                        Log.e("GoogleSignInJS", "      - SHA-1: [paste your SHA-1 without colons]");
                        Log.e("GoogleSignInJS", "   5. Must be in SAME project as Web OAuth client");
                        Log.e("GoogleSignInJS", "");
                        Log.e("GoogleSignInJS", "📋 Other possible causes:");
                        Log.e("GoogleSignInJS", "   1. Server client ID doesn't match Google Cloud Console");
                        Log.e("GoogleSignInJS", "   2. Package name mismatch in Android OAuth client");
                        Log.e("GoogleSignInJS", "   3. Android OAuth client not in same project as Web client");
                        Log.e("GoogleSignInJS", "   4. Required APIs not enabled (Google Sign-In API, Identity Toolkit API)");
                        Log.e("GoogleSignInJS", "");
                        Log.e("GoogleSignInJS", "📚 See FIX_ANDROID_DEVELOPER_ERROR.md for detailed instructions");
                    } else if (statusCode == 7) {
                        errorMessage = "NETWORK_ERROR: Check internet connection. Status code: " + statusCode;
                    } else if (statusCode == 8) {
                        errorMessage = "INTERNAL_ERROR: Google Play Services error. Status code: " + statusCode;
                    }
                    
                    Log.e("GoogleSignInJS", "❌ Sign-in error: " + errorMessage);
                    Log.e("GoogleSignInJS", "❌ Exception message: " + (exceptionMessage != null ? exceptionMessage : "null"));
                    Log.e("GoogleSignInJS", "❌ Status string: " + statusString);
                    Log.e("GoogleSignInJS", "❌ Status code: " + statusCode);
                    if (!causeMessage.isEmpty()) {
                        Log.e("GoogleSignInJS", "❌ Cause message: " + causeMessage);
                    }
                    e.printStackTrace();
                    sendResultToJS(callbackId, null, errorMessage);
                } catch (Exception e) {
                    Log.e("GoogleSignInJS", "❌ Unexpected error: " + e.getMessage());
                    e.printStackTrace();
                    sendResultToJS(callbackId, null, "Sign in failed: " + e.getMessage());
                }
            });
        }
        
        private PluginCall createCustomPluginCall(String callbackId) {
            // Use reflection to access Bridge's internal MessageHandler
            try {
                // Try to get MessageHandler from Bridge
                java.lang.reflect.Field messageHandlerField = bridge.getClass().getDeclaredField("messageHandler");
                messageHandlerField.setAccessible(true);
                com.getcapacitor.MessageHandler handler = (com.getcapacitor.MessageHandler) messageHandlerField.get(bridge);
                Log.e("MainActivity", "✅ Got MessageHandler via field reflection");
                
                return new PluginCall(handler, "GoogleSignIn", "signIn", callbackId, new JSObject()) {
                    @Override
                    public void resolve(JSObject data) {
                        super.resolve(data);
                        sendResultToJS(callbackId, data.toString(), null);
                    }
                    
                    @Override
                    public void reject(String msg) {
                        super.reject(msg);
                        sendResultToJS(callbackId, null, msg);
                    }
                };
            } catch (NoSuchFieldException e) {
                Log.e("MainActivity", "⚠️ messageHandler field not found, trying method...");
                // Try method instead
                try {
                    java.lang.reflect.Method getMessageHandlerMethod = bridge.getClass().getMethod("getMessageHandler");
                    com.getcapacitor.MessageHandler handler = (com.getcapacitor.MessageHandler) getMessageHandlerMethod.invoke(bridge);
                    Log.e("MainActivity", "✅ Got MessageHandler via method reflection");
                    return new PluginCall(handler, "GoogleSignIn", "signIn", callbackId, new JSObject()) {
                        @Override
                        public void resolve(JSObject data) {
                            super.resolve(data);
                            sendResultToJS(callbackId, data.toString(), null);
                        }
                        
                        @Override
                        public void reject(String msg) {
                            super.reject(msg);
                            sendResultToJS(callbackId, null, msg);
                        }
                    };
                } catch (Exception ex) {
                    Log.e("MainActivity", "❌ Failed to get MessageHandler via method: " + ex.getMessage());
                    ex.printStackTrace();
                    return null;
                }
            } catch (Exception e) {
                Log.e("MainActivity", "❌ Failed to create PluginCall: " + e.getMessage());
                e.printStackTrace();
                return null;
            }
        }
        
        void sendResultToJS(String callbackId, String result, String error) {
            String js;
            if (error != null) {
                // Escape single quotes and newlines for JavaScript string
                String escapedError = error.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("\r", "\\r");
                js = "if (window.GoogleSignInCallback) { window.GoogleSignInCallback('" + callbackId + "', {error: '" + escapedError + "'}); }";
            } else {
                // result is already a JSON string from JSObject.toString()
                js = "if (window.GoogleSignInCallback) { try { window.GoogleSignInCallback('" + callbackId + "', " + result + "); } catch(e) { console.error('Callback error:', e); } }";
            }
            bridge.getWebView().post(() -> bridge.getWebView().evaluateJavascript(js, null));
        }
    }
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register custom GoogleSignIn plugin
        try {
            this.registerPlugin(GoogleSignInPlugin.class);
            Log.e("MainActivity", "========================================");
            Log.e("MainActivity", "✅ GoogleSignInPlugin registered successfully");
            
            // Verify plugin is in the bridge
            com.getcapacitor.PluginHandle pluginHandle = this.bridge.getPlugin("GoogleSignIn");
            if (pluginHandle != null) {
                Log.e("MainActivity", "✅ Plugin verified in bridge: " + pluginHandle.getInstance().getClass().getName());
            } else {
                Log.e("MainActivity", "⚠️ Plugin NOT found in bridge!");
            }
            
            // Add JavaScript interface to WebView for direct plugin calls
            final WebView webView = this.bridge.getWebView();
            // Ensure JavaScript is enabled
            webView.getSettings().setJavaScriptEnabled(true);
            googleSignInInterface = new GoogleSignInJSInterface();
            
            // Initialize ActivityResultLauncher for Google Sign-In
            googleSignInInterface.signInLauncher = registerForActivityResult(
                new ActivityResultContracts.StartActivityForResult(),
                result -> {
                    int resultCode = result.getResultCode();
                    Intent data = result.getData();
                    
                    Log.e("GoogleSignInJS", "========================================");
                    Log.e("GoogleSignInJS", "ActivityResultLauncher callback received");
                    Log.e("GoogleSignInJS", "Result Code: " + resultCode + " (RESULT_OK=" + Activity.RESULT_OK + ", RESULT_CANCELED=" + Activity.RESULT_CANCELED + ")");
                    Log.e("GoogleSignInJS", "Data is null: " + (data == null));
                    if (data != null) {
                        Log.e("GoogleSignInJS", "Data extras: " + (data.getExtras() != null ? data.getExtras().toString() : "null"));
                    }
                    Log.e("GoogleSignInJS", "========================================");
                    
                    // Google Sign-In can return RESULT_CANCELED even with valid data
                    // We should process the Intent regardless of result code
                    // GoogleSignIn.getSignedInAccountFromIntent() will handle error detection
                    if (data != null) {
                        Log.e("GoogleSignInJS", "✅ Processing Intent data (result code: " + resultCode + ")");
                        googleSignInInterface.handleSignInResult(data);
                    } else {
                        Log.e("GoogleSignInJS", "❌ Sign-in cancelled - Data is null");
                        if (googleSignInInterface.pendingCallbackId != null) {
                            googleSignInInterface.sendResultToJS(
                                googleSignInInterface.pendingCallbackId, 
                                null, 
                                "Sign-in cancelled"
                            );
                            googleSignInInterface.pendingCallbackId = null;
                        }
                    }
                }
            );
            
            webView.addJavascriptInterface(googleSignInInterface, "GoogleSignInNative");
            Log.e("MainActivity", "✅ JavaScript interface 'GoogleSignInNative' added to WebView");
            
            // Test the interface immediately
            webView.post(new Runnable() {
                @Override
                public void run() {
                    String testJs = "console.error('[MainActivity] Testing GoogleSignInNative interface...'); " +
                                   "console.error('[MainActivity] Interface exists?', typeof window.GoogleSignInNative !== 'undefined'); " +
                                   "if (window.GoogleSignInNative) { " +
                                   "  console.error('[MainActivity] ✅ GoogleSignInNative interface is available'); " +
                                   "} else { " +
                                   "  console.error('[MainActivity] ❌ GoogleSignInNative interface NOT available'); " +
                                   "}";
                    webView.evaluateJavascript(testJs, null);
                }
            });
            
            // Inject JavaScript code to expose plugin via the interface
            // Use multiple injection attempts to ensure it's available
            final int[] attemptCount = {0};
            final WebView finalWebView = webView;
            final Runnable[] injectPluginRef = new Runnable[1];
            injectPluginRef[0] = new Runnable() {
                @Override
                public void run() {
                    attemptCount[0]++;
                    final int currentAttempt = attemptCount[0];
                    String js = "(function() { " +
                               "  if (typeof window.Capacitor === 'undefined') { " +
                               "    return false; " +
                               "  } " +
                               "  const C = window.Capacitor; " +
                               "  if (!C.Plugins) C.Plugins = {}; " +
                               "  if (C.Plugins.GoogleSignIn) return true; " +
                               "  " +
                               "  // Store pending callbacks " +
                               "  if (!window._GoogleSignInCallbacks) window._GoogleSignInCallbacks = {}; " +
                               "  const pendingCallbacks = window._GoogleSignInCallbacks; " +
                               "  " +
                               "  // Expose plugin using native JavaScript interface " +
                               "  C.Plugins.GoogleSignIn = { " +
                               "    signIn: function() { " +
                               "      return new Promise(function(resolve, reject) { " +
                               "        const callbackId = 'cb' + Date.now() + '_' + Math.random().toString(36).substr(2, 9); " +
                               "        " +
                               "        // Store callback " +
                               "        pendingCallbacks[callbackId] = { resolve: resolve, reject: reject }; " +
                               "        " +
                               "        // Call native interface " +
                               "        if (window.GoogleSignInNative && window.GoogleSignInNative.signIn) { " +
                               "          console.error('[GoogleSignIn] ✅ Calling native interface with callbackId:', callbackId); " +
                               "          window.GoogleSignInNative.signIn(callbackId); " +
                               "          " +
                               "          // Set timeout " +
                               "          setTimeout(function() { " +
                               "            if (pendingCallbacks[callbackId]) { " +
                               "              delete pendingCallbacks[callbackId]; " +
                               "              reject(new Error('Sign in timeout')); " +
                               "            } " +
                               "          }, 30000); " +
                               "        } else { " +
                               "          delete pendingCallbacks[callbackId]; " +
                               "          console.error('[GoogleSignIn] ❌ Native interface not available'); " +
                               "          reject(new Error('Native interface not available')); " +
                               "        } " +
                               "      }); " +
                               "    }, " +
                               "    signOut: function() { return Promise.resolve({ success: true }); }, " +
                               "    log: function(options) { return Promise.resolve(); } " +
                               "  }; " +
                               "  " +
                               "  // Set up callback handler for native interface " +
                               "  window.GoogleSignInCallback = function(callbackId, result) { " +
                               "    const callback = pendingCallbacks[callbackId]; " +
                               "    if (callback) { " +
                               "      delete pendingCallbacks[callbackId]; " +
                               "      if (result.error) { " +
                               "        callback.reject(new Error(result.error)); " +
                               "      } else { " +
                               "        callback.resolve(result); " +
                               "      } " +
                               "    } " +
                               "  }; " +
                               "  " +
                               "  console.error('[GoogleSignIn] ✅ Plugin exposed via native interface'); " +
                               "  return true; " +
                               "})();";
                    finalWebView.evaluateJavascript(js, new android.webkit.ValueCallback<String>() {
                        @Override
                        public void onReceiveValue(String value) {
                            if (!"true".equals(value) && currentAttempt < 10) {
                                // Retry if injection failed
                                finalWebView.postDelayed(injectPluginRef[0], 200);
                            } else {
                                Log.e("MainActivity", "✅ JavaScript code injected to expose plugin (attempt " + currentAttempt + ")");
                            }
                        }
                    });
                }
            };
            webView.postDelayed(injectPluginRef[0], 100);
            
            Log.e("MainActivity", "========================================");
        } catch (Exception e) {
            Log.e("MainActivity", "❌ Failed to register GoogleSignInPlugin:", e);
            e.printStackTrace();
        }
        
        // SMART SCROLL: Allow natural scrolling behavior
        // The WebView will handle scroll detection via JavaScript
        this.bridge.getWebView().setOverScrollMode(View.OVER_SCROLL_IF_CONTENT_SCROLLS);
        
        // Enable smooth scrolling
        this.bridge.getWebView().setVerticalScrollBarEnabled(true);
        
        // Additional WebView settings for optimal scrolling
        WebView webView = this.bridge.getWebView();
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setDatabaseEnabled(true);
        
        // Enable WebView console logging to Logcat
        webView.setWebChromeClient(new android.webkit.WebChromeClient() {
            @Override
            public boolean onConsoleMessage(android.webkit.ConsoleMessage consoleMessage) {
                Log.e("WebView", consoleMessage.message() + " -- From line "
                    + consoleMessage.lineNumber() + " of "
                    + consoleMessage.sourceId());
                return true;
            }
        });
        
        // Enable nested scrolling for better touch handling
        webView.setScrollBarStyle(View.SCROLLBARS_INSIDE_OVERLAY);
        webView.setNestedScrollingEnabled(true);
        
        // Apply gradient status bar (matching website)
        Window window = getWindow();
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        
        // FIX: Enable edge-to-edge properly with window insets
        // This tells the system to layout behind system bars
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowCompat.setDecorFitsSystemWindows(window, false);
        } else {
            // For older Android versions
            window.getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            );
        }
        
        // Create gradient drawable for status bar
        GradientDrawable gradientDrawable = new GradientDrawable(
            GradientDrawable.Orientation.LEFT_RIGHT,
            new int[] {
                0xFF2563EB, // Blue (#2563eb)
                0xFF9333EA  // Purple (#9333ea)
            }
        );
        
        window.setStatusBarColor(0xFF2563EB); // Fallback to blue if gradient not supported
        // Note: Status bar gradient requires Android 12+ or custom view
        // Using blue as it's the primary brand color
        
        // Make status bar content light (white icons)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            WindowInsetsControllerCompat windowInsetsController = 
                WindowCompat.getInsetsController(window, window.getDecorView());
            windowInsetsController.setAppearanceLightStatusBars(false); // White icons on blue background
        }
    }
    
}
