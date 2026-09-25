import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http_parser/http_parser.dart';

class ApiException implements Exception {
  const ApiException(this.message, {this.statusCode, this.code});
  final String message;
  final int? statusCode;
  final String? code;
  @override
  String toString() => message;
}

class ApiClient {
  ApiClient._() {
    _dio.interceptors.add(
      InterceptorsWrapper(onRequest: _onRequest, onError: _onError),
    );
  }

  static final instance = ApiClient._();
  static const _storage = FlutterSecureStorage();
  static const _configuredBase = String.fromEnvironment('API_BASE_URL');
  static String get baseUrl {
    if (_configuredBase.isNotEmpty) return _configuredBase;
    if (kIsWeb) return 'http://192.168.1.222:3001/api/mobile/v1';
    return defaultTargetPlatform == TargetPlatform.android
        ? 'http://192.168.1.222:3001/api/mobile/v1'
        : 'http://192.168.1.222:3001/api/mobile/v1';
  }

  final Dio _dio = Dio(
    BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 12),
      receiveTimeout: const Duration(seconds: 20),
      headers: {'Accept': 'application/json'},
    ),
  );
  Future<void>? _refreshing;

  Future<void> _onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _storage.read(key: 'access_token');
    if (token != null) options.headers['Authorization'] = 'Bearer $token';
    handler.next(options);
  }

  Future<void> _onError(
    DioException error,
    ErrorInterceptorHandler handler,
  ) async {
    final request = error.requestOptions;
    if (error.response?.statusCode != 401 ||
        request.extra['retried'] == true ||
        request.path.contains('/auth/')) {
      handler.next(error);
      return;
    }
    try {
      _refreshing ??= _refresh();
      await _refreshing;
      _refreshing = null;
      final access = await _storage.read(key: 'access_token');
      request.headers['Authorization'] = 'Bearer $access';
      request.extra['retried'] = true;
      handler.resolve(await _dio.fetch(request));
    } catch (_) {
      _refreshing = null;
      await clearSession();
      handler.next(error);
    }
  }

  Future<void> _refresh() async {
    final refresh = await _storage.read(key: 'refresh_token');
    if (refresh == null) throw const ApiException('Сессия завершена');
    final plain = Dio(BaseOptions(baseUrl: baseUrl));
    final response = await plain.post(
      '/auth/refresh',
      data: {'refreshToken': refresh, 'device': 'Flutter'},
    );
    await saveSession(Map<String, dynamic>.from(response.data['data'] as Map));
  }

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) async {
    try {
      return _unwrap(await _dio.get(path, queryParameters: query));
    } on DioException catch (error) {
      throw _error(error);
    }
  }

  Future<dynamic> post(String path, {Object? data}) async {
    try {
      return _unwrap(await _dio.post(path, data: data));
    } on DioException catch (error) {
      throw _error(error);
    }
  }

  Future<dynamic> patch(String path, {Object? data}) async {
    try {
      return _unwrap(await _dio.patch(path, data: data));
    } on DioException catch (error) {
      throw _error(error);
    }
  }

  Future<dynamic> delete(String path, {Object? data}) async {
    try {
      return _unwrap(await _dio.delete(path, data: data));
    } on DioException catch (error) {
      throw _error(error);
    }
  }

  Future<dynamic> upload(
    String path,
    List<int> bytes,
    String name, {
    String kind = 'image',
  }) async {
    try {
      final extension = name.split('.').last.toLowerCase();
      final mime = switch (extension) {
        'png' => 'image/png',
        'webp' => 'image/webp',
        'gif' => 'image/gif',
        'mp4' => 'video/mp4',
        'webm' => 'video/webm',
        'mov' => 'video/quicktime',
        'avi' => 'video/x-msvideo',
        _ => 'image/jpeg',
      };
      final form = FormData.fromMap({
        'kind': kind,
        'file': MultipartFile.fromBytes(
          bytes,
          filename: name,
          contentType: MediaType.parse(mime),
        ),
      });
      return _unwrap(await _dio.post(path, data: form));
    } on DioException catch (error) {
      throw _error(error);
    }
  }

  dynamic _unwrap(Response<dynamic> response) =>
      response.data is Map ? response.data['data'] : response.data;

  ApiException _error(DioException error) {
    final body = error.response?.data;
    final details = body is Map ? body['error'] : null;
    final message = details is Map ? details['message']?.toString() : null;
    return ApiException(
      message ??
          (error.type == DioExceptionType.connectionError
              ? 'Не удалось подключиться к серверу'
              : 'Что-то пошло не так'),
      statusCode: error.response?.statusCode,
      code: details is Map ? details['code']?.toString() : null,
    );
  }

  Future<void> saveSession(Map<String, dynamic> data) async {
    final access = data['accessToken']?.toString();
    final refresh = data['refreshToken']?.toString();
    if (access != null) {
      await _storage.write(key: 'access_token', value: access);
    }
    if (refresh != null) {
      await _storage.write(key: 'refresh_token', value: refresh);
    }
  }

  Future<String?> refreshToken() => _storage.read(key: 'refresh_token');

  Future<void> clearSession() async {
    await _storage.delete(key: 'access_token');
    await _storage.delete(key: 'refresh_token');
  }
}
