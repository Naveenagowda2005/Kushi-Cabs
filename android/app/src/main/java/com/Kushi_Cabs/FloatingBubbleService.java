package com.kushi_cabs;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.PixelFormat;
import android.media.AudioManager;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.os.Vibrator;
import android.util.Log;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;
import android.widget.TextView;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

/**
 * FloatingBubbleService
 * 
 * System-level overlay floating bubble for trip notifications
 * Features:
 * - Circle 360x360px at TOP-RIGHT corner (20px from edges)
 * - "Kushi Cabs" text in blue (#0066CC)
 * - GPS radar animation (pulsing blue circles)
 * - Trip count badge (red #FF6B6B, top-right)
 * - Dropdown menu with trip details
 * - ring.mp3 custom sound on trip notification
 * - Vibration feedback (50ms + 100ms + 50ms pattern)
 * - Works when app backgrounded or closed
 */
public class FloatingBubbleService extends Service {
    private static final String TAG = "FloatingBubbleService";
    private static final String CHANNEL_ID = "floating_bubble_channel";
    private static final int NOTIFICATION_ID = 9001;
    
    private WindowManager windowManager;
    private FrameLayout bubbleLayout;
    private RelativeLayout bubbleCircle;
    private LinearLayout dropdownMenu;
    private TextView tripCountBadge;
    private boolean isDropdownOpen = false;
    private float lastTouchX, lastTouchY;
    private long touchStartTime;
    private static final long TOUCH_THRESHOLD_MS = 200;
    private int currentTripCount = 0;
    private AudioManager audioManager;
    private Vibrator vibrator;
    
