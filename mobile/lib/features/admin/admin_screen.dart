import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/common.dart';
import '../../models/models.dart';

class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  int _section = 0;
  List<Post>? _posts;
  List<Map<String, dynamic>>? _tickets;
  Object? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _error = null);
    try {
      final responses = await Future.wait([
        ApiClient.instance.get('/admin/posts'),
        ApiClient.instance.get('/admin/support'),
      ]);
      if (mounted) {
        setState(() {
          _posts = (responses[0] as List)
              .map(
                (item) => Post.fromJson(Map<String, dynamic>.from(item as Map)),
              )
              .toList();
          _tickets = (responses[1] as List)
              .map((item) => Map<String, dynamic>.from(item as Map))
              .toList();
        });
      }
    } catch (error) {
      if (mounted) setState(() => _error = error);
    }
  }

  Future<void> _moderate(Post post, String action) async {
    try {
      await ApiClient.instance.patch(
        '/admin/posts/${post.id}',
        data: {'action': action},
      );
      await _load();
      if (mounted) {
        showAppMessage(
          context,
          action == 'approve' ? 'Публикация одобрена' : 'Публикация отклонена',
        );
      }
    } catch (error) {
      if (mounted) showAppMessage(context, '$error', error: true);
    }
  }

  Future<void> _answer(Map<String, dynamic> ticket) async {
    final answer = TextEditingController();
    final send = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (context) => Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          6,
          20,
          MediaQuery.viewInsetsOf(context).bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${ticket['subject']}',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text('${ticket['message']}'),
            const SizedBox(height: 16),
            TextField(
              controller: answer,
              minLines: 4,
              maxLines: 8,
              decoration: const InputDecoration(
                labelText: 'Ответ пользователю',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () => Navigator.pop(context, true),
                child: const Text('Отправить ответ'),
              ),
            ),
          ],
        ),
      ),
    );
    if (send == true && answer.text.trim().isNotEmpty) {
      try {
        await ApiClient.instance.patch(
          '/admin/support/${ticket['id']}',
          data: {'answer': answer.text.trim()},
        );
        await _load();
      } catch (error) {
        if (mounted) showAppMessage(context, '$error', error: true);
      }
    }
    answer.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final loading = _posts == null || _tickets == null;
    return Scaffold(
      appBar: AppBar(title: const Text('Управление')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 4, 20, 14),
            child: SegmentedButton<int>(
              segments: [
                ButtonSegment(
                  value: 0,
                  icon: const Icon(CupertinoIcons.doc_text),
                  label: Text('Публикации · ${_posts?.length ?? 0}'),
                ),
                ButtonSegment(
                  value: 1,
                  icon: const Icon(CupertinoIcons.chat_bubble_2),
                  label: Text('Поддержка · ${_tickets?.length ?? 0}'),
                ),
              ],
              selected: {_section},
              onSelectionChanged: (value) =>
                  setState(() => _section = value.first),
              showSelectedIcon: false,
            ),
          ),
          Expanded(
            child: loading && _error == null
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                ? StateView(
                    icon: CupertinoIcons.exclamationmark_triangle,
                    title: 'Данные не загрузились',
                    message: '$_error',
                    onRetry: _load,
                  )
                : RefreshIndicator(
                    onRefresh: _load,
                    child: _section == 0 ? _postsList() : _ticketsList(),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _postsList() {
    final posts = _posts!;
    if (posts.isEmpty) {
      return ListView(
        children: [
          SizedBox(height: 100),
          StateView(
            icon: CupertinoIcons.checkmark_seal,
            title: 'Очередь пуста',
            message: 'Все публикации уже проверены.',
          ),
        ],
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 30),
      itemCount: posts.length,
      separatorBuilder: (_, _) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final post = posts[index];
        return GlassSurface(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(post.title, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 5),
              Text(
                '${post.author.name} · ${post.content}',
                maxLines: 4,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => _moderate(post, 'reject'),
                      child: const Text('Отклонить'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: FilledButton(
                      onPressed: () => _moderate(post, 'approve'),
                      child: const Text('Одобрить'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _ticketsList() {
    final tickets = _tickets!;
    if (tickets.isEmpty) {
      return ListView(
        children: [
          SizedBox(height: 100),
          StateView(
            icon: CupertinoIcons.checkmark_seal,
            title: 'Обращений нет',
            message: 'Все вопросы пользователей обработаны.',
          ),
        ],
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 30),
      itemCount: tickets.length,
      separatorBuilder: (_, _) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final ticket = tickets[index];
        final user = Map<String, dynamic>.from(ticket['user'] as Map? ?? {});
        return GlassSurface(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      '${ticket['subject']}',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  Text(
                    '${ticket['status']}',
                    style: const TextStyle(
                      color: AppColors.accent,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 5),
              Text(
                '${user['firstName'] ?? ''} ${user['lastName'] ?? ''} · ${user['email'] ?? ''}',
                style: TextStyle(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 10),
              Text('${ticket['message']}'),
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                child: FilledButton.tonal(
                  onPressed: () => _answer(ticket),
                  child: Text(
                    ticket['answer'] == null ? 'Ответить' : 'Изменить ответ',
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
