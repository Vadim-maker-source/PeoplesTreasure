import 'package:flutter/material.dart';

final appThemeMode = ValueNotifier<ThemeMode>(ThemeMode.system);

void toggleAppTheme(BuildContext context) {
  appThemeMode.value = Theme.of(context).brightness == Brightness.dark
      ? ThemeMode.light
      : ThemeMode.dark;
}