    // Trip details for dropdown
    private String tripPickup = "Pickup Location";
    private String tripDropoff = "Dropoff Location";
    private String tripFare = "$0.00";
    private String tripStatus = "In Progress";

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "FloatingBubbleService started");
        
        audioManager = (AudioManager) getSystemService(AUDIO_SERVICE);
        vibrator = (Vibrator) getSystemService(VIBRATOR_SERVICE);
        
        // Start as foreground service
        createNotificationChannel();
        startForeground(NOTIFICATION_ID, createNotification());
        
        if (intent != null) {
            String action = intent.getStringExtra("action");
            
            if ("show".equals(action)) {
                if (bubbleLayout == null) {
                    createBubble();
                }
                updateBubbleContent(intent);
            } else if ("hide".equals(action)) {
                hideBubble();
                stopForeground(true);
                stopSelf();
            } else if ("update".equals(action)) {
                int newTripCount = intent.getIntExtra("tripCount", -1);
                
                if (newTripCount != -1 && newTripCount != currentTripCount) {
                    Log.d(TAG, "Trip count changed: " + currentTripCount + " -> " + newTripCount);
                    updateTripCount(newTripCount);
                    playNotificationSound();
                    playVibration();
                } else {
                    updateBubbleContent(intent);
                }
            }
        }
        
        return START_STICKY;
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Floating Bubble",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Trip notifications");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }
    
    private Notification createNotification() {
        Intent launchIntent = new Intent(this, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Kushi Cabs")
            .setContentText("Trip in progress...")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();
    }

    private void createBubble() {
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        bubbleLayout = new FrameLayout(this);

        createBubbleCircle();
        createDropdownMenu();

        bubbleLayout.addView(bubbleCircle);
        bubbleLayout.addView(dropdownMenu);

        WindowManager.LayoutParams params = new WindowManager.LayoutParams();
        params.type = getWindowType();
        params.format = PixelFormat.TRANSLUCENT;
        params.flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE |
                       WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN;
        params.width = WindowManager.LayoutParams.WRAP_CONTENT;
        params.height = WindowManager.LayoutParams.WRAP_CONTENT;
        params.gravity = Gravity.TOP | Gravity.RIGHT;
        params.x = 20;
        params.y = 20;

        try {
            windowManager.addView(bubbleLayout, params);
            Log.d(TAG, "Bubble view added at TOP-RIGHT (20px from edges)");
        } catch (Exception e) {
            Log.e(TAG, "Error adding bubble view: " + e.getMessage());
        }
    }

    private void createBubbleCircle() {
        bubbleCircle = new RelativeLayout(this);
        bubbleCircle.setLayoutParams(new FrameLayout.LayoutParams(360, 360));
        bubbleCircle.setBackgroundColor(android.graphics.Color.WHITE);
        bubbleCircle.setPadding(20, 20, 20, 20);

        // GPS Radar background animation
        GPSRadarView radarView = new GPSRadarView(this);
        radarView.setLayoutParams(new RelativeLayout.LayoutParams(
            RelativeLayout.LayoutParams.MATCH_PARENT,
            RelativeLayout.LayoutParams.MATCH_PARENT
        ));
        radarView.setBackgroundColor(0x00000000);
        bubbleCircle.addView(radarView);

        // "Kushi Cabs" text - Blue #0066CC
        TextView bubbleText = new TextView(this);
        bubbleText.setText("Kushi\nCabs");
        bubbleText.setTextSize(16);
        bubbleText.setTextColor(0xFF0066CC);
        bubbleText.setTypeface(null, android.graphics.Typeface.BOLD);
        bubbleText.setGravity(View.TEXT_ALIGNMENT_CENTER);

        RelativeLayout.LayoutParams textParams = new RelativeLayout.LayoutParams(
            RelativeLayout.LayoutParams.WRAP_CONTENT,
            RelativeLayout.LayoutParams.WRAP_CONTENT
        );
        textParams.addRule(RelativeLayout.CENTER_IN_PARENT);
        bubbleText.setLayoutParams(textParams);
        bubbleCircle.addView(bubbleText);

        // Trip count badge - Red #FF6B6B
        tripCountBadge = new TextView(this);
        tripCountBadge.setText("1");
        tripCountBadge.setTextSize(14);
        tripCountBadge.setTextColor(android.graphics.Color.WHITE);
        tripCountBadge.setTypeface(null, android.graphics.Typeface.BOLD);
        tripCountBadge.setGravity(android.view.Gravity.CENTER);
        tripCountBadge.setBackgroundColor(0xFFFF6B6B);
        tripCountBadge.setPadding(8, 4, 8, 4);

        RelativeLayout.LayoutParams badgeParams = new RelativeLayout.LayoutParams(56, 56);
        badgeParams.addRule(RelativeLayout.ALIGN_PARENT_TOP);
        badgeParams.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);
        badgeParams.setMargins(0, 16, 16, 0);
        tripCountBadge.setLayoutParams(badgeParams);
        bubbleCircle.addView(tripCountBadge);

        bubbleCircle.setOnTouchListener(this::handleBubbleTouch);
    }

    private void createDropdownMenu() {
        dropdownMenu = new LinearLayout(this);
        dropdownMenu.setOrientation(LinearLayout.VERTICAL);
        dropdownMenu.setBackgroundColor(android.graphics.Color.WHITE);
        dropdownMenu.setVisibility(View.GONE);
        dropdownMenu.setPadding(12, 12, 12, 12);

        createDropdownMenuContent();

        FrameLayout.LayoutParams menuParams = new FrameLayout.LayoutParams(
            560,
            FrameLayout.LayoutParams.WRAP_CONTENT,
            Gravity.TOP | Gravity.RIGHT
        );
        menuParams.setMargins(0, 380, 20, 0);
        dropdownMenu.setLayoutParams(menuParams);
    }
    
    private void createDropdownMenuContent() {
        // Trip card title
        TextView titleText = new TextView(this);
        titleText.setText("Active Trip");
        titleText.setTextSize(14);
        titleText.setTextColor(0xFF0066CC);
        titleText.setTypeface(null, android.graphics.Typeface.BOLD);
        titleText.setPadding(0, 0, 0, 8);
        dropdownMenu.addView(titleText);

        // Divider
        View divider1 = createDivider();
        dropdownMenu.addView(divider1);

        // Pickup location
        TextView pickupLabel = createDetailLabel("📍 Pickup:");
        TextView pickupValue = createDetailValue(tripPickup);
        dropdownMenu.addView(pickupLabel);
        dropdownMenu.addView(pickupValue);

        // Divider
        View divider2 = createDivider();
        dropdownMenu.addView(divider2);

        // Dropoff location
        TextView dropoffLabel = createDetailLabel("📍 Dropoff:");
        TextView dropoffValue = createDetailValue(tripDropoff);
        dropdownMenu.addView(dropoffLabel);
        dropdownMenu.addView(dropoffValue);

        // Divider
        View divider3 = createDivider();
        dropdownMenu.addView(divider3);

        // Fare amount
        TextView fareLabel = createDetailLabel("💵 Fare:");
        TextView fareValue = createDetailValue(tripFare);
        fareValue.setTextColor(0xFFFF6B6B);
        fareValue.setTypeface(null, android.graphics.Typeface.BOLD);
        dropdownMenu.addView(fareLabel);
        dropdownMenu.addView(fareValue);

        // Divider
        View divider4 = createDivider();
        dropdownMenu.addView(divider4);

        // Status
        TextView statusLabel = createDetailLabel("Status:");
        TextView statusValue = createDetailValue(tripStatus);
        statusValue.setTextColor(0xFF00CC44);
        dropdownMenu.addView(statusLabel);
        dropdownMenu.addView(statusValue);
    }

    private TextView createDetailLabel(String text) {
        TextView label = new TextView(this);
        label.setText(text);
        label.setTextSize(11);
        label.setTextColor(0xFF333333);
        label.setTypeface(null, android.graphics.Typeface.BOLD);
        label.setPadding(0, 4, 0, 2);
        return label;
    }

    private TextView createDetailValue(String text) {
        TextView value = new TextView(this);
        value.setText(text);
        value.setTextSize(12);
        value.setTextColor(0xFF333333);
        value.setPadding(12, 0, 0, 6);
        return value;
    }

    private View createDivider() {
        View divider = new View(this);
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            1
        );
        params.setMargins(0, 4, 0, 4);
        divider.setLayoutParams(params);
        divider.setBackgroundColor(0xFFEEEEEE);
        return divider;
    }

    private boolean handleBubbleTouch(View v, MotionEvent event) {
        switch (event.getAction()) {
            case MotionEvent.ACTION_DOWN:
                touchStartTime = System.currentTimeMillis();
                lastTouchX = event.getRawX();
                lastTouchY = event.getRawY();
                return true;

            case MotionEvent.ACTION_UP:
                long touchDuration = System.currentTimeMillis() - touchStartTime;
                float moveDistance = (float) Math.sqrt(
                    Math.pow(event.getRawX() - lastTouchX, 2) +
                    Math.pow(event.getRawY() - lastTouchY, 2)
                );

                if (touchDuration < TOUCH_THRESHOLD_MS && moveDistance < 50) {
                    handleBubbleClick();
                    return true;
                }
                break;
        }
        return false;
    }

    private void handleBubbleClick() {
        Log.d(TAG, "Bubble clicked");
        
        if (isDropdownOpen) {
            closeDropdown();
        } else {
            openDropdown();
            
            // Open app after a short delay
            new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
                Intent launchIntent = new Intent(FloatingBubbleService.this, MainActivity.class);
                launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
                try {
                    startActivity(launchIntent);
                    Log.d(TAG, "App opened - MainActivity launched");
                } catch (Exception e) {
                    Log.e(TAG, "Error opening app: " + e.getMessage());
                }
            }, 300);
        }
    }

    private void openDropdown() {
        isDropdownOpen = true;
        dropdownMenu.setVisibility(View.VISIBLE);
        Log.d(TAG, "Dropdown opened");
    }

    private void closeDropdown() {
        isDropdownOpen = false;
        dropdownMenu.setVisibility(View.GONE);
        Log.d(TAG, "Dropdown closed");
    }

    private void updateBubbleContent(Intent intent) {
        if (intent == null) return;
        
        int tripCount = intent.getIntExtra("tripCount", 0);
        
        // Extract trip details from intent
        String newPickup = intent.getStringExtra("tripPickup");
        if (newPickup == null) newPickup = "Pickup Location";
        
        String newDropoff = intent.getStringExtra("tripDropoff");
        if (newDropoff == null) newDropoff = "Dropoff Location";
        
        String newFare = intent.getStringExtra("tripFare");
        if (newFare == null) newFare = "$0.00";
        
        String newStatus = intent.getStringExtra("tripStatus");
        if (newStatus == null) newStatus = "In Progress";
        
        // Update values
        tripPickup = newPickup;
        tripDropoff = newDropoff;
        tripFare = newFare;
        tripStatus = newStatus;
        
        // Refresh dropdown with new content
        if (isDropdownOpen && dropdownMenu != null) {
            dropdownMenu.removeAllViews();
            createDropdownMenuContent();
        }
        
        Log.d(TAG, "Updating bubble - Trip count: " + tripCount + 
              ", Pickup: " + tripPickup + ", Dropoff: " + tripDropoff + 
              ", Fare: " + tripFare + ", Status: " + tripStatus);
    }

    private void updateTripCount(int newCount) {
        if (tripCountBadge != null) {
            currentTripCount = newCount;
            tripCountBadge.setText(String.valueOf(newCount));
            
            tripCountBadge.animate()
                .scaleX(1.3f)
                .scaleY(1.3f)
                .setDuration(200)
                .withEndAction(() -> {
                    tripCountBadge.animate()
                        .scaleX(1.0f)
                        .scaleY(1.0f)
                        .setDuration(200)
                        .start();
                })
                .start();
            
            Log.d(TAG, "Trip count badge updated to: " + newCount);
        }
    }

    private void playNotificationSound() {
        try {
            Uri soundUri = Uri.parse("android.resource://" + getPackageName() + "/" + R.raw.ring);
            android.media.Ringtone ringtone = RingtoneManager.getRingtone(this, soundUri);
            ringtone.play();
            Log.d(TAG, "ring.mp3 notification sound played");
        } catch (Exception e) {
            Log.e(TAG, "Error playing ring.mp3: " + e.getMessage());
            try {
                Uri fallbackUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
                android.media.Ringtone fallbackRingtone = RingtoneManager.getRingtone(this, fallbackUri);
                fallbackRingtone.play();
                Log.d(TAG, "Fallback system notification played");
            } catch (Exception ex) {
                Log.e(TAG, "Fallback failed: " + ex.getMessage());
            }
        }
    }

    private void playVibration() {
        try {
            if (vibrator != null && vibrator.hasVibrator()) {
                long[] pattern = {0, 50, 100, 50};
                vibrator.vibrate(pattern, -1);
                Log.d(TAG, "Vibration triggered (50ms + 100ms + 50ms)");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error playing vibration: " + e.getMessage());
        }
    }

    private void hideBubble() {
        if (windowManager != null && bubbleLayout != null) {
            try {
                windowManager.removeView(bubbleLayout);
                Log.d(TAG, "Bubble removed");
            } catch (Exception e) {
                Log.e(TAG, "Error removing bubble: " + e.getMessage());
            }
        }
    }

    private int getWindowType() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            return WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
        }
        return WindowManager.LayoutParams.TYPE_PHONE;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        hideBubble();
        Log.d(TAG, "FloatingBubbleService destroyed");
    }
}

