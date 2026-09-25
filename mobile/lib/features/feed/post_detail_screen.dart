import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../core/api/api_client.dart';
import '../../core/widgets/common.dart';
import '../../models/models.dart';

class PostDetailScreen extends StatefulWidget {
  const PostDetailScreen({super.key, required this.postId});
  final String postId;

  @override
  State<PostDetailScreen> createState() => _PostDetailScreenState();
}

class _PostDetailScreenState extends State<PostDetailScreen> {
  final _comment = TextEditingController();
  Map<String, dynamic>? _data;
  Object? _error;
  bool _sending = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final data = Map<String, dynamic>.from(
        await ApiClient.instance.get('/posts/${widget.postId}') as Map,
      );
      if (mounted) {
        setState(() {
          _data = data;
          _error = null;
        });
      }
    } catch (error) {
      if (mounted) setState(() => _error = error);
    }
  }

  Future<void> _send() async {
    final text = _comment.text.trim();
    if (text.isEmpty || _sending) return;
    setState(() => _sending = true);
    try {
      await ApiClient.instance.post(
        '/posts/${widget.postId}/comments',
        data: {'content': text},
      );
      _comment.clear();
      await _load();
    } catch (error) {
      if (mounted) showAppMessage(context, '$error', error: true);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_data == null) {
      return Scaffold(
        appBar: AppBar(),
        body: _error == null
            ? const Center(child: CircularProgressIndicator())
            : StateView(
                icon: CupertinoIcons.exclamationmark_triangle,
                title: 'История недоступна',
                message: '$_error',
                onRetry: _load,
              ),
      );
    }
    final post = Post.fromJson(_data!);
    final comments = (_data!['comments'] as List? ?? []).cast<Map>();
    return Scaffold(
      appBar: AppBar(title: const Text('История')),
      body: CustomScrollView(
        slivers: [
          if (post.media.isNotEmpty)
            SliverToBoxAdapter(
              child: Hero(
                tag: 'post-${post.id}',
                child: CachedNetworkImage(
                  imageUrl: post.media.first,
                  width: double.infinity,
                  height: 280,
                  fit: BoxFit.cover,
                ),
              ),
            ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
            sliver: SliverList.list(
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      child: Text(
                        post.author.name.isEmpty ? '?' : post.author.name[0],
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        post.author.name,
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ),
                    Text(
                      DateFormat('d MMM', 'ru').format(post.createdAt),
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 22),
                Text(
                  post.title,
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 14),
                Text(
                  post.content,
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
                const SizedBox(height: 26),
                Text(
                  'Комментарии · ${comments.length}',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
          if (comments.isEmpty)
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text('Начните обсуждение — здесь пока тихо.'),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              sliver: SliverList.separated(
                itemCount: comments.length,
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final item = Map<String, dynamic>.from(comments[index]);
                  final author = Map<String, dynamic>.from(
                    item['author'] as Map? ?? {},
                  );
                  return GlassSurface(
                    padding: const EdgeInsets.all(14),
                    radius: 18,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${author['name'] ?? 'Пользователь'}',
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 5),
                        Text('${item['content'] ?? ''}'),
                      ],
                    ),
                  );
                },
              ),
            ),
          const SliverToBoxAdapter(child: SizedBox(height: 100)),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: EdgeInsets.fromLTRB(
            12,
            8,
            12,
            MediaQuery.viewInsetsOf(context).bottom > 0 ? 8 : 12,
          ),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _comment,
                  minLines: 1,
                  maxLines: 4,
                  decoration: const InputDecoration(
                    hintText: 'Написать комментарий…',
                  ),
                ),
              ),
              const SizedBox(width: 8),
              IconButton.filled(
                onPressed: _sending ? null : _send,
                icon: _sending
                    ? const SizedBox.square(
                        dimension: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(CupertinoIcons.arrow_up),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
