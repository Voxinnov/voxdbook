import 'package:flutter/material.dart';

class AppTheme {
  // ── Voxinnov Brand Colors (from voxinnov.com) ──
  static const Color primaryRed    = Color(0xFFED1C24);   // VOX red
  static const Color limeAccent    = Color(0xFFC9F31D);   // Accent lime
  static const Color darkBg        = Color(0xFF121212);   // Main dark bg
  static const Color darkSurface   = Color(0xFF1E1E1E);   // Card/surface bg
  static const Color darkBorder    = Color(0xFF2A2A2A);   // Dividers
  static const Color whiteText     = Color(0xFFFFFFFF);
  static const Color greyText      = Color(0xFF999999);
  static const Color lightBg       = Color(0xFFF5F5F5);
  static const Color lightSurface  = Color(0xFFFFFFFF);

  // ── Dark Theme (matching voxinnov.com) ──
  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: darkBg,
      primaryColor: primaryRed,
      colorScheme: const ColorScheme.dark(
        primary: primaryRed,
        secondary: limeAccent,
        background: darkBg,
        surface: darkSurface,
        onPrimary: whiteText,
        onSecondary: darkBg,
        onBackground: whiteText,
        onSurface: whiteText,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: darkBg,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          color: whiteText,
          fontSize: 18,
          fontWeight: FontWeight.bold,
          letterSpacing: 1.2,
        ),
        iconTheme: IconThemeData(color: whiteText),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: darkSurface,
        selectedItemColor: primaryRed,
        unselectedItemColor: greyText,
        type: BottomNavigationBarType.fixed,
      ),
      cardTheme: CardThemeData(
        color: darkSurface,
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: darkBorder),
        ),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: primaryRed,
        foregroundColor: whiteText,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryRed,
          foregroundColor: whiteText,
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle: const TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.1),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: primaryRed),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: darkSurface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: darkBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: darkBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: primaryRed, width: 2),
        ),
        labelStyle: const TextStyle(color: greyText),
        prefixIconColor: greyText,
      ),
      checkboxTheme: CheckboxThemeData(
        fillColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected) ? primaryRed : Colors.transparent,
        ),
        checkColor: WidgetStateProperty.all(whiteText),
        side: const BorderSide(color: greyText),
      ),
      dividerColor: darkBorder,
      textTheme: const TextTheme(
        headlineLarge: TextStyle(color: whiteText, fontWeight: FontWeight.bold),
        headlineMedium: TextStyle(color: whiteText, fontWeight: FontWeight.bold),
        bodyLarge:  TextStyle(color: whiteText),
        bodyMedium: TextStyle(color: greyText),
        labelSmall: TextStyle(color: greyText),
      ),
      snackBarTheme: const SnackBarThemeData(
        backgroundColor: darkSurface,
        contentTextStyle: TextStyle(color: whiteText),
      ),
    );
  }

  // ── Light Theme ──
  static ThemeData get lightTheme {
    return ThemeData(
      brightness: Brightness.light,
      scaffoldBackgroundColor: lightBg,
      primaryColor: primaryRed,
      colorScheme: const ColorScheme.light(
        primary: primaryRed,
        secondary: limeAccent,
        background: lightBg,
        surface: lightSurface,
        onPrimary: whiteText,
        onSecondary: darkBg,
        onBackground: darkBg,
        onSurface: darkBg,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: primaryRed,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          color: whiteText,
          fontSize: 18,
          fontWeight: FontWeight.bold,
          letterSpacing: 1.2,
        ),
        iconTheme: IconThemeData(color: whiteText),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        selectedItemColor: primaryRed,
        unselectedItemColor: greyText,
        type: BottomNavigationBarType.fixed,
      ),
      cardTheme: CardThemeData(
        color: lightSurface,
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: primaryRed,
        foregroundColor: whiteText,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryRed,
          foregroundColor: whiteText,
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle: const TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.1),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: primaryRed),
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: primaryRed, width: 2),
        ),
        labelStyle: const TextStyle(color: greyText),
        prefixIconColor: greyText,
      ),
      checkboxTheme: CheckboxThemeData(
        fillColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected) ? primaryRed : Colors.transparent,
        ),
      ),
    );
  }
}
