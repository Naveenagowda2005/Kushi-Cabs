package com.Kushi_Cabs.overlay

import android.app.Service
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.TextView

class FloatingBubbleService : Service() {
    private var windowManager: WindowManager? = null
    private var floatingView: View? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.getStringExtra("action")) {
            "show" -> showBubble(intent.getIntExtra("tripCount", 0))
            "update" -> updateCount(intent.getIntExtra("tripCount", 0))
            "hide" -> { removeBubble(); stopSelf() }
        }
        return START_STICKY
    }

    private fun showBubble(count: Int) {
        if (floatingView != null) { updateCount(count); return }
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager

        val tv = TextView(this).apply {
            text = count.toString()
            textSize = 18f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#FF6B35"))
            setPadding(20, 20, 20, 20)
        }
        floatingView = tv

        val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        else WindowManager.LayoutParams.TYPE_PHONE

        val params = WindowManager.LayoutParams(120, 120, type,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE, PixelFormat.TRANSLUCENT).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 50; y = 200
        }

        var ix = 0; var iy = 0; var tx = 0f; var ty = 0f
        tv.setOnTouchListener { _, e ->
            when (e.action) {
                MotionEvent.ACTION_DOWN -> { ix = params.x; iy = params.y; tx = e.rawX; ty = e.rawY }
                MotionEvent.ACTION_MOVE -> { params.x = ix+(e.rawX-tx).toInt(); params.y = iy+(e.rawY-ty).toInt(); windowManager?.updateViewLayout(floatingView, params) }
                MotionEvent.ACTION_UP -> { packageManager.getLaunchIntentForPackage(packageName)?.let { startActivity(it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } }
            }
            true
        }
        try { windowManager?.addView(floatingView, params) } catch (e: Exception) { e.printStackTrace() }
    }

    private fun updateCount(count: Int) {
        (floatingView as? TextView)?.text = count.toString()
        if (count == 0) { removeBubble(); stopSelf() }
    }

    private fun removeBubble() {
        floatingView?.let { windowManager?.removeView(it) }
        floatingView = null
    }

    override fun onDestroy() { super.onDestroy(); removeBubble() }
}
