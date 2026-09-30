import 'package:flutter_test/flutter_test.dart';
import 'package:peoples_treasure/core/update/app_update.dart';

void main() {
  test('detects a different published APK hash', () {
    expect(isDifferentBuild('abc123', 'def456'), isTrue);
  });

  test('accepts the installed APK when hashes match regardless of case', () {
    expect(isDifferentBuild('ABC123', 'abc123'), isFalse);
  });

  test('does not force an update when either hash is unavailable', () {
    expect(isDifferentBuild('', 'abc123'), isFalse);
    expect(isDifferentBuild('abc123', ''), isFalse);
  });
}
