package com.balanze.app;

import android.app.Activity;
import android.content.Intent;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;

@CapacitorPlugin(name = "GoogleSignIn")
public class GoogleSignInPlugin extends Plugin {

    private static final int RC_SIGN_IN = 9001;
    private GoogleSignInClient googleSignInClient;
    private PluginCall savedCall;

    @Override
    public void load() {
        super.load();
        
        Log.e("GoogleSignIn", "========================================");
        Log.e("GoogleSignIn", "GoogleSignInPlugin.load() CALLED");
        Log.e("GoogleSignIn", "========================================");
        
        // Get the server client ID from capacitor config
        // This should be your Google OAuth Web Client ID (same as configured in Supabase)
        String serverClientId = getConfig().getString("serverClientId", "");
        
        Log.e("GoogleSignIn", "Server Client ID from config: " + (serverClientId.isEmpty() ? "EMPTY" : serverClientId.substring(0, Math.min(20, serverClientId.length())) + "..."));
        
        if (serverClientId.isEmpty()) {
            Log.e("GoogleSignIn", "❌ Google Sign-In: serverClientId not configured in capacitor.config.ts");
            Log.e("GoogleSignIn", "Please add GoogleSignIn: { serverClientId: 'your-google-client-id' } to capacitor.config.ts");
            // Don't initialize if not configured - will fail gracefully
            return;
        }
        
        Log.e("GoogleSignIn", "✅ Configuring Google Sign-In with serverClientId");
        
        // Configure Google Sign-In
        // Note: For native Android Sign-In, use the same Web Client ID that's configured in Supabase
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(serverClientId)
            .requestEmail()
            .requestProfile()
            .build();
        
        googleSignInClient = GoogleSignIn.getClient(getActivity(), gso);
        Log.e("GoogleSignIn", "✅ GoogleSignInClient initialized successfully");
    }

    @PluginMethod
    public void signIn(PluginCall call) {
        Log.e("GoogleSignIn", "========================================");
        Log.e("GoogleSignIn", "signIn() METHOD CALLED");
        Log.e("GoogleSignIn", "========================================");
        
        savedCall = call;
        
        if (googleSignInClient == null) {
            Log.e("GoogleSignIn", "❌ googleSignInClient is null - plugin not initialized");
            call.reject("Google Sign-In not initialized. Check serverClientId configuration.");
            return;
        }
        
        Activity activity = getActivity();
        if (activity == null) {
            Log.e("GoogleSignIn", "❌ Activity is null");
            call.reject("Activity is null");
            return;
        }
        
        Log.e("GoogleSignIn", "✅ Starting Google Sign-In intent...");
        Intent signInIntent = googleSignInClient.getSignInIntent();
        startActivityForResult(call, signInIntent, RC_SIGN_IN);
        Log.e("GoogleSignIn", "✅ Sign-In intent started");
    }

    @PluginMethod
    public void signOut(PluginCall call) {
        googleSignInClient.signOut()
            .addOnCompleteListener(getActivity(), task -> {
                JSObject result = new JSObject();
                result.put("success", true);
                call.resolve(result);
            });
    }

    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);
        
        if (requestCode == RC_SIGN_IN && savedCall != null) {
            Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
            handleSignInResult(task);
        }
    }

    private void handleSignInResult(Task<GoogleSignInAccount> completedTask) {
        try {
            GoogleSignInAccount account = completedTask.getResult(ApiException.class);
            
            if (account != null) {
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("idToken", account.getIdToken());
                result.put("email", account.getEmail());
                result.put("displayName", account.getDisplayName());
                result.put("photoUrl", account.getPhotoUrl() != null ? account.getPhotoUrl().toString() : null);
                result.put("id", account.getId());
                
                if (savedCall != null) {
                    savedCall.resolve(result);
                    savedCall = null;
                }
            } else {
                if (savedCall != null) {
                    savedCall.reject("Sign in failed: account is null");
                    savedCall = null;
                }
            }
        } catch (ApiException e) {
            String errorMessage = "Sign in failed: " + e.getStatusCode();
            if (e.getStatusCode() == 12500) {
                errorMessage = "Sign in was cancelled";
            } else if (e.getStatusCode() == 10) {
                errorMessage = "Developer error: Check your server client ID configuration";
            } else if (e.getStatusCode() == 7) {
                errorMessage = "Network error: Please check your internet connection";
            }
            
            if (savedCall != null) {
                savedCall.reject(errorMessage);
                savedCall = null;
            }
        }
    }
}

