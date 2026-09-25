import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_controller.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/common.dart';
import '../admin/admin_screen.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  List<Map<String, dynamic>>? _courses;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await ApiClient.instance.get('/courses') as List;
      if (mounted) {
        setState(
          () => _courses = data
              .map((item) => Map<String, dynamic>.from(item as Map))
              .toList(),
        );
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).value;
    if (user == null) return const SizedBox.shrink();
    final courses = _courses ?? [];
    final completed = courses.where((item) => item['completed'] == true).length;
    return SafeArea(
      bottom: false,
      child: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.only(bottom: 110),
          children: [
            const PageIntro(eyebrow: 'Ваше пространство', title: 'Профиль'),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                children: [
                  GlassSurface(
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 36,
                          backgroundColor: AppColors.accent.withValues(
                            alpha: .13,
                          ),
                          backgroundImage: user.avatar == null
                              ? null
                              : CachedNetworkImageProvider(user.avatar!),
                          child: user.avatar == null
                              ? Text(
                                  user.name.isEmpty ? '?' : user.name[0],
                                  style: Theme.of(context)
                                      .textTheme
                                      .headlineSmall
                                      ?.copyWith(color: AppColors.accent),
                                )
                              : null,
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                user.name,
                                style: Theme.of(context).textTheme.titleLarge,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                user.email,
                                style: TextStyle(
                                  color: Theme.of(
                                    context,
                                  ).colorScheme.onSurfaceVariant,
                                ),
                              ),
                              if (user.region?.isNotEmpty == true)
                                Padding(
                                  padding: const EdgeInsets.only(top: 4),
                                  child: Text(
                                    user.region!,
                                    style: const TextStyle(
                                      color: AppColors.accent,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                        if (user.isAdmin)
                          const Icon(
                            CupertinoIcons.checkmark_shield_fill,
                            color: AppColors.accent,
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: _Stat(value: '$completed', label: 'пройдено'),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _Stat(
                          value: '${courses.length}',
                          label: 'начато',
                        ),
                      ),
                    ],
                  ),
                  if (user.bio?.isNotEmpty == true) ...[
                    const SizedBox(height: 14),
                    GlassSurface(
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: Text(user.bio!),
                      ),
                    ),
                  ],
                  const SizedBox(height: 20),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      'Прогресс',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  const SizedBox(height: 10),
                  if (_courses == null)
                    const LinearProgressIndicator()
                  else if (courses.isEmpty)
                    const GlassSurface(
                      child: Text(
                        'Пройдите первый тест в каталоге народов — результат появится здесь.',
                      ),
                    )
                  else
                    for (final course in courses)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: GlassSurface(
                          padding: const EdgeInsets.all(14),
                          radius: 18,
                          child: Row(
                            children: [
                              Container(
                                width: 42,
                                height: 42,
                                decoration: BoxDecoration(
                                  color:
                                      (course['completed'] == true
                                              ? AppColors.success
                                              : AppColors.accent)
                                          .withValues(alpha: .12),
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                child: Icon(
                                  course['completed'] == true
                                      ? CupertinoIcons.checkmark_seal_fill
                                      : CupertinoIcons.chart_bar_fill,
                                  color: course['completed'] == true
                                      ? AppColors.success
                                      : AppColors.accent,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  '${course['ethnicGroupName']}',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                              Text(
                                '${course['score']} балл.',
                                style: TextStyle(
                                  color: Theme.of(
                                    context,
                                  ).colorScheme.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                  const SizedBox(height: 14),
                  if (user.isAdmin)
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.tonalIcon(
                        onPressed: () => Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => const AdminScreen(),
                          ),
                        ),
                        icon: const Icon(CupertinoIcons.shield_lefthalf_fill),
                        label: const Text('Панель администратора'),
                      ),
                    ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () => ref.read(authProvider.notifier).logout(),
                      icon: const Icon(CupertinoIcons.square_arrow_right),
                      label: const Text('Выйти'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.value, required this.label});
  final String value;
  final String label;
  @override
  Widget build(BuildContext context) => GlassSurface(
    padding: const EdgeInsets.all(16),
    radius: 20,
    child: Column(
      children: [
        Text(value, style: Theme.of(context).textTheme.headlineMedium),
        Text(
          label,
          style: TextStyle(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    ),
  );
}
