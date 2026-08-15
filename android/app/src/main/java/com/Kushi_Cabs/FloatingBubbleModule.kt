package com.kushi_cabs

import android.os.Build
import android.provider.Settings
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule

/**
 * FloatingBubbleModule
 * React Native bridge for floating bubble notifications with ring.mp3 sound
 */
@ReactModule(name = "FloatingBubbleModule")
class FloatingBubbleModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "FloatingBubbleModule"
    }

    override fun getName(): String = "FloatingBubbleModule"

    @ReactMethod
    fun showBubble(tripData: ReadableMap, promise: Promise) {
        try {
            if (!hasOverlayPermission()) {
                promise.reject("PERMISSION_DENIED", "Overlay permission not granted")
                return
            }

            val intent = android.content.Intent(reactApplicationContext, FloatingBubbleService::class.java)
            intent.action = "show"
            intent.putExtra("tripId", tripData.getString("tripId"))
            intent.putExtra("tripCount", tripData.getInt("tripCount"))
            
            // Pass trip details for dropdown menu
            intent.putExtra("tripPickup", tripData.getString("pickupLocation") ?: "Pickup Location")
            intent.putExtra("tripDropoff", tripData.getString("dropoffLocation") ?: "Dropoff Location")
            intent.putExtra("tripFare", tripData.getString("fareAmount") ?: "$0.00")
            intent.putExtra("tripStatus", tripData.getString("status") ?: "In Progress")

            Log.d(TAG, "showBubble called - Pickup: ${tripData.getString("pickupLocation")}, Dropoff: ${tripData.getString("dropoffLocation")}, Fare: ${tripData.getString("fareAmount")}")

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactApplicationContext.startForegroundService(intent)
            } else {
                reactApplicationContext.startService(intent)
            }

            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Error showing bubble: ${e.message}")
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun hideBubble(promise: Promise) {
        try {
            val intent = android.content.Intent(reactApplicationContext, FloatingBubbleService::class.java)
            intent.action = "hide"
            reactApplicationContext.stopService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Error hiding bubble: ${e.message}")
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun updateTripCount(count: Int, promise: Promise) {
        try {
            val intent = android.content.Intent(reactApplicationContext, FloatingBubbleService::class.java)
            intent.action = "update"
            intent.putExtra("tripCount", count)
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactApplicationContext.startForegroundService(intent)
            } else {
                reactApplicationContext.startService(intent)
            }
            
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Error updating trip count: ${e.message}")
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun requestOverlayPermission(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (Settings.canDrawOverlays(reactApplicationContext)) {
                    Log.d(TAG, "Permission already granted")
                    promise.resolve(true)
                } else {
                    val intent = android.content.Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        android.net.Uri.parse("package:" + reactApplicationContext.packageName)
                    )
                    
                    currentActivity?.startActivity(intent)
                    Log.d(TAG, "Showing overlay permission dialog")
                    promise.resolve(true)
                }
            } else {
                promise.resolve(true)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error requesting permission: ${e.message}")
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun hasOverlayPermission(promise: Promise) {
        try {
            val hasPermission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Settings.canDrawOverlays(reactApplicationContext)
            } else {
                true
            }
            
            Log.d(TAG, "hasOverlayPermission: $hasPermission")
            promise.resolve(hasPermission)
        } catch (e: Exception) {
            Log.e(TAG, "Error checking permission: ${e.message}")
            promise.reject("ERROR", e.message)
        }
    }

    private fun hasOverlayPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(reactApplicationContext)
        } else {
            true
        }
    }
}
