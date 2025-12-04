package com.balanze.app;

import android.os.Bundle;
import android.os.Build;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebView;
import android.graphics.drawable.GradientDrawable;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

import java.util.ArrayList;

public class MainActivity extends BridgeActivity {
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register Google Sign-In plugin
        this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {{
            add(GoogleSignInPlugin.class);
        }});
        
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
