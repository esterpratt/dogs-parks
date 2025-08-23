package com.klavhub;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.graphics.Color;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    Window window = getWindow();

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      window.setDecorFitsSystemWindows(false);
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      window.setNavigationBarColor(Color.TRANSPARENT);
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      window.getDecorView().setSystemUiVisibility(
        View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
      );
    }

    // ✅ Ensure default notification channel exists
    createDefaultNotificationChannel();
  }

  private void createDefaultNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      String channelId = "default";
      String name = "General";
      String description = "General notifications";
      int importance = NotificationManager.IMPORTANCE_DEFAULT;

      NotificationChannel channel = new NotificationChannel(channelId, name, importance);
      channel.setDescription(description);

      NotificationManager nm = getSystemService(NotificationManager.class);
      if (nm != null) {
        nm.createNotificationChannel(channel);
      }
    }
  }
}
