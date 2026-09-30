import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

import '../api/api_client.dart';

class AppUpdateInfo {
  const AppUpdateInfo({
    required this.versionName,
    required this.versionCode,
    required this.sha256,
    required this.downloadUrl,
    required this.size,
  });

  final String versionName;
  final int versionCode;
  final String sha256;
  final String downloadUrl;
  final int size;

  factory AppUpdateInfo.fromJson(Map<String, dynamic> json) => AppUpdateInfo(
    versionName: json['versionName']?.toString() ?? '',
    versionCode: (json['versionCode'] as num?)?.toInt() ?? 0,
    sha256: json['sha256']?.toString().toLowerCase() ?? '',
    downloadUrl: json['downloadUrl']?.toString() ?? '',
    size: (json['size'] as num?)?.toInt() ?? 0,
  );
}

bool isDifferentBuild(String installedSha256, String publishedSha256) {
  final installed = installedSha256.trim().toLowerCase();
  final published = publishedSha256.trim().toLowerCase();
  return installed.isNotEmpty && published.isNotEmpty && installed != published;
}

class AppUpdateService {
  AppUpdateService._();

  static const _channel = MethodChannel('ru.peoplestreasure/app_update');

  static Future<AppUpdateInfo?> availableUpdate() async {
    if (kIsWeb || defaultTargetPlatform != TargetPlatform.android) return null;

    final installedSha256 = await _channel.invokeMethod<String>(
      'getInstalledSha256',
    );
    if (installedSha256 == null || installedSha256.isEmpty) return null;

    final response = await ApiClient.instance.get('/app-update');
    final update = AppUpdateInfo.fromJson(
      Map<String, dynamic>.from(response as Map),
    );
    return isDifferentBuild(installedSha256, update.sha256) ? update : null;
  }

  static Future<void> download(AppUpdateInfo update) =>
      _channel.invokeMethod('openDownload', {'url': update.downloadUrl});
}
