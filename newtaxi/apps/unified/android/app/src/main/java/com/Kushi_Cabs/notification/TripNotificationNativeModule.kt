package com.Kushi_Cabs.notification

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.*
import com.Kushi_Cabs.MainActivity

class TripNotificationNativeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val channelId = "trip_notifications"
    private val notificationId = 1001

    init { createChannel() }

    override fun getName() = "TripNotification"

    private fun createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val mgr = reactApplicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            mgr.createNotificationChannel(NotificationChannel(channelId, "Trip Notifications", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "New trip requests"; enableVibration(true); setShowBadge(true)
            })
        }
    }

    // Called by JS: TripNotification.showTripAlert(tripCount)
    @ReactMethod fun showTripAlert(tripCount: Int) {
        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M)
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        else PendingIntent.FLAG_UPDATE_CURRENT

        val pi = PendingIntent.getActivity(reactApplicationContext, 0,
            Intent(reactApplicationContext, MainActivity::class.java).apply {
                this.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            }, flags)

        val builder = NotificationCompat.Builder(reactApplicationContext, channelId)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("🚖 New Trip Available!")
            .setContentText("$tripCount trip${if (tripCount > 1) "s" else ""} waiting for you")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pi).setAutoCancel(true)
            .setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION))
            .setVibrate(longArrayOf(0, 500, 200, 500))
        if (tripCount > 1) builder.setNumber(tripCount)

        try {
            NotificationManagerCompat.from(reactApplicationContext).notify(notificationId, builder.build())
            vibrate()
        } catch (e: SecurityException) { e.printStackTrace() }
    }

    // Called by JS: TripNotification.cancelTripAlert()
    @ReactMethod fun cancelTripAlert() {
        NotificationManagerCompat.from(reactApplicationContext).cancel(notificationId)
    }

    // Called by JS: TripNotification.requestPermission(callback)
    @ReactMethod fun requestPermission(callback: Callback) {
        val granted = NotificationManagerCompat.from(reactApplicationContext).areNotificationsEnabled()
        callback.invoke(granted)
    }

    private fun vibrate() {
        val v = reactApplicationContext.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
            v.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 500, 200, 500), -1))
        else @Suppress("DEPRECATION") v.vibrate(longArrayOf(0, 500, 200, 500), -1)
    }
}
