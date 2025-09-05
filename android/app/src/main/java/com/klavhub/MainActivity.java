package com.klavhub;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.os.Bundle;

import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    EdgeToEdge.enable(this);

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
