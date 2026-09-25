import 'package:flutter_test/flutter_test.dart';
import 'package:peoples_treasure/models/models.dart';

void main() {
  test('user role exposes admin access', () {
    final user = AppUser.fromJson({
      'id': '1',
      'email': 'admin@example.com',
      'firstName': 'Анна',
      'lastName': 'Иванова',
      'role': 'ADMIN',
    });

    expect(user.name, 'Анна Иванова');
    expect(user.isAdmin, isTrue);
  });

  test('post parser handles optional collections', () {
    final post = Post.fromJson({
      'id': 'post-1',
      'title': 'История',
      'content': 'Текст',
      'author': {'id': 'user-1', 'name': 'Автор'},
      'createdAt': '2026-09-24T10:00:00.000Z',
      'likes': 2,
      'commentsCount': 1,
      'status': 'approved',
    });

    expect(post.media, isEmpty);
    expect(post.tags, isEmpty);
    expect(post.author.name, 'Автор');
  });
}
