import 'package:flutter/material.dart';

// We will import screens here once we create them
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/dashboard/main_navigation.dart';

class AppRoutes {
  static const String login = '/login';
  static const String register = '/register';
  static const String mainNav = '/main';

  static Map<String, WidgetBuilder> getRoutes() {
    return {
      login: (context) => const LoginScreen(),
      register: (context) => const RegisterScreen(),
      mainNav: (context) => const MainNavigation(),
    };
  }
}
