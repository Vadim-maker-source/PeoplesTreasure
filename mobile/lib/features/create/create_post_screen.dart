import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/common.dart';
import '../../models/models.dart';

class CreatePostScreen extends StatefulWidget {
  const CreatePostScreen({super.key, required this.onCreated});
  final VoidCallback onCreated;

  @override
  State<CreatePostScreen> createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends State<CreatePostScreen> {
  final _title = TextEditingController();
  final _content = TextEditingController();
  final _tags = TextEditingController();
  List<PersonSummary> _peoples = [];
  String? _group;
  XFile? _image;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _loadPeoples();
  }

  @override
  void dispose() {
    _title.dispose();
    _content.dispose();
    _tags.dispose();
    super.dispose();
  }

  Future<void> _loadPeoples() async {
    try {
      final data = await ApiClient.instance.get('/peoples') as List;
      final items = data
          .map(
            (item) =>
                PersonSummary.fromJson(Map<String, dynamic>.from(item as Map)),
          )
          .toList();
      if (mounted) {
        setState(() {
          _peoples = items;
          _group ??= items.firstOrNull?.id;
        });
      }
    } catch (_) {}
  }

  Future<void> _pickImage() async {
    final image = await ImagePicker().pickImage(
      source: ImageSource.gallery,
      imageQuality: 88,
      maxWidth: 2200,
    );
    if (image != null && mounted) setState(() => _image = image);
  }

  Future<void> _submit() async {
    if (_title.text.trim().isEmpty ||
        _content.text.trim().isEmpty ||
        _group == null) {
      showAppMessage(
        context,
        'Заполните заголовок, текст и выберите народ',
        error: true,
      );
      return;
    }
    setState(() => _busy = true);
    try {
      final media = <String>[];
      if (_image != null) {
        final uploaded = Map<String, dynamic>.from(
          await ApiClient.instance.upload(
                '/media',
                await _image!.readAsBytes(),
                _image!.name,
              )
              as Map,
        );
        final url = (uploaded['url'] ?? uploaded['publicUrl'])?.toString();
        if (url != null) media.add(url);
      }
      await ApiClient.instance.post(
        '/posts',
        data: {
          'title': _title.text.trim(),
          'content': _content.text.trim(),
          'ethnicGroupId': _group,
          'tags': _tags.text
              .split(',')
              .map((value) => value.trim().replaceFirst('#', ''))
              .where((value) => value.isNotEmpty)
              .toList(),
          'media': media,
        },
      );
      _title.clear();
      _content.clear();
      _tags.clear();
      if (mounted) setState(() => _image = null);
      if (mounted) {
        showAppMessage(context, 'Публикация отправлена на модерацию');
      }
      widget.onCreated();
    } catch (error) {
      if (mounted) showAppMessage(context, '$error', error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.only(bottom: 110),
        children: [
          const PageIntro(
            eyebrow: 'Новая публикация',
            title: 'Поделитесь историей',
            subtitle:
                'Личный опыт, семейная традиция или место, о котором должны узнать другие.',
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: GlassSurface(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextField(
                    controller: _title,
                    textCapitalization: TextCapitalization.sentences,
                    maxLength: 200,
                    decoration: const InputDecoration(
                      labelText: 'Заголовок',
                      counterText: '',
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: _group,
                    decoration: const InputDecoration(
                      labelText: 'Народ',
                      prefixIcon: Icon(CupertinoIcons.map),
                    ),
                    items: _peoples
                        .map(
                          (item) => DropdownMenuItem(
                            value: item.id,
                            child: Text(item.name),
                          ),
                        )
                        .toList(),
                    onChanged: (value) => setState(() => _group = value),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _content,
                    minLines: 8,
                    maxLines: 14,
                    maxLength: 20000,
                    textCapitalization: TextCapitalization.sentences,
                    decoration: const InputDecoration(
                      labelText: 'Ваша история',
                      alignLabelWithHint: true,
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _tags,
                    decoration: const InputDecoration(
                      labelText: 'Теги через запятую',
                      prefixIcon: Icon(CupertinoIcons.tag),
                    ),
                  ),
                  const SizedBox(height: 16),
                  InkWell(
                    onTap: _busy ? null : _pickImage,
                    borderRadius: BorderRadius.circular(18),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: AppColors.accent.withValues(alpha: .08),
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(
                          color: AppColors.accent.withValues(alpha: .18),
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            _image == null
                                ? CupertinoIcons.photo_on_rectangle
                                : CupertinoIcons.checkmark_circle_fill,
                            color: AppColors.accent,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              _image?.name ?? 'Добавить фотографию',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          if (_image != null)
                            IconButton(
                              onPressed: () => setState(() => _image = null),
                              icon: const Icon(
                                CupertinoIcons.clear_circled_solid,
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: _busy ? null : _submit,
                      icon: _busy
                          ? const SizedBox.square(
                              dimension: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(CupertinoIcons.paperplane_fill),
                      label: Text(
                        _busy ? 'Отправляем…' : 'Отправить на модерацию',
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
