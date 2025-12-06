package com.balanze.app;

import android.os.Bundle;
import android.os.Build;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebView;
import android.graphics.drawable.GradientDrawable;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register custom GoogleSignIn plugin
        // Capacitor automatically exposes registered plugins to JavaScript via Capacitor.Plugins.GoogleSignIn
        try {
            this.registerPlugin(GoogleSignInPlugin.class);
            Log.e("MainActivity", "========================================");
            Log.e("MainActivity", "✅ GoogleSignInPlugin registered successfully");
            Log.e("MainActivity", "========================================");
            
            // Manually expose plugin to JavaScript after page loads
            // Use a delayed injection to avoid interfering with Capacitor initialization
            final WebView webView = this.bridge.getWebView();
            webView.postDelayed(new Runnable() {
                @Override
                public void run() {
                    // Inject plugin wrapper after Capacitor is ready
                    String js = "(function() { " +
                               "  function exposePlugin() { " +
                               "    try { " +
                               "      if (typeof window.Capacitor === 'undefined') { " +
                               "        setTimeout(exposePlugin, 200); " +
                               "        return; " +
                               "      } " +
                               "      if (!window.Capacitor.Plugins) { " +
                               "        window.Capacitor.Plugins = {}; " +
                               "      } " +
                               "      if (window.Capacitor.Plugins.GoogleSignIn) { " +
                               "        console.error('[MainActivity] ✅ Plugin already exists'); " +
                               "        return; " +
                               "      } " +
                               "      // Create plugin wrapper using Capacitor's bridge " +
                               "      window.Capacitor.Plugins.GoogleSignIn = { " +
                               "        signIn: function() { " +
                               "          if (window.Capacitor && window.Capacitor.toNative) { " +
                               "            return window.Capacitor.toNative('GoogleSignIn', 'signIn', {}); " +
                               "          } " +
                               "          return Promise.reject(new Error('Capacitor bridge not available')); " +
                               "        }, " +
                               "        signOut: function() { " +
                               "          if (window.Capacitor && window.Capacitor.toNative) { " +
                               "            return window.Capacitor.toNative('GoogleSignIn', 'signOut', {}); " +
                               "          } " +
                               "          return Promise.reject(new Error('Capacitor bridge not available')); " +
                               "        } " +
                               "      }; " +
                               "      console.error('[MainActivity] ✅✅✅ GoogleSignIn plugin exposed'); " +
                               "    } catch (e) { " +
                               "      console.error('[MainActivity] ❌ Error exposing plugin:', e); " +
                               "    } " +
                               "  } " +
                               "  exposePlugin(); " +
                               "})();";
                    webView.evaluateJavascript(js, null);
                }
            }, 1000); // Wait 1 second for Capacitor to initialize
        } catch (Exception e) {
            Log.e("MainActivity", "❌ Failed to register GoogleSignInPlugin:", e);
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
