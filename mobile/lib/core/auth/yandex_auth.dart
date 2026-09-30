import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

class YandexAuthException implements Exception {
  const YandexAuthException(this.message, {this.cancelled = false});

  final String message;
  final bool cancelled;

  @override
  String toString() => message;
}

class YandexAuth {
  const YandexAuth._();

  static const _channel = MethodChannel('ru.peoplestreasure/yandex_auth');

  static Future<String> signIn() async {
    if (kIsWeb || defaultTargetPlatform != TargetPlatform.android) {
      throw const YandexAuthException(
        'Вход через Яндекс пока поддерживается только в Android-приложении',
      );
    }

    try {
      final token = await _channel.invokeMethod<String>('signIn');
      if (token == null || token.isEmpty) {
        throw const YandexAuthException('Яндекс не вернул токен авторизации');
      }
      return token;
    } on PlatformException catch (error) {
      throw YandexAuthException(
        error.message ?? 'Не удалось войти через Яндекс',
        cancelled: error.code == 'YANDEX_AUTH_CANCELLED',
      );
    }
  }
}
