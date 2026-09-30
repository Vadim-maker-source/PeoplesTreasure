import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

final appThemeMode = ValueNotifier<ThemeMode>(ThemeMode.system);
const _themePreferenceKey = 'app_theme_mode';

Future<void> initializeAppTheme() async {
  final preferences = await SharedPreferences.getInstance();
  appThemeMode.value = switch (preferences.getString(_themePreferenceKey)) {
    'light' => ThemeMode.light,
    'dark' => ThemeMode.dark,
    _ => ThemeMode.system,
  };
}

Future<void> setAppTheme(ThemeMode mode) async {
  appThemeMode.value = mode;
  final preferences = await SharedPreferences.getInstance();
  if (mode == ThemeMode.system) {
    await preferences.remove(_themePreferenceKey);
    return;
  }
  await preferences.setString(_themePreferenceKey, mode.name);
}

Future<void> toggleAppTheme(BuildContext context) => setAppTheme(
  Theme.of(context).brightness == Brightness.dark
      ? ThemeMode.light
      : ThemeMode.dark,
);
