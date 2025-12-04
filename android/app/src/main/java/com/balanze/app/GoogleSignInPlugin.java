package com.balanze.app;

import android.app.Activity;
import android.content.Intent;
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
        
        // Get the server client ID from capacitor config
        // This should be your Google OAuth Web Client ID (same as configured in Supabase)
        String serverClientId = getConfig().getString("serverClientId", "");
        
        if (serverClientId.isEmpty()) {
            getLog().error("Google Sign-In: serverClientId not configured in capacitor.config.ts");
            getLog().error("Please add GoogleSignIn: { serverClientId: 'your-google-client-id' } to capacitor.config.ts");
            // Don't initialize if not configured - will fail gracefully
            return;
        }
        
        // Configure Google Sign-In
        // Note: For native Android Sign-In, use the same Web Client ID that's configured in Supabase
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(serverClientId)
            .requestEmail()
            .requestProfile()
            .build();
        
        googleSignInClient = GoogleSignIn.getClient(getActivity(), gso);
    }

    @PluginMethod
    public void signIn(PluginCall call) {
        savedCall = call;
        
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is null");
            return;
        }
        
        Intent signInIntent = googleSignInClient.getSignInIntent();
        startActivityForResult(call, signInIntent, RC_SIGN_IN);
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

