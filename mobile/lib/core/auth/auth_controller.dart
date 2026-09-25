import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/models.dart';
import '../api/api_client.dart';

final authProvider = AsyncNotifierProvider<AuthController, AppUser?>(
  AuthController.new,
);

class AuthController extends AsyncNotifier<AppUser?> {
  final _api = ApiClient.instance;

  @override
  Future<AppUser?> build() async {
    if (await _api.refreshToken() == null) return null;
    try {
      final data = await _api.get('/me');
      return AppUser.fromJson(Map<String, dynamic>.from(data as Map));
    } catch (_) {
      await _api.clearSession();
      return null;
    }
  }

  Future<void> login(String email, String password) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final data = Map<String, dynamic>.from(
        await _api.post(
              '/auth/login',
              data: {
                'email': email,
                'password': password,
                'device': 'Flutter mobile',
              },
            )
            as Map,
      );
      await _api.saveSession(data);
      return AppUser.fromJson(Map<String, dynamic>.from(data['user'] as Map));
    });
  }

  Future<void> sendCode(String email) =>
      _api.post('/auth/send-code', data: {'email': email});

  Future<void> register(Map<String, dynamic> form) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final data = Map<String, dynamic>.from(
        await _api.post(
              '/auth/register',
              data: {...form, 'device': 'Flutter mobile'},
            )
            as Map,
      );
      await _api.saveSession(data);
      return AppUser.fromJson(Map<String, dynamic>.from(data['user'] as Map));
    });
  }

  Future<void> logout() async {
    final refresh = await _api.refreshToken();
    try {
      if (refresh != null) {
        await _api.post('/auth/logout', data: {'refreshToken': refresh});
      }
    } finally {
      await _api.clearSession();
      state = const AsyncData(null);
    }
  }
}
