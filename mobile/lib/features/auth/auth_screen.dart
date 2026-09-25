import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/common.dart';

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _phone = TextEditingController();
  final _age = TextEditingController();
  final _code = TextEditingController();
  bool _register = false;
  bool _codeSent = false;
  bool _obscure = true;
  bool _sendingCode = false;

  @override
  void dispose() {
    for (final controller in [
      _email,
      _password,
      _firstName,
      _lastName,
      _phone,
      _age,
      _code,
    ]) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    final email = _email.text.trim();
    if (email.isEmpty || _password.text.length < 8) {
      showAppMessage(
        context,
        'Введите email и пароль не короче 8 символов',
        error: true,
      );
      return;
    }
    if (_register) {
      if (!_codeSent) {
        setState(() => _sendingCode = true);
        try {
          await ref.read(authProvider.notifier).sendCode(email);
          if (mounted) {
            setState(() => _codeSent = true);
            showAppMessage(context, 'Код отправлен на почту');
          }
        } catch (error) {
          if (mounted) showAppMessage(context, '$error', error: true);
        } finally {
          if (mounted) setState(() => _sendingCode = false);
        }
        return;
      }
      await ref.read(authProvider.notifier).register({
        'email': email,
        'password': _password.text,
        'confirmPassword': _password.text,
        'firstName': _firstName.text.trim(),
        'lastName': _lastName.text.trim(),
        'phone': _phone.text.trim(),
        'age': int.tryParse(_age.text),
        'code': _code.text.trim(),
      });
    } else {
      await ref.read(authProvider.notifier).login(email, _password.text);
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(authProvider, (previous, next) {
      if (next.hasError && previous?.error != next.error) {
        showAppMessage(context, '${next.error}', error: true);
      }
    });
    final busy = ref.watch(authProvider).isLoading || _sendingCode;
    final sourceTheme = AppTheme.light.copyWith(
      dividerTheme: const DividerThemeData(
        color: Color(0xFFD1D5DB),
        thickness: 1,
      ),
      inputDecorationTheme: AppTheme.light.inputDecorationTheme.copyWith(
        isDense: true,
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 12,
          vertical: 10,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(6),
          borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(6),
          borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(6),
          borderSide: const BorderSide(color: AppColors.accent, width: 2),
        ),
      ),
    );
    return Theme(
      data: sourceTheme,
      child: Scaffold(
        backgroundColor: Colors.white,
        body: Stack(
          fit: StackFit.expand,
          children: [
            Image.asset(
              'assets/images/SignBg.png',
              fit: BoxFit.cover,
              alignment: Alignment.center,
            ),
            SafeArea(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 32,
                  ),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 448),
                    child: Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: MediaQuery.sizeOf(context).width >= 640
                            ? 32
                            : 24,
                        vertical: 32,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.border),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: .14),
                            blurRadius: 28,
                            offset: const Offset(0, 14),
                          ),
                        ],
                      ),
                      child: AnimatedSize(
                        duration: const Duration(milliseconds: 220),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const Align(
                              alignment: Alignment.center,
                              child: BrandMark(size: 48),
                            ),
                            const SizedBox(height: 24),
                            Text(
                              _register ? 'Регистрация' : 'Вход в аккаунт',
                              textAlign: TextAlign.center,
                              style: sourceTheme.textTheme.headlineLarge
                                  ?.copyWith(color: AppColors.ink),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              _register
                                  ? 'Присоединяйтесь к сообществу "Сокровища Народов"'
                                  : 'Добро пожаловать в сообщество "Сокровища Народов"',
                              textAlign: TextAlign.center,
                              style: sourceTheme.textTheme.bodyMedium?.copyWith(
                                color: AppColors.muted,
                              ),
                            ),
                            const SizedBox(height: 28),
                            if (!_register) ...[
                              OutlinedButton.icon(
                                onPressed: busy
                                    ? null
                                    : () => showAppMessage(
                                        context,
                                        'Вход через Яндекс доступен в веб-версии',
                                      ),
                                style: OutlinedButton.styleFrom(
                                  side: const BorderSide(
                                    color: Color(0xFFD1D5DB),
                                  ),
                                  foregroundColor: const Color(0xFF374151),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                ),
                                icon: Image.asset(
                                  'assets/images/Yandex_icon.png',
                                  width: 28,
                                  height: 28,
                                ),
                                label: const Text('Войти через Яндекс'),
                              ),
                              const SizedBox(height: 24),
                              Row(
                                children: [
                                  const Expanded(child: Divider()),
                                  Padding(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                    ),
                                    child: Text(
                                      'или',
                                      style: sourceTheme.textTheme.bodyMedium
                                          ?.copyWith(
                                            color: const Color(0xFF6B7280),
                                          ),
                                    ),
                                  ),
                                  const Expanded(child: Divider()),
                                ],
                              ),
                              const SizedBox(height: 24),
                            ],
                            if (_register) ...[
                              Row(
                                children: [
                                  Expanded(
                                    child: _FieldLabel(
                                      label: 'Имя *',
                                      child: TextField(
                                        controller: _firstName,
                                        textCapitalization:
                                            TextCapitalization.words,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: _FieldLabel(
                                      label: 'Фамилия *',
                                      child: TextField(
                                        controller: _lastName,
                                        textCapitalization:
                                            TextCapitalization.words,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                            ],
                            _FieldLabel(
                              label: 'Email *',
                              child: TextField(
                                controller: _email,
                                keyboardType: TextInputType.emailAddress,
                                autofillHints: const [AutofillHints.email],
                                decoration: const InputDecoration(
                                  hintText: 'example@mail.ru',
                                  prefixIcon: Icon(CupertinoIcons.mail_solid),
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),
                            _FieldLabel(
                              label: 'Пароль *',
                              child: TextField(
                                controller: _password,
                                obscureText: _obscure,
                                autofillHints: const [AutofillHints.password],
                                decoration: InputDecoration(
                                  hintText: '••••••••',
                                  prefixIcon: const Icon(
                                    CupertinoIcons.lock_fill,
                                  ),
                                  suffixIcon: IconButton(
                                    onPressed: () =>
                                        setState(() => _obscure = !_obscure),
                                    icon: Icon(
                                      _obscure
                                          ? CupertinoIcons.eye_fill
                                          : CupertinoIcons.eye_slash_fill,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            if (_register) ...[
                              const SizedBox(height: 16),
                              Row(
                                children: [
                                  Expanded(
                                    flex: 2,
                                    child: _FieldLabel(
                                      label: 'Телефон *',
                                      child: TextField(
                                        controller: _phone,
                                        keyboardType: TextInputType.phone,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: _FieldLabel(
                                      label: 'Возраст *',
                                      child: TextField(
                                        controller: _age,
                                        keyboardType: TextInputType.number,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              if (_codeSent) ...[
                                const SizedBox(height: 16),
                                _FieldLabel(
                                  label: 'Код из письма *',
                                  child: TextField(
                                    controller: _code,
                                    keyboardType: TextInputType.number,
                                    decoration: const InputDecoration(
                                      prefixIcon: Icon(CupertinoIcons.number),
                                    ),
                                  ),
                                ),
                              ],
                            ],
                            const SizedBox(height: 24),
                            SizedBox(
                              width: double.infinity,
                              child: FilledButton(
                                onPressed: busy ? null : _submit,
                                style: FilledButton.styleFrom(
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                ),
                                child: busy
                                    ? const SizedBox.square(
                                        dimension: 20,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          color: Colors.white,
                                        ),
                                      )
                                    : Text(
                                        _register
                                            ? (_codeSent
                                                  ? 'Зарегистрироваться'
                                                  : 'Получить код')
                                            : 'Войти',
                                      ),
                              ),
                            ),
                            const SizedBox(height: 24),
                            Wrap(
                              alignment: WrapAlignment.center,
                              children: [
                                Text(
                                  _register
                                      ? 'Уже есть аккаунт? '
                                      : 'Ещё нет аккаунта? ',
                                  style: sourceTheme.textTheme.bodyLarge
                                      ?.copyWith(color: AppColors.muted),
                                ),
                                InkWell(
                                  onTap: busy
                                      ? null
                                      : () => setState(() {
                                          _register = !_register;
                                          _codeSent = false;
                                        }),
                                  child: Text(
                                    _register ? 'Войти' : 'Зарегистрируйтесь',
                                    style: sourceTheme.textTheme.bodyLarge
                                        ?.copyWith(
                                          color: AppColors.accent,
                                          fontWeight: FontWeight.w600,
                                          decoration: TextDecoration.underline,
                                          decorationColor: AppColors.accent,
                                        ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel({required this.label, required this.child});
  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Color(0xFF374151),
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 6),
        child,
      ],
    );
  }
}
