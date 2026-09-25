import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';
import '../../core/theme/theme_mode.dart';
import '../create/create_post_screen.dart';
import '../feed/feed_screen.dart';
import '../peoples/peoples_screen.dart';
import '../profile/profile_screen.dart';
import '../support/support_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;
  int _createKey = 0;

  List<Widget> get _screens => [
    const FeedScreen(),
    const PeoplesScreen(),
    CreatePostScreen(
      key: ValueKey(_createKey),
      onCreated: () => setState(() => _index = 0),
    ),
    const SupportScreen(),
    const ProfileScreen(),
  ];

  static const _items = [
    (CupertinoIcons.house_fill, 'Лента'),
    (CupertinoIcons.map_fill, 'Народы'),
    (CupertinoIcons.add_circled_solid, 'Создать'),
    (CupertinoIcons.chat_bubble_2_fill, 'Поддержка'),
    (CupertinoIcons.person_crop_circle_fill, 'Профиль'),
  ];

  void _select(int value) {
    setState(() {
      if (value == 2 && _index == 2) _createKey++;
      _index = value;
    });
  }

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final navigationColor = dark ? const Color(0xFF0F172A) : AppColors.section;
    return LayoutBuilder(
      builder: (context, constraints) {
        final wide = constraints.maxWidth >= 840;
        final content = MediaQuery.removePadding(
          context: context,
          removeTop: true,
          child: IndexedStack(index: _index, children: _screens),
        );
        final header = const _SiteHeader();
        if (wide) {
          return Scaffold(
            body: SafeArea(
              child: Column(
                children: [
                  header,
                  Expanded(
                    child: Row(
                      children: [
                        NavigationRail(
                          backgroundColor: navigationColor,
                          selectedIndex: _index,
                          onDestinationSelected: _select,
                          extended: constraints.maxWidth >= 1100,
                          labelType: constraints.maxWidth >= 1100
                              ? NavigationRailLabelType.none
                              : NavigationRailLabelType.all,
                          indicatorColor: AppColors.action,
                          selectedIconTheme: const IconThemeData(
                            color: AppColors.ink,
                          ),
                          destinations: _items
                              .map(
                                (item) => NavigationRailDestination(
                                  icon: Icon(item.$1),
                                  label: Text(item.$2),
                                ),
                              )
                              .toList(),
                        ),
                        Expanded(child: content),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        }
        return Scaffold(
          body: SafeArea(
            child: Column(
              children: [
                header,
                Expanded(child: content),
              ],
            ),
          ),
          bottomNavigationBar: NavigationBarTheme(
            data: NavigationBarThemeData(
              backgroundColor: navigationColor,
              indicatorColor: AppColors.action,
              iconTheme: WidgetStateProperty.resolveWith(
                (states) => IconThemeData(
                  color: states.contains(WidgetState.selected)
                      ? AppColors.ink
                      : (dark ? Colors.white70 : AppColors.muted),
                ),
              ),
              labelTextStyle: WidgetStateProperty.resolveWith(
                (states) => TextStyle(
                  color: dark ? Colors.white : AppColors.ink,
                  fontSize: 11,
                  fontWeight: states.contains(WidgetState.selected)
                      ? FontWeight.w700
                      : FontWeight.w600,
                ),
              ),
            ),
            child: NavigationBar(
              height: 70,
              selectedIndex: _index,
              onDestinationSelected: _select,
              labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
              destinations: _items
                  .map(
                    (item) => NavigationDestination(
                      icon: Icon(item.$1),
                      label: item.$2,
                    ),
                  )
                  .toList(),
            ),
          ),
        );
      },
    );
  }
}

class _SiteHeader extends StatelessWidget {
  const _SiteHeader();

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Material(
      elevation: 4,
      shadowColor: Colors.black.withValues(alpha: .18),
      color: dark ? const Color(0xFF0F172A) : AppColors.section,
      child: SizedBox(
        height: 64,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              Image.asset(
                dark
                    ? 'assets/images/logo-white.png'
                    : 'assets/images/logo2.png',
                height: 34,
                fit: BoxFit.contain,
              ),
              const Spacer(),
              InkWell(
                onTap: () => toggleAppTheme(context),
                borderRadius: BorderRadius.circular(999),
                child: Container(
                  width: 76,
                  height: 38,
                  padding: const EdgeInsets.all(3),
                  decoration: BoxDecoration(
                    color: AppColors.action,
                    border: Border.all(color: AppColors.accent),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: AnimatedAlign(
                    duration: const Duration(milliseconds: 200),
                    alignment: dark
                        ? Alignment.centerRight
                        : Alignment.centerLeft,
                    child: Container(
                      width: 30,
                      height: 30,
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        dark
                            ? CupertinoIcons.moon_fill
                            : CupertinoIcons.sun_max_fill,
                        size: 17,
                        color: AppColors.accent,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
