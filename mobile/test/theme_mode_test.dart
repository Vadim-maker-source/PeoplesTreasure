import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:peoples_treasure/core/theme/theme_mode.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    appThemeMode.value = ThemeMode.system;
  });

  test('restores a saved dark theme', () async {
    SharedPreferences.setMockInitialValues({'app_theme_mode': 'dark'});

    await initializeAppTheme();

    expect(appThemeMode.value, ThemeMode.dark);
  });

  test('persists the selected theme', () async {
    await setAppTheme(ThemeMode.light);

    appThemeMode.value = ThemeMode.system;
    await initializeAppTheme();

    expect(appThemeMode.value, ThemeMode.light);
  });
}
