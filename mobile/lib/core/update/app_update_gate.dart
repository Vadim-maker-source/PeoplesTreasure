import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import 'app_update.dart';

class AppUpdateGate extends StatefulWidget {
  const AppUpdateGate({required this.child, super.key});

  final Widget child;

  @override
  State<AppUpdateGate> createState() => _AppUpdateGateState();
}

class _AppUpdateGateState extends State<AppUpdateGate> {
  bool _checked = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _check());
  }

  Future<void> _check() async {
    if (_checked) return;
    _checked = true;

    try {
      final update = await AppUpdateService.availableUpdate();
      if (!mounted || update == null) return;
      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (dialogContext) => PopScope(
          canPop: false,
          child: AlertDialog(
            icon: const Icon(
              Icons.system_update_rounded,
              size: 42,
              color: AppColors.accent,
            ),
            title: const Text('Доступно обновление'),
            content: Text(
              'Установлена устаревшая сборка. Скачайте версию '
              '${update.versionName}, чтобы продолжить работу.',
              textAlign: TextAlign.center,
            ),
            actionsAlignment: MainAxisAlignment.center,
            actions: [
              FilledButton.icon(
                onPressed: () => AppUpdateService.download(update),
                icon: const Icon(Icons.download_rounded),
                label: const Text('Скачать обновление'),
              ),
            ],
          ),
        ),
      );
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
