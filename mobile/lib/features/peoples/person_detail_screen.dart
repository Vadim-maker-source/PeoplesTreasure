import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/common.dart';
import '../../models/models.dart';
import 'quiz_screen.dart';

class PersonDetailScreen extends StatefulWidget {
  const PersonDetailScreen({super.key, required this.person});
  final PersonSummary person;

  @override
  State<PersonDetailScreen> createState() => _PersonDetailScreenState();
}

class _PersonDetailScreenState extends State<PersonDetailScreen> {
  Map<String, dynamic>? _data;
  Object? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = Map<String, dynamic>.from(
        await ApiClient.instance.get('/peoples/${widget.person.id}') as Map,
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

  @override
  Widget build(BuildContext context) {
    final data = _data;
    return Scaffold(
      body: data == null
          ? SafeArea(
              child: Column(
                children: [
                  Align(
                    alignment: Alignment.centerLeft,
                    child: BackButton(onPressed: () => Navigator.pop(context)),
                  ),
                  Expanded(
                    child: _error == null
                        ? const Center(child: CircularProgressIndicator())
                        : StateView(
                            icon: CupertinoIcons.exclamationmark_triangle,
                            title: 'Раздел недоступен',
                            message: '$_error',
                            onRetry: _load,
                          ),
                  ),
                ],
              ),
            )
          : CustomScrollView(
              slivers: [
                SliverAppBar.large(
                  expandedHeight: 360,
                  pinned: true,
                  title: Text('${data['name']}'),
                  flexibleSpace: FlexibleSpaceBar(
                    background: Stack(
                      fit: StackFit.expand,
                      children: [
                        if (widget.person.cover != null)
                          Hero(
                            tag: 'person-${widget.person.id}',
                            child: CachedNetworkImage(
                              imageUrl: widget.person.cover!,
                              fit: BoxFit.cover,
                            ),
                          ),
                        const DecoratedBox(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [Color(0x14000000), Color(0xAA000000)],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SliverToBoxAdapter(
                  child: Column(
                    children: [
                      SizedBox(
                        height: 8,
                        child: ColoredBox(color: Color(0xFFFFA100)),
                      ),
                      SizedBox(
                        height: 8,
                        child: ColoredBox(color: Color(0xFFFF7C00)),
                      ),
                      SizedBox(
                        height: 8,
                        child: ColoredBox(color: Color(0xFFFF4500)),
                      ),
                    ],
                  ),
                ),
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 22, 20, 110),
                  sliver: SliverList.list(
                    children: [
                      Text(
                        '${data['description']}',
                        style: Theme.of(context).textTheme.bodyLarge,
                      ),
                      const SizedBox(height: 22),
                      FilledButton.icon(
                        onPressed: () => Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => QuizScreen(
                              personId: widget.person.id,
                              personName: widget.person.name,
                            ),
                          ),
                        ),
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.action,
                          foregroundColor: AppColors.ink,
                          shape: const StadiumBorder(),
                          minimumSize: const Size(double.infinity, 58),
                        ),
                        icon: const Icon(CupertinoIcons.sparkles),
                        label: const Text('Проверить знания'),
                      ),
                      const SizedBox(height: 24),
                      _InfoSection(
                        icon: CupertinoIcons.location_solid,
                        title: 'Регион',
                        text: '${data['region'] ?? ''}',
                      ),
                      _InfoSection(
                        icon: CupertinoIcons.chat_bubble_text_fill,
                        title: 'Язык',
                        text:
                            '${data['language'] ?? data['languageFamily'] ?? ''}',
                      ),
                      _InfoSection(
                        icon: CupertinoIcons.time_solid,
                        title: 'Происхождение',
                        text: '${data['prois'] ?? ''}',
                      ),
                      _ListSection(
                        icon: CupertinoIcons.person_2_fill,
                        title: 'Традиции',
                        items: data['traditions'],
                      ),
                      _ListSection(
                        icon: CupertinoIcons.bag_fill,
                        title: 'Кухня',
                        items: data['food'],
                        images: data['photoFood'],
                      ),
                      _ListSection(
                        icon: CupertinoIcons.sparkles,
                        title: 'Национальный костюм',
                        items: data['suit'],
                        images: data['suitPhoto'],
                      ),
                      _ListSection(
                        icon: CupertinoIcons.music_note_2,
                        title: 'Фольклор',
                        items: data['folklor'],
                      ),
                      _ListSection(
                        icon: CupertinoIcons.book_fill,
                        title: 'История',
                        items: data['historyEvents'],
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}

class _InfoSection extends StatelessWidget {
  const _InfoSection({
    required this.icon,
    required this.title,
    required this.text,
  });
  final IconData icon;
  final String title;
  final String text;
  @override
  Widget build(BuildContext context) => _Section(
    icon: icon,
    title: title,
    child: Text(text, style: Theme.of(context).textTheme.bodyLarge),
  );
}

class _ListSection extends StatelessWidget {
  const _ListSection({
    required this.icon,
    required this.title,
    this.items,
    this.images,
  });
  final IconData icon;
  final String title;
  final dynamic items;
  final dynamic images;
  @override
  Widget build(BuildContext context) {
    final values = (items as List? ?? []).map((item) => '$item').toList();
    final photos = (images as List? ?? []).whereType<String>().toList();
    return _Section(
      icon: icon,
      title: title,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (final value in values)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Text(value, style: Theme.of(context).textTheme.bodyLarge),
            ),
          if (photos.isNotEmpty)
            SizedBox(
              height: 180,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: photos.length,
                separatorBuilder: (_, _) => const SizedBox(width: 10),
                itemBuilder: (_, index) => ClipRRect(
                  borderRadius: BorderRadius.circular(18),
                  child: CachedNetworkImage(
                    imageUrl: photos[index],
                    width: 250,
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({
    required this.icon,
    required this.title,
    required this.child,
  });
  final IconData icon;
  final String title;
  final Widget child;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 30),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: AppColors.accent, size: 30),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                title,
                style: Theme.of(context).textTheme.headlineSmall,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: AppColors.section,
            borderRadius: BorderRadius.circular(8),
          ),
          child: DefaultTextStyle.merge(
            style: const TextStyle(color: Colors.black),
            child: child,
          ),
        ),
      ],
    ),
  );
}
