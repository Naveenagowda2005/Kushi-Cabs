package com.Kushi_Cabs.overlay

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.*

class FloatingBubbleNativeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "FloatingBubble"

    // Called by JS: FloatingBubble.show(tripCount, isOnline)
    @ReactMethod fun show(tripCount: Int, isOnline: Boolean) {
        reactApplicationContext.startService(Intent(reactApplicationContext, FloatingBubbleService::class.java).apply {
            putExtra("action", "show"); putExtra("tripCount", tripCount)
        })
    }

    // Called by JS: FloatingBubble.hide()
    @ReactMethod fun hide() {
        reactApplicationContext.startService(Intent(reactApplicationContext, FloatingBubbleService::class.java).apply {
            putExtra("action", "hide")
        })
    }

    // Called by JS: FloatingBubble.hasPermission(callback)
    @ReactMethod fun hasPermission(callback: Callback) {
        val hasPermission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M)
            Settings.canDrawOverlays(reactApplicationContext)
        else true
        callback.invoke(hasPermission)
    }

    // Called by JS: FloatingBubble.requestPermission()
    @ReactMethod fun requestPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            reactApplicationContext.startActivity(
                Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:${reactApplicationContext.packageName}"))
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            )
        }
    }
}
