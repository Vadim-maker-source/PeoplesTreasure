import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/common.dart';

class QuizScreen extends StatefulWidget {
  const QuizScreen({
    super.key,
    required this.personId,
    required this.personName,
  });
  final String personId;
  final String personName;

  @override
  State<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen> {
  List<Map<String, dynamic>>? _questions;
  final Map<int, int> _answers = {};
  Map<String, dynamic>? _result;
  Object? _error;
  bool _sending = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = Map<String, dynamic>.from(
        await ApiClient.instance.get('/quizzes/${widget.personId}') as Map,
      );
      if (mounted) {
        setState(() {
          _questions = (data['questions'] as List)
              .map((item) => Map<String, dynamic>.from(item as Map))
              .toList();
          _error = null;
        });
      }
    } catch (error) {
      if (mounted) setState(() => _error = error);
    }
  }

  Future<void> _submit() async {
    final questions = _questions!;
    if (_answers.length != questions.length) {
      showAppMessage(context, 'Ответьте на все вопросы', error: true);
      return;
    }
    setState(() => _sending = true);
    try {
      final result = Map<String, dynamic>.from(
        await ApiClient.instance.post(
              '/quizzes/${widget.personId}/submit',
              data: {
                'answers': questions
                    .map(
                      (question) => {
                        'questionId': question['id'],
                        'selectedIndex': _answers[question['id'] as int],
                      },
                    )
                    .toList(),
              },
            )
            as Map,
      );
      if (mounted) setState(() => _result = result);
    } catch (error) {
      if (mounted) showAppMessage(context, '$error', error: true);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final questions = _questions;
    return Scaffold(
      appBar: AppBar(title: Text('Тест · ${widget.personName}')),
      body: questions == null
          ? (_error == null
                ? const Center(child: CircularProgressIndicator())
                : StateView(
                    icon: CupertinoIcons.exclamationmark_triangle,
                    title: 'Тест не загрузился',
                    message: '$_error',
                    onRetry: _load,
                  ))
          : _result != null
          ? _Result(
              data: _result!,
              onAgain: () => setState(() {
                _result = null;
                _answers.clear();
              }),
            )
          : ListView.builder(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 110),
              itemCount: questions.length + 1,
              itemBuilder: (context, index) {
                if (index == questions.length) {
                  return Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: FilledButton(
                      onPressed: _sending ? null : _submit,
                      child: _sending
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text('Узнать результат'),
                    ),
                  );
                }
                final question = questions[index];
                final id = question['id'] as int;
                final options = (question['options'] as List)
                    .map((item) => '$item')
                    .toList();
                return Padding(
                  padding: const EdgeInsets.only(bottom: 14),
                  child: GlassSurface(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${index + 1} / ${questions.length}',
                          style: const TextStyle(
                            color: AppColors.accent,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '${question['text']}',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 12),
                        RadioGroup<int>(
                          groupValue: _answers[id],
                          onChanged: (value) {
                            if (value != null) {
                              setState(() => _answers[id] = value);
                            }
                          },
                          child: Column(
                            children: [
                              for (
                                var optionIndex = 0;
                                optionIndex < options.length;
                                optionIndex++
                              )
                                RadioListTile<int>(
                                  value: optionIndex,
                                  title: Text(options[optionIndex]),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                  contentPadding: EdgeInsets.zero,
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}

class _Result extends StatelessWidget {
  const _Result({required this.data, required this.onAgain});
  final Map<String, dynamic> data;
  final VoidCallback onAgain;
  @override
  Widget build(BuildContext context) {
    final passed = data['passed'] == true;
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: GlassSurface(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 82,
                height: 82,
                decoration: BoxDecoration(
                  color: (passed ? AppColors.success : AppColors.accent)
                      .withValues(alpha: .13),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  passed
                      ? CupertinoIcons.checkmark_seal_fill
                      : CupertinoIcons.arrow_counterclockwise,
                  size: 42,
                  color: passed ? AppColors.success : AppColors.accent,
                ),
              ),
              const SizedBox(height: 18),
              Text(
                '${data['percentage']}%',
                style: Theme.of(context).textTheme.displaySmall,
              ),
              const SizedBox(height: 8),
              Text(
                passed ? 'Безупречно!' : 'Уже неплохо',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              Text(
                'Верных ответов: ${data['score']} из ${data['total']}',
                style: TextStyle(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 22),
              SizedBox(
                width: double.infinity,
                child: FilledButton.tonal(
                  onPressed: onAgain,
                  child: const Text('Пройти ещё раз'),
                ),
              ),
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Вернуться к материалу'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
