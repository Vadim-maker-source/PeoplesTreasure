import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/common.dart';
import '../../models/models.dart';

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  List<SupportTicket>? _tickets;
  Object? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await ApiClient.instance.get('/support') as List;
      if (mounted) {
        setState(() {
          _tickets = data
              .map(
                (item) => SupportTicket.fromJson(
                  Map<String, dynamic>.from(item as Map),
                ),
              )
              .toList();
          _error = null;
        });
      }
    } catch (error) {
      if (mounted) setState(() => _error = error);
    }
  }

  Future<void> _newTicket() async {
    final subject = TextEditingController();
    final message = TextEditingController();
    final submitted = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (context) => Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          4,
          20,
          MediaQuery.viewInsetsOf(context).bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Новое обращение',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: subject,
              maxLength: 150,
              decoration: const InputDecoration(labelText: 'Тема'),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: message,
              minLines: 5,
              maxLines: 8,
              maxLength: 5000,
              decoration: const InputDecoration(
                labelText: 'Что случилось?',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () => Navigator.pop(context, true),
                child: const Text('Отправить'),
              ),
            ),
          ],
        ),
      ),
    );
    if (submitted != true) return;
    try {
      await ApiClient.instance.post(
        '/support',
        data: {'subject': subject.text.trim(), 'message': message.text.trim()},
      );
      await _load();
      if (mounted) showAppMessage(context, 'Обращение создано');
    } catch (error) {
      if (mounted) showAppMessage(context, '$error', error: true);
    } finally {
      subject.dispose();
      message.dispose();
    }
  }

  @override
  Widget build(BuildContext context) {
    final tickets = _tickets;
    return SafeArea(
      bottom: false,
      child: RefreshIndicator(
        onRefresh: _load,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            const SliverToBoxAdapter(
              child: PageIntro(
                eyebrow: 'Мы рядом',
                title: 'Поддержка',
                subtitle:
                    'Расскажите о проблеме — ответ сохранится прямо здесь.',
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 18),
                child: SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: _newTicket,
                    icon: const Icon(CupertinoIcons.add),
                    label: const Text('Новое обращение'),
                  ),
                ),
              ),
            ),
            if (tickets == null && _error == null)
              const SliverFillRemaining(
                hasScrollBody: false,
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_error != null)
              SliverFillRemaining(
                hasScrollBody: false,
                child: StateView(
                  icon: CupertinoIcons.wifi_exclamationmark,
                  title: 'Не удалось загрузить обращения',
                  message: '$_error',
                  onRetry: _load,
                ),
              )
            else if (tickets!.isEmpty)
              const SliverFillRemaining(
                hasScrollBody: false,
                child: StateView(
                  icon: CupertinoIcons.chat_bubble_2,
                  title: 'Обращений пока нет',
                  message:
                      'Если что-то не работает или нужна помощь, напишите нам.',
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 110),
                sliver: SliverList.separated(
                  itemCount: tickets.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final ticket = tickets[index];
                    final answered = ticket.adminResponse?.isNotEmpty == true;
                    return GlassSurface(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  ticket.subject,
                                  style: Theme.of(context).textTheme.titleLarge,
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 5,
                                ),
                                decoration: BoxDecoration(
                                  color:
                                      (answered
                                              ? AppColors.success
                                              : AppColors.accent)
                                          .withValues(alpha: .12),
                                  borderRadius: BorderRadius.circular(999),
                                ),
                                child: Text(
                                  answered ? 'Есть ответ' : 'В работе',
                                  style: TextStyle(
                                    color: answered
                                        ? AppColors.success
                                        : AppColors.accent,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(ticket.message),
                          if (answered) ...[
                            const SizedBox(height: 14),
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: AppColors.success.withValues(alpha: .08),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Text(ticket.adminResponse!),
                            ),
                          ],
                          const SizedBox(height: 10),
                          Text(
                            DateFormat(
                              'd MMMM, HH:mm',
                              'ru',
                            ).format(ticket.createdAt.toLocal()),
                            style: TextStyle(
                              fontSize: 12,
                              color: Theme.of(
                                context,
                              ).colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }
}
