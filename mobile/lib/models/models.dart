class AppUser {
  const AppUser({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.role,
    this.avatar,
    this.region,
    this.bio,
  });

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
    id: '${json['id']}',
    email: '${json['email']}',
    firstName: '${json['firstName'] ?? ''}',
    lastName: '${json['lastName'] ?? ''}',
    role: '${json['role'] ?? 'USER'}',
    avatar: json['avatar'] as String?,
    region: json['region'] as String?,
    bio: json['bio'] as String?,
  );

  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String role;
  final String? avatar;
  final String? region;
  final String? bio;
  String get name => '$firstName $lastName'.trim();
  bool get isAdmin => role == 'ADMIN';
}

class Author {
  const Author({
    required this.id,
    required this.name,
    this.avatar,
    this.verified = false,
  });
  factory Author.fromJson(Map<String, dynamic> json) => Author(
    id: '${json['id']}',
    name: '${json['name'] ?? ''}',
    avatar: json['avatar'] as String?,
    verified: json['verified'] == true,
  );
  final String id;
  final String name;
  final String? avatar;
  final bool verified;
}

class Post {
  const Post({
    required this.id,
    required this.title,
    required this.content,
    required this.author,
    required this.createdAt,
    required this.likes,
    required this.commentsCount,
    required this.status,
    required this.ethnicGroupId,
    this.media = const [],
    this.tags = const [],
    this.liked = false,
  });

  factory Post.fromJson(Map<String, dynamic> json) => Post(
    id: '${json['id']}',
    title: '${json['title'] ?? ''}',
    content: '${json['content'] ?? ''}',
    author: Author.fromJson(
      Map<String, dynamic>.from(json['author'] as Map? ?? {}),
    ),
    createdAt: DateTime.tryParse('${json['createdAt']}') ?? DateTime.now(),
    likes: (json['likes'] as num?)?.toInt() ?? 0,
    commentsCount: (json['commentsCount'] as num?)?.toInt() ?? 0,
    status: '${json['status'] ?? ''}',
    ethnicGroupId: json['ethnicGroupId']?.toString(),
    media: (json['media'] as List? ?? []).whereType<String>().toList(),
    tags: (json['tags'] as List? ?? []).map((item) => '$item').toList(),
    liked: json['liked'] == true,
  );

  final String id;
  final String title;
  final String content;
  final Author author;
  final DateTime createdAt;
  final int likes;
  final int commentsCount;
  final String status;
  final String? ethnicGroupId;
  final List<String> media;
  final List<String> tags;
  final bool liked;
}

class PersonSummary {
  const PersonSummary({
    required this.id,
    required this.name,
    required this.description,
    required this.population,
    required this.region,
    this.cover,
  });
  factory PersonSummary.fromJson(Map<String, dynamic> json) => PersonSummary(
    id: '${json['id']}',
    name: '${json['name']}',
    description: '${json['description'] ?? ''}',
    population: (json['population'] as num?)?.toInt() ?? 0,
    region: '${json['region'] ?? ''}',
    cover: json['cover'] as String?,
  );
  final String id;
  final String name;
  final String description;
  final int population;
  final String region;
  final String? cover;
}

class SupportTicket {
  const SupportTicket({
    required this.id,
    required this.subject,
    required this.message,
    required this.status,
    required this.createdAt,
    this.adminResponse,
  });
  factory SupportTicket.fromJson(Map<String, dynamic> json) => SupportTicket(
    id: '${json['id']}',
    subject: '${json['subject'] ?? ''}',
    message: '${json['message'] ?? ''}',
    status: '${json['status'] ?? 'open'}',
    createdAt: DateTime.tryParse('${json['createdAt']}') ?? DateTime.now(),
    adminResponse: (json['answer'] ?? json['adminResponse'])?.toString(),
  );
  final String id;
  final String subject;
  final String message;
  final String status;
  final DateTime createdAt;
  final String? adminResponse;
}
