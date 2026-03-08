import 'package:flutter/material.dart';

/// NOTE: For actual FCM integration, you need to:
/// 1. Add `firebase_core` and `firebase_messaging` to pubspec.yaml
/// 2. Configure Firebase project and add `google-services.json`
/// 3. Initialize Firebase in main.dart: `await Firebase.initializeApp();`
class NotificationService {
  static Future<void> initialize() async {
    // Mock Initialization
    debugPrint('Mock NotificationService Initialized');
  }

  static Future<void> showNotification(String title, String body) async {
    // Mock showing notification
    debugPrint('Mock Notification: $title - $body');
  }
}
