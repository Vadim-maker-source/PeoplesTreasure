import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  static const accent = Color(0xFFFF7340);
  static const action = Color(0xFFFFB840);
  static const actionSoft = Color(0xFFFFCB73);
  static const gradientEnd = Color(0xFFFF4500);
  static const ink = Color(0xFF111827);
  static const muted = Color(0xFF4B5563);
  static const canvas = Color(0xFFFFF9F9);
  static const section = Color(0xFFFFF0F0);
  static const darkCanvas = Color(0xFF364153);
  static const darkSurface = Color(0xFF111827);
  static const border = Color(0xFFE5E7EB);
  static const field = Color(0xFFF9FAFB);
  static const success = Color(0xFF15803D);
}

class AppTheme {
  static ThemeData get light => _theme(Brightness.light);
  static ThemeData get dark => _theme(Brightness.dark);

  static ThemeData _theme(Brightness brightness) {
    final dark = brightness == Brightness.dark;
    final base = ThemeData(useMaterial3: true, brightness: brightness);
    final scheme = ColorScheme(
      brightness: brightness,
      primary: AppColors.accent,
      onPrimary: Colors.white,
      secondary: AppColors.action,
      onSecondary: AppColors.ink,
      error: const Color(0xFFDC2626),
      onError: Colors.white,
      surface: dark ? AppColors.darkSurface : Colors.white,
      onSurface: dark ? Colors.white : AppColors.ink,
    );
    final textTheme = GoogleFonts.nunitoTextTheme(base.textTheme).copyWith(
      displaySmall: GoogleFonts.nunito(
        fontSize: 34,
        height: 1.12,
        fontWeight: FontWeight.w700,
      ),
      headlineLarge: GoogleFonts.nunito(
        fontSize: 30,
        height: 1.18,
        fontWeight: FontWeight.w700,
      ),
      headlineMedium: GoogleFonts.nunito(
        fontSize: 26,
        height: 1.2,
        fontWeight: FontWeight.w700,
      ),
      headlineSmall: GoogleFonts.nunito(
        fontSize: 22,
        height: 1.25,
        fontWeight: FontWeight.w700,
      ),
      titleLarge: GoogleFonts.nunito(
        fontSize: 20,
        height: 1.25,
        fontWeight: FontWeight.w700,
      ),
      titleMedium: GoogleFonts.nunito(
        fontSize: 16,
        height: 1.3,
        fontWeight: FontWeight.w700,
      ),
      bodyLarge: GoogleFonts.nunito(
        fontSize: 16,
        height: 1.5,
        fontWeight: FontWeight.w400,
      ),
      bodyMedium: GoogleFonts.nunito(
        fontSize: 14,
        height: 1.45,
        fontWeight: FontWeight.w400,
      ),
      labelLarge: GoogleFonts.nunito(fontSize: 15, fontWeight: FontWeight.w600),
    );
    return base.copyWith(
      colorScheme: scheme,
      scaffoldBackgroundColor: dark ? AppColors.darkCanvas : AppColors.canvas,
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        elevation: 3,
        shadowColor: Colors.black.withValues(alpha: .16),
        backgroundColor: dark ? const Color(0xFF0F172A) : AppColors.section,
        foregroundColor: dark ? Colors.white : AppColors.ink,
        surfaceTintColor: Colors.transparent,
        centerTitle: false,
        titleTextStyle: textTheme.titleLarge?.copyWith(
          color: dark ? Colors.white : AppColors.ink,
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 6,
        shadowColor: Colors.black.withValues(alpha: .13),
        color: dark ? AppColors.darkSurface : Colors.white,
        surfaceTintColor: Colors.transparent,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          side: BorderSide(
            color: dark ? Colors.white.withValues(alpha: .1) : AppColors.border,
          ),
          borderRadius: BorderRadius.circular(16),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: dark ? const Color(0xFF1F2937) : AppColors.field,
        labelStyle: TextStyle(
          color: dark ? const Color(0xFFE5E7EB) : const Color(0xFF374151),
          fontWeight: FontWeight.w600,
        ),
        hintStyle: TextStyle(
          color: dark ? const Color(0xFF9CA3AF) : const Color(0xFF6B7280),
        ),
        prefixIconColor: const Color(0xFF9CA3AF),
        suffixIconColor: const Color(0xFF9CA3AF),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border, width: 2),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: dark ? const Color(0xFF374151) : AppColors.border,
            width: 2,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.action, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFDC2626), width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size(44, 48),
          backgroundColor: AppColors.accent,
          foregroundColor: Colors.white,
          disabledBackgroundColor: AppColors.accent.withValues(alpha: .5),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle: GoogleFonts.nunito(
            fontSize: 15,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(44, 48),
          foregroundColor: dark ? Colors.white : AppColors.ink,
          side: const BorderSide(color: AppColors.accent),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle: GoogleFonts.nunito(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      dividerColor: dark
          ? Colors.white.withValues(alpha: .12)
          : AppColors.border,
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: AppColors.accent,
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: dark ? AppColors.darkSurface : AppColors.ink,
        contentTextStyle: GoogleFonts.nunito(color: Colors.white),
      ),
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: FadeForwardsPageTransitionsBuilder(),
          TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
          TargetPlatform.macOS: CupertinoPageTransitionsBuilder(),
        },
      ),
    );
  }
}

class BrandMark extends StatelessWidget {
  const BrandMark({super.key, this.size = 48});
  final double size;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Логотип Сокровища народов',
      child: Image.asset(
        'assets/images/logo.png',
        width: size,
        height: size,
        fit: BoxFit.contain,
      ),
    );
  }
}

class BrandButton extends StatelessWidget {
  const BrandButton({
    super.key,
    required this.onPressed,
    required this.child,
    this.icon,
    this.busy = false,
  });
  final VoidCallback? onPressed;
  final Widget child;
  final Widget? icon;
  final bool busy;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.accent, AppColors.gradientEnd],
        ),
        borderRadius: BorderRadius.circular(8),
      ),
      child: icon == null
          ? FilledButton(
              onPressed: busy ? null : onPressed,
              style: FilledButton.styleFrom(
                backgroundColor: Colors.transparent,
                disabledBackgroundColor: Colors.transparent,
                shadowColor: Colors.transparent,
              ),
              child: busy
                  ? const SizedBox.square(
                      dimension: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : child,
            )
          : FilledButton.icon(
              onPressed: busy ? null : onPressed,
              style: FilledButton.styleFrom(
                backgroundColor: Colors.transparent,
                disabledBackgroundColor: Colors.transparent,
                shadowColor: Colors.transparent,
              ),
              icon: icon!,
              label: busy
                  ? const SizedBox.square(
                      dimension: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : child,
            ),
    );
  }
}
