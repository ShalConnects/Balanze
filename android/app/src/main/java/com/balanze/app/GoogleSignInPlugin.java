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
        
        String serverClientId = GoogleAuthConfig.resolveServerClientId(
            getConfig().getString("serverClientId", "")
        );
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(serverClientId)
            .requestEmail()
            .requestProfile()
            .build();
        googleSignInClient = GoogleSignIn.getClient(getActivity(), gso);
        Log.e("GoogleSignIn", "✅ GoogleSignInClient initialized");
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
        
        // ALWAYS sign out and revoke access to force account picker to show
        // This is the most reliable way to ensure the picker appears
        Log.e("GoogleSignIn", "🔄 Signing out and revoking access to force account picker...");
        
        // First sign out
        googleSignInClient.signOut().addOnCompleteListener(activity, signOutTask -> {
            Log.e("GoogleSignIn", "✅ Sign out completed");
            
            // Then revoke access to clear all cached account data
            googleSignInClient.revokeAccess().addOnCompleteListener(activity, revokeTask -> {
                Log.e("GoogleSignIn", "✅ Access revoked, account cache cleared");
                
                // Now show the sign-in intent - this should always show account picker
                try {
                    Intent signInIntent = googleSignInClient.getSignInIntent();
                    startActivityForResult(call, signInIntent, RC_SIGN_IN);
                    Log.e("GoogleSignIn", "✅ Sign-In intent started - account picker should appear");
                } catch (Exception e) {
                    Log.e("GoogleSignIn", "❌ Error starting sign-in intent: " + e.getMessage());
                    e.printStackTrace();
                    if (savedCall != null) {
                        savedCall.reject("Failed to start sign-in: " + e.getMessage());
                        savedCall = null;
                    }
                }
            });
        });
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

    @PluginMethod
    public void log(PluginCall call) {
        String message = call.getString("message", "");
        Log.e("JS_LOG", message);
        call.resolve();
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

