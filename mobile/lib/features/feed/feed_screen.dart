import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/common.dart';
import '../../models/models.dart';
import 'post_detail_screen.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  final _search = TextEditingController();
  bool _loading = true;
  Object? _error;
  List<Post> _posts = [];
  String _sort = 'newest';

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = Map<String, dynamic>.from(
        await ApiClient.instance.get(
              '/posts',
              query: {
                'limit': 30,
                'sort': _sort,
                if (_search.text.trim().isNotEmpty) 'q': _search.text.trim(),
              },
            )
            as Map,
      );
      final posts = (data['items'] as List? ?? [])
          .map((item) => Post.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();
      if (mounted) setState(() => _posts = posts);
    } catch (error) {
      if (mounted) setState(() => _error = error);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: RefreshIndicator(
        onRefresh: _load,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            const SliverToBoxAdapter(
              child: PageIntro(
                eyebrow: 'Сообщество',
                title: 'Живые истории',
                subtitle: 'Люди, традиции и места — из первых рук.',
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _search,
                        textInputAction: TextInputAction.search,
                        onSubmitted: (_) => _load(),
                        decoration: InputDecoration(
                          hintText: 'Найти историю',
                          prefixIcon: const Icon(CupertinoIcons.search),
                          suffixIcon: _search.text.isEmpty
                              ? null
                              : IconButton(
                                  onPressed: () {
                                    _search.clear();
                                    _load();
                                  },
                                  icon: const Icon(
                                    CupertinoIcons.clear_circled_solid,
                                  ),
                                ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    PopupMenuButton<String>(
                      tooltip: 'Сортировка',
                      onSelected: (value) {
                        setState(() => _sort = value);
                        _load();
                      },
                      itemBuilder: (_) => const [
                        PopupMenuItem(
                          value: 'newest',
                          child: Text('Сначала новые'),
                        ),
                        PopupMenuItem(
                          value: 'popular',
                          child: Text('Популярные'),
                        ),
                      ],
                      child: Container(
                        width: 54,
                        height: 54,
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.surface,
                          borderRadius: BorderRadius.circular(18),
                        ),
                        child: const Icon(CupertinoIcons.slider_horizontal_3),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            if (_loading)
              const SliverFillRemaining(
                hasScrollBody: false,
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_error != null)
              SliverFillRemaining(
                hasScrollBody: false,
                child: StateView(
                  icon: CupertinoIcons.wifi_exclamationmark,
                  title: 'Лента не загрузилась',
                  message:
                      'Проверьте соединение с сервером и повторите попытку.',
                  onRetry: _load,
                ),
              )
            else if (_posts.isEmpty)
              const SliverFillRemaining(
                hasScrollBody: false,
                child: StateView(
                  icon: CupertinoIcons.doc_text_search,
                  title: 'Пока ничего не найдено',
                  message:
                      'Измените запрос или вернитесь позже — новые истории скоро появятся.',
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 110),
                sliver: SliverList.separated(
                  itemCount: _posts.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 14),
                  itemBuilder: (context, index) =>
                      PostCard(post: _posts[index], onChanged: _load)
                          .animate()
                          .fadeIn(
                            delay: (index.clamp(0, 8) * 45).ms,
                            duration: 300.ms,
                          )
                          .slideY(begin: .05, end: 0),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class PostCard extends StatefulWidget {
  const PostCard({super.key, required this.post, this.onChanged});
  final Post post;
  final VoidCallback? onChanged;

  @override
  State<PostCard> createState() => _PostCardState();
}

class _PostCardState extends State<PostCard> {
  late bool liked = widget.post.liked;
  late int likes = widget.post.likes;
  bool changing = false;

  Future<void> _like() async {
    if (changing) return;
    final before = liked;
    final beforeLikes = likes;
    setState(() {
      changing = true;
      liked = !liked;
      likes += liked ? 1 : -1;
    });
    try {
      final data = Map<String, dynamic>.from(
        await ApiClient.instance.post('/posts/${widget.post.id}/like') as Map,
      );
      if (mounted) {
        setState(() {
          liked = data['liked'] == true;
          likes = (data['likes'] as num).toInt();
        });
      }
    } catch (error) {
      if (mounted) {
        setState(() {
          liked = before;
          likes = beforeLikes;
        });
        showAppMessage(context, '$error', error: true);
      }
    } finally {
      if (mounted) setState(() => changing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final post = widget.post;
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () async {
          await Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => PostDetailScreen(postId: post.id),
            ),
          );
          widget.onChanged?.call();
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (post.media.isNotEmpty)
              Hero(
                tag: 'post-${post.id}',
                child: CachedNetworkImage(
                  imageUrl: post.media.first,
                  width: double.infinity,
                  height: 210,
                  fit: BoxFit.cover,
                  placeholder: (_, _) => Container(
                    height: 210,
                    color: Theme.of(
                      context,
                    ).colorScheme.surfaceContainerHighest,
                  ),
                  errorWidget: (_, _, _) => Container(
                    height: 110,
                    color: AppColors.accent.withValues(alpha: .09),
                    child: const Center(
                      child: Icon(
                        CupertinoIcons.photo,
                        color: AppColors.accent,
                      ),
                    ),
                  ),
                ),
              ),
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 17, 18, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 24,
                        backgroundColor: AppColors.actionSoft,
                        foregroundColor: Colors.white,
                        backgroundImage: post.author.avatar == null
                            ? null
                            : CachedNetworkImageProvider(post.author.avatar!),
                        child: post.author.avatar == null
                            ? Text(
                                post.author.name.isEmpty
                                    ? '?'
                                    : post.author.name[0],
                              )
                            : null,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    post.author.name,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                                if (post.author.verified)
                                  const Padding(
                                    padding: EdgeInsets.only(left: 4),
                                    child: Icon(
                                      CupertinoIcons.checkmark_seal_fill,
                                      size: 15,
                                      color: AppColors.accent,
                                    ),
                                  ),
                              ],
                            ),
                            Text(
                              DateFormat(
                                'd MMM, HH:mm',
                                'ru',
                              ).format(post.createdAt.toLocal()),
                              style: TextStyle(
                                fontSize: 12,
                                color: Theme.of(
                                  context,
                                ).colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 15),
                  Text(
                    post.title,
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 7),
                  Text(
                    post.content,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                  if (post.tags.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 7,
                      runSpacing: 7,
                      children: post.tags
                          .take(4)
                          .map(
                            (tag) => Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.section,
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Text(
                                '#$tag',
                                style: const TextStyle(
                                  color: Color(0xFF374151),
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          )
                          .toList(),
                    ),
                  ],
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      _Action(
                        icon: liked
                            ? CupertinoIcons.heart_fill
                            : CupertinoIcons.heart,
                        label: '$likes',
                        color: liked ? AppColors.accent : null,
                        onTap: _like,
                      ),
                      const SizedBox(width: 18),
                      _Action(
                        icon: CupertinoIcons.chat_bubble,
                        label: '${post.commentsCount}',
                      ),
                      const Spacer(),
                      const Icon(CupertinoIcons.chevron_right, size: 18),
                    ],
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

class _Action extends StatelessWidget {
  const _Action({
    required this.icon,
    required this.label,
    this.color,
    this.onTap,
  });
  final IconData icon;
  final String label;
  final Color? color;
  final VoidCallback? onTap;
  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(14),
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(color: color, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    ),
  );
}