class GPSRadarView extends View {
    private Paint radarPaint;
    private Paint circlePaint;
    private float animationProgress = 0f;
    private static final int ANIMATION_DURATION = 1500;
    private long lastAnimationTime = 0;
    private static final int RADAR_CIRCLES = 3;

    public GPSRadarView(android.content.Context context) {
        super(context);
        init();
    }

    private void init() {
        radarPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        radarPaint.setStyle(Paint.Style.STROKE);
        radarPaint.setColor(0xFF0066CC);
        radarPaint.setStrokeWidth(2f);

        circlePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        circlePaint.setStyle(Paint.Style.STROKE);
        circlePaint.setColor(0xFF0066CC);
        circlePaint.setStrokeWidth(1.5f);
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);

        long currentTime = System.currentTimeMillis();
        if (lastAnimationTime == 0) {
            lastAnimationTime = currentTime;
        }

        long elapsed = (currentTime - lastAnimationTime) % ANIMATION_DURATION;
        animationProgress = (float) elapsed / ANIMATION_DURATION;

        int centerX = getWidth() / 2;
        int centerY = getHeight() / 2;
        float maxRadius = Math.min(centerX, centerY) - 20;

        for (int i = 0; i < RADAR_CIRCLES; i++) {
            float staggered = (animationProgress + (float) i / RADAR_CIRCLES) % 1.0f;
            float radius = maxRadius * staggered;
            int alpha = (int) (255 * (1.0f - staggered));
            radarPaint.setAlpha(alpha);
            canvas.drawCircle(centerX, centerY, radius, radarPaint);
        }

        circlePaint.setAlpha(255);
        canvas.drawCircle(centerX, centerY, 6f, circlePaint);

        invalidate();
    }
}
